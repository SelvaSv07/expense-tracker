import { createCazuraAgent } from "@/lib/ai/cazura-agent";
import { decryptApiKey } from "@/lib/ai/crypto";
import { runAgentWithSse } from "@/lib/ai/runner";
import { checkRateLimit } from "@/lib/ai/rate-limit";
import {
  appendMessage,
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
  const agent = createCazuraAgent(settings.model ?? "gpt-4.1-mini");

  const runState = await RunState.fromString(agent, approval.serializedRunState);
  const interruptions = runState.getInterruptions();
  const target = interruptions[0];
  if (!target) {
    await setApprovalStateStatus(parsed.data.approvalId, "expired");
    return NextResponse.json({ error: "No pending interruption to resolve" }, { status: 410 });
  }

  if (parsed.data.decision === "approve") {
    runState.approve(target);
    await setApprovalStateStatus(parsed.data.approvalId, "approved");
    await appendMessage({
      userId: session.user.id,
      conversationId: approval.conversationId,
      role: "tool",
      content: `Approved tool: ${approval.toolName ?? "unknown"}`,
      metadata: approval.toolArguments ?? null,
    });
  } else {
    runState.reject(target, {
      message: parsed.data.rejectMessage?.trim() || "User rejected this action.",
    });
    await setApprovalStateStatus(parsed.data.approvalId, "rejected");
    await appendMessage({
      userId: session.user.id,
      conversationId: approval.conversationId,
      role: "tool",
      content: `Rejected tool: ${approval.toolName ?? "unknown"}`,
      metadata: approval.toolArguments ?? null,
    });
  }

  const stream = createSseStream(async (writer) => {
    writer.send("meta", {
      conversationId: approval.conversationId,
      approvalId: parsed.data.approvalId,
      decision: parsed.data.decision,
    });

    const result = await runAgentWithSse({
      writer,
      agent,
      messageOrState: runState,
      context: { userId: session.user!.id },
      apiKey,
      userId: session.user!.id,
      conversationId: approval.conversationId,
    });

    if (result.assistantText) {
      await appendMessage({
        userId: session.user!.id,
        conversationId: approval.conversationId,
        role: "assistant",
        content: result.assistantText,
      });
      writer.send("assistant", { content: result.assistantText });
    }

    if (result.approvals.length > 0) {
      writer.send("interruptions", { approvals: result.approvals });
    }
    writer.send("done", { conversationId: approval.conversationId });
    writer.close();
  });

  return new Response(stream, { headers: SSE_HEADERS });
}
