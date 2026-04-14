"use client";

import { TransactionCategoryLabel } from "@/components/transactions/transaction-category-label";
import { formatInr } from "@/lib/money";
import {
  ArrowDown,
  ArrowUp,
  MoreHorizontal,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

type Tx = {
  id: string;
  amount: number;
  /** Serialized from the server as an ISO string when this is a client component. */
  occurredAt: Date | string;
  categoryName: string;
  categoryType: string;
  categoryIcon: string | null;
  categoryColor: string;
  paymentMethod: string | null;
  transactionName: string | null;
  note: string | null;
};

function toOccurredDate(tx: Tx): Date {
  return tx.occurredAt instanceof Date
    ? tx.occurredAt
    : new Date(tx.occurredAt);
}

function ymdLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const TABLE_MIN_W = "min-w-[720px]";
const COL_CATEGORY = "w-[200px] shrink-0";
const COL_DATE = "min-w-0 flex-1";
const COL_TIME = "w-24 shrink-0";
const COL_AMOUNT = "min-w-0 flex-1";
const COL_METHOD = "w-[120px] shrink-0";

const inputBarClass =
  "h-[30px] rounded-lg border px-2 text-[11px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--cazura-border)] focus-visible:ring-offset-1";

export function OverviewRecentTransactions({ rows }: { rows: Tx[] }) {
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((tx) => {
      if (!q) return true;
      const occurred = toOccurredDate(tx);
      const hay = [
        tx.categoryName,
        tx.transactionName ?? "",
        tx.note ?? "",
        tx.paymentMethod ?? "",
        formatInr(tx.amount),
        ymdLocal(occurred),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [rows, query]);

  const ordered = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      if (sortBy === "date") {
        const ta = toOccurredDate(a).getTime();
        const tb = toOccurredDate(b).getTime();
        const cmp = ta - tb;
        const signed = sortDir === "asc" ? cmp : -cmp;
        if (signed !== 0) return signed;
        return a.id.localeCompare(b.id);
      }
      const cmp = a.amount - b.amount;
      const signed = sortDir === "asc" ? cmp : -cmp;
      if (signed !== 0) return signed;
      return a.id.localeCompare(b.id);
    });
    return copy;
  }, [filtered, sortBy, sortDir]);

  const display = ordered.slice(0, 8);

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
          className="flex h-[30px] min-w-0 shrink-0 items-center gap-1.5 rounded-lg border px-2.5"
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
          <input
            type="search"
            placeholder="Search transaction"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={`${inputBarClass} min-w-[100px] flex-1 border-0 bg-transparent sm:min-w-[140px]`}
            style={{ color: "var(--cazura-text)" }}
          />
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
        className="overflow-x-auto overflow-y-hidden rounded-lg border"
        style={{ borderColor: "var(--cazura-border)" }}
      >
        <div className="min-w-0">
          <div
            className={`flex items-center gap-3 border-b px-3 py-1.5 ${TABLE_MIN_W}`}
            style={{
              background: "#f0f0f0",
              borderColor: "var(--cazura-border)",
            }}
          >
            <span
              className={COL_CATEGORY}
              style={{ fontSize: 11, color: "var(--cazura-label)" }}
            >
              Category
            </span>
            <button
              type="button"
              className={`flex ${COL_DATE} items-center gap-0.5 rounded-sm text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--cazura-border)] focus-visible:ring-offset-2`}
              onClick={() => {
                if (sortBy === "date") {
                  setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                } else {
                  setSortBy("date");
                  setSortDir("desc");
                }
              }}
              aria-label={
                sortBy === "date"
                  ? sortDir === "asc"
                    ? "Date: oldest first. Click to sort newest first."
                    : "Date: newest first. Click to sort oldest first."
                  : "Sort by date, newest first."
              }
            >
              <span
                style={{ fontSize: 11, color: "var(--cazura-label)" }}
              >
                Date
              </span>
              {sortBy === "date" ? (
                sortDir === "asc" ? (
                  <ArrowUp
                    className="size-3 shrink-0"
                    strokeWidth={2}
                    color="var(--cazura-label)"
                  />
                ) : (
                  <ArrowDown
                    className="size-3 shrink-0"
                    strokeWidth={2}
                    color="var(--cazura-label)"
                  />
                )
              ) : null}
            </button>
            <span
              className={COL_TIME}
              style={{ fontSize: 11, color: "var(--cazura-label)" }}
            >
              Time
            </span>
            <button
              type="button"
              className={`flex ${COL_AMOUNT} items-center gap-0.5 rounded-sm text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--cazura-border)] focus-visible:ring-offset-2`}
              onClick={() => {
                if (sortBy === "amount") {
                  setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                } else {
                  setSortBy("amount");
                  setSortDir("desc");
                }
              }}
              aria-label={
                sortBy === "amount"
                  ? sortDir === "asc"
                    ? "Amount: low to high. Click to sort high to low."
                    : "Amount: high to low. Click to sort low to high."
                  : "Sort by amount, high to low."
              }
            >
              <span
                style={{ fontSize: 11, color: "var(--cazura-label)" }}
              >
                Amount
              </span>
              {sortBy === "amount" ? (
                sortDir === "asc" ? (
                  <ArrowUp
                    className="size-3 shrink-0"
                    strokeWidth={2}
                    color="var(--cazura-label)"
                  />
                ) : (
                  <ArrowDown
                    className="size-3 shrink-0"
                    strokeWidth={2}
                    color="var(--cazura-label)"
                  />
                )
              ) : null}
            </button>
            <span
              className={COL_METHOD}
              style={{ fontSize: 11, color: "var(--cazura-label)" }}
            >
              Method
            </span>
            <span
              className="w-12 shrink-0 text-right"
              style={{ fontSize: 11, color: "var(--cazura-label)" }}
            >
              Action
            </span>
          </div>
          {display.map((tx) => {
            const positive = tx.categoryType === "income";
            const occurred = toOccurredDate(tx);
            return (
              <div
                key={tx.id}
                className={`flex items-center gap-3 border-b px-3 py-2.5 last:border-b-0 ${TABLE_MIN_W}`}
                style={{
                  background: "var(--cazura-panel)",
                  borderColor: "var(--cazura-border)",
                }}
              >
                <div className={`${COL_CATEGORY} min-w-0`}>
                  <TransactionCategoryLabel
                    name={tx.categoryName}
                    icon={tx.categoryIcon}
                    color={tx.categoryColor}
                    transactionName={tx.transactionName}
                    note={tx.note}
                    variant="cazura"
                  />
                </div>
                <span
                  className={`${COL_DATE} text-xs font-medium`}
                  style={{ color: "var(--cazura-muted)" }}
                >
                  {occurred.toLocaleDateString(undefined, {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                <span
                  className={`${COL_TIME} text-xs font-medium`}
                  style={{ color: "var(--cazura-muted)" }}
                >
                  {occurred.toLocaleTimeString(undefined, {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
                <span
                  className={`${COL_AMOUNT} text-xs font-bold`}
                  style={{
                    color: positive
                      ? "var(--cazura-teal-mid)"
                      : "var(--cazura-red)",
                  }}
                >
                  {positive ? "+" : "-"}
                  {formatInr(tx.amount)}
                </span>
                <span
                  className={`${COL_METHOD} truncate text-xs font-medium`}
                  style={{ color: "var(--cazura-text)" }}
                >
                  {tx.paymentMethod?.replace(/_/g, " ") ?? "—"}
                </span>
                <div className="flex w-12 shrink-0 justify-end">
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
          {rows.length === 0 ? (
            <div
              className="px-3 py-6 text-center text-sm"
              style={{ color: "var(--cazura-muted)" }}
            >
              No transactions in this range.
            </div>
          ) : null}
          {rows.length > 0 && display.length === 0 ? (
            <div
              className="px-3 py-6 text-center text-sm"
              style={{ color: "var(--cazura-muted)" }}
            >
              No transactions match your search.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
