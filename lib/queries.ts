import { db } from "@/db";
import {
  budgets,
  categories,
  goalContributions,
  goals,
  transactions,
  userFinance,
} from "@/db/schema";
import type { MonthRef, TimePreset } from "@/lib/time-range";
import { getRangeFromPreset, getPreviousRange } from "@/lib/time-range";
import { and, count, desc, eq, gte, lte } from "drizzle-orm";

export async function getOpeningBalanceForUser(userId: string): Promise<number> {
  const [r] = await db
    .select({ openingBalance: userFinance.openingBalance })
    .from(userFinance)
    .where(eq(userFinance.userId, userId))
    .limit(1);
  return r?.openingBalance ?? 0;
}

export async function listCategories(userId: string) {
  return db
    .select()
    .from(categories)
    .where(eq(categories.userId, userId))
    .orderBy(categories.name);
}

/** Per-category usage (transactions + budgets) for this user. */
export async function getCategoryUsage(userId: string) {
  const txRows = await db
    .select({
      categoryId: transactions.categoryId,
      n: count(),
    })
    .from(transactions)
    .innerJoin(categories, eq(transactions.categoryId, categories.id))
    .where(eq(categories.userId, userId))
    .groupBy(transactions.categoryId);

  const budgetRows = await db
    .select({
      categoryId: budgets.categoryId,
      n: count(),
    })
    .from(budgets)
    .where(eq(budgets.userId, userId))
    .groupBy(budgets.categoryId);

  const map: Record<string, { transactions: number; budgets: number }> = {};
  for (const r of txRows) {
    map[r.categoryId] = { transactions: Number(r.n), budgets: 0 };
  }
  for (const r of budgetRows) {
    const cur = map[r.categoryId] ?? { transactions: 0, budgets: 0 };
    cur.budgets = Number(r.n);
    map[r.categoryId] = cur;
  }
  return map;
}

export async function getTransactionAggregates(
  userId: string,
  preset: TimePreset,
  custom?: { from: Date; to: Date },
  monthRef?: MonthRef,
) {
  const range = getRangeFromPreset(preset, new Date(), custom, monthRef);
  const prev = getPreviousRange(preset, new Date(), custom, monthRef);

  const rows = await db
    .select({
      amount: transactions.amount,
      type: categories.type,
    })
    .from(transactions)
    .innerJoin(categories, eq(transactions.categoryId, categories.id))
    .where(
      and(
        eq(transactions.userId, userId),
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
        eq(transactions.userId, userId),
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

export async function getBalance(userId: string) {
  const openingBalance = await getOpeningBalanceForUser(userId);
  const rows = await db
    .select({
      amount: transactions.amount,
      type: categories.type,
    })
    .from(transactions)
    .innerJoin(categories, eq(transactions.categoryId, categories.id))
    .where(eq(transactions.userId, userId));

  let sum = openingBalance;
  for (const r of rows) {
    if (r.type === "income") sum += r.amount;
    else sum -= r.amount;
  }
  return sum;
}

export async function getTodaySpend(userId: string, day = new Date()) {
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
        eq(transactions.userId, userId),
        eq(categories.type, "expense"),
        gte(transactions.occurredAt, start),
        lte(transactions.occurredAt, end),
      ),
    );

  return rows.reduce((a, r) => a + r.amount, 0);
}

export type CashFlowGranularity = "month" | "week" | "year";

function ordinalDayEn(day: number): string {
  if (day >= 11 && day <= 13) return `${day}th`;
  switch (day % 10) {
    case 1:
      return `${day}st`;
    case 2:
      return `${day}nd`;
    case 3:
      return `${day}rd`;
    default:
      return `${day}th`;
  }
}

/** e.g. "1st Apr - 7th Apr" for week buckets within a calendar month. */
function weekBucketDateRangeLabel(
  year: number,
  monthIndex: number,
  weekIndex: number,
  daysInMonth: number,
): string {
  const startDay = weekIndex * 7 + 1;
  const endDay = Math.min((weekIndex + 1) * 7, daysInMonth);
  const monthShort = new Date(year, monthIndex, 1).toLocaleString("en-US", {
    month: "short",
  });
  return `${ordinalDayEn(startDay)} ${monthShort} - ${ordinalDayEn(endDay)} ${monthShort}`;
}

/** Income/expense buckets for the cash-flow chart (amounts in paisa). */
export async function getCashFlowSeries(
  userId: string,
  year: number,
  granularity: CashFlowGranularity,
  opts?: { weekMonthIndex?: number },
): Promise<{ label: string; income: number; expense: number }[]> {
  if (granularity === "year") {
    const startYear = year - 4;
    const start = new Date(startYear, 0, 1);
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
          eq(transactions.userId, userId),
          gte(transactions.occurredAt, start),
          lte(transactions.occurredAt, end),
        ),
      );

    const buckets = Array.from({ length: year - startYear + 1 }, (_, i) => {
      const y = startYear + i;
      return { label: String(y), income: 0, expense: 0 };
    });
    const idxByYear = new Map(buckets.map((b, i) => [Number(b.label), i]));

    for (const r of rows) {
      const y = r.occurredAt.getFullYear();
      const idx = idxByYear.get(y);
      if (idx === undefined) continue;
      if (r.type === "income") buckets[idx]!.income += r.amount;
      else buckets[idx]!.expense += r.amount;
    }
    return buckets;
  }

  if (granularity === "week") {
    const monthIndex = opts?.weekMonthIndex ?? 0;
    const monthStart = new Date(year, monthIndex, 1);
    const monthEnd = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);
    const daysInMonth = monthEnd.getDate();

    const weekRows = await db
      .select({
        occurredAt: transactions.occurredAt,
        amount: transactions.amount,
        type: categories.type,
      })
      .from(transactions)
      .innerJoin(categories, eq(transactions.categoryId, categories.id))
      .where(
        and(
          eq(transactions.userId, userId),
          gte(transactions.occurredAt, monthStart),
          lte(transactions.occurredAt, monthEnd),
        ),
      );

    const nWeeks = Math.ceil(daysInMonth / 7);
    const buckets = Array.from({ length: nWeeks }, (_, i) => ({
      label: weekBucketDateRangeLabel(year, monthIndex, i, daysInMonth),
      income: 0,
      expense: 0,
    }));
    const startMs = monthStart.getTime();
    const dayMs = 86_400_000;
    for (const r of weekRows) {
      const dayOfMonth = Math.floor((r.occurredAt.getTime() - startMs) / dayMs);
      if (dayOfMonth < 0 || dayOfMonth >= daysInMonth) continue;
      const w = Math.floor(dayOfMonth / 7);
      if (w < 0 || w >= nWeeks) continue;
      if (r.type === "income") buckets[w]!.income += r.amount;
      else buckets[w]!.expense += r.amount;
    }
    return buckets;
  }

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
        eq(transactions.userId, userId),
        gte(transactions.occurredAt, start),
        lte(transactions.occurredAt, end),
      ),
    );

  const buckets = Array.from({ length: 12 }, (_, i) => ({
    label: new Date(year, i, 1).toLocaleString("en-US", { month: "short" }),
    income: 0,
    expense: 0,
  }));
  for (const r of rows) {
    const m = r.occurredAt.getMonth();
    if (r.type === "income") buckets[m]!.income += r.amount;
    else buckets[m]!.expense += r.amount;
  }
  return buckets;
}

/** @deprecated Use getCashFlowSeries with granularity "month" */
export async function getCashFlowByMonth(
  userId: string,
  year: number,
  granularity: "month" | "week" = "month",
) {
  return getCashFlowSeries(
    userId,
    year,
    granularity === "week" ? "week" : "month",
    granularity === "week"
      ? { weekMonthIndex: new Date().getMonth() }
      : undefined,
  );
}

export async function listTransactionsWithCategory(
  userId: string,
  preset: TimePreset,
  custom?: { from: Date; to: Date },
  monthRef?: MonthRef,
) {
  const range = getRangeFromPreset(preset, new Date(), custom, monthRef);
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
        eq(transactions.userId, userId),
        gte(transactions.occurredAt, range.start),
        lte(transactions.occurredAt, range.end),
      ),
    )
    .orderBy(desc(transactions.occurredAt));
}

export async function getExpenseBreakdown(
  userId: string,
  preset: TimePreset,
  custom?: { from: Date; to: Date },
  monthRef?: MonthRef,
) {
  const range = getRangeFromPreset(preset, new Date(), custom, monthRef);
  const rows = await db
    .select({
      name: categories.name,
      amount: transactions.amount,
    })
    .from(transactions)
    .innerJoin(categories, eq(transactions.categoryId, categories.id))
    .where(
      and(
        eq(transactions.userId, userId),
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
  userId: string,
  preset: TimePreset,
  custom?: { from: Date; to: Date },
  monthRef?: MonthRef,
) {
  const range = getRangeFromPreset(preset, new Date(), custom, monthRef);

  const monthStarts = new Set<number>();
  let t = new Date(range.start);
  while (t <= range.end) {
    monthStarts.add(new Date(t.getFullYear(), t.getMonth(), 1).getTime());
    t = new Date(t.getFullYear(), t.getMonth() + 1, 1);
  }

  const budgetsRows = await db
    .select()
    .from(budgets)
    .where(eq(budgets.userId, userId));

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
        eq(transactions.userId, userId),
        eq(categories.type, "expense"),
        gte(transactions.occurredAt, range.start),
        lte(transactions.occurredAt, range.end),
      ),
    );

  const spent = spentRows.reduce((a, r) => a + r.amount, 0);

  return { budgeted, spent };
}

export async function getBudgetVsSpentByMonth(userId: string, year: number) {
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
    .where(eq(budgets.userId, userId));

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
          eq(transactions.userId, userId),
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

export async function getBudgetPercentByMonth(userId: string, year: number) {
  const months = await getBudgetVsSpentByMonth(userId, year);
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
  userId: string,
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
      budgetId: budgets.id,
      categoryId: budgets.categoryId,
      amount: budgets.amount,
      categoryName: categories.name,
      categoryIcon: categories.icon,
    })
    .from(budgets)
    .innerJoin(categories, eq(budgets.categoryId, categories.id))
    .where(and(eq(budgets.userId, userId), eq(budgets.yearMonth, start)));

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
        eq(transactions.userId, userId),
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
      budgetId: b.budgetId,
      categoryId: b.categoryId,
      categoryName: b.categoryName,
      categoryIcon: b.categoryIcon,
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
