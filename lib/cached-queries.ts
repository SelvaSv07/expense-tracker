/**
 * Redis-backed read-through cache for expensive finance queries.
 * Mutations should call `bumpUserFinanceCache` from `@/lib/cache`.
 */
import {
  bumpUserFinanceCache,
  cacheGetOrSet,
  financeRangeKey,
  financeRangeKeyRangeOnly,
} from "@/lib/cache";
import type { CashFlowGranularity } from "@/lib/queries";
import * as queries from "@/lib/queries";
import type { MonthRef, TimePreset, TimeRange } from "@/lib/time-range";

export { bumpUserFinanceCache };

export async function getTransactionAggregates(
  userId: string,
  preset: TimePreset,
  custom?: { from: Date; to: Date },
  monthRef?: MonthRef,
  opts?: { range?: TimeRange; prev?: TimeRange },
) {
  const rk = financeRangeKey(preset, custom, monthRef, opts);
  return cacheGetOrSet(
    userId,
    `agg:${rk}`,
    () =>
      queries.getTransactionAggregates(userId, preset, custom, monthRef, opts),
  );
}

export async function listTransactionsWithCategory(
  userId: string,
  preset: TimePreset,
  custom?: { from: Date; to: Date },
  monthRef?: MonthRef,
) {
  const rk = financeRangeKey(preset, custom, monthRef);
  return cacheGetOrSet(userId, `txlist:${rk}`, () =>
    queries.listTransactionsWithCategory(userId, preset, custom, monthRef),
  );
}

export async function getExpenseBreakdown(
  userId: string,
  preset: TimePreset,
  custom?: { from: Date; to: Date },
  monthRef?: MonthRef,
) {
  const rk = financeRangeKey(preset, custom, monthRef);
  return cacheGetOrSet(userId, `brk:${rk}`, () =>
    queries.getExpenseBreakdown(userId, preset, custom, monthRef),
  );
}

export async function getBalance(userId: string) {
  return cacheGetOrSet(userId, "balance", () => queries.getBalance(userId));
}

export async function getTodaySpend(userId: string, day = new Date()) {
  const dayKey = day.toISOString().slice(0, 10);
  return cacheGetOrSet(
    userId,
    `today:${dayKey}`,
    () => queries.getTodaySpend(userId, day),
  );
}

export async function getBudgetUsageForRange(
  userId: string,
  preset: TimePreset,
  custom?: { from: Date; to: Date },
  monthRef?: MonthRef,
  opts?: { range?: TimeRange },
) {
  const rk = financeRangeKeyRangeOnly(preset, custom, monthRef, opts);
  return cacheGetOrSet(userId, `buduse:${rk}`, () =>
    queries.getBudgetUsageForRange(userId, preset, custom, monthRef, opts),
  );
}

export async function getCashFlowSeries(
  userId: string,
  year: number,
  granularity: CashFlowGranularity,
  opts?: { weekMonthIndex?: number },
) {
  const w =
    granularity === "week" ? String(opts?.weekMonthIndex ?? "") : "na";
  return cacheGetOrSet(
    userId,
    `cf:${year}:${granularity}:${w}`,
    () => queries.getCashFlowSeries(userId, year, granularity, opts),
  );
}
