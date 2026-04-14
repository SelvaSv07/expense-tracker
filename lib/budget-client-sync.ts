/** Fired on `window` after client-side budget month navigation updates the URL. */
export const BUDGET_CLIENT_MONTH_CHANGED = "cazura-budget-client-month-changed";

export type BudgetClientMonthDetail = { monthKey: string };

export function dispatchBudgetClientMonthChanged(monthKey: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(BUDGET_CLIENT_MONTH_CHANGED, {
      detail: { monthKey } satisfies BudgetClientMonthDetail,
    }),
  );
}
