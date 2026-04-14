"use server";

import { db } from "@/db";
import { budgets, categories } from "@/db/schema";
import { BUDGET_RECURRING_ANCHOR } from "@/lib/budget-recurring";
import {
  getBudgetBreakdownForMonth,
  getBudgetPercentLastNMonths,
} from "@/lib/queries";
import type { RadarWindowMonths } from "@/lib/search-params-time";
import { getSession } from "@/lib/session";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { BudgetBreakdownRow } from "@/lib/budget-breakdown";

const monthKeySchema = z.string().regex(/^\d{4}-\d{2}$/);

/** Load breakdown for month navigation without a full `/budget` RSC navigation. */
export async function loadBudgetSpendingBreakdownForMonth(monthKey: string): Promise<{
  rows: BudgetBreakdownRow[];
  viewMonthLabel: string;
  monthKey: string;
}> {
  const parsed = monthKeySchema.safeParse(monthKey);
  if (!parsed.success) throw new Error("Invalid month");

  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const [y, mo] = monthKey.split("-").map(Number);
  if (y < 2000 || y > 2100 || mo < 1 || mo > 12) throw new Error("Invalid month");

  const viewMonthDate = new Date(y, mo - 1, 1);
  const raw = await getBudgetBreakdownForMonth(session.user.id, viewMonthDate);
  const rows: BudgetBreakdownRow[] = raw.map((r) => ({
    budgetId: r.budgetId,
    categoryName: r.categoryName,
    categoryIcon: r.categoryIcon,
    categoryColor: r.categoryColor,
    budgeted: r.budgeted,
    spent: r.spent,
    pct: r.pct,
    budgetScope: r.budgetScope,
  }));

  const viewMonthLabel = viewMonthDate.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  return { rows, viewMonthLabel, monthKey };
}

const radarWindowSchema = z.union([
  z.literal(3),
  z.literal(6),
  z.literal(9),
  z.literal(12),
]);

/** Radar series for “last N months” without a full `/budget` RSC navigation. */
export async function loadBudgetRadarSeries(input: {
  anchorMonthKey: string;
  months: RadarWindowMonths;
}): Promise<{ data: { month: string; pct: number }[] }> {
  const mk = monthKeySchema.safeParse(input.anchorMonthKey);
  if (!mk.success) throw new Error("Invalid month");
  const rm = radarWindowSchema.safeParse(input.months);
  if (!rm.success) throw new Error("Invalid window");

  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const [y, mo] = input.anchorMonthKey.split("-").map(Number);
  if (y < 2000 || y > 2100 || mo < 1 || mo > 12) throw new Error("Invalid month");

  const anchor = new Date(y, mo - 1, 1);
  const data = await getBudgetPercentLastNMonths(
    session.user.id,
    anchor,
    input.months,
  );
  return { data };
}

const upsertSchema = z.object({
  categoryId: z.string(),
  amount: z.number().int().nonnegative(),
  recurring: z.boolean(),
  /** Calendar month: budget applies to this month only, or recurring starts here (first of month). */
  month: z.coerce.date(),
});

export async function upsertBudget(input: z.infer<typeof upsertSchema>) {
  const parsed = upsertSchema.parse(input);
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

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

  const firstOfSelected = new Date(
    parsed.month.getFullYear(),
    parsed.month.getMonth(),
    1,
  );

  if (parsed.recurring) {
    const [existing] = await db
      .select({ id: budgets.id })
      .from(budgets)
      .where(
        and(
          eq(budgets.userId, session.user.id),
          eq(budgets.categoryId, parsed.categoryId),
          eq(budgets.recurring, true),
        ),
      )
      .limit(1);

    if (existing) {
      await db
        .update(budgets)
        .set({
          amount: parsed.amount,
          yearMonth: BUDGET_RECURRING_ANCHOR,
          startsMonth: firstOfSelected,
          updatedAt: new Date(),
        })
        .where(eq(budgets.id, existing.id));
    } else {
      await db.insert(budgets).values({
        id: crypto.randomUUID(),
        userId: session.user.id,
        categoryId: parsed.categoryId,
        yearMonth: BUDGET_RECURRING_ANCHOR,
        recurring: true,
        startsMonth: firstOfSelected,
        amount: parsed.amount,
      });
    }
  } else {
    const first = firstOfSelected;

    const [existing] = await db
      .select({ id: budgets.id })
      .from(budgets)
      .where(
        and(
          eq(budgets.userId, session.user.id),
          eq(budgets.categoryId, parsed.categoryId),
          eq(budgets.recurring, false),
          eq(budgets.yearMonth, first),
        ),
      )
      .limit(1);

    if (existing) {
      await db
        .update(budgets)
        .set({
          amount: parsed.amount,
          startsMonth: null,
          updatedAt: new Date(),
        })
        .where(eq(budgets.id, existing.id));
    } else {
      await db.insert(budgets).values({
        id: crypto.randomUUID(),
        userId: session.user.id,
        categoryId: parsed.categoryId,
        yearMonth: first,
        recurring: false,
        startsMonth: null,
        amount: parsed.amount,
      });
    }
  }

  revalidatePath("/");
  revalidatePath("/budget");
}

export async function deleteBudget(budgetId: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const [row] = await db
    .select({ id: budgets.id })
    .from(budgets)
    .where(and(eq(budgets.id, budgetId), eq(budgets.userId, session.user.id)))
    .limit(1);

  if (!row) throw new Error("Not found");
  await db.delete(budgets).where(eq(budgets.id, budgetId));
  revalidatePath("/");
  revalidatePath("/budget");
}
