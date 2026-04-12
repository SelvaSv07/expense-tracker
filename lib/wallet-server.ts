import { getDefaultWalletId, getWalletForUser } from "@/lib/queries";
import { cookies } from "next/headers";

export async function resolveWalletId(userId: string) {
  const jar = await cookies();
  const fromCookie = jar.get("walletId")?.value;
  if (fromCookie) {
    const w = await getWalletForUser(userId, fromCookie);
    if (w) return w.id;
  }
  const def = await getDefaultWalletId(userId);
  if (!def) throw new Error("No wallet");
  return def;
}
