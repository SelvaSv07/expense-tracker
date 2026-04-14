export type BudgetBreakdownRow = {
  budgetId: string;
  categoryName: string;
  categoryIcon: string | null;
  categoryColor: string;
  budgeted: number;
  spent: number;
  pct: number;
  /** Repeating default vs one-off amount for the viewed month. */
  budgetScope: "month" | "recurring";
};
