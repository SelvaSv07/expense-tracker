import { db } from "@/db";
import {
  budgets,
  categories,
  goalContributions,
  goals,
  paymentMethods,
  transactions,
  userFinance,
} from "@/db/schema";
import {
  type BudgetAmountRow,
  effectiveBudgetByCategoryForMonth,
  effectiveBudgetTotalForMonth,
  effectiveBudgetTotalForMonths,
  recurringBudgetAppliesInMonth,
} from "@/lib/budget-recurring";
import type { MonthRef, TimePreset, TimeRange } from "@/lib/time-range";
import { getRangeFromPreset, getPreviousRange } from "@/lib/time-range";
import { format, startOfMonth, subMonths } from "date-fns";
import { and, asc, count, desc, eq, gte, isNotNull, lte } from "drizzle-orm";

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

const DEFAULT_PAYMENT_METHOD_SEED = [
  { name: "Cash", sortOrder: 0 },
  { name: "Card", sortOrder: 1 },
  { name: "UPI", sortOrder: 2 },
] as const;

/** Ensures default Cash / Card / UPI exist, then returns rows ordered for pickers. */
export async function listPaymentMethods(userId: string) {
  let rows = await db
    .select()
    .from(paymentMethods)
    .where(eq(paymentMethods.userId, userId))
    .orderBy(asc(paymentMethods.sortOrder), asc(paymentMethods.name));

  if (rows.length === 0) {
    for (const d of DEFAULT_PAYMENT_METHOD_SEED) {
      await db.insert(paymentMethods).values({
        id: crypto.randomUUID(),
        userId,
        name: d.name,
        sortOrder: d.sortOrder,
      });
    }
    rows = await db
      .select()
      .from(paymentMethods)
      .where(eq(paymentMethods.userId, userId))
      .orderBy(asc(paymentMethods.sortOrder), asc(paymentMethods.name));
  }
  return rows;
}

/** Transaction counts per stored `payment_method` string (non-null only). */
export async function getPaymentMethodUsageByName(userId: string) {
  const txRows = await db
    .select({
      method: transactions.paymentMethod,
      n: count(),
    })
    .from(transactions)
    .where(
      and(eq(transactions.userId, userId), isNotNull(transactions.paymentMethod)),
    )
    .groupBy(transactions.paymentMethod);

  const map: Record<string, number> = {};
  for (const r of txRows) {
    if (r.method) map[r.method] = Number(r.n);
  }
  return map;
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
  opts?: { range?: TimeRange; prev?: TimeRange },
) {
  const now = new Date();
  const range =
    opts?.range ?? getRangeFromPreset(preset, now, custom, monthRef);
  const prev =
    opts?.prev ?? getPreviousRange(preset, now, custom, monthRef);

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

/** Income/expense buckets for the cash-flow chart (amounts in rupees). */
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
      transactionName: transactions.transactionName,
      note: transactions.note,
      paymentMethod: transactions.paymentMethod,
      categoryId: transactions.categoryId,
      categoryName: categories.name,
      categoryType: categories.type,
      categoryIcon: categories.icon,
      categoryColor: categories.color,
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
  opts?: { range?: TimeRange },
) {
  const range =
    opts?.range ?? getRangeFromPreset(preset, new Date(), custom, monthRef);

  const monthStarts = new Set<number>();
  let t = new Date(range.start);
  while (t <= range.end) {
    monthStarts.add(new Date(t.getFullYear(), t.getMonth(), 1).getTime());
    t = new Date(t.getFullYear(), t.getMonth() + 1, 1);
  }

  const budgetsRows = await db
    .select({
      categoryId: budgets.categoryId,
      amount: budgets.amount,
      recurring: budgets.recurring,
      yearMonth: budgets.yearMonth,
      startsMonth: budgets.startsMonth,
    })
    .from(budgets)
    .where(eq(budgets.userId, userId));

  const budgeted = effectiveBudgetTotalForMonths(budgetsRows, monthStarts);

  const spentRows = await db
    .select({
      amount: transactions.amount,
      categoryId: transactions.categoryId,
      occurredAt: transactions.occurredAt,
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

  const spentByMonth = new Map<number, typeof spentRows>();
  for (const r of spentRows) {
    const d = new Date(r.occurredAt);
    const k = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
    const list = spentByMonth.get(k);
    if (list) list.push(r);
    else spentByMonth.set(k, [r]);
  }

  let spent = 0;
  for (const [monthTs, rows] of spentByMonth) {
    const caps = effectiveBudgetByCategoryForMonth(
      budgetsRows,
      new Date(monthTs),
    );
    for (const r of rows) {
      if ((caps.get(r.categoryId) ?? 0) > 0) spent += r.amount;
    }
  }

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
    .select({
      categoryId: budgets.categoryId,
      amount: budgets.amount,
      recurring: budgets.recurring,
      yearMonth: budgets.yearMonth,
      startsMonth: budgets.startsMonth,
    })
    .from(budgets)
    .where(eq(budgets.userId, userId));

  for (let m = 0; m < 12; m++) {
    const start = new Date(year, m, 1);
    const end = new Date(year, m + 1, 0, 23, 59, 59, 999);

    const budgeted = effectiveBudgetTotalForMonth(bSum, start);

    const spentRows = await db
      .select({
        amount: transactions.amount,
        categoryId: transactions.categoryId,
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

    const caps = effectiveBudgetByCategoryForMonth(bSum, start);
    const spent = spentRows.reduce((a, r) => {
      if ((caps.get(r.categoryId) ?? 0) > 0) return a + r.amount;
      return a;
    }, 0);

    out.push({
      month: labels[m] ?? "",
      budgeted,
      spent,
    });
  }

  return out;
}

/** Ten calendar years ending at `endYear`: total budgeted (sum of monthly effective budgets) vs expense spent per year. */
export async function getBudgetVsSpentForYearRange(
  userId: string,
  endYear: number,
  yearCount: number,
) {
  const startYear = endYear - yearCount + 1;
  const rangeStart = new Date(startYear, 0, 1);
  const rangeEnd = new Date(endYear, 11, 31, 23, 59, 59, 999);

  const bSum = await db
    .select({
      categoryId: budgets.categoryId,
      amount: budgets.amount,
      recurring: budgets.recurring,
      yearMonth: budgets.yearMonth,
      startsMonth: budgets.startsMonth,
    })
    .from(budgets)
    .where(eq(budgets.userId, userId));

  const spentRows = await db
    .select({
      amount: transactions.amount,
      occurredAt: transactions.occurredAt,
    })
    .from(transactions)
    .innerJoin(categories, eq(transactions.categoryId, categories.id))
    .where(
      and(
        eq(transactions.userId, userId),
        eq(categories.type, "expense"),
        gte(transactions.occurredAt, rangeStart),
        lte(transactions.occurredAt, rangeEnd),
      ),
    );

  const spentByYear = new Map<number, number>();
  for (const r of spentRows) {
    const y = new Date(r.occurredAt).getFullYear();
    spentByYear.set(y, (spentByYear.get(y) ?? 0) + r.amount);
  }

  const out: { month: string; budgeted: number; spent: number }[] = [];
  for (let y = startYear; y <= endYear; y++) {
    let budgeted = 0;
    for (let m = 0; m < 12; m++) {
      budgeted += effectiveBudgetTotalForMonth(bSum, new Date(y, m, 1));
    }
    out.push({
      month: String(y),
      budgeted,
      spent: spentByYear.get(y) ?? 0,
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

/** Rolling window ending at `anchorMonth` (any day in that month). */
export async function getBudgetPercentLastNMonths(
  userId: string,
  anchorMonth: Date,
  count: number,
) {
  const anchor = startOfMonth(anchorMonth);
  const ticks = Array.from({ length: count }, (_, i) =>
    subMonths(anchor, count - 1 - i),
  );
  const years = [...new Set(ticks.map((d) => d.getFullYear()))];
  const byYear = new Map<
    number,
    Awaited<ReturnType<typeof getBudgetVsSpentByMonth>>
  >();
  await Promise.all(
    years.map(async (y) => {
      byYear.set(y, await getBudgetVsSpentByMonth(userId, y));
    }),
  );
  const useYearSuffix =
    ticks.length > 0
      ? Math.min(...ticks.map((t) => t.getFullYear())) !==
        Math.max(...ticks.map((t) => t.getFullYear()))
      : false;

  const out: { month: string; pct: number }[] = [];
  for (const d of ticks) {
    const y = d.getFullYear();
    const m = d.getMonth();
    const row = byYear.get(y)?.[m];
    const budgeted = row?.budgeted ?? 0;
    const spent = row?.spent ?? 0;
    const pct =
      budgeted > 0 ? Math.min(100, Math.round((spent / budgeted) * 100)) : 0;
    const monthLabel = useYearSuffix ? format(d, "MMM ''yy") : format(d, "MMM");
    out.push({ month: monthLabel, pct });
  }
  return out;
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
      recurring: budgets.recurring,
      yearMonth: budgets.yearMonth,
      startsMonth: budgets.startsMonth,
      categoryName: categories.name,
      categoryIcon: categories.icon,
      categoryColor: categories.color,
    })
    .from(budgets)
    .innerJoin(categories, eq(budgets.categoryId, categories.id))
    .where(
      and(eq(budgets.userId, userId), eq(categories.type, "expense")),
    );

  const startTs = start.getTime();
  const recurringByCat = new Map<
    string,
    (typeof budgetRows)[number]
  >();
  const monthByCat = new Map<string, (typeof budgetRows)[number]>();
  for (const b of budgetRows) {
    if (b.recurring) {
      if (recurringBudgetAppliesInMonth(b.startsMonth, start)) {
        recurringByCat.set(b.categoryId, b);
      }
    } else {
      const d = new Date(b.yearMonth);
      const k = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
      if (k === startTs) monthByCat.set(b.categoryId, b);
    }
  }

  const categoryIds = new Set([
    ...recurringByCat.keys(),
    ...monthByCat.keys(),
  ]);

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

  return [...categoryIds]
    .map((categoryId) => {
      const spec = monthByCat.get(categoryId);
      const rec = recurringByCat.get(categoryId);
      const chosen = spec ?? rec;
      if (!chosen) return null;
      const s = spentMap.get(categoryId) ?? 0;
      const amt = chosen.amount;
      const pct = amt > 0 ? Math.round((s / amt) * 100) : 0;
      return {
        budgetId: chosen.budgetId,
        categoryId,
        categoryName: chosen.categoryName,
        categoryIcon: chosen.categoryIcon,
        categoryColor: chosen.categoryColor,
        budgeted: amt,
        spent: s,
        pct,
        budgetScope: (spec ? "month" : "recurring") as "month" | "recurring",
      };
    })
    .filter(
      (
        r,
      ): r is {
        budgetId: string;
        categoryId: string;
        categoryName: string;
        categoryIcon: string | null;
        categoryColor: string;
        budgeted: number;
        spent: number;
        pct: number;
        budgetScope: "month" | "recurring";
      } => r != null,
    )
    .sort((a, b) => a.categoryName.localeCompare(b.categoryName));
}

/** Budget vs spend per category across a date range (e.g. calendar year). */
export async function getBudgetBreakdownForRange(
  userId: string,
  range: { start: Date; end: Date },
) {
  const monthStarts: number[] = [];
  let t = new Date(range.start);
  const endMs = range.end.getTime();
  while (t.getTime() <= endMs) {
    monthStarts.push(new Date(t.getFullYear(), t.getMonth(), 1).getTime());
    t = new Date(t.getFullYear(), t.getMonth() + 1, 1);
  }

  const budgetRows = await db
    .select({
      budgetId: budgets.id,
      categoryId: budgets.categoryId,
      amount: budgets.amount,
      recurring: budgets.recurring,
      yearMonth: budgets.yearMonth,
      startsMonth: budgets.startsMonth,
      categoryName: categories.name,
      categoryIcon: categories.icon,
      categoryColor: categories.color,
    })
    .from(budgets)
    .innerJoin(categories, eq(budgets.categoryId, categories.id))
    .where(
      and(eq(budgets.userId, userId), eq(categories.type, "expense")),
    );

  const bSum: BudgetAmountRow[] = budgetRows.map((b) => ({
    categoryId: b.categoryId,
    amount: b.amount,
    recurring: b.recurring,
    yearMonth: b.yearMonth,
    startsMonth: b.startsMonth,
  }));

  const categoryBudgeted = new Map<string, number>();
  for (const ts of monthStarts) {
    const caps = effectiveBudgetByCategoryForMonth(bSum, new Date(ts));
    for (const [catId, amt] of caps) {
      if (amt <= 0) continue;
      categoryBudgeted.set(catId, (categoryBudgeted.get(catId) ?? 0) + amt);
    }
  }

  const spentRows = await db
    .select({
      categoryId: categories.id,
      amount: transactions.amount,
      occurredAt: transactions.occurredAt,
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

  const spentByCat = new Map<string, number>();
  for (const r of spentRows) {
    const d = new Date(r.occurredAt);
    const ms = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
    const caps = effectiveBudgetByCategoryForMonth(bSum, new Date(ms));
    if ((caps.get(r.categoryId) ?? 0) > 0) {
      spentByCat.set(
        r.categoryId,
        (spentByCat.get(r.categoryId) ?? 0) + r.amount,
      );
    }
  }

  const monthStartSet = new Set(monthStarts);

  return [...categoryBudgeted.keys()]
    .map((categoryId) => {
      const budgeted = categoryBudgeted.get(categoryId) ?? 0;
      const s = spentByCat.get(categoryId) ?? 0;
      const pct =
        budgeted > 0 ? Math.min(100, Math.round((s / budgeted) * 100)) : 0;

      const rowsForCat = budgetRows.filter((b) => b.categoryId === categoryId);
      const rec = rowsForCat.find(
        (b) =>
          b.recurring &&
          monthStarts.some((ts) =>
            recurringBudgetAppliesInMonth(b.startsMonth, new Date(ts)),
          ),
      );
      const spec = rowsForCat.find((b) => {
        if (b.recurring) return false;
        const bd = new Date(b.yearMonth);
        const k = new Date(bd.getFullYear(), bd.getMonth(), 1).getTime();
        return monthStartSet.has(k);
      });
      const chosen = rec ?? spec;
      if (!chosen) return null;

      return {
        budgetId: chosen.budgetId,
        categoryId,
        categoryName: chosen.categoryName,
        categoryIcon: chosen.categoryIcon,
        categoryColor: chosen.categoryColor,
        budgeted,
        spent: s,
        pct,
        budgetScope: (rec ? "recurring" : "month") as "month" | "recurring",
      };
    })
    .filter(
      (
        r,
      ): r is {
        budgetId: string;
        categoryId: string;
        categoryName: string;
        categoryIcon: string | null;
        categoryColor: string;
        budgeted: number;
        spent: number;
        pct: number;
        budgetScope: "month" | "recurring";
      } => r != null,
    )
    .sort((a, b) => a.categoryName.localeCompare(b.categoryName));
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
