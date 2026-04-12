"use server";

import { db } from "@/db";
import { categories, transactions, wallets } from "@/db/schema";
import { getSession } from "@/lib/session";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const schema = z.object({
  walletId: z.string(),
  categoryId: z.string(),
  amount: z.number().int().positive(),
  occurredAt: z.coerce.date(),
  note: z.string().optional(),
  paymentMethod: z.string().optional(),
});

export async function createTransaction(input: z.infer<typeof schema>) {
  const parsed = schema.parse(input);
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const [w] = await db
    .select()
    .from(wallets)
    .where(
      and(eq(wallets.id, parsed.walletId), eq(wallets.userId, session.user.id)),
    )
    .limit(1);
  if (!w) throw new Error("Wallet not found");

  const [c] = await db
    .select()
    .from(categories)
    .where(
      and(
        eq(categories.id, parsed.categoryId),
        eq(categories.userId, session.user.id),
      ),
    )
    .limit(1);
  if (!c) throw new Error("Invalid category");

  const id = crypto.randomUUID();
  await db.insert(transactions).values({
    id,
    walletId: parsed.walletId,
    categoryId: parsed.categoryId,
    amount: parsed.amount,
    occurredAt: parsed.occurredAt,
    note: parsed.note ?? null,
    paymentMethod: parsed.paymentMethod ?? null,
  });

  revalidatePath("/");
  return id;
}

export async function deleteTransaction(transactionId: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const [row] = await db
    .select({ id: transactions.id, walletId: transactions.walletId })
    .from(transactions)
    .innerJoin(wallets, eq(transactions.walletId, wallets.id))
    .where(
      and(
        eq(transactions.id, transactionId),
        eq(wallets.userId, session.user.id),
      ),
    )
    .limit(1);

  if (!row) throw new Error("Not found");

  await db.delete(transactions).where(eq(transactions.id, transactionId));
  revalidatePath("/");
}
