import { normalizeCategoryColor } from "@/lib/category-color";

export type BudgetSegment = {
  color: string;
  weight: number;
  categoryName: string;
  categoryIcon: string | null;
  spent: number;
};

export function segmentsFromBreakdown(
  rows: {
    spent: number;
    categoryColor: string;
    categoryName: string;
    categoryIcon: string | null;
  }[],
): BudgetSegment[] {
  const total = rows.reduce((a, r) => a + r.spent, 0);
  if (total <= 0) return [];
  return rows
    .filter((r) => r.spent > 0)
    .map((r) => ({
      color: normalizeCategoryColor(r.categoryColor),
      weight: r.spent,
      categoryName: r.categoryName,
      categoryIcon: r.categoryIcon,
      spent: r.spent,
    }));
}
