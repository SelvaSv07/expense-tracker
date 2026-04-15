import {
  Runner,
  RunState,
  OpenAIProvider,
  isOpenAIResponsesRawModelStreamEvent,
  setTracingDisabled,
} from "@openai/agents";
import type {
  Agent,
  AgentInputItem,
  RunToolApprovalItem,
  RunStreamEvent,
  StreamedRunResult,
  RunResult,
} from "@openai/agents";
import { createApprovalState } from "@/lib/ai/store";
import {
  assistantUiOutputSchema,
  outputToDisplayText,
  type AssistantUiOutput,
} from "@/lib/ai/output";
import {
  assistantToolDataSchema,
  parseToolResultOutput,
  type AssistantToolDataList,
} from "@/lib/ai/tool-ui";

// Disable tracing globally (BYOK mode — no OpenAI tracing key).
setTracingDisabled(true);

function stringifyOutput(value: unknown): string {
  if (typeof value === "string") return value;
  if (value == null) return "";
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function parseAssistantPayload(value: unknown): AssistantUiOutput | null {
  const parsed = assistantUiOutputSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

function tryParseAssistantToolData(parsedOutput: unknown): AssistantToolDataList[number] | null {
  const direct = assistantToolDataSchema.safeParse(parsedOutput);
  if (direct.success) return direct.data;
  return null;
}

/**
 * Collect MCP-style tool envelopes from run items.
 */
function extractAssistantToolData(newItems: unknown[]): AssistantToolDataList {
  const collected: AssistantToolDataList = [];
  for (const item of newItems) {
    if (!item || typeof item !== "object") continue;
    const rec = item as Record<string, unknown>;

    if (rec.type === "tool_call_output_item" && "output" in rec) {
      const parsedOutput = parseToolResultOutput(rec.output);
      const next = tryParseAssistantToolData(parsedOutput);
      if (next) collected.push(next);
      continue;
    }

    const raw = rec.rawItem as Record<string, unknown> | undefined;
    if (raw?.type === "function_call_result") {
      const parsedOutput = parseToolResultOutput(raw.output);
      const next = tryParseAssistantToolData(parsedOutput);
      if (next) collected.push(next);
    }
  }
  return collected;
}

/**
 * Create a per-request Runner with an isolated OpenAI provider.
 * This avoids global state races when multiple users call concurrently.
 */
function createRunner(apiKey: string): Runner {
  const provider = new OpenAIProvider({ apiKey });
  return new Runner({ modelProvider: provider });
}

/**
 * Extract the tool-call ID from a RunToolApprovalItem so we can match it
 * precisely when the user approves/rejects.
 */
function extractToolCallId(item: RunToolApprovalItem): string | null {
  const raw = item.rawItem as Record<string, unknown> | undefined;
  if (!raw) return null;
  if (typeof raw.call_id === "string") return raw.call_id;
  if (typeof raw.id === "string") return raw.id;
  return null;
}

export async function runAgentStreaming(input: {
  agent: Agent<any, any>;
  messageOrState: string | AgentInputItem[] | RunState<any, Agent<any, any>>;
  context: { userId: string };
  apiKey: string;
  userId: string;
  conversationId: string;
  onTextDelta?: (delta: string) => void;
  onToolData?: (data: AssistantToolDataList) => void;
  signal?: AbortSignal;
}) {
  const {
    agent,
    messageOrState,
    context,
    apiKey,
    userId,
    conversationId,
    onTextDelta,
    onToolData,
    signal,
  } = input;

  const runner = createRunner(apiKey);
  const stream: StreamedRunResult<any, any> = await runner.run(agent, messageOrState, {
    stream: true,
    context,
    signal,
  });

  // Iterate real stream events
  for await (const event of stream) {
    if (signal?.aborted) break;

    if (event.type === "raw_model_stream_event") {
      if (
        isOpenAIResponsesRawModelStreamEvent(event) &&
        event.data.event.type === "response.output_text.delta"
      ) {
        const delta = (event.data.event as { delta?: string }).delta;
        if (delta) onTextDelta?.(delta);
      }
    }

    if (event.type === "run_item_stream_event" && event.name === "tool_output") {
      const itemRecord = event.item as unknown as Record<string, unknown>;
      const parsedOutput = parseToolResultOutput(itemRecord.output);
      const toolData = tryParseAssistantToolData(parsedOutput);
      if (toolData) onToolData?.([toolData]);
    }
  }

  await stream.completed;

  // Extract final results
  const assistantPayload = parseAssistantPayload(stream.finalOutput);
  const assistantToolDataList = extractAssistantToolData(stream.newItems);
  let assistantText = outputToDisplayText(assistantPayload);
  if (!assistantText && stream.finalOutput) assistantText = stringifyOutput(stream.finalOutput);
  if (!assistantText) {
    const maybeMessage = stream.newItems.find((item: any) => item.type === "message_output_item");
    if (maybeMessage && "outputText" in (maybeMessage as any) && (maybeMessage as any).outputText) {
      assistantText = String((maybeMessage as any).outputText);
    }
  }

  // Handle interruptions (approval requests)
  const interruptions = stream.interruptions ?? [];
  const approvalEvents = await Promise.all(
    interruptions.map((item) =>
      mapInterruptionToEvent({
        item,
        userId,
        conversationId,
        state: stream.state,
      }),
    ),
  );

  return {
    assistantText,
    assistantPayload,
    assistantToolDataList,
    approvals: approvalEvents,
    state: stream.state,
  };
}

/**
 * Non-streaming run for simpler cases or fallback.
 */
export async function runAgentOnce(input: {
  agent: Agent<any, any>;
  messageOrState: string | AgentInputItem[] | RunState<any, Agent<any, any>>;
  context: { userId: string };
  apiKey: string;
  userId: string;
  conversationId: string;
}) {
  const { agent, messageOrState, context, apiKey, userId, conversationId } = input;

  const runner = createRunner(apiKey);
  const result: RunResult<any, any> = await runner.run(agent, messageOrState, {
    stream: false,
    context,
  });

  const assistantPayload = parseAssistantPayload(result.finalOutput);
  const assistantToolDataList = extractAssistantToolData(result.newItems);
  let assistantText = outputToDisplayText(assistantPayload);
  if (!assistantText && result.finalOutput) assistantText = stringifyOutput(result.finalOutput);
  if (!assistantText) {
    const maybeMessage = result.newItems.find((item: any) => item.type === "message_output_item");
    if (maybeMessage && "outputText" in (maybeMessage as any) && (maybeMessage as any).outputText) {
      assistantText = String((maybeMessage as any).outputText);
    }
  }

  const interruptions = result.interruptions ?? [];
  const approvalEvents = await Promise.all(
    interruptions.map((item) =>
      mapInterruptionToEvent({
        item,
        userId,
        conversationId,
        state: result.state,
      }),
    ),
  );

  return {
    assistantText,
    assistantPayload,
    assistantToolDataList,
    approvals: approvalEvents,
    state: result.state,
  };
}

async function mapInterruptionToEvent(input: {
  item: RunToolApprovalItem;
  userId: string;
  conversationId: string;
  state: RunState<any, Agent<any, any>>;
}) {
  const { item, userId, conversationId, state } = input;
  const serializedRunState = state.toString();
  const raw = item.rawItem as Record<string, unknown>;
  const toolName = typeof raw.name === "string" ? raw.name : "tool_call";
  const toolArguments =
    typeof raw.arguments === "string"
      ? raw.arguments
      : JSON.stringify(raw.arguments ?? {});
  const toolCallId = extractToolCallId(item);

  const approvalId = await createApprovalState({
    userId,
    conversationId,
    serializedRunState,
    toolName,
    toolArguments,
    toolCallId,
  });

  return {
    approvalId,
    toolName,
    toolCallId,
    arguments: toolArguments,
  };
}
