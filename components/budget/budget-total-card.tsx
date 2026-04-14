"use client";

import { formatInr } from "@/lib/money";
import { timeQueryString } from "@/lib/search-params-time";
import type { TimePreset } from "@/lib/time-range";
import { normalizeCategoryColor } from "@/lib/category-color";
import Link from "next/link";

export type BudgetSegment = { color: string; weight: number };

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

  const tabLinks: { id: "today" | "month" | "year"; label: string; href: string }[] = [
    { id: "today", label: "This Day", href: "/budget?tf=today" },
    {
      id: "month",
      label: "This Month",
      href: `/budget?${timeQueryString("month", undefined, { monthKey: mk })}`,
    },
    { id: "year", label: "This Year", href: "/budget?tf=year" },
  ];

  const activeTab: "today" | "month" | "year" =
    preset === "today" ? "today" : preset === "year" ? "year" : "month";

  const totalWeight = segments.reduce((a, s) => a + s.weight, 0);

  return (
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

      <div className="flex items-center gap-0.5 pl-1">
        {totalWeight > 0 ? (
          segments.map((s, i) => (
            <div
              key={i}
              className="min-w-1 rounded-md"
              style={{
                flex: s.weight,
                height: 16,
                background: s.color,
                minHeight: 16,
              }}
            />
          ))
        ) : (
          <div
            className="h-4 w-full rounded-md"
            style={{ background: "var(--cazura-canvas)" }}
          />
        )}
      </div>
    </div>
  );
}

export function segmentsFromBreakdown(
  rows: { spent: number; categoryColor: string }[],
): BudgetSegment[] {
  const total = rows.reduce((a, r) => a + r.spent, 0);
  if (total <= 0) return [];
  return rows
    .filter((r) => r.spent > 0)
    .map((r) => ({
      color: normalizeCategoryColor(r.categoryColor),
      weight: r.spent,
    }));
}
