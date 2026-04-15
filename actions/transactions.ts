"use server";

import { db } from "@/db";
import { categories, transactions } from "@/db/schema";
import { listPaymentMethods } from "@/lib/queries";
import { getSession } from "@/lib/session";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const schema = z.object({
  categoryId: z.string(),
  amount: z.number().int().positive(),
  occurredAt: z.coerce.date(),
  transactionName: z.string().optional(),
  note: z.string().optional(),
  paymentMethod: z.string().optional(),
});

export async function createTransaction(input: z.infer<typeof schema>) {
  const parsed = schema.parse(input);
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

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

  let paymentMethod: string | null = null;
  const rawPm = parsed.paymentMethod?.trim();
  if (rawPm) {
    const methods = await listPaymentMethods(session.user.id);
    const allowed = new Set(methods.map((m) => m.name));
    if (!allowed.has(rawPm)) {
      throw new Error(
        `Invalid payment method "${rawPm}". Add or choose a method from Settings → Payment methods.`,
      );
    }
    paymentMethod = rawPm;
  }

  const id = crypto.randomUUID();
  await db.insert(transactions).values({
    id,
    userId: session.user.id,
    categoryId: parsed.categoryId,
    amount: parsed.amount,
    occurredAt: parsed.occurredAt,
    transactionName: parsed.transactionName?.trim() || null,
    note: parsed.note?.trim() || null,
    paymentMethod,
  });

  revalidatePath("/");
  revalidatePath("/transactions");
  revalidatePath("/settings/payment-methods");
  return id;
}

export async function deleteTransaction(transactionId: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const [row] = await db
    .select({ id: transactions.id })
    .from(transactions)
    .where(
      and(
        eq(transactions.id, transactionId),
        eq(transactions.userId, session.user.id),
      ),
    )
    .limit(1);

  if (!row) throw new Error("Not found");

  await db.delete(transactions).where(eq(transactions.id, transactionId));
  revalidatePath("/");
}
