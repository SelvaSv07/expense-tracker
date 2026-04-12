import { db } from "@/db";
import {
  budgets,
  categories,
  goalContributions,
  goals,
  transactions,
  wallets,
} from "@/db/schema";
import type { TimePreset } from "@/lib/time-range";
import { getRangeFromPreset, getPreviousRange } from "@/lib/time-range";
import { and, desc, eq, gte, lte } from "drizzle-orm";

export async function getWalletForUser(userId: string, walletId: string) {
  const [w] = await db
    .select()
    .from(wallets)
    .where(and(eq(wallets.userId, userId), eq(wallets.id, walletId)))
    .limit(1);
  return w ?? null;
}

export async function getDefaultWalletId(userId: string) {
  const [def] = await db
    .select({ id: wallets.id })
    .from(wallets)
    .where(and(eq(wallets.userId, userId), eq(wallets.isDefault, true)))
    .limit(1);
  if (def) return def.id;
  const [first] = await db
    .select({ id: wallets.id })
    .from(wallets)
    .where(eq(wallets.userId, userId))
    .limit(1);
  return first?.id ?? null;
}

export async function listWallets(userId: string) {
  return db
    .select()
    .from(wallets)
    .where(eq(wallets.userId, userId))
    .orderBy(desc(wallets.isDefault), wallets.name);
}

export async function listCategories(userId: string) {
  return db
    .select()
    .from(categories)
    .where(eq(categories.userId, userId))
    .orderBy(categories.name);
}

export async function getTransactionAggregates(
  walletId: string,
  preset: TimePreset,
  custom?: { from: Date; to: Date },
) {
  const range = getRangeFromPreset(preset, new Date(), custom);
  const prev = getPreviousRange(preset, new Date(), custom);

  const rows = await db
    .select({
      amount: transactions.amount,
      type: categories.type,
    })
    .from(transactions)
    .innerJoin(categories, eq(transactions.categoryId, categories.id))
    .where(
      and(
        eq(transactions.walletId, walletId),
        gte(transactions.occurredAt, range.start),
        lte(transactions.occurredAt, range.end),
      ),
    );

  let income = 0;
  let expense = 0;
  for (const r of rows) {
    if (r.type === "income") income += r.amount;
    else expense += r.amount;
  }

  const prevRows = await db
    .select({
      amount: transactions.amount,
      type: categories.type,
    })
    .from(transactions)
    .innerJoin(categories, eq(transactions.categoryId, categories.id))
    .where(
      and(
        eq(transactions.walletId, walletId),
        gte(transactions.occurredAt, prev.start),
        lte(transactions.occurredAt, prev.end),
      ),
    );

  let prevIncome = 0;
  let prevExpense = 0;
  for (const r of prevRows) {
    if (r.type === "income") prevIncome += r.amount;
    else prevExpense += r.amount;
  }

  const totalVolume = income + expense;

  return {
    range,
    income,
    expense,
    totalVolume,
    prevIncome,
    prevExpense,
    prevTotalVolume: prevIncome + prevExpense,
  };
}

export async function getBalance(walletId: string, openingBalance: number) {
  const rows = await db
    .select({
      amount: transactions.amount,
      type: categories.type,
    })
    .from(transactions)
    .innerJoin(categories, eq(transactions.categoryId, categories.id))
    .where(eq(transactions.walletId, walletId));

  let sum = openingBalance;
  for (const r of rows) {
    if (r.type === "income") sum += r.amount;
    else sum -= r.amount;
  }
  return sum;
}

export async function getTodaySpend(walletId: string, day = new Date()) {
  const start = new Date(day);
  start.setHours(0, 0, 0, 0);
  const end = new Date(day);
  end.setHours(23, 59, 59, 999);

  const rows = await db
    .select({
      amount: transactions.amount,
      type: categories.type,
    })
    .from(transactions)
    .innerJoin(categories, eq(transactions.categoryId, categories.id))
    .where(
      and(
        eq(transactions.walletId, walletId),
        eq(categories.type, "expense"),
        gte(transactions.occurredAt, start),
        lte(transactions.occurredAt, end),
      ),
    );

  return rows.reduce((a, r) => a + r.amount, 0);
}

export async function getCashFlowByMonth(
  walletId: string,
  year: number,
  granularity: "month" | "week" = "month",
) {
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31, 23, 59, 59, 999);

  const rows = await db
    .select({
      occurredAt: transactions.occurredAt,
      amount: transactions.amount,
      type: categories.type,
    })
    .from(transactions)
    .innerJoin(categories, eq(transactions.categoryId, categories.id))
    .where(
      and(
        eq(transactions.walletId, walletId),
        gte(transactions.occurredAt, start),
        lte(transactions.occurredAt, end),
      ),
    );

  if (granularity === "month") {
    const buckets = Array.from({ length: 12 }, (_, i) => ({
      label: new Date(year, i, 1).toLocaleString("en-US", { month: "short" }),
      income: 0,
      expense: 0,
    }));
    for (const r of rows) {
      const m = r.occurredAt.getMonth();
      if (r.type === "income") buckets[m].income += r.amount;
      else buckets[m].expense += r.amount;
    }
    return buckets;
  }

  return [];
}

export async function listTransactionsWithCategory(
  walletId: string,
  preset: TimePreset,
  custom?: { from: Date; to: Date },
) {
  const range = getRangeFromPreset(preset, new Date(), custom);
  return db
    .select({
      id: transactions.id,
      amount: transactions.amount,
      occurredAt: transactions.occurredAt,
      note: transactions.note,
      paymentMethod: transactions.paymentMethod,
      categoryId: transactions.categoryId,
      categoryName: categories.name,
      categoryType: categories.type,
      categoryIcon: categories.icon,
    })
    .from(transactions)
    .innerJoin(categories, eq(transactions.categoryId, categories.id))
    .where(
      and(
        eq(transactions.walletId, walletId),
        gte(transactions.occurredAt, range.start),
        lte(transactions.occurredAt, range.end),
      ),
    )
    .orderBy(desc(transactions.occurredAt));
}

export async function getExpenseBreakdown(
  walletId: string,
  preset: TimePreset,
  custom?: { from: Date; to: Date },
) {
  const range = getRangeFromPreset(preset, new Date(), custom);
  const rows = await db
    .select({
      name: categories.name,
      amount: transactions.amount,
    })
    .from(transactions)
    .innerJoin(categories, eq(transactions.categoryId, categories.id))
    .where(
      and(
        eq(transactions.walletId, walletId),
        eq(categories.type, "expense"),
        gte(transactions.occurredAt, range.start),
        lte(transactions.occurredAt, range.end),
      ),
    );

  const map = new Map<string, number>();
  for (const r of rows) {
    map.set(r.name, (map.get(r.name) ?? 0) + r.amount);
  }
  return [...map.entries()].map(([name, value]) => ({ name, value }));
}

export async function getBudgetUsageForRange(
  walletId: string,
  preset: TimePreset,
  custom?: { from: Date; to: Date },
) {
  const range = getRangeFromPreset(preset, new Date(), custom);

  const monthStarts = new Set<number>();
  let t = new Date(range.start);
  while (t <= range.end) {
    monthStarts.add(new Date(t.getFullYear(), t.getMonth(), 1).getTime());
    t = new Date(t.getFullYear(), t.getMonth() + 1, 1);
  }

  const budgetsRows = await db
    .select()
    .from(budgets)
    .where(eq(budgets.walletId, walletId));

  let budgeted = 0;
  for (const b of budgetsRows) {
    const bm = new Date(b.yearMonth);
    bm.setHours(0, 0, 0, 0);
    const key = new Date(bm.getFullYear(), bm.getMonth(), 1).getTime();
    if (monthStarts.has(key)) budgeted += b.amount;
  }

  const spentRows = await db
    .select({ amount: transactions.amount })
    .from(transactions)
    .innerJoin(categories, eq(transactions.categoryId, categories.id))
    .where(
      and(
        eq(transactions.walletId, walletId),
        eq(categories.type, "expense"),
        gte(transactions.occurredAt, range.start),
        lte(transactions.occurredAt, range.end),
      ),
    );

  const spent = spentRows.reduce((a, r) => a + r.amount, 0);

  return { budgeted, spent };
}

export async function getBudgetVsSpentByMonth(walletId: string, year: number) {
  const labels = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const out: { month: string; budgeted: number; spent: number }[] = [];

  const bSum = await db
    .select()
    .from(budgets)
    .where(eq(budgets.walletId, walletId));

  for (let m = 0; m < 12; m++) {
    const start = new Date(year, m, 1);
    const end = new Date(year, m + 1, 0, 23, 59, 59, 999);

    let budgeted = 0;
    for (const b of bSum) {
      const d = new Date(b.yearMonth);
      if (d.getFullYear() === year && d.getMonth() === m) {
        budgeted += b.amount;
      }
    }

    const spentRows = await db
      .select({ amount: transactions.amount })
      .from(transactions)
      .innerJoin(categories, eq(transactions.categoryId, categories.id))
      .where(
        and(
          eq(transactions.walletId, walletId),
          eq(categories.type, "expense"),
          gte(transactions.occurredAt, start),
          lte(transactions.occurredAt, end),
        ),
      );

    const spent = spentRows.reduce((a, r) => a + r.amount, 0);

    out.push({
      month: labels[m] ?? "",
      budgeted,
      spent,
    });
  }

  return out;
}

export async function getBudgetPercentByMonth(walletId: string, year: number) {
  const months = await getBudgetVsSpentByMonth(walletId, year);
  return months.map((row) => {
    const pct =
      row.budgeted > 0
        ? Math.min(100, Math.round((row.spent / row.budgeted) * 100))
        : 0;
    return {
      month: row.month,
      pct,
      full: 100,
    };
  });
}

export async function getBudgetBreakdownForMonth(
  walletId: string,
  monthDate: Date,
) {
  const start = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const end = new Date(
    monthDate.getFullYear(),
    monthDate.getMonth() + 1,
    0,
    23,
    59,
    59,
    999,
  );

  const budgetRows = await db
    .select({
      categoryId: budgets.categoryId,
      amount: budgets.amount,
      categoryName: categories.name,
    })
    .from(budgets)
    .innerJoin(categories, eq(budgets.categoryId, categories.id))
    .where(and(eq(budgets.walletId, walletId), eq(budgets.yearMonth, start)));

  const spent = await db
    .select({
      categoryId: categories.id,
      categoryName: categories.name,
      amount: transactions.amount,
    })
    .from(transactions)
    .innerJoin(categories, eq(transactions.categoryId, categories.id))
    .where(
      and(
        eq(transactions.walletId, walletId),
        eq(categories.type, "expense"),
        gte(transactions.occurredAt, start),
        lte(transactions.occurredAt, end),
      ),
    );

  const spentMap = new Map<string, number>();
  for (const s of spent) {
    spentMap.set(
      s.categoryId,
      (spentMap.get(s.categoryId) ?? 0) + s.amount,
    );
  }

  return budgetRows.map((b) => {
    const s = spentMap.get(b.categoryId) ?? 0;
    const pct = b.amount > 0 ? Math.round((s / b.amount) * 100) : 0;
    return {
      categoryId: b.categoryId,
      categoryName: b.categoryName,
      budgeted: b.amount,
      spent: s,
      pct,
    };
  });
}

export async function listGoals(userId: string) {
  return db
    .select()
    .from(goals)
    .where(eq(goals.userId, userId))
    .orderBy(desc(goals.createdAt));
}

export async function getGoalMetrics(userId: string) {
  const gs = await listGoals(userId);
  const totalSaved = gs.reduce((a, g) => a + g.savedAmount, 0);
  const active = gs.filter((g) => g.savedAmount < g.targetAmount).length;

  const contribRows = await db
    .select({
      amount: goalContributions.amount,
      occurredAt: goalContributions.occurredAt,
    })
    .from(goalContributions)
    .innerJoin(goals, eq(goalContributions.goalId, goals.id))
    .where(eq(goals.userId, userId));

  const byMonth = new Map<string, number>();
  for (const c of contribRows) {
    const k = `${c.occurredAt.getFullYear()}-${c.occurredAt.getMonth()}`;
    byMonth.set(k, (byMonth.get(k) ?? 0) + c.amount);
  }
  const avgMonthly =
    byMonth.size > 0
      ? [...byMonth.values()].reduce((a, b) => a + b, 0) / byMonth.size
      : 0;

  return { totalSaved, active, avgMonthly: Math.round(avgMonthly) };
}

export async function getGoalContributionSeries(userId: string) {
  const rows = await db
    .select({
      occurredAt: goalContributions.occurredAt,
      amount: goalContributions.amount,
    })
    .from(goalContributions)
    .innerJoin(goals, eq(goalContributions.goalId, goals.id))
    .where(eq(goals.userId, userId))
    .orderBy(goalContributions.occurredAt);

  let cum = 0;
  return rows.map((r) => {
    cum += r.amount;
    return {
      date: r.occurredAt.toISOString().slice(0, 10),
      cumulative: cum,
    };
  });
}
