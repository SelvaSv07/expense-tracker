import { formatInr } from "@/lib/money";
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowDownToLine, ArrowUp, ArrowUpFromLine } from "lucide-react";
import type { ReactNode } from "react";

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Math.abs(((current - previous) / previous) * 100);
}

function formatPct(n: number): string {
  if (n >= 10 || n === 0) return `${n.toFixed(1)}%`;
  return `${n.toFixed(2)}%`;
}

function SideStatCard({
  title,
  amount,
  changePct,
  changeLabel,
  positive,
  icon,
  comparisonSuffix,
}: {
  title: string;
  amount: number;
  changePct: number;
  changeLabel: string;
  positive: boolean;
  icon?: ReactNode;
  comparisonSuffix: string;
}) {
  return (
    <div
      className="flex h-full min-h-0 min-w-0 flex-1 flex-col gap-4 rounded-xl border p-3 md:max-w-none"
      style={{
        background: "var(--cazura-panel)",
        borderColor: "var(--cazura-border)",
      }}
    >
      <div className="flex shrink-0 items-center gap-2">
        {icon ? <span className="shrink-0">{icon}</span> : null}
        <span
          className="min-w-0 flex-1 text-base font-bold"
          style={{ color: "var(--cazura-text)" }}
        >
          {title}
        </span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col justify-center gap-2 px-1">
        <div className="flex flex-wrap items-center gap-1">
          <span
            className="text-2xl font-medium"
            style={{ color: "var(--cazura-text)" }}
          >
            {formatInr(amount)}
          </span>
          <div
            className="flex items-center gap-0.5 rounded-xl border px-1 py-0.5"
            style={{
              background: "var(--cazura-canvas)",
              borderColor: "var(--cazura-border)",
            }}
          >
            {positive ? (
              <ArrowUp
                className="size-3"
                strokeWidth={2.5}
                style={{ color: "var(--cazura-teal-mid)" }}
              />
            ) : (
              <ArrowDown
                className="size-3"
                strokeWidth={2.5}
                style={{ color: "var(--cazura-red)" }}
              />
            )}
            <span
              className="text-[10px] font-bold"
              style={{
                color: positive ? "var(--cazura-teal-mid)" : "var(--cazura-red)",
              }}
            >
              {formatPct(changePct)}
            </span>
          </div>
        </div>
        <p className="text-xs" style={{ color: "var(--cazura-label)" }}>
          <span
            className="font-bold"
            style={{
              color: positive ? "var(--cazura-teal-mid)" : "var(--cazura-red)",
            }}
          >
            {changeLabel}
          </span>{" "}
          {comparisonSuffix}
        </p>
      </div>
    </div>
  );
}

export function BudgetIncomeCard({
  income,
  prevIncome,
  className,
  comparisonSuffix = "from previous period",
}: {
  income: number;
  prevIncome: number;
  className?: string;
  comparisonSuffix?: string;
}) {
  const dInc = income - prevIncome;
  const incPct = pctChange(income, prevIncome);
  const incPos = dInc >= 0;

  return (
    <div className={cn("flex h-full min-h-0 min-w-0 flex-col", className)}>
      <SideStatCard
        title="Incomes"
        amount={income}
        changePct={incPct}
        changeLabel={`${incPos ? "+" : "−"}${formatInr(Math.abs(dInc))}`}
        positive={incPos}
        comparisonSuffix={comparisonSuffix}
        icon={
          <ArrowDownToLine
            className="size-4"
            strokeWidth={1.8}
            style={{ color: "var(--cazura-teal-mid)" }}
          />
        }
      />
    </div>
  );
}

export function BudgetExpenseCard({
  expense,
  prevExpense,
  className,
  comparisonSuffix = "from previous period",
}: {
  expense: number;
  prevExpense: number;
  className?: string;
  comparisonSuffix?: string;
}) {
  const dExp = expense - prevExpense;
  const expPct = pctChange(expense, prevExpense);
  const expPos = dExp <= 0;

  return (
    <div className={cn("flex h-full min-h-0 min-w-0 flex-col", className)}>
      <SideStatCard
        title="Expenses"
        amount={expense}
        changePct={expPct}
        changeLabel={`${expPos ? "+" : "−"}${formatInr(Math.abs(dExp))}`}
        positive={expPos}
        comparisonSuffix={comparisonSuffix}
        icon={
          <ArrowUpFromLine
            className="size-4"
            strokeWidth={1.8}
            style={{ color: "var(--cazura-red)" }}
          />
        }
      />
    </div>
  );
}
