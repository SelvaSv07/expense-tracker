import { formatInr } from "@/lib/money";
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowDownToLine, ArrowUp, ArrowUpFromLine } from "lucide-react";
import type { ReactNode } from "react";

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Math.abs(((current - previous) / previous) * 100);
}

function formatPct(n: number): string {
  return `${Math.round(n)}%`;
}

function StatMiniCard({
  title,
  amount,
  changePct,
  changeLabel,
  positive,
  icon,
}: {
  title: string;
  amount: number;
  changePct: number;
  changeLabel: string;
  positive: boolean;
  icon?: ReactNode;
}) {
  return (
    <div
      className="flex min-w-[180px] flex-1 flex-col gap-4 rounded-xl border p-3"
      style={{
        background: "var(--cazura-panel)",
        borderColor: "var(--cazura-border)",
      }}
    >
      <div className="flex items-center gap-2">
        {icon ? <span className="shrink-0">{icon}</span> : null}
        <span
          className="min-w-0 flex-1 text-base font-bold"
          style={{ color: "var(--cazura-text)" }}
        >
          {title}
        </span>
      </div>
      <div className="flex flex-col gap-2 px-1">
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
          from previous period
        </p>
      </div>
    </div>
  );
}

export function TransactionStatMiniCards({
  totalVolume,
  prevTotalVolume,
  income,
  prevIncome,
  expense,
  prevExpense,
}: {
  totalVolume: number;
  prevTotalVolume: number;
  income: number;
  prevIncome: number;
  expense: number;
  prevExpense: number;
}) {
  const dVol = totalVolume - prevTotalVolume;
  const dInc = income - prevIncome;
  const dExp = expense - prevExpense;

  const volPct = pctChange(totalVolume, prevTotalVolume);
  const incPct = pctChange(income, prevIncome);
  const expPct = pctChange(expense, prevExpense);

  const volPos = dVol >= 0;
  const incPos = dInc >= 0;
  const expPos = dExp <= 0;

  return (
    <div
      className={cn(
        "flex gap-4 overflow-x-auto pb-1",
        "md:overflow-visible",
      )}
    >
      <StatMiniCard
        title="Total Transaction"
        amount={totalVolume}
        changePct={volPct}
        changeLabel={`${volPos ? "+" : "−"}${formatInr(Math.abs(dVol))}`}
        positive={volPos}
      />
      <StatMiniCard
        title="Incomes"
        amount={income}
        changePct={incPct}
        changeLabel={`${incPos ? "+" : "−"}${formatInr(Math.abs(dInc))}`}
        positive={incPos}
        icon={
          <ArrowDownToLine
            className="size-4"
            strokeWidth={1.8}
            style={{ color: "var(--cazura-teal-mid)" }}
          />
        }
      />
      <StatMiniCard
        title="Expenses"
        amount={expense}
        changePct={expPct}
        changeLabel={`${expPos ? "+" : "−"}${formatInr(Math.abs(dExp))}`}
        positive={expPos}
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
