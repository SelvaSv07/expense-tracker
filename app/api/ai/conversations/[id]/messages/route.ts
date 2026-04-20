import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";

type Params = {
  params: Promise<{ id: string }>;
};

/** Chats are not persisted; messages are always empty. */
export async function GET(request: Request, context: Params) {
  void request;
  void context;
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ messages: [] });
}
