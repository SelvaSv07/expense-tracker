"use client";

import { BudgetBarChart } from "@/components/charts/budget-bar-chart";
import { CalendarDays, ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

function clampYear(y: number): number {
  return Math.min(2100, Math.max(2000, y));
}

export function BudgetSpendingFlow({
  barData,
  yearlyBarData,
  highlightMonthIndex,
  chartYear,
}: {
  barData: { month: string; budgeted: number; spent: number }[];
  /** Ten calendar years ending at `chartYear` (labels = year strings). */
  yearlyBarData: { month: string; budgeted: number; spent: number }[];
  highlightMonthIndex: number;
  chartYear: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [flowTab, setFlowTab] = useState<"monthly" | "yearly">("monthly");

  function pushBudgetMonth(year: number, monthIndex: number) {
    const y = clampYear(year);
    const monthKey = `${y}-${String(monthIndex + 1).padStart(2, "0")}`;
    const p = new URLSearchParams(searchParams.toString());
    p.set("tf", "month");
    p.set("m", monthKey);
    const qs = p.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  const tabs: { id: typeof flowTab; label: string }[] = [
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
          className="flex h-8 shrink-0 items-center gap-0.5 rounded-lg border px-1 text-xs font-medium"
          style={{
            background: "var(--cazura-panel)",
            borderColor: "var(--cazura-border)",
            color: "var(--cazura-text)",
          }}
        >
          <button
            type="button"
            aria-label="Previous year"
            className="cursor-pointer rounded p-0.5 hover:opacity-80"
            onClick={() => pushBudgetMonth(chartYear - 1, highlightMonthIndex)}
          >
            <ChevronLeft className="size-4" strokeWidth={1.8} />
          </button>
          <span className="flex min-w-[2.75rem] items-center justify-center gap-1 px-0.5">
            <CalendarDays className="size-4 shrink-0" strokeWidth={1.8} />
            {chartYear}
          </span>
          <button
            type="button"
            aria-label="Next year"
            className="cursor-pointer rounded p-0.5 hover:opacity-80"
            onClick={() => pushBudgetMonth(chartYear + 1, highlightMonthIndex)}
          >
            <ChevronRight className="size-4" strokeWidth={1.8} />
          </button>
        </div>
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
                className="cursor-pointer rounded-lg px-3 py-2 text-xs transition-colors"
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
        <button
          type="button"
          className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border"
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
            chartYear={chartYear}
            xAxisKind="month"
          />
        ) : (
          <BudgetBarChart
            data={yearlyBarData}
            variant="cazura"
            highlightMonthIndex={Math.max(0, yearlyBarData.length - 1)}
            chartYear={chartYear}
            xAxisKind="year"
          />
        )}
      </div>
    </div>
  );
}
