import { RunState, run, setDefaultOpenAIKey } from "@openai/agents";
import type { Agent, RunToolApprovalItem } from "@openai/agents";
import { createApprovalState } from "@/lib/ai/store";
import type { SseWriter } from "@/lib/ai/sse";

function stringifyOutput(value: unknown): string {
  if (typeof value === "string") return value;
  if (value == null) return "";
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export async function runAgentWithSse(input: {
  writer: SseWriter;
  agent: Agent<any, any>;
  messageOrState: string | RunState<any, Agent<any, any>>;
  context: { userId: string };
  apiKey: string;
  userId: string;
  conversationId: string;
}) {
  const { writer, agent, messageOrState, context, apiKey, userId, conversationId } = input;

  setDefaultOpenAIKey(apiKey);
  const streamed = await run(agent, messageOrState, {
    stream: true,
    context,
  });

  const reader = streamed.toTextStream().getReader();
  let assistantText = "";
  while (true) {
    const chunk = await reader.read();
    if (chunk.done) break;
    if (chunk.value) {
      assistantText += chunk.value;
      writer.send("token", { value: chunk.value });
    }
  }
  await streamed.completed;

  if (!assistantText && streamed.finalOutput) {
    assistantText = stringifyOutput(streamed.finalOutput);
  }

  const interruptions = streamed.interruptions ?? [];
  const approvalEvents = await Promise.all(
    interruptions.map((item) =>
      mapInterruptionToEvent({
        item,
        userId,
        conversationId,
        state: streamed.state,
      }),
    ),
  );

  return {
    assistantText,
    approvals: approvalEvents,
    state: streamed.state,
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
  const approvalId = await createApprovalState({
    userId,
    conversationId,
    serializedRunState,
    toolName: item.rawItem.name,
    toolArguments: item.rawItem.arguments,
  });

  return {
    approvalId,
    toolName: item.rawItem.name,
    arguments: item.rawItem.arguments,
  };
}
