"use server";

import { db } from "@/db";
import { budgets, categories, wallets } from "@/db/schema";
import { getSession } from "@/lib/session";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const upsertSchema = z.object({
  walletId: z.string(),
  categoryId: z.string(),
  yearMonth: z.coerce.date(),
  amount: z.number().int().nonnegative(),
});

export async function upsertBudget(input: z.infer<typeof upsertSchema>) {
  const parsed = upsertSchema.parse(input);
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
        eq(categories.type, "expense"),
      ),
    )
    .limit(1);
  if (!c) throw new Error("Invalid expense category");

  const ym = new Date(parsed.yearMonth);
  const first = new Date(ym.getFullYear(), ym.getMonth(), 1);

  const [existing] = await db
    .select({ id: budgets.id })
    .from(budgets)
    .where(
      and(
        eq(budgets.walletId, parsed.walletId),
        eq(budgets.categoryId, parsed.categoryId),
        eq(budgets.yearMonth, first),
      ),
    )
    .limit(1);

  if (existing) {
    await db
      .update(budgets)
      .set({
        amount: parsed.amount,
        updatedAt: new Date(),
      })
      .where(eq(budgets.id, existing.id));
  } else {
    await db.insert(budgets).values({
      id: crypto.randomUUID(),
      walletId: parsed.walletId,
      categoryId: parsed.categoryId,
      yearMonth: first,
      amount: parsed.amount,
    });
  }

  revalidatePath("/");
}

export async function deleteBudget(budgetId: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const [row] = await db
    .select({ id: budgets.id })
    .from(budgets)
    .innerJoin(wallets, eq(budgets.walletId, wallets.id))
    .where(and(eq(budgets.id, budgetId), eq(wallets.userId, session.user.id)))
    .limit(1);

  if (!row) throw new Error("Not found");
  await db.delete(budgets).where(eq(budgets.id, budgetId));
  revalidatePath("/");
}
