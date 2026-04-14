import type { CashFlowGranularity } from "@/lib/queries";

export function parseCashFlowChartParams(
  searchParams: Record<string, string | string[] | undefined>,
): { cfYear: number; cfGranularity: CashFlowGranularity } {
  const raw =
    typeof searchParams.cfYear === "string"
      ? Number.parseInt(searchParams.cfYear, 10)
      : Number.NaN;
  const cfYear =
    Number.isFinite(raw) && raw >= 2000 && raw <= 2100
      ? raw
      : new Date().getFullYear();

  const g = typeof searchParams.cf === "string" ? searchParams.cf : "month";
  const cfGranularity: CashFlowGranularity =
    g === "week" || g === "month" || g === "year" ? g : "month";

  return { cfYear, cfGranularity };
}
