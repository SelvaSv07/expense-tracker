import { TransactionCategoryLabel } from "@/components/transactions/transaction-category-label";
import { formatInr } from "@/lib/money";
import { MoreHorizontal, Search, SlidersHorizontal } from "lucide-react";
import Link from "next/link";

type Tx = {
  id: string;
  amount: number;
  occurredAt: Date;
  categoryName: string;
  categoryType: string;
  categoryIcon: string | null;
  paymentMethod: string | null;
};

export function OverviewRecentTransactions({ rows }: { rows: Tx[] }) {
  const display = rows.slice(0, 8);

  return (
    <div
      className="flex flex-col gap-3 rounded-xl border p-3"
      style={{
        background: "var(--cazura-panel)",
        borderColor: "var(--cazura-border)",
      }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="min-w-0 flex-1 text-[15px] font-bold"
          style={{ color: "var(--cazura-text)" }}
        >
          Recent Transaction
        </span>
        <div
          className="flex h-[30px] shrink-0 items-center gap-1.5 rounded-lg border px-2.5"
          style={{
            background: "var(--cazura-panel)",
            borderColor: "var(--cazura-border)",
          }}
        >
          <Search
            className="size-3 shrink-0"
            strokeWidth={2}
            color="var(--cazura-label)"
          />
          <span className="text-[11px]" style={{ color: "var(--cazura-label)" }}>
            Search transaction
          </span>
        </div>
        <Link
          href="/transactions"
          className="flex h-[30px] shrink-0 items-center gap-1 rounded-lg border px-2.5 text-[11px] font-bold"
          style={{
            background: "var(--cazura-panel)",
            borderColor: "var(--cazura-border)",
            color: "var(--cazura-text)",
          }}
        >
          <SlidersHorizontal className="size-3" strokeWidth={2} />
          Filter
        </Link>
        <Link
          href="/transactions"
          className="flex size-[30px] shrink-0 items-center justify-center rounded-lg border"
          style={{
            background: "var(--cazura-panel)",
            borderColor: "var(--cazura-border)",
          }}
          aria-label="More"
        >
          <MoreHorizontal
            className="size-[13px]"
            strokeWidth={2}
            color="var(--cazura-label)"
          />
        </Link>
      </div>

      <div
        className="overflow-hidden rounded-lg border"
        style={{ borderColor: "var(--cazura-border)" }}
      >
        <div
          className="flex items-center gap-2 border-b px-3 py-1.5"
          style={{
            background: "#f0f0f0",
            borderColor: "var(--cazura-border)",
          }}
        >
          {(
            [
              ["Category", "w-[140px] shrink-0"],
              ["Date", "min-w-0 flex-1"],
              ["Time", "w-20 shrink-0"],
              ["Amount", "min-w-0 flex-1"],
              ["Method", "w-[100px] shrink-0"],
              ["Action", "w-10 shrink-0 text-right"],
            ] as const
          ).map(([label, cls]) => (
            <span
              key={label}
              className={cls}
              style={{ fontSize: 11, color: "var(--cazura-label)" }}
            >
              {label}
            </span>
          ))}
        </div>
        {display.map((tx) => {
          const positive = tx.categoryType === "income";
          return (
            <div
              key={tx.id}
              className="flex items-center gap-2 border-b px-3 py-2.5 last:border-b-0"
              style={{
                background: "var(--cazura-panel)",
                borderColor: "var(--cazura-border)",
              }}
            >
              <div className="flex w-[140px] shrink-0 items-center gap-2 overflow-hidden">
                <TransactionCategoryLabel
                  name={tx.categoryName}
                  icon={tx.categoryIcon}
                />
              </div>
              <span
                className="min-w-0 flex-1 text-xs font-medium"
                style={{ color: "var(--cazura-muted)" }}
              >
                {tx.occurredAt.toLocaleDateString(undefined, {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              <span
                className="w-20 shrink-0 text-xs font-medium"
                style={{ color: "var(--cazura-muted)" }}
              >
                {tx.occurredAt.toLocaleTimeString(undefined, {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
              <span
                className="min-w-0 flex-1 text-xs font-bold"
                style={{
                  color: positive ? "var(--cazura-teal-mid)" : "var(--cazura-red)",
                }}
              >
                {positive ? "+" : "-"}
                {formatInr(tx.amount)}
              </span>
              <span
                className="w-[100px] shrink-0 truncate text-xs font-medium"
                style={{ color: "var(--cazura-text)" }}
              >
                {tx.paymentMethod?.replace(/_/g, " ") ?? "—"}
              </span>
              <div className="flex w-10 shrink-0 justify-end">
                <Link
                  href="/transactions"
                  className="flex items-center justify-center rounded-md border p-1"
                  style={{ borderColor: "var(--cazura-border)" }}
                  aria-label="Transaction actions"
                >
                  <MoreHorizontal
                    className="size-[11px]"
                    strokeWidth={2}
                    color="var(--cazura-label)"
                  />
                </Link>
              </div>
            </div>
          );
        })}
        {display.length === 0 ? (
          <div
            className="px-3 py-6 text-center text-sm"
            style={{ color: "var(--cazura-muted)" }}
          >
            No transactions in this range.
          </div>
        ) : null}
      </div>
    </div>
  );
}
