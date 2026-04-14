"use client";

import { formatInr } from "@/lib/money";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const CAZURA_BUDGET_ACTIVE = "var(--cazura-teal)";
const CAZURA_SPENT_ACTIVE = "var(--cazura-teal-mid)";
const CAZURA_BUDGET_REST = "#dde2e2";
const CAZURA_SPENT_REST = "#dfebe5";

function CazuraMonthTick(props: {
  x: string | number;
  y: string | number;
  payload?: { value?: string };
  index: number;
  highlightIndex: number | null;
}) {
  const { x, y, payload, index, highlightIndex } = props;
  const label = String(payload?.value ?? "");
  const active = highlightIndex != null && highlightIndex === index;
  return (
    <text
      x={Number(x)}
      y={Number(y)}
      dy={10}
      textAnchor="middle"
      fill={active ? "var(--cazura-text)" : "var(--cazura-label)"}
      fontSize={12}
      fontWeight={active ? 700 : 400}
    >
      {label}
    </text>
  );
}

export function BudgetBarChart({
  data,
  highlightMonthIndex,
  variant = "default",
}: {
  data: { month: string; budgeted: number; spent: number }[];
  /** 0–11 for Jan–Dec; highlights paired bars like the Figma budget flow. */
  highlightMonthIndex?: number | null;
  variant?: "default" | "cazura";
}) {
  const chart = data.map((d) => ({
    month: d.month,
    budgeted: d.budgeted / 100,
    spent: d.spent / 100,
  }));

  const cazura = variant === "cazura";
  const hi =
    highlightMonthIndex != null &&
    highlightMonthIndex >= 0 &&
    highlightMonthIndex < chart.length
      ? highlightMonthIndex
      : null;

  return (
    <div className="h-[300px] w-full min-w-0">
      <ResponsiveContainer
        width="100%"
        height="100%"
        minWidth={0}
        initialDimension={{ width: 400, height: 300 }}
      >
        <BarChart data={chart} barGap={4} barCategoryGap="12%">
          <CartesianGrid
            strokeDasharray="3 3"
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
                <CazuraMonthTick {...props} highlightIndex={hi} />
              )}
            />
          ) : (
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
          )}
          <YAxis
            tickFormatter={(v) => `₹${v}`}
            tick={{
              fontSize: cazura ? 12 : 11,
              fill: cazura ? "var(--cazura-label)" : undefined,
            }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={
              cazura
                ? {
                    background: "var(--cazura-panel)",
                    border: "1px solid var(--cazura-border)",
                    borderRadius: 8,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                  }
                : undefined
            }
            labelStyle={
              cazura
                ? { color: "var(--cazura-text)", fontWeight: 500 }
                : undefined
            }
            formatter={(value) =>
              formatInr(Math.round(Number(value ?? 0) * 100))
            }
          />
          <Legend
            wrapperStyle={
              cazura
                ? { color: "var(--cazura-muted)", fontSize: 12 }
                : undefined
            }
          />
          <Bar dataKey="budgeted" name="Budgeted" radius={[6, 6, 0, 0]}>
            {chart.map((_, i) => (
              <Cell
                key={`b-${i}`}
                fill={
                  cazura
                    ? hi === i
                      ? CAZURA_BUDGET_ACTIVE
                      : CAZURA_BUDGET_REST
                    : "hsl(220 14% 86%)"
                }
                stroke={cazura && hi !== i ? "#c2d0d2" : undefined}
              />
            ))}
          </Bar>
          <Bar dataKey="spent" name="Spent" radius={[6, 6, 0, 0]}>
            {chart.map((_, i) => (
              <Cell
                key={`s-${i}`}
                fill={
                  cazura
                    ? hi === i
                      ? CAZURA_SPENT_ACTIVE
                      : CAZURA_SPENT_REST
                    : "hsl(173 58% 39%)"
                }
                stroke={cazura && hi !== i ? "#ceddd6" : undefined}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
