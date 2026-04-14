import { formatInr } from "@/lib/money";
import { cn } from "@/lib/utils";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  MoreHorizontal,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

function barsFromSeries(values: number[], maxH = 64) {
  const slice = values.slice(-9);
  const max = Math.max(...slice.map((v) => Math.abs(v)), 1);
  return slice.map((v) =>
    Math.max(8, Math.round((Math.abs(v) / max) * maxH)),
  );
}

export function OverviewIncomeExpenseCards({
  income,
  expense,
  deltaIncome,
  deltaExpense,
  prevIncome,
  prevExpense,
  incomeSeries,
  expenseSeries,
}: {
  income: number;
  expense: number;
  deltaIncome: number;
  deltaExpense: number;
  prevIncome: number;
  prevExpense: number;
  incomeSeries: number[];
  expenseSeries: number[];
}) {
  const incomeBars = barsFromSeries(incomeSeries);
  const expenseBars = barsFromSeries(expenseSeries);
  const incomePct =
    prevIncome > 0 ? ((income - prevIncome) / prevIncome) * 100 : 0;
  const expensePct =
    prevExpense > 0 ? ((expense - prevExpense) / prevExpense) * 100 : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div
        className="flex min-w-0 flex-1 flex-col gap-3 rounded-xl border p-3"
        style={{
          background: "var(--cazura-panel)",
          borderColor: "var(--cazura-border)",
        }}
      >
        <div className="flex items-center gap-2">
          <ArrowDownToLine
            className="size-4 shrink-0"
            strokeWidth={1.8}
            color="var(--cazura-teal-mid)"
          />
          <span
            className="flex-1 text-[15px] font-bold"
            style={{ color: "var(--cazura-text)" }}
          >
            Incomes
          </span>
          <MoreHorizontal
            className="size-[15px] cursor-pointer"
            strokeWidth={2}
            color="var(--cazura-label)"
          />
        </div>
        <div className="flex items-end justify-between gap-2">
          <div className="flex min-w-0 flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className="text-[22px] font-medium tracking-tight"
                style={{ color: "var(--cazura-text)" }}
              >
                {formatInr(income)}
              </span>
              <div
                className="flex items-center gap-0.5 rounded-[10px] border border-[var(--cazura-border)] px-1 py-0.5"
                style={{ background: "var(--cazura-canvas)" }}
              >
                <TrendingUp
                  className="size-2.5"
                  strokeWidth={2.5}
                  color="var(--cazura-teal-mid)"
                />
                <span
                  className="text-[10px] font-bold"
                  style={{ color: "var(--cazura-teal-mid)" }}
                >
                  {incomePct >= 0 ? "+" : ""}
                  {incomePct.toFixed(1)}%
                </span>
              </div>
            </div>
            <p className="text-[11px]" style={{ color: "var(--cazura-label)" }}>
              <span
                className="font-bold"
                style={{ color: "var(--cazura-teal-mid)" }}
              >
                {deltaIncome >= 0 ? "+" : "-"}
                {formatInr(Math.abs(deltaIncome))}
              </span>{" "}
              from last period
            </p>
          </div>
          <div className="flex shrink-0 items-end gap-1">
            {incomeBars.map((h, i) => (
              <div
                key={i}
                className={cn(
                  "w-[5px] shrink-0 rounded-t-[10px] rounded-b-[2px]",
                  i % 3 === 0 ? "bg-[#b6d6c6]" : "bg-[var(--cazura-teal-mid)]",
                )}
                style={{ height: h }}
              />
            ))}
          </div>
        </div>
      </div>

      <div
        className="flex min-w-0 flex-1 flex-col gap-3 rounded-xl border p-3"
        style={{
          background: "var(--cazura-panel)",
          borderColor: "var(--cazura-border)",
        }}
      >
        <div className="flex items-center gap-2">
          <ArrowUpFromLine
            className="size-4 shrink-0"
            strokeWidth={1.8}
            color="var(--cazura-red)"
          />
          <span
            className="flex-1 text-[15px] font-bold"
            style={{ color: "var(--cazura-text)" }}
          >
            Expenses
          </span>
          <MoreHorizontal
            className="size-[15px] cursor-pointer"
            strokeWidth={2}
            color="var(--cazura-label)"
          />
        </div>
        <div className="flex items-end justify-between gap-2">
          <div className="flex min-w-0 flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className="text-[22px] font-medium tracking-tight"
                style={{ color: "var(--cazura-text)" }}
              >
                {formatInr(expense)}
              </span>
              <div
                className="flex items-center gap-0.5 rounded-[10px] border border-[var(--cazura-border)] px-1 py-0.5"
                style={{ background: "var(--cazura-canvas)" }}
              >
                <TrendingDown
                  className="size-2.5"
                  strokeWidth={2.5}
                  color="var(--cazura-red)"
                />
                <span
                  className="text-[10px] font-bold"
                  style={{ color: "var(--cazura-red)" }}
                >
                  {expensePct >= 0 ? "+" : ""}
                  {Math.abs(expensePct).toFixed(2)}%
                </span>
              </div>
            </div>
            <p className="text-[11px]" style={{ color: "var(--cazura-label)" }}>
              <span className="font-bold" style={{ color: "var(--cazura-red)" }}>
                {deltaExpense >= 0 ? "+" : "-"}
                {formatInr(Math.abs(deltaExpense))}
              </span>{" "}
              from last period
            </p>
          </div>
          <div className="flex shrink-0 items-end gap-1">
            {expenseBars.map((h, i) => (
              <div
                key={i}
                className={cn(
                  "w-[5px] shrink-0 rounded-t-[10px] rounded-b-[2px]",
                  i % 3 === 0 ? "bg-[#e1b4b2]" : "bg-[var(--cazura-red)]",
                )}
                style={{ height: h }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
