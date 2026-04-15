import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";

/** Chats are not persisted; list is always empty. */
export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ conversations: [] });
}

/** Chats are not persisted; returns a client-only id for compatibility. */
export async function POST() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ conversationId: crypto.randomUUID() });
}
