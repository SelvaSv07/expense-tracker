"use client";

import { formatInr } from "@/lib/money";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/** Solid bars — highlighted month */
const BUDGET_ACTIVE = "var(--cazura-teal)";
const SPENT_ACTIVE = "var(--cazura-teal-mid)";

/** Pattern ids (single chart instance per view) */
const PAT_BUDGET = "cazuraBudgetStripes";
const PAT_SPENT = "cazuraSpentStripes";

function formatYAxisInrCompact(v: number): string {
  const r = "\u20B9";
  const n = Math.abs(v);
  if (n >= 10000000) return `${r}${Math.round(v / 10000000)}Cr`;
  if (n >= 100000) return `${r}${Math.round(v / 100000)}L`;
  if (n >= 1000) return `${r}${Math.round(v / 1000)}K`;
  return `${r}${Math.round(v)}`;
}

function monthTitle(monthShort: string, year: number): string {
  const i = MONTH_SHORT.indexOf(monthShort as (typeof MONTH_SHORT)[number]);
  if (i < 0) return `${monthShort} ${year}`;
  return new Date(year, i, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

function chartAxisTooltipTitle(
  label: string,
  chartYear: number,
  kind: "month" | "year",
): string {
  const s = String(label).trim();
  if (kind === "year" && /^\d{4}$/.test(s)) {
    return `Year ${s}`;
  }
  return monthTitle(s, chartYear);
}

type TooltipContentProps = {
  active?: boolean;
  payload?: ReadonlyArray<{
    dataKey?: string | number;
    value?: number | string;
    name?: string;
  }>;
  label?: string | number;
  chartYear: number;
  xAxisKind: "month" | "year";
};

function CazuraBudgetTooltip({
  active,
  payload,
  label,
  chartYear,
  xAxisKind,
}: TooltipContentProps) {
  if (!active || !payload?.length || label == null) return null;

  const budgetEntry = payload.find((p) => p.dataKey === "budgeted");
  const spentEntry = payload.find((p) => p.dataKey === "spent");
  const budgetRupee = Number(budgetEntry?.value ?? 0);
  const spentRupee = Number(spentEntry?.value ?? 0);
  const budgetRupees = Math.round(budgetRupee);
  const spentRupees = Math.round(spentRupee);

  const title = chartAxisTooltipTitle(String(label), chartYear, xAxisKind);

  return (
    <div
      className="min-w-0 rounded-lg border bg-white px-2.5 py-2 shadow-md"
      style={{
        borderColor: "var(--cazura-border)",
        boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
      }}
    >
      <p
        className="mb-1.5 text-[11px] font-semibold leading-tight"
        style={{ color: "var(--cazura-text)" }}
      >
        {title}
      </p>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-4">
          <span
            className="flex items-center gap-1.5 text-[10px]"
            style={{ color: "var(--cazura-muted)" }}
          >
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ background: BUDGET_ACTIVE }}
            />
            Budget
          </span>
          <span
            className="text-[11px] font-bold tabular-nums leading-tight"
            style={{ color: "var(--cazura-text)" }}
          >
            {formatInr(budgetRupees)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span
            className="flex items-center gap-1.5 text-[10px]"
            style={{ color: "var(--cazura-muted)" }}
          >
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ background: SPENT_ACTIVE }}
            />
            Spent
          </span>
          <span
            className="text-[11px] font-bold tabular-nums leading-tight"
            style={{ color: "var(--cazura-text)" }}
          >
            {formatInr(spentRupees)}
          </span>
        </div>
      </div>
    </div>
  );
}

function CazuraMonthTick(props: {
  x: string | number;
  y: string | number;
  payload?: { value?: string };
  index: number;
  highlightIndex: number | null;
  fontSize?: number;
}) {
  const { x, y, payload, index, highlightIndex, fontSize = 12 } = props;
  const label = String(payload?.value ?? "");
  const active = highlightIndex != null && highlightIndex === index;
  return (
    <text
      x={Number(x)}
      y={Number(y)}
      dy={10}
      textAnchor="middle"
      fill={active ? "var(--cazura-text)" : "var(--cazura-label)"}
      fontSize={fontSize}
      fontWeight={active ? 700 : 400}
    >
      {label}
    </text>
  );
}

function ChartDefs() {
  return (
    <defs>
      <pattern
        id={PAT_BUDGET}
        width="6"
        height="6"
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(45)"
      >
        <rect width="6" height="6" fill="#d2dce1" />
        <path
          d="M0 0 L0 8 M3 0 L3 8"
          stroke="#9eb0b8"
          strokeWidth="1.25"
          strokeOpacity="0.45"
        />
      </pattern>
      <pattern
        id={PAT_SPENT}
        width="6"
        height="6"
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(45)"
      >
        <rect width="6" height="6" fill="#d4eadf" />
        <path
          d="M0 0 L0 8 M3 0 L3 8"
          stroke="#7fb89a"
          strokeWidth="1.25"
          strokeOpacity="0.4"
        />
      </pattern>
    </defs>
  );
}

export function BudgetBarChart({
  data,
  highlightMonthIndex,
  chartYear,
  xAxisKind = "month",
  variant = "default",
}: {
  data: { month: string; budgeted: number; spent: number }[];
  /** Index in `data` for bold ticks / solid bars (month0–11 or year 0–9). */
  highlightMonthIndex?: number | null;
  /** Calendar year for tooltip title (month mode) or context year (year mode). */
  chartYear?: number;
  /** Month labels (Jan–Dec) vs year labels (e.g. 2017–2026). */
  xAxisKind?: "month" | "year";
  variant?: "default" | "cazura";
}) {
  const chart = data.map((d) => ({
    month: d.month,
    budgeted: d.budgeted,
    spent: d.spent,
  }));

  const cazura = variant === "cazura";
  const hi =
    highlightMonthIndex != null &&
    highlightMonthIndex >= 0 &&
    highlightMonthIndex < chart.length
      ? highlightMonthIndex
      : null;

  const year = chartYear ?? new Date().getFullYear();
  const yearTickFont = xAxisKind === "year" ? 10 : 12;
  const categoryGap = xAxisKind === "year" ? "22%" : "14%";

  return (
    <div className="w-full min-w-0">
      <div className="h-[300px] w-full min-w-0">
        <ResponsiveContainer
          width="100%"
          height="100%"
          minWidth={0}
          initialDimension={{ width: 400, height: 300 }}
        >
          <BarChart
            data={chart}
            barGap={6}
            barCategoryGap={categoryGap}
            margin={{ top: 8, right: 8, left: 4, bottom: 4 }}
          >
            {cazura ? <ChartDefs /> : null}
            <CartesianGrid
              strokeDasharray="0"
              vertical={false}
              stroke={cazura ? "var(--cazura-border)" : undefined}
              className={cazura ? undefined : "stroke-muted"}
            />
            {cazura ? (
              <XAxis
                dataKey="month"
                tickLine={false}
                interval={0}
                axisLine={{ stroke: "var(--cazura-border)" }}
                tick={(props) => (
                  <CazuraMonthTick
                    {...props}
                    highlightIndex={hi}
                    fontSize={yearTickFont}
                  />
                )}
              />
            ) : (
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            )}
            <YAxis
              tickFormatter={
                cazura ? formatYAxisInrCompact : (v) => `\u20B9${v}`
              }
              tick={{
                fontSize: cazura ? 12 : 11,
                fill: cazura ? "var(--cazura-label)" : undefined,
              }}
              axisLine={false}
              tickLine={false}
              width={cazura ? 48 : undefined}
            />
            {cazura ? (
              <Tooltip
                cursor={{ fill: "rgba(6, 15, 13, 0.04)" }}
                content={(props) => (
                  <CazuraBudgetTooltip
                    active={props.active}
                    payload={props.payload as TooltipContentProps["payload"]}
                    label={props.label}
                    chartYear={year}
                    xAxisKind={xAxisKind}
                  />
                )}
              />
            ) : (
              <Tooltip
                formatter={(value) =>
                  formatInr(Math.round(Number(value ?? 0)))
                }
              />
            )}
            <Bar
              dataKey="budgeted"
              name="Budget"
              radius={[8, 8, 0, 0]}
              maxBarSize={36}
            >
              {chart.map((_, i) => (
                <Cell
                  key={`b-${i}`}
                  fill={
                    cazura
                      ? hi === i
                        ? BUDGET_ACTIVE
                        : `url(#${PAT_BUDGET})`
                      : "hsl(220 14% 86%)"
                  }
                />
              ))}
            </Bar>
            <Bar
              dataKey="spent"
              name="Spent"
              radius={[8, 8, 0, 0]}
              maxBarSize={36}
            >
              {chart.map((_, i) => (
                <Cell
                  key={`s-${i}`}
                  fill={
                    cazura
                      ? hi === i
                        ? SPENT_ACTIVE
                        : `url(#${PAT_SPENT})`
                      : "hsl(173 58% 39%)"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {cazura ? (
        <div
          className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 px-2 pt-3 pb-1 text-xs"
          style={{ color: "var(--cazura-muted)" }}
        >
          <span className="inline-flex items-center gap-2">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ background: "#b8c5cc" }}
            />
            Budget
          </span>
          <span className="inline-flex items-center gap-2">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ background: "#8fbc9f" }}
            />
            Spent
          </span>
        </div>
      ) : null}
    </div>
  );
}
