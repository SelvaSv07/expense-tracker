import { ensureConversationOwnership, listMessages } from "@/lib/ai/store";
import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, { params }: Params) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: conversationId } = await params;
  const owned = await ensureConversationOwnership(session.user.id, conversationId);
  if (!owned) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const messages = await listMessages(session.user.id, conversationId);
  return NextResponse.json({ messages });
}
