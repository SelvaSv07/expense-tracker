import { createCazuraAgent } from "@/lib/ai/cazura-agent";
import { DEFAULT_OPENAI_MODEL_ID } from "@/lib/ai/openai-model-options";
import { decryptApiKey } from "@/lib/ai/crypto";
import { runAgentStreaming } from "@/lib/ai/runner";
import { checkRateLimit } from "@/lib/ai/rate-limit";
import {
  getApprovalState,
  getUserAiSettings,
  setApprovalStateStatus,
} from "@/lib/ai/store";
import { createSseStream, SSE_HEADERS } from "@/lib/ai/sse";
import { getSession } from "@/lib/session";
import { RunState } from "@openai/agents";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  approvalId: z.string(),
  decision: z.enum(["approve", "reject"]),
  rejectMessage: z.string().optional(),
});

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
  const allowed = checkRateLimit(`ai:approve:${session.user.id}`, 40, 60_000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please wait and try again." },
      { status: 429 },
    );
  }

  const approval = await getApprovalState(session.user.id, parsed.data.approvalId);
  if (!approval) {
    return NextResponse.json({ error: "Approval request not found" }, { status: 404 });
  }
  if (approval.status !== "pending") {
    return NextResponse.json({ error: "Approval request already resolved" }, { status: 409 });
  }

  const settings = await getUserAiSettings(session.user.id);
  if (!settings) {
    return NextResponse.json(
      { error: "OpenAI API key is not configured. Add it in Settings > AI." },
      { status: 400 },
    );
  }
  const apiKey = decryptApiKey(settings.openaiApiKeyEnc);
  const agent = createCazuraAgent(settings.model ?? DEFAULT_OPENAI_MODEL_ID);

  const runState = await RunState.fromString(agent, approval.serializedRunState);
  const interruptions = runState.getInterruptions();

  // Find the exact interruption matching the stored toolCallId, or fall back to matching by toolName
  let target = interruptions[0];
  if (approval.toolCallId) {
    const match = interruptions.find((item) => {
      const raw = item.rawItem as Record<string, unknown> | undefined;
      if (!raw) return false;
      return raw.call_id === approval.toolCallId || raw.id === approval.toolCallId;
    });
    if (match) target = match;
  }

  if (!target) {
    await setApprovalStateStatus(parsed.data.approvalId, "expired");
    return NextResponse.json({ error: "No pending interruption to resolve" }, { status: 410 });
  }

  if (parsed.data.decision === "approve") {
    runState.approve(target);
    await setApprovalStateStatus(parsed.data.approvalId, "approved");
  } else {
    runState.reject(target, {
      message: parsed.data.rejectMessage?.trim() || "User rejected this action.",
    });
    await setApprovalStateStatus(parsed.data.approvalId, "rejected");
  }

  const stream = createSseStream(async (writer) => {
    writer.send("meta", { conversationId: approval.conversationId });

    const result = await runAgentStreaming({
      agent,
      messageOrState: runState,
      context: { userId: session.user.id },
      apiKey,
      userId: session.user.id,
      conversationId: approval.conversationId,
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
    writer.send("done", { conversationId: approval.conversationId });
    writer.close();
  }, request.signal);

  return new Response(stream, {
    headers: SSE_HEADERS,
  });
}
