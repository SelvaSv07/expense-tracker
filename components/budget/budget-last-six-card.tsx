"use client";

import { BudgetRadarChart } from "@/components/charts/budget-radar-chart";
import { ChevronsUpDown, MoreHorizontal } from "lucide-react";

export function BudgetLastSixCard({
  data,
}: {
  data: { month: string; pct: number }[];
}) {
  return (
    <div
      className="overflow-hidden rounded-xl border"
      style={{
        background: "var(--cazura-panel)",
        borderColor: "var(--cazura-border)",
      }}
    >
      <div className="flex items-center gap-2 p-3">
        <div className="flex min-w-0 flex-1 items-center gap-1">
          <span
            className="text-base font-bold"
            style={{ color: "var(--cazura-text)" }}
          >
            Last 6 Months
          </span>
          <ChevronsUpDown
            className="size-4 shrink-0"
            strokeWidth={2}
            style={{ color: "var(--cazura-muted)" }}
          />
        </div>
        <button
          type="button"
          className="flex size-9 shrink-0 items-center justify-center rounded-lg border"
          style={{
            background: "var(--cazura-panel)",
            borderColor: "var(--cazura-border)",
          }}
          aria-label="More"
        >
          <MoreHorizontal
            className="size-4"
            strokeWidth={2}
            style={{ color: "var(--cazura-label)" }}
          />
        </button>
      </div>
      <div className="px-3 pb-3">
        <BudgetRadarChart data={data} variant="cazura" />
      </div>
    </div>
  );
}
