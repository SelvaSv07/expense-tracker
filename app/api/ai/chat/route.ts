import { createCazuraAgent } from "@/lib/ai/cazura-agent";
import { decryptApiKey } from "@/lib/ai/crypto";
import { runAgentWithSse } from "@/lib/ai/runner";
import { checkRateLimit } from "@/lib/ai/rate-limit";
import {
  appendMessage,
  createConversation,
  ensureConversationOwnership,
  getUserAiSettings,
} from "@/lib/ai/store";
import { createSseStream, SSE_HEADERS } from "@/lib/ai/sse";
import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  message: z.string().trim().min(1).max(8000),
  conversationId: z.string().optional(),
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
  const allowed = checkRateLimit(`ai:chat:${session.user.id}`, 40, 60_000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please wait and try again." },
      { status: 429 },
    );
  }

  const settings = await getUserAiSettings(session.user.id);
  if (!settings) {
    return NextResponse.json(
      { error: "OpenAI API key is not configured. Add it in Settings > AI." },
      { status: 400 },
    );
  }

  const conversationId =
    parsed.data.conversationId ?? (await createConversation(session.user.id));

  if (parsed.data.conversationId) {
    const owned = await ensureConversationOwnership(
      session.user.id,
      parsed.data.conversationId,
    );
    if (!owned) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }
  }

  await appendMessage({
    userId: session.user.id,
    conversationId,
    role: "user",
    content: parsed.data.message,
  });

  const apiKey = decryptApiKey(settings.openaiApiKeyEnc);
  const agent = createCazuraAgent(settings.model ?? "gpt-4.1-mini");

  const stream = createSseStream(async (writer) => {
    writer.send("meta", { conversationId });
    const result = await runAgentWithSse({
      writer,
      agent,
      messageOrState: parsed.data.message,
      context: { userId: session.user!.id },
      apiKey,
      userId: session.user!.id,
      conversationId,
    });

    if (result.assistantText) {
      await appendMessage({
        userId: session.user!.id,
        conversationId,
        role: "assistant",
        content: result.assistantText,
      });
      writer.send("assistant", { content: result.assistantText });
    }

    if (result.approvals.length > 0) {
      writer.send("interruptions", { approvals: result.approvals });
    }
    writer.send("done", { conversationId });
    writer.close();
  });

  return new Response(stream, {
    headers: SSE_HEADERS,
  });
}
