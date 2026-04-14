"use client";

import { formatInr } from "@/lib/money";
import { cn } from "@/lib/utils";
import { Wand2 } from "lucide-react";
import { useCallback, useEffect, useId, useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Row = { label: string; income: number; expense: number };

const MONTH_LONG: Record<string, string> = {
  Jan: "January",
  Feb: "February",
  Mar: "March",
  Apr: "April",
  May: "May",
  Jun: "June",
  Jul: "July",
  Aug: "August",
  Sep: "September",
  Oct: "October",
  Nov: "November",
  Dec: "December",
};

function formatYAxisInr(rupees: number): string {
  const v = Math.round(rupees);
  if (v >= 10000000)
    return `₹${(v / 10000000).toFixed(v % 10000000 === 0 ? 0 : 1)}Cr`;
  if (v >= 100000) return `₹${Math.round(v / 100000)}L`;
  if (v >= 1000) return `₹${Math.round(v / 1000)}K`;
  return `₹${v}`;
}

/** Evenly spaced ticks with headroom so the peak is not flush with the top. */
function computeEvenYAxis(maxDataRupee: number): {
  niceMax: number;
  ticks: number[];
} {
  const m = Math.max(0, maxDataRupee);
  if (m === 0) {
    const step = 4000;
    const niceMax = 12000;
    return {
      niceMax,
      ticks: Array.from({ length: niceMax / step + 1 }, (_, i) => i * step),
    };
  }

  const targetTop = m * 1.22;
  const steps = [
    100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000,
  ];

  /** Cap tick count so Y labels have more vertical breathing room. */
  const maxTicks = 6;
  const minTicks = 4;

  for (const step of steps) {
    let top = Math.ceil(targetTop / step) * step;
    if (top <= m) top += step;
    const nTicks = Math.floor(top / step) + 1;
    if (nTicks < minTicks || nTicks > maxTicks) continue;
    const ticks: number[] = [];
    for (let v = 0; v <= top + 1e-9; v += step) ticks.push(v);
    return { niceMax: top, ticks };
  }

  let step = 2000;
  let top = Math.ceil(targetTop / step) * step;
  if (top <= m) top += step;
  while (Math.floor(top / step) + 1 > maxTicks) {
    const idx = steps.indexOf(step);
    if (idx >= 0 && idx < steps.length - 1) {
      step = steps[idx + 1]!;
    } else {
      step *= 2;
    }
    top = Math.ceil(targetTop / step) * step;
    if (top <= m) top += step;
  }
  const ticks: number[] = [];
  for (let v = 0; v <= top + 1e-9; v += step) ticks.push(v);
  return { niceMax: top, ticks };
}

function CashFlowTooltip({
  active,
  label,
  payload,
  onActiveLabel,
}: {
  active?: boolean;
  label?: string | number;
  payload?: unknown;
  onActiveLabel: (label: string | null) => void;
}) {
  useEffect(() => {
    onActiveLabel(active && label != null ? String(label) : null);
  }, [active, label, onActiveLabel]);

  const rows = Array.isArray(payload) ? payload : [];
  const income = rows.find(
    (p) => (p as { dataKey?: unknown }).dataKey === "income",
  ) as { value?: number } | undefined;
  const expense = rows.find(
    (p) => (p as { dataKey?: unknown }).dataKey === "expense",
  ) as { value?: number } | undefined;

  if (!active || !label || rows.length === 0) {
    return null;
  }

  const short = String(label);
  const monthTitle =
    MONTH_LONG[short] ?? short;
  const monthYear = `${monthTitle} ${new Date().getFullYear()}`;

  return (
    <div className="flex flex-col gap-2">
      {income != null && income.value != null ? (
        <div
          className="w-[148px] rounded-lg border p-2.5 shadow-[0_4px_12px_rgba(0,0,0,0.05)]"
          style={{
            background: "var(--cazura-panel)",
            borderColor: "var(--cazura-border)",
          }}
        >
          <div className="mb-1.5 flex items-center gap-1.5">
            <span
              className="size-1.5 shrink-0 rounded-full"
              style={{ background: "var(--cazura-teal-mid)" }}
            />
            <span
              className="flex-1 text-[10px] font-medium"
              style={{ color: "var(--cazura-text)" }}
            >
              Incomes
            </span>
            <span
              className="text-[8px]"
              style={{ color: "var(--cazura-muted)" }}
            >
              {monthYear}
            </span>
          </div>
          <p
            className="mb-1 text-xs leading-tight font-bold"
            style={{ color: "var(--cazura-text)" }}
          >
            {formatInr(Math.round(Number(income.value) * 100))}
          </p>
          <div className="flex items-center gap-1">
            <Wand2
              className="size-2.5 shrink-0"
              strokeWidth={2}
              style={{ color: "var(--cazura-teal-light)" }}
            />
            <span
              className="bg-gradient-to-r from-[var(--cazura-teal)] to-[var(--cazura-teal-soft)] bg-clip-text text-[9px] font-medium text-transparent"
              style={{ WebkitTextFillColor: "transparent" }}
            >
              Compare to this month
            </span>
          </div>
        </div>
      ) : null}
      {expense != null && expense.value != null ? (
        <div
          className="w-[148px] rounded-lg border p-2.5 shadow-[0_4px_12px_rgba(0,0,0,0.05)]"
          style={{
            background: "var(--cazura-panel)",
            borderColor: "var(--cazura-border)",
          }}
        >
          <div className="mb-1.5 flex items-center gap-1.5">
            <span
              className="size-1.5 shrink-0 rounded-full"
              style={{ background: "var(--cazura-red)" }}
            />
            <span
              className="flex-1 text-[10px] font-medium"
              style={{ color: "var(--cazura-text)" }}
            >
              Expenses
            </span>
            <span
              className="text-[8px]"
              style={{ color: "var(--cazura-muted)" }}
            >
              {monthYear}
            </span>
          </div>
          <p
            className="mb-1 text-xs leading-tight font-bold"
            style={{ color: "var(--cazura-text)" }}
          >
            {formatInr(Math.round(Number(expense.value) * 100))}
          </p>
          <div className="flex items-center gap-1">
            <Wand2
              className="size-2.5 shrink-0"
              strokeWidth={2}
              style={{ color: "var(--cazura-teal-light)" }}
            />
            <span
              className="bg-gradient-to-r from-[var(--cazura-teal)] to-[var(--cazura-teal-soft)] bg-clip-text text-[9px] font-medium text-transparent"
              style={{ WebkitTextFillColor: "transparent" }}
            >
              Compare to this month
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function IncomeExpenseChart({ data }: { data: Row[] }) {
  const gradId = useId().replace(/:/g, "");
  const [activeLabel, setActiveLabel] = useState<string | null>(null);
  const onActiveLabel = useCallback((l: string | null) => {
    setActiveLabel(l);
  }, []);

  const chartData = data.map((d) => ({
    name: d.label,
    income: Math.max(0, d.income / 100),
    expense: Math.max(0, d.expense / 100),
  }));

  const maxVal = Math.max(
    1,
    ...chartData.flatMap((d) => [d.income, d.expense]),
  );
  const { niceMax, ticks: yTicks } = computeEvenYAxis(maxVal);

  return (
    <div className="h-[280px] w-full min-w-0">
      <ResponsiveContainer
        width="100%"
        height="100%"
        minWidth={0}
        initialDimension={{ width: 400, height: 280 }}
      >
        <ComposedChart
          data={chartData}
          margin={{ top: 8, right: 28, left: 6, bottom: 8 }}
        >
          <defs>
            <linearGradient
              id={`incomeFill-${gradId}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor="#588d73" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#588d73" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="0"
            vertical={false}
            stroke="#ebebeb"
          />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            interval={0}
            tick={(props) => {
              const x = Number(props.x);
              const y = Number(props.y);
              const v = String(
                (props.payload as { value?: string })?.value ?? "",
              );
              const idx =
                typeof (props as { index?: number }).index === "number"
                  ? (props as { index: number }).index
                  : chartData.findIndex((d) => d.name === v);
              const n = chartData.length;
              const isFirst = n > 0 && idx === 0;
              const isLast = n > 0 && idx === n - 1;
              const textAnchor =
                isFirst && !isLast
                  ? "start"
                  : isLast && !isFirst
                    ? "end"
                    : "middle";
              const active = activeLabel === v;
              return (
                <text
                  x={x}
                  y={y}
                  dy={10}
                  textAnchor={textAnchor}
                  className={cn(
                    "text-[11px]",
                    active ? "font-bold" : "font-normal",
                  )}
                  fill={active ? "var(--cazura-text)" : "var(--cazura-label)"}
                >
                  {v}
                </text>
              );
            }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            domain={[0, niceMax]}
            ticks={yTicks}
            allowDataOverflow={false}
            tickFormatter={(v: number) => formatYAxisInr(v)}
            tick={{
              fontSize: 10,
              fill: "var(--cazura-label)",
              dx: -4,
            }}
            width={58}
          />
          {activeLabel ? (
            <ReferenceLine
              x={activeLabel}
              stroke="#c0c0c0"
              strokeDasharray="4 4"
              strokeWidth={1}
            />
          ) : null}
          <Tooltip
            content={(props) => (
              <CashFlowTooltip
                active={props.active}
                label={props.label}
                payload={props.payload}
                onActiveLabel={onActiveLabel}
              />
            )}
            cursor={false}
            wrapperStyle={{ outline: "none" }}
          />
          <Area
            type="monotone"
            dataKey="income"
            baseLine={0}
            stroke="var(--cazura-teal-mid)"
            strokeWidth={2}
            fill={`url(#incomeFill-${gradId})`}
            fillOpacity={1}
            isAnimationActive={false}
            activeDot={{
              r: 4,
              stroke: "#fff",
              strokeWidth: 2,
              fill: "var(--cazura-teal-mid)",
            }}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="expense"
            name="Expenses"
            stroke="var(--cazura-red)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
            activeDot={{
              r: 4,
              stroke: "#fff",
              strokeWidth: 2,
              fill: "var(--cazura-red)",
            }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
