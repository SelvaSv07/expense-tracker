"use client";

import { IncomeExpenseChart } from "@/components/charts/income-expense-chart";
import type { CashFlowGranularity } from "@/lib/queries";
import type { MonthRef } from "@/lib/time-range";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Row = { label: string; income: number; expense: number };

const TAB_TO_CF: Record<"weekly" | "monthly" | "yearly", CashFlowGranularity> =
  {
    weekly: "week",
    monthly: "month",
    yearly: "year",
  };

const CF_TO_TAB: Record<CashFlowGranularity, "weekly" | "monthly" | "yearly"> =
  {
    week: "weekly",
    month: "monthly",
    year: "yearly",
  };

function clampYear(y: number): number {
  return Math.min(2100, Math.max(2000, y));
}

function monthKeyFromRef(ref: MonthRef): string {
  return `${ref.year}-${String(ref.monthIndex + 1).padStart(2, "0")}`;
}

function shiftMonth(ref: MonthRef, delta: number): MonthRef {
  const d = new Date(ref.year, ref.monthIndex + delta, 1);
  return { year: d.getFullYear(), monthIndex: d.getMonth() };
}

function formatMonthYear(ref: MonthRef): string {
  return new Date(ref.year, ref.monthIndex, 1).toLocaleString("en-US", {
    month: "short",
    year: "numeric",
  });
}

export function OverviewCashFlow({
  data,
  year,
  granularity,
  weekFocus,
}: {
  data: Row[];
  year: number;
  granularity: CashFlowGranularity;
  weekFocus: MonthRef;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = CF_TO_TAB[granularity];

  function mergePush(mutate: (p: URLSearchParams) => void) {
    const p = new URLSearchParams(searchParams.toString());
    mutate(p);
    const qs = p.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  function pushWithChart(
    next: Partial<{ year: number; granularity: CashFlowGranularity }>,
  ) {
    mergePush((p) => {
      const y = next.year ?? year;
      const g = next.granularity ?? granularity;
      p.set("cfYear", String(clampYear(y)));
      p.set("cf", g);
    });
  }

  function pushWeekMonth(next: MonthRef) {
    mergePush((p) => {
      p.set("tf", "month");
      p.set("m", monthKeyFromRef(next));
      p.set("cf", "week");
    });
  }

  const isWeekly = granularity === "week";

  return (
    <div
      className="overflow-hidden rounded-xl border"
      style={{
        background: "var(--cazura-panel)",
        borderColor: "var(--cazura-border)",
      }}
    >
      <div className="flex flex-wrap items-center gap-2.5 px-3 pt-3 pb-0">
        <span
          className="min-w-0 flex-1 text-[15px] font-bold"
          style={{ color: "var(--cazura-text)" }}
        >
          Cash Flow
        </span>
        {isWeekly ? (
          <div
            className="flex h-[30px] shrink-0 items-center gap-0.5 rounded-lg border px-1 text-[11px] font-medium"
            style={{
              background: "var(--cazura-panel)",
              borderColor: "var(--cazura-border)",
              color: "var(--cazura-text)",
            }}
          >
            <button
              type="button"
              aria-label="Previous month"
              className="rounded p-0.5 hover:opacity-80"
              onClick={() => pushWeekMonth(shiftMonth(weekFocus, -1))}
            >
              <ChevronLeft className="size-[13px]" strokeWidth={1.8} />
            </button>
            <span className="flex min-w-[4.5rem] items-center justify-center gap-1 px-0.5">
              <CalendarDays className="size-[13px] shrink-0" strokeWidth={1.8} />
              {formatMonthYear(weekFocus)}
            </span>
            <button
              type="button"
              aria-label="Next month"
              className="rounded p-0.5 hover:opacity-80"
              onClick={() => pushWeekMonth(shiftMonth(weekFocus, 1))}
            >
              <ChevronRight className="size-[13px]" strokeWidth={1.8} />
            </button>
          </div>
        ) : (
          <div
            className="flex h-[30px] shrink-0 items-center gap-0.5 rounded-lg border px-1 text-[11px] font-medium"
            style={{
              background: "var(--cazura-panel)",
              borderColor: "var(--cazura-border)",
              color: "var(--cazura-text)",
            }}
          >
            <button
              type="button"
              aria-label="Previous year"
              className="rounded p-0.5 hover:opacity-80"
              onClick={() => pushWithChart({ year: clampYear(year - 1) })}
            >
              <ChevronLeft className="size-[13px]" strokeWidth={1.8} />
            </button>
            <span className="flex min-w-[3.25rem] items-center justify-center gap-1 px-0.5">
              <CalendarDays className="size-[13px] shrink-0" strokeWidth={1.8} />
              {year}
            </span>
            <button
              type="button"
              aria-label="Next year"
              className="rounded p-0.5 hover:opacity-80"
              onClick={() => pushWithChart({ year: clampYear(year + 1) })}
            >
              <ChevronRight className="size-[13px]" strokeWidth={1.8} />
            </button>
          </div>
        )}
        <div
          className="flex rounded-lg"
          style={{ background: "var(--cazura-canvas)" }}
        >
          {(["weekly", "monthly", "yearly"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => pushWithChart({ granularity: TAB_TO_CF[t] })}
              className="rounded-lg px-2.5 py-1.5 text-[11px] capitalize transition-colors"
              style={
                tab === t
                  ? {
                      background: "var(--cazura-panel)",
                      border: "1px solid var(--cazura-border)",
                      color: "var(--cazura-text)",
                      fontWeight: 700,
                      boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                    }
                  : {
                      color: "var(--cazura-label)",
                      fontWeight: 400,
                    }
              }
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="px-3 pb-2 pt-2">
        <IncomeExpenseChart data={data} />
      </div>
    </div>
  );
}
