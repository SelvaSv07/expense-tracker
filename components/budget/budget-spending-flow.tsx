"use client";

import { BudgetBarChart } from "@/components/charts/budget-bar-chart";
import { CalendarDays, MoreHorizontal } from "lucide-react";
import { useState } from "react";

export function BudgetSpendingFlow({
  barData,
  highlightMonthIndex,
  chartYear,
}: {
  barData: { month: string; budgeted: number; spent: number }[];
  highlightMonthIndex: number;
  chartYear: number;
}) {
  const [flowTab, setFlowTab] = useState<"daily" | "monthly" | "yearly">(
    "monthly",
  );

  const tabs: { id: typeof flowTab; label: string }[] = [
    { id: "daily", label: "Daily" },
    { id: "monthly", label: "Monthly" },
    { id: "yearly", label: "Yearly" },
  ];

  return (
    <div
      className="overflow-hidden rounded-xl border"
      style={{
        background: "var(--cazura-panel)",
        borderColor: "var(--cazura-border)",
      }}
    >
      <div className="flex flex-wrap items-center gap-2 p-3 pb-0">
        <span
          className="min-w-0 flex-1 text-base font-bold"
          style={{ color: "var(--cazura-text)" }}
        >
          Budget Spending Flow
        </span>
        <div
          className="flex shrink-0 rounded-lg"
          style={{ background: "var(--cazura-canvas)" }}
        >
          {tabs.map((t) => {
            const active = flowTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setFlowTab(t.id)}
                className="rounded-lg px-3 py-2 text-xs transition-colors"
                style={
                  active
                    ? {
                        background: "var(--cazura-panel)",
                        border: "1px solid var(--cazura-border)",
                        color: "var(--cazura-text)",
                        fontWeight: 700,
                      }
                    : {
                        color: "var(--cazura-label)",
                        fontWeight: 400,
                      }
                }
              >
                {t.label}
              </button>
            );
          })}
        </div>
        <div
          className="flex h-8 shrink-0 items-center gap-2 rounded-lg border px-3 text-xs font-medium"
          style={{
            background: "var(--cazura-panel)",
            borderColor: "var(--cazura-border)",
            color: "var(--cazura-text)",
          }}
        >
          <CalendarDays className="size-4" strokeWidth={1.8} />
          {chartYear}
        </div>
        <button
          type="button"
          className="flex size-8 shrink-0 items-center justify-center rounded-lg border"
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

      <div className="px-3 pb-2 pt-2">
        {flowTab === "monthly" ? (
          <BudgetBarChart
            data={barData}
            variant="cazura"
            highlightMonthIndex={highlightMonthIndex}
          />
        ) : (
          <div
            className="flex h-[300px] items-center justify-center rounded-lg border text-center text-sm"
            style={{
              borderColor: "var(--cazura-border)",
              color: "var(--cazura-muted)",
            }}
          >
            {flowTab === "daily"
              ? "Daily budget flow is not available yet. Use Monthly to compare budget vs spent by month."
              : "Yearly totals appear in the overview. Monthly view shows each month in the selected year."}
          </div>
        )}
      </div>
    </div>
  );
}
