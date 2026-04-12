"use server";

import { db } from "@/db";
import { wallets } from "@/db/schema";
import { getSession } from "@/lib/session";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export async function createWallet(name: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const id = crypto.randomUUID();
  await db.insert(wallets).values({
    id,
    userId: session.user.id,
    name,
    currency: "INR",
    openingBalance: 0,
    isDefault: false,
  });
  revalidatePath("/");
  return id;
}

export async function setActiveWallet(walletId: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const [w] = await db
    .select()
    .from(wallets)
    .where(and(eq(wallets.id, walletId), eq(wallets.userId, session.user.id)))
    .limit(1);
  if (!w) throw new Error("Wallet not found");

  const jar = await cookies();
  jar.set("walletId", walletId, { path: "/", httpOnly: true, sameSite: "lax" });
  revalidatePath("/");
}
