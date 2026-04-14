/** Stored as `year_month` for budgets that apply to every calendar month. */
export const BUDGET_RECURRING_ANCHOR = new Date(1900, 0, 1);

export function isBudgetRecurringAnchor(d: Date): boolean {
  return (
    d.getFullYear() === BUDGET_RECURRING_ANCHOR.getFullYear() &&
    d.getMonth() === BUDGET_RECURRING_ANCHOR.getMonth() &&
    d.getDate() === BUDGET_RECURRING_ANCHOR.getDate()
  );
}

export type BudgetAmountRow = {
  categoryId: string;
  amount: number;
  recurring: boolean;
  yearMonth: Date;
  startsMonth: Date | null;
};

export function recurringBudgetAppliesInMonth(
  startsMonth: Date | null | undefined,
  monthStart: Date,
): boolean {
  if (startsMonth == null) return true;
  const since = new Date(
    startsMonth.getFullYear(),
    startsMonth.getMonth(),
    1,
  ).getTime();
  const startTs = new Date(
    monthStart.getFullYear(),
    monthStart.getMonth(),
    1,
  ).getTime();
  return startTs >= since;
}

/** Per category effective cap for `monthStart` (month-specific overrides recurring). */
export function effectiveBudgetByCategoryForMonth(
  rows: BudgetAmountRow[],
  monthStart: Date,
): Map<string, number> {
  const startTs = new Date(
    monthStart.getFullYear(),
    monthStart.getMonth(),
    1,
  ).getTime();
  const recurringByCat = new Map<string, number>();
  const monthByCat = new Map<string, number>();
  for (const b of rows) {
    if (b.recurring) {
      if (recurringBudgetAppliesInMonth(b.startsMonth, monthStart)) {
        recurringByCat.set(b.categoryId, b.amount);
      }
    } else {
      const d = new Date(b.yearMonth);
      const k = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
      if (k === startTs) monthByCat.set(b.categoryId, b.amount);
    }
  }
  const ids = new Set([...recurringByCat.keys(), ...monthByCat.keys()]);
  const out = new Map<string, number>();
  for (const id of ids) {
    out.set(id, monthByCat.get(id) ?? recurringByCat.get(id) ?? 0);
  }
  return out;
}

/** Per category: one-off month budget overrides recurring default for that month. */
export function effectiveBudgetTotalForMonth(
  rows: BudgetAmountRow[],
  monthStart: Date,
): number {
  let sum = 0;
  for (const v of effectiveBudgetByCategoryForMonth(rows, monthStart).values()) {
    sum += v;
  }
  return sum;
}

export function effectiveBudgetTotalForMonths(
  rows: BudgetAmountRow[],
  monthStartTimestamps: Iterable<number>,
): number {
  let total = 0;
  for (const ts of monthStartTimestamps) {
    total += effectiveBudgetTotalForMonth(rows, new Date(ts));
  }
  return total;
}
