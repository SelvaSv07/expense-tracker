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
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  CategoryIconShelf,
  categoryIconShelfBorderStyle,
} from "@/lib/category-color";
import { formatInr } from "@/lib/money";
import { cn, formatPaymentMethodLabel } from "@/lib/utils";
import {
  ArrowDown,
  ArrowUp,
  LayoutGrid,
  MoreHorizontal,
  Search,
  SlidersHorizontal,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

export type { ActivityRow };

const INITIAL_VISIBLE = 20;
const LOAD_MORE_STEP = 20;

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

/** Fixed slot matching `CategoryIconShelf` size so filter rows align. */
function FilterMenuIconSlot({ children }: { children: ReactNode }) {
  return (
    <span className="flex size-[22px] shrink-0 items-center justify-center">
      {children}
    </span>
  );
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
  const [categoryName, setCategoryName] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  const [dateSort, setDateSort] = useState<"asc" | "desc">("desc");
  const [detailRow, setDetailRow] = useState<ActivityRow | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const loadMoreSentinelRef = useRef<HTMLDivElement>(null);

  /** One entry per category name in `rows` (icon/color from first matching row). */
  const categoryFilterOptions = useMemo(() => {
    const firstByName = new Map<
      string,
      { icon: string | null; color: string }
    >();
    for (const r of rows) {
      if (!firstByName.has(r.categoryName)) {
        firstByName.set(r.categoryName, {
          icon: r.categoryIcon,
          color: r.categoryColor,
        });
      }
    }
    return [...firstByName.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, meta]) => ({ name, ...meta }));
  }, [rows]);

  useEffect(() => {
    if (
      categoryName !== null &&
      !categoryFilterOptions.some((c) => c.name === categoryName)
    ) {
      setCategoryName(null);
    }
  }, [categoryName, categoryFilterOptions]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (kind !== "all" && r.categoryType !== kind) return false;
      if (categoryName !== null && r.categoryName !== categoryName) return false;
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
  }, [rows, query, kind, categoryName]);

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

  /** Net of all rows matching the current filters (income minus expense). */
  const listedNetTotal = useMemo(() => {
    let net = 0;
    for (const r of ordered) {
      net += r.categoryType === "income" ? r.amount : -r.amount;
    }
    return net;
  }, [ordered]);

  useEffect(() => {
    setVisibleCount(Math.min(INITIAL_VISIBLE, ordered.length));
  }, [query, kind, categoryName, dateSort]);

  const displayedRows = ordered.slice(
    0,
    Math.min(visibleCount, ordered.length),
  );
  const hasMore = displayedRows.length < ordered.length;

  useEffect(() => {
    const root = scrollAreaRef.current;
    const target = loadMoreSentinelRef.current;
    if (!root || !target || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        setVisibleCount((c) => Math.min(c + LOAD_MORE_STEP, ordered.length));
      },
      { root, rootMargin: "120px", threshold: 0 },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, ordered.length, displayedRows.length]);

  return (
    <TooltipProvider delay={400}>
      <div
      className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border"
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
      <div className="flex shrink-0 flex-wrap items-center gap-2.5 px-3 pt-3">
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
          <DropdownMenuContent
            align="end"
            className="min-w-[180px] max-h-[min(22rem,70vh)]"
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel>Type</DropdownMenuLabel>
              <DropdownMenuItem
                className="gap-2"
                onClick={() => setKind("all")}
              >
                <FilterMenuIconSlot>
                  <LayoutGrid
                    className="size-3.5"
                    strokeWidth={2}
                    style={{ color: "var(--cazura-label)" }}
                  />
                </FilterMenuIconSlot>
                All
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2"
                onClick={() => setKind("income")}
              >
                <FilterMenuIconSlot>
                  <TrendingUp
                    className="size-3.5"
                    strokeWidth={2.5}
                    style={{ color: "var(--cazura-teal-mid)" }}
                  />
                </FilterMenuIconSlot>
                Income only
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2"
                onClick={() => setKind("expense")}
              >
                <FilterMenuIconSlot>
                  <TrendingDown
                    className="size-3.5"
                    strokeWidth={2.5}
                    style={{ color: "var(--cazura-red)" }}
                  />
                </FilterMenuIconSlot>
                Expense only
              </DropdownMenuItem>
            </DropdownMenuGroup>
            {categoryFilterOptions.length > 0 ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Categories</DropdownMenuLabel>
                  <DropdownMenuItem
                    className="gap-2"
                    onClick={() => {
                      setCategoryName(null);
                    }}
                  >
                    <FilterMenuIconSlot>
                      <LayoutGrid
                        className="size-3.5"
                        strokeWidth={2}
                        style={{ color: "var(--cazura-label)" }}
                      />
                    </FilterMenuIconSlot>
                    All categories
                  </DropdownMenuItem>
                  {categoryFilterOptions.map(({ name, icon, color }) => (
                    <DropdownMenuItem
                      key={name}
                      className="gap-2"
                      onClick={() => {
                        setCategoryName(name);
                      }}
                    >
                      <FilterMenuIconSlot>
                        <CategoryIconShelf
                          icon={icon}
                          color={color}
                          title={name}
                          className="size-full border p-0.5"
                          style={categoryIconShelfBorderStyle(color)}
                          iconClassName="size-3"
                        />
                      </FilterMenuIconSlot>
                      <span className="min-w-0 flex-1 truncate">{name}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </>
            ) : null}
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
        className="m-3 flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border"
        style={{ borderColor: "var(--cazura-border)" }}
      >
        <div
          className="flex min-w-[720px] shrink-0 items-center gap-3 border-b px-3 py-2"
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
            onClick={() =>
              setDateSort((d) => (d === "asc" ? "desc" : "asc"))
            }
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

        <div
          ref={scrollAreaRef}
          className="min-h-0 flex-1 overflow-y-auto overflow-x-auto"
        >
          {displayedRows.length === 0 ? (
            <p
              className="px-3 py-10 text-center text-xs"
              style={{ color: "var(--cazura-muted)" }}
            >
              {rows.length === 0
                ? "No transactions yet. Add one to get started."
                : "No transactions match your search or filter."}
            </p>
          ) : (
            <>
              {displayedRows.map((tx, i) => (
                <div
                  key={tx.id}
                  tabIndex={0}
                  aria-haspopup="dialog"
                  aria-label={`View details: ${tx.categoryName}, ${tx.categoryType === "income" ? "income" : "expense"} ${formatInr(tx.amount)}`}
                  className={cn(
                    "flex min-w-[720px] cursor-pointer items-center gap-3 px-3 py-3 outline-none transition-colors hover:bg-[var(--cazura-canvas)] focus-visible:bg-[var(--cazura-canvas)] focus-visible:ring-2 focus-visible:ring-[var(--cazura-border)] focus-visible:ring-offset-2",
                    i < displayedRows.length - 1 && "border-b",
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
              ))}
              {hasMore ? (
                <div
                  ref={loadMoreSentinelRef}
                  className="h-1 w-full shrink-0"
                  aria-hidden
                />
              ) : null}
              <div
                className="flex min-w-[720px] items-center gap-3 border-t px-3 py-2.5"
                style={{
                  background: "#f0f0f0",
                  borderColor: "var(--cazura-row-divider)",
                }}
                role="row"
                aria-label={`Total for listed transactions: ${listedNetTotal >= 0 ? "+" : "−"}${formatInr(Math.abs(listedNetTotal))}`}
              >
                <span
                  className="min-w-[220px] flex-1 basis-0 text-xs font-bold"
                  style={{ color: "var(--cazura-text)" }}
                >
                  Total
                </span>
                <span className="w-[148px] shrink-0" aria-hidden />
                <span className="w-24 shrink-0" aria-hidden />
                <span
                  className="w-[128px] shrink-0 pr-3 text-right text-xs font-bold tabular-nums"
                  style={{
                    color:
                      listedNetTotal >= 0
                        ? "var(--cazura-teal-mid)"
                        : "var(--cazura-red)",
                  }}
                >
                  {listedNetTotal >= 0 ? "+" : "−"}
                  {formatInr(Math.abs(listedNetTotal))}
                </span>
                <span className="w-[120px] shrink-0" aria-hidden />
                <span className="w-12 shrink-0" aria-hidden />
              </div>
            </>
          )}
        </div>
      </div>

      {ordered.length > 0 ? (
        <div
          className="shrink-0 px-4 pb-3 text-xs"
          style={{ color: "var(--cazura-muted)" }}
        >
          {displayedRows.length < ordered.length
            ? `Showing ${displayedRows.length} of ${ordered.length}`
            : `${ordered.length} transaction${ordered.length === 1 ? "" : "s"}`}
        </div>
      ) : null}
    </div>
    </TooltipProvider>
  );
}
