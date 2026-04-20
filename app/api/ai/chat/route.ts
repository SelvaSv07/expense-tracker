import { createCazuraAgent, type CazuraAgentContext } from "@/lib/ai/cazura-agent";
import { DEFAULT_OPENAI_MODEL_ID } from "@/lib/ai/openai-model-options";
import { decryptApiKey } from "@/lib/ai/crypto";
import { runAgentStreaming } from "@/lib/ai/runner";
import type { Agent, AgentOutputType } from "@openai/agents";
import { checkRateLimit } from "@/lib/ai/rate-limit";
import { getUserAiSettings } from "@/lib/ai/store";
import { createSseStream, SSE_HEADERS } from "@/lib/ai/sse";
import { getSession } from "@/lib/session";
import type { AgentInputItem } from "@openai/agents";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  conversationId: z.string().uuid(),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(32000),
      }),
    )
    .min(1)
    .max(80),
});

function buildHistoryInput(
  messages: { role: "user" | "assistant"; content: string }[],
): AgentInputItem[] {
  const historyInput: AgentInputItem[] = [];
  for (const m of messages) {
    if (m.role === "user") {
      historyInput.push({ role: "user", content: m.content });
      continue;
    }
    historyInput.push({
      type: "message",
      role: "assistant",
      status: "completed",
      content: [{ type: "output_text", text: m.content }],
    });
  }
  return historyInput;
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const allowed = checkRateLimit(`ai:chat:${session.user.id}`, 40, 60_000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please wait and try again." },
      { status: 429 },
    );
  }

  const { conversationId, messages } = parsed.data;
  const last = messages[messages.length - 1];
  if (last.role !== "user") {
    return NextResponse.json(
      { error: "The last message in the transcript must be from the user." },
      { status: 400 },
    );
  }

  const totalChars = messages.reduce((a, m) => a + m.content.length, 0);
  if (totalChars > 400_000) {
    return NextResponse.json(
      { error: "Conversation transcript is too long. Start a new chat." },
      { status: 400 },
    );
  }

  const settings = await getUserAiSettings(session.user.id);
  if (!settings) {
    return NextResponse.json(
      { error: "OpenAI API key is not configured. Add it in Settings > AI." },
      { status: 400 },
    );
  }

  const historyInput = buildHistoryInput(messages);

  const apiKey = decryptApiKey(settings.openaiApiKeyEnc);
  const agent = createCazuraAgent(settings.model ?? DEFAULT_OPENAI_MODEL_ID);

  const stream = createSseStream(async (writer) => {
    writer.send("meta", { conversationId });

    const result = await runAgentStreaming<CazuraAgentContext>({
      agent: agent as Agent<CazuraAgentContext, AgentOutputType>,
      messageOrState: historyInput,
      context: { userId: session.user.id },
      apiKey,
      userId: session.user.id,
      conversationId,
      onTextDelta(delta) {
        writer.send("token", { value: delta });
      },
      onToolData(dataList) {
        writer.send("assistant_tool_data", { toolDataList: dataList });
      },
      signal: request.signal,
    });

    const toolDataList = result.assistantToolDataList;

    let assistantContent = (result.assistantText ?? "").trim();
    if (!assistantContent) {
      assistantContent = result.assistantPayload?.message?.trim() ?? "";
    }
    if (!assistantContent && toolDataList.length > 0) {
      assistantContent = "Here is the data from your finance tools.";
    }

    if (assistantContent || toolDataList.length > 0 || result.assistantPayload) {
      if (assistantContent) {
        writer.send("assistant", { content: assistantContent });
      }
      if (result.assistantPayload) {
        writer.send("assistant_payload", { payload: result.assistantPayload });
      }
      if (toolDataList.length > 0) {
        writer.send("assistant_tool_data", { toolDataList });
      }
    }

    if (result.approvals.length > 0) {
      writer.send("interruptions", { approvals: result.approvals });
    }
    writer.send("done", { conversationId });
    writer.close();
  }, request.signal);

  return new Response(stream, {
    headers: SSE_HEADERS,
  });
}
