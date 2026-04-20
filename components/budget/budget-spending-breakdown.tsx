"use client";

import { DeleteBudgetButton } from "@/components/budget/delete-budget-button";
import { TransactionCategoryLabel } from "@/components/transactions/transaction-category-label";
import { loadBudgetSpendingBreakdownForMonth } from "@/actions/budgets";
import type { BudgetBreakdownRow } from "@/lib/budget-breakdown";
import { dispatchBudgetClientMonthChanged } from "@/lib/budget-client-sync";
import { formatInr } from "@/lib/money";
import type { RadarWindowMonths } from "@/lib/search-params-time";
import { cn } from "@/lib/utils";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";

export type { BudgetBreakdownRow };

function shiftMonthKey(monthKey: string, deltaMonths: number): string {
  const [y, mo] = monthKey.split("-").map(Number);
  const d = new Date(y, mo - 1 + deltaMonths, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function BudgetSpendingBreakdown({
  rows: initialRows,
  viewMonthLabel: initialViewMonthLabel,
  monthNav,
}: {
  rows: BudgetBreakdownRow[];
  viewMonthLabel: string;
  /** Client-side month navigation without remounting the full budget page. */
  monthNav?: { monthKey: string; radarMonths: RadarWindowMonths };
}) {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [rows, setRows] = useState(initialRows);
  const [viewMonthLabel, setViewMonthLabel] = useState(initialViewMonthLabel);
  const [activeMonthKey, setActiveMonthKey] = useState(
    monthNav?.monthKey ?? "",
  );

  const showMonthNav = Boolean(monthNav);

  const replaceMonthInUrl = useCallback(
    (nextMonthKey: string, radar: RadarWindowMonths) => {
      const p = new URLSearchParams(
        typeof window !== "undefined"
          ? window.location.search
          : "",
      );
      p.set("tf", "month");
      p.set("m", nextMonthKey);
      p.set("radarMonths", String(radar));
      window.history.replaceState(
        null,
        "",
        `${pathname}?${p.toString()}`,
      );
    },
    [pathname],
  );

  const goToMonth = useCallback(
    (nextMonthKey: string) => {
      if (!monthNav) return;
      startTransition(async () => {
        try {
          const data = await loadBudgetSpendingBreakdownForMonth(nextMonthKey);
          setRows(data.rows);
          setViewMonthLabel(data.viewMonthLabel);
          setActiveMonthKey(data.monthKey);
          replaceMonthInUrl(nextMonthKey, monthNav.radarMonths);
          dispatchBudgetClientMonthChanged(nextMonthKey);
        } catch (e) {
          console.error(e);
        }
      });
    },
    [monthNav, replaceMonthInUrl],
  );

  useEffect(() => {
    if (!monthNav) return;

    const onPopState = () => {
      const q = new URLSearchParams(window.location.search);
      const m = q.get("m");
      if (!m || !/^\d{4}-\d{2}$/.test(m)) return;
      startTransition(async () => {
        try {
          const data = await loadBudgetSpendingBreakdownForMonth(m);
          setRows(data.rows);
          setViewMonthLabel(data.viewMonthLabel);
          setActiveMonthKey(data.monthKey);
          dispatchBudgetClientMonthChanged(m);
        } catch (e) {
          console.error(e);
        }
      });
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [monthNav]);

  return (
    <div
      className="flex flex-col gap-4 rounded-xl border p-3"
      aria-busy={isPending}
      style={{
        background: "var(--cazura-panel)",
        borderColor: "var(--cazura-border)",
      }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="min-w-0 flex-1 text-base font-bold"
          style={{ color: "var(--cazura-text)" }}
        >
          Budget Spending Breakdown
        </span>
        <div className="flex items-center gap-1">
          {showMonthNav ? (
            <>
              <button
                type="button"
                disabled={isPending}
                onClick={() =>
                  goToMonth(shiftMonthKey(activeMonthKey, -1))
                }
                className={cn(
                  "flex size-8 cursor-pointer items-center justify-center rounded-lg border transition-opacity hover:opacity-90 disabled:opacity-50",
                )}
                style={{
                  background: "var(--cazura-panel)",
                  borderColor: "var(--cazura-border)",
                  color: "var(--cazura-text)",
                }}
                aria-label="Previous month"
              >
                <ChevronLeft className="size-4" />
              </button>
              <div
                className="flex h-8 min-w-[140px] items-center justify-center gap-2 rounded-lg border px-3 text-xs font-medium"
                style={{
                  background: "var(--cazura-panel)",
                  borderColor: "var(--cazura-border)",
                  color: "var(--cazura-text)",
                }}
              >
                <CalendarDays className="size-4 shrink-0" strokeWidth={1.8} />
                <span className="truncate">{viewMonthLabel}</span>
              </div>
              <button
                type="button"
                disabled={isPending}
                onClick={() =>
                  goToMonth(shiftMonthKey(activeMonthKey, 1))
                }
                className={cn(
                  "flex size-8 cursor-pointer items-center justify-center rounded-lg border transition-opacity hover:opacity-90 disabled:opacity-50",
                )}
                style={{
                  background: "var(--cazura-panel)",
                  borderColor: "var(--cazura-border)",
                  color: "var(--cazura-text)",
                }}
                aria-label="Next month"
              >
                <ChevronRight className="size-4" />
              </button>
            </>
          ) : (
            <div
              className="flex h-8 min-w-[140px] items-center justify-center gap-2 rounded-lg border px-3 text-xs font-medium"
              style={{
                background: "var(--cazura-panel)",
                borderColor: "var(--cazura-border)",
                color: "var(--cazura-text)",
              }}
            >
              <CalendarDays className="size-4 shrink-0" strokeWidth={1.8} />
              <span className="truncate">{viewMonthLabel}</span>
            </div>
          )}
        </div>
      </div>

      <div
        className={cn(
          "overflow-hidden rounded-lg border transition-opacity",
          isPending && "opacity-60",
        )}
        style={{ borderColor: "var(--cazura-border)" }}
      >
        <div
          className="flex flex-wrap items-center gap-3 border-b px-3 py-2 md:flex-nowrap md:gap-3"
          style={{
            background: "color-mix(in srgb, var(--cazura-border) 35%, var(--cazura-panel))",
            borderColor: "var(--cazura-row-divider)",
          }}
        >
          <span
            className="w-full text-xs font-medium md:w-[160px] md:flex-shrink-0"
            style={{ color: "var(--cazura-label)" }}
          >
            Category
          </span>
          <span
            className="hidden text-xs font-medium md:block md:min-w-0 md:flex-1"
            style={{ color: "var(--cazura-label)" }}
          >
            Budgeted
          </span>
          <span
            className="hidden text-xs font-medium md:block md:min-w-0 md:flex-1"
            style={{ color: "var(--cazura-label)" }}
          >
            Spent
          </span>
          <span
            className="hidden w-[200px] flex-shrink-0 text-xs font-medium md:block"
            style={{ color: "var(--cazura-label)" }}
          >
            Progress Bar
          </span>
          <span
            className="hidden w-10 flex-shrink-0 text-xs font-medium md:block"
            style={{ color: "var(--cazura-label)" }}
          >
            Used
          </span>
          <span
            className="ml-auto hidden w-12 text-right text-xs font-medium md:block"
            style={{ color: "var(--cazura-label)" }}
          >
            Action
          </span>
        </div>

        {rows.length === 0 ? (
          <div
            className="px-3 py-10 text-center text-sm"
            style={{ color: "var(--cazura-muted)" }}
          >
            No budgets for this month. Use Set New Budget to create one.
          </div>
        ) : (
          rows.map((row) => (
            <div
              key={row.budgetId}
              className="flex flex-col gap-3 border-b px-3 py-3 last:border-b-0 md:flex-row md:flex-wrap md:items-center md:gap-3"
              style={{ borderColor: "var(--cazura-row-divider)" }}
            >
              <div className="flex items-center gap-2 md:w-[160px] md:flex-shrink-0">
                <TransactionCategoryLabel
                  name={row.categoryName}
                  icon={row.categoryIcon}
                  color={row.categoryColor}
                />
              </div>
              <span
                className="flex flex-wrap items-center gap-2 text-xs font-medium md:min-w-0 md:flex-1"
                style={{ color: "var(--cazura-muted)" }}
              >
                <span className="inline-flex items-center gap-2">
                  <span className="md:hidden" style={{ color: "var(--cazura-label)" }}>
                    Budgeted{" "}
                  </span>
                  {formatInr(row.budgeted)}
                  <span
                    className="rounded-md border px-1.5 py-0.5 text-[10px] font-semibold whitespace-nowrap"
                    style={{
                      background: "var(--cazura-canvas)",
                      borderColor: "var(--cazura-border)",
                      color: "var(--cazura-label)",
                    }}
                  >
                    {row.budgetScope === "recurring" ? "All months" : "This month"}
                  </span>
                </span>
              </span>
              <span
                className="text-xs font-medium md:min-w-0 md:flex-1"
                style={{ color: "var(--cazura-muted)" }}
              >
                <span className="md:hidden" style={{ color: "var(--cazura-label)" }}>
                  Spent{" "}
                </span>
                {formatInr(row.spent)}
              </span>
              <div className="relative h-2 w-full md:w-[200px] md:flex-shrink-0">
                <div
                  className="absolute inset-0 rounded-lg border"
                  style={{
                    background: "var(--cazura-canvas)",
                    borderColor: "var(--cazura-border)",
                  }}
                />
                <div
                  className="absolute top-0 left-0 h-full rounded-lg border"
                  style={{
                    width: `${row.budgeted > 0 ? Math.min(100, (row.spent / row.budgeted) * 100) : 0}%`,
                    background: "linear-gradient(to right, var(--cazura-teal-mid), var(--cazura-teal))",
                    borderColor: "#809b9e",
                  }}
                />
              </div>
              <span
                className="text-xs font-bold md:w-10 md:flex-shrink-0"
                style={{ color: "var(--cazura-teal)" }}
              >
                {row.pct}%
              </span>
              <div className="flex justify-end md:w-12 md:flex-shrink-0">
                <DeleteBudgetButton
                  budgetId={row.budgetId}
                  variant="cazura-icon"
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
