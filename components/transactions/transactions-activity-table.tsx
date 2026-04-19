"use client";

import type { ActivityRow } from "@/components/transactions/activity-row";
import { useOptimisticTransactionsOptional } from "@/components/transactions/optimistic-transactions-context";
import { TransactionCategoryLabel } from "@/components/transactions/transaction-category-label";
import { TransactionDetailDialog } from "@/components/transactions/transaction-detail-dialog";
import { TransactionRowActions } from "@/components/transactions/transaction-row-actions";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatInr } from "@/lib/money";
import { cn, formatPaymentMethodLabel } from "@/lib/utils";
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useMemo, useState } from "react";

export type { ActivityRow };

const PAGE_SIZES = [10, 20, 50] as const;

function formatTableDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTableTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function TransactionsActivityTable({
  rows: rowsProp,
}: {
  /** When omitted and wrapped in `OptimisticTransactionsProvider`, rows come from context. */
  rows?: ActivityRow[];
}) {
  const opt = useOptimisticTransactionsOptional();
  const rows = opt?.displayRows ?? rowsProp ?? [];
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<"all" | "income" | "expense">("all");
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZES)[number]>(20);
  const [page, setPage] = useState(1);
  const [dateSort, setDateSort] = useState<"asc" | "desc">("desc");
  const [detailRow, setDetailRow] = useState<ActivityRow | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (kind !== "all" && r.categoryType !== kind) return false;
      if (!q) return true;
      const hay = [
        r.categoryName,
        r.transactionName ?? "",
        r.note ?? "",
        r.paymentMethod ?? "",
        formatInr(r.amount),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [rows, query, kind]);

  const ordered = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      const ta = new Date(a.occurredAt).getTime();
      const tb = new Date(b.occurredAt).getTime();
      const cmp = dateSort === "asc" ? ta - tb : tb - ta;
      if (cmp !== 0) return cmp;
      return a.id.localeCompare(b.id);
    });
    return copy;
  }, [filtered, dateSort]);

  const totalPages = Math.max(1, Math.ceil(ordered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const sliceStart = (safePage - 1) * pageSize;
  const pageRows = ordered.slice(sliceStart, sliceStart + pageSize);

  return (
    <div
      className="flex flex-col overflow-hidden rounded-xl border"
      style={{
        background: "var(--cazura-panel)",
        borderColor: "var(--cazura-border)",
      }}
    >
      <TransactionDetailDialog
        row={detailRow}
        onOpenChange={(open) => {
          if (!open) setDetailRow(null);
        }}
      />
      <div className="flex flex-wrap items-center gap-2.5 px-3 pt-3">
        <span
          className="min-w-0 flex-1 text-[15px] font-bold"
          style={{ color: "var(--cazura-text)" }}
        >
          Transaction Activity
        </span>
        <div
          className="flex h-[30px] shrink-0 items-center gap-1.5 rounded-lg border px-2.5"
          style={{
            background: "var(--cazura-panel)",
            borderColor: "var(--cazura-border)",
          }}
        >
          <Search
            className="size-3 shrink-0 text-[var(--cazura-label)]"
            strokeWidth={2}
          />
          <input
            type="search"
            placeholder="Search transaction"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            className="placeholder:text-[var(--cazura-label)] w-[128px] min-w-0 border-0 bg-transparent text-[11px] outline-none sm:w-[160px]"
            style={{ color: "var(--cazura-text)" }}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "h-[30px] gap-1 rounded-lg border px-2.5 text-[11px] font-bold shadow-none",
            )}
            style={{
              background: "var(--cazura-panel)",
              borderColor: "var(--cazura-border)",
              color: "var(--cazura-text)",
            }}
          >
            <SlidersHorizontal className="size-3" strokeWidth={2} />
            Filter
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[140px]">
            <DropdownMenuItem onClick={() => { setKind("all"); setPage(1); }}>
              All
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setKind("income"); setPage(1); }}>
              Income only
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setKind("expense"); setPage(1); }}>
              Expense only
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-[30px] shrink-0 rounded-lg border shadow-none"
          style={{
            background: "var(--cazura-panel)",
            borderColor: "var(--cazura-border)",
          }}
          disabled
          aria-label="More (coming soon)"
        >
          <MoreHorizontal className="size-3.5 text-[var(--cazura-label)]" />
        </Button>
      </div>

      <div
        className="m-3 overflow-hidden rounded-lg border"
        style={{ borderColor: "var(--cazura-border)" }}
      >
        <div
          className="flex min-w-[720px] items-center gap-3 border-b px-3 py-2"
          style={{
            background: "#f0f0f0",
            borderColor: "var(--cazura-row-divider)",
          }}
        >
          <span className="min-w-[220px] flex-1 basis-0 text-xs font-medium text-[var(--cazura-label)]">
            Category
          </span>
          <button
            type="button"
            className="flex w-[148px] shrink-0 items-center gap-0.5 rounded-sm text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--cazura-border)] focus-visible:ring-offset-2"
            onClick={() => {
              setDateSort((d) => (d === "asc" ? "desc" : "asc"));
              setPage(1);
            }}
            aria-label={
              dateSort === "asc"
                ? "Date: oldest first. Click to sort newest first."
                : "Date: newest first. Click to sort oldest first."
            }
          >
            <span className="text-xs font-medium text-[var(--cazura-label)]">
              Date
            </span>
            {dateSort === "asc" ? (
              <ArrowUp className="size-3 shrink-0 text-[var(--cazura-label)]" />
            ) : (
              <ArrowDown className="size-3 shrink-0 text-[var(--cazura-label)]" />
            )}
          </button>
          <span className="w-24 shrink-0 text-xs font-medium text-[var(--cazura-label)]">
            Time
          </span>
          <span className="w-[128px] shrink-0 pr-3 text-right text-xs font-medium text-[var(--cazura-label)]">
            Amount
          </span>
          <span className="w-[120px] shrink-0 text-xs font-medium text-[var(--cazura-label)]">
            Method
          </span>
          <span className="w-12 shrink-0 text-right text-xs font-medium text-[var(--cazura-label)]">
            Action
          </span>
        </div>

        <div className="max-h-[min(520px,55vh)] overflow-y-auto overflow-x-auto">
          {pageRows.length === 0 ? (
            <p
              className="px-3 py-10 text-center text-xs"
              style={{ color: "var(--cazura-muted)" }}
            >
              {rows.length === 0
                ? "No transactions yet. Add one to get started."
                : "No transactions match your search or filter."}
            </p>
          ) : (
            pageRows.map((tx, i) => (
              <div
                key={tx.id}
                tabIndex={0}
                aria-haspopup="dialog"
                aria-label={`View details: ${tx.categoryName}, ${tx.categoryType === "income" ? "income" : "expense"} ${formatInr(tx.amount)}`}
                className={cn(
                  "flex min-w-[720px] cursor-pointer items-center gap-3 px-3 py-3 outline-none transition-colors hover:bg-[var(--cazura-canvas)] focus-visible:bg-[var(--cazura-canvas)] focus-visible:ring-2 focus-visible:ring-[var(--cazura-border)] focus-visible:ring-offset-2",
                  i < pageRows.length - 1 && "border-b",
                  tx.optimistic && "opacity-[0.72]",
                )}
                style={{
                  background: "var(--cazura-panel)",
                  borderColor: "var(--cazura-row-divider)",
                }}
                onClick={() => {
                  if (tx.optimistic) return;
                  setDetailRow(tx);
                }}
                onKeyDown={(e) => {
                  if (tx.optimistic) return;
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setDetailRow(tx);
                  }
                }}
              >
                <div className="min-w-[220px] flex-1 basis-0">
                  <div className="min-w-0">
                    <TransactionCategoryLabel
                      name={tx.categoryName}
                      icon={tx.categoryIcon}
                      color={tx.categoryColor}
                      transactionName={tx.transactionName}
                      note={tx.note}
                      variant="cazura"
                    />
                  </div>
                </div>
                <span
                  className="w-[148px] shrink-0 text-xs font-medium"
                  style={{ color: "var(--cazura-muted)" }}
                >
                  {formatTableDate(tx.occurredAt)}
                </span>
                <span
                  className="w-24 shrink-0 text-xs font-medium"
                  style={{ color: "var(--cazura-muted)" }}
                >
                  {formatTableTime(tx.occurredAt)}
                </span>
                <span
                  className="w-[128px] shrink-0 pr-3 text-right text-xs font-bold tabular-nums"
                  style={{
                    color:
                      tx.categoryType === "income"
                        ? "var(--cazura-teal-mid)"
                        : "var(--cazura-red)",
                  }}
                >
                  {tx.categoryType === "income" ? "+" : "−"}
                  {formatInr(tx.amount)}
                </span>
                <span
                  className="w-[120px] shrink-0 text-xs font-medium"
                  style={{ color: "var(--cazura-text)" }}
                >
                  {formatPaymentMethodLabel(tx.paymentMethod)}
                </span>
                <div
                  className="flex w-12 shrink-0 justify-end"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  {tx.optimistic ? (
                    <span
                      className="text-[10px] font-medium"
                      style={{ color: "var(--cazura-muted)" }}
                    >
                      Saving…
                    </span>
                  ) : (
                    <TransactionRowActions
                      id={tx.id}
                      row={tx}
                      variant="cazura"
                    />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 px-4 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span style={{ color: "var(--cazura-text)" }}>Show data</span>
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "h-7 rounded-md border px-2 text-xs font-medium shadow-none",
              )}
              style={{
                background: "var(--cazura-canvas)",
                borderColor: "var(--cazura-border)",
                color: "var(--cazura-text)",
              }}
            >
              {pageSize}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {PAGE_SIZES.map((n) => (
                <DropdownMenuItem
                  key={n}
                  onClick={() => {
                    setPageSize(n);
                    setPage(1);
                  }}
                >
                  {n} per page
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <span style={{ color: "var(--cazura-text)" }}>
            of {ordered.length}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className="flex items-center rounded-full border p-1"
            style={{
              background: safePage <= 1 ? "#f0f0f0" : "var(--cazura-panel)",
              borderColor: "var(--cazura-border)",
            }}
            disabled={safePage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            aria-label="Previous page"
          >
            <ChevronLeft className="size-3 text-[var(--cazura-muted)]" />
          </button>
          {paginationItems(safePage, totalPages).map((item, idx) =>
            item === "ellipsis" ? (
              <span
                key={`e-${idx}`}
                className="flex size-6 items-center justify-center text-xs text-[var(--cazura-muted)]"
              >
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                className="flex size-6 items-center justify-center rounded-md text-xs"
                style={{
                  background:
                    item === safePage ? "var(--cazura-teal)" : "transparent",
                  color:
                    item === safePage
                      ? "var(--cazura-panel)"
                      : "var(--cazura-muted)",
                  fontWeight: item === safePage ? 500 : 400,
                }}
                onClick={() => setPage(item)}
              >
                {item}
              </button>
            ),
          )}
          <button
            type="button"
            className="flex items-center rounded-full border p-1"
            style={{
              background:
                safePage >= totalPages ? "#f0f0f0" : "var(--cazura-panel)",
              borderColor: "var(--cazura-border)",
            }}
            disabled={safePage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            aria-label="Next page"
          >
            <ChevronRight className="size-3 text-[var(--cazura-muted)]" />
          </button>
        </div>
      </div>
    </div>
  );
}

function paginationItems(
  current: number,
  total: number,
): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const set = new Set<number>();
  set.add(1);
  set.add(total);
  for (let d = -1; d <= 1; d++) {
    const p = current + d;
    if (p > 1 && p < total) set.add(p);
  }
  const sorted = [...set].sort((a, b) => a - b);
  const out: (number | "ellipsis")[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const cur = sorted[i]!;
    if (i > 0 && cur - sorted[i - 1]! > 1) out.push("ellipsis");
    out.push(cur);
  }
  return out;
}
