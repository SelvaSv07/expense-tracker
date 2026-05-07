"use client";

import {
  CategoryIconShelf,
  categoryIconShelfBorderStyle,
} from "@/lib/category-color";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatInr } from "@/lib/money";
import type { BudgetSegment } from "@/lib/budget-segments";
import { timeQueryString } from "@/lib/search-params-time";
import type { TimePreset } from "@/lib/time-range";
import Link from "next/link";

export function BudgetTotalCard({
  spent,
  budgeted,
  preset,
  monthKey,
  segments,
}: {
  spent: number;
  budgeted: number;
  preset: TimePreset;
  monthKey?: string;
  segments: BudgetSegment[];
}) {
  const now = new Date();
  const defaultMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const mk = monthKey ?? defaultMonthKey;

  const tabLinks: { id: "month" | "year"; label: string; href: string }[] = [
    {
      id: "month",
      label: "This Month",
      href: `/budget?${timeQueryString("month", undefined, { monthKey: mk })}`,
    },
    {
      id: "year",
      label: "This Year",
      href: `/budget?${timeQueryString("year", undefined, { monthKey: mk })}`,
    },
  ];

  const activeTab: "month" | "year" =
    preset === "year" ? "year" : "month";

  const totalWeight = segments.reduce((a, s) => a + s.weight, 0);

  return (
    <TooltipProvider delay={400}>
      <div
        className="flex h-full min-h-0 flex-col gap-0 rounded-xl border p-3"
        style={{
          background: "var(--cazura-panel)",
          borderColor: "var(--cazura-border)",
        }}
      >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span
          className="min-w-0 flex-1 text-base font-bold"
          style={{ color: "var(--cazura-text)" }}
        >
          Budget Total
        </span>
        <div
          className="flex shrink-0 rounded-lg"
          style={{ background: "var(--cazura-canvas)" }}
        >
          {tabLinks.map((t) => {
            const active = activeTab === t.id;
            return (
              <Link
                key={t.id}
                href={t.href}
                className="rounded-lg px-3 py-2 text-xs whitespace-nowrap transition-colors"
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
              </Link>
            );
          })}
        </div>
      </div>

      <div className="mb-3 flex flex-col gap-0.5 pl-1">
        <span
          className="text-[28px] leading-none font-bold"
          style={{ color: "var(--cazura-text)" }}
        >
          {formatInr(spent)}
        </span>
        <span className="text-xs" style={{ color: "var(--cazura-label)" }}>
          used from{" "}
          <strong className="font-bold" style={{ color: "var(--cazura-text)" }}>
            {formatInr(budgeted)}
          </strong>
        </span>
      </div>

      <div className="relative z-0 flex items-stretch gap-0.5 pl-1">
        {totalWeight > 0 ? (
          segments.map((s, i) => (
            <Tooltip key={i}>
              <TooltipTrigger
                type="button"
                className="group relative flex min-h-4 min-w-2 cursor-default border-0 bg-transparent p-0 outline-none focus-visible:ring-2 focus-visible:ring-[var(--cazura-border)] focus-visible:ring-offset-2"
                style={{ flex: s.weight }}
                aria-label={`${s.categoryName}, ${formatInr(s.spent)} spent`}
              >
                <div
                  className="h-4 w-full min-h-4 rounded-md"
                  style={{ background: s.color }}
                />
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={6}>
                <div className="flex items-center gap-2">
                  <CategoryIconShelf
                    icon={s.categoryIcon}
                    color={s.color}
                    title={s.categoryName}
                    className="size-7 shrink-0 border p-1"
                    style={categoryIconShelfBorderStyle(s.color)}
                    iconClassName="size-3.5"
                  />
                  <div className="min-w-0">
                    <p
                      className="text-xs leading-tight font-semibold break-words"
                      style={{ color: "var(--cazura-text)" }}
                    >
                      {s.categoryName}
                    </p>
                    <p
                      className="mt-0.5 text-[11px] leading-tight"
                      style={{ color: "var(--cazura-muted)" }}
                    >
                      {formatInr(s.spent)}
                    </p>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          ))
        ) : (
          <div
            className="h-4 w-full rounded-md"
            style={{ background: "var(--cazura-canvas)" }}
          />
        )}
      </div>
    </div>
    </TooltipProvider>
  );
}
