"use client";

import { deleteSubscription } from "@/actions/subscriptions";
import type {
  PaymentMethodOption,
  TransactionCategoryOption,
} from "@/components/transactions/add-transaction-dialog";
import {
  SubscriptionFormDialog,
  type SubscriptionEditValues,
} from "@/components/transactions/subscription-form-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CategoryIconShelf,
  categoryIconShelfBorderStyle,
} from "@/lib/category-color";
import { formatInr } from "@/lib/money";
import { cn } from "@/lib/utils";
import { ArrowUpRight, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const SUBSCRIPTION_CARD_PREVIEW_LIMIT = 3;

function ordinalDaySuffix(day: number): string {
  if (day >= 11 && day <= 13) return `${day}th`;
  switch (day % 10) {
    case 1:
      return `${day}st`;
    case 2:
      return `${day}nd`;
    case 3:
      return `${day}rd`;
    default:
      return `${day}th`;
  }
}

function subscriptionCardCadenceLabel(billingDay: number): string {
  return `Monthly on the ${ordinalDaySuffix(billingDay)}`;
}

export type SubscriptionCardRow = {
  id: string;
  serviceName: string;
  amount: number;
  scheduleSummary: string;
  nextDueLabel: string;
  categoryName: string;
  categoryIcon: string | null;
  categoryColor: string;
  categoryId: string;
  paymentMethod: string | null;
  note: string | null;
  scheduleType: "recurring" | "until";
  billingDay: number;
  untilYear: number | null;
  untilMonth: number | null;
};

function SubscriptionCardRowItem({
  row,
  onEdit,
  onDelete,
  variant = "card",
}: {
  row: SubscriptionCardRow;
  onEdit: () => void;
  onDelete: () => void;
  variant?: "card" | "dialog";
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-2",
        variant === "dialog" && "py-3.5",
        variant === "card" && "py-3",
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Tooltip>
          <TooltipTrigger
            type="button"
            delay={250}
            className={cn(
              "inline-flex cursor-default rounded-full border-0 bg-transparent p-0 outline-none",
              "focus-visible:ring-2 focus-visible:ring-[var(--cazura-teal)]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--cazura-panel)]",
            )}
            aria-label={`Category: ${row.categoryName}`}
          >
            <CategoryIconShelf
              icon={row.categoryIcon}
              color={row.categoryColor}
              className="size-9 shrink-0 rounded-full border p-1.5"
              style={categoryIconShelfBorderStyle(row.categoryColor)}
              iconClassName="size-3.5"
            />
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={6}>
            {row.categoryName}
          </TooltipContent>
        </Tooltip>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span
            className="truncate text-sm font-medium leading-snug"
            style={{ color: "var(--cazura-text)" }}
          >
            {row.serviceName}
          </span>
          <span className="text-[11px] leading-snug text-[var(--cazura-label)]">
            {variant === "card" ? (
              subscriptionCardCadenceLabel(row.billingDay)
            ) : (
              <>
                {row.scheduleSummary}
                <span className="text-[var(--cazura-muted)]"> · </span>
                Next: {row.nextDueLabel}
              </>
            )}
          </span>
        </div>
      </div>
      <div
        className={cn(
          "flex shrink-0 flex-row items-center",
          variant === "dialog" ? "gap-2.5" : "gap-0",
        )}
      >
        <span
          className="text-sm font-semibold tabular-nums tracking-tight whitespace-nowrap"
          style={{ color: "var(--cazura-text)" }}
        >
          {formatInr(row.amount)}
        </span>
        {variant === "dialog" ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded border p-0"
              style={{ borderColor: "var(--cazura-border)" }}
            >
              <MoreHorizontal
                className="size-2.5 text-[var(--cazura-label)]"
                strokeWidth={2}
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[120px]">
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="size-3.5" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={onDelete}>
                <Trash2 className="size-3.5" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
    </div>
  );
}

const subscriptionAddButtonClassName = cn(
  buttonVariants({ size: "sm" }),
  "h-8 shrink-0 gap-1.5 rounded-lg border text-xs font-medium shadow-[0_2px_8px_rgba(0,0,0,0.1)]",
);

const subscriptionAddButtonStyle = {
  background: "var(--cazura-teal)",
  borderColor: "#629298",
  color: "var(--cazura-panel)",
} as const;

export function TransactionsSubscriptionsCard({
  categories,
  paymentMethods,
  subscriptions: subscriptionRows,
}: {
  categories: TransactionCategoryOption[];
  paymentMethods: PaymentMethodOption[];
  subscriptions: SubscriptionCardRow[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<SubscriptionEditValues | null>(null);
  const [viewAllOpen, setViewAllOpen] = useState(false);

  const previewSubscriptionRows = subscriptionRows.slice(
    0,
    SUBSCRIPTION_CARD_PREVIEW_LIMIT,
  );

  function toEditValues(row: SubscriptionCardRow): SubscriptionEditValues {
    return {
      id: row.id,
      serviceName: row.serviceName,
      amount: row.amount,
      categoryId: row.categoryId,
      paymentMethod: row.paymentMethod,
      note: row.note,
      scheduleType: row.scheduleType,
      billingDay: row.billingDay,
      untilYear: row.untilYear,
      untilMonth: row.untilMonth,
    };
  }

  async function onDelete(id: string) {
    if (
      !confirm(
        "Remove this subscription? Charges already logged stay in your activity.",
      )
    ) {
      return;
    }
    try {
      await deleteSubscription(id);
      router.refresh();
    } catch {
      /* surfaced elsewhere if needed */
    }
  }

  return (
    <TooltipProvider delay={400}>
      <>
      <div
        className="flex flex-col gap-4 rounded-xl border p-3"
        style={{
          background: "var(--cazura-panel)",
          borderColor: "var(--cazura-border)",
        }}
      >
      <div className="flex items-center gap-2">
        <span
          className="min-w-0 flex-1 truncate text-[15px] font-bold"
          style={{ color: "var(--cazura-text)" }}
        >
          Subscriptions
        </span>
      </div>

      {subscriptionRows.length > 0 ? (
        <div className="flex flex-col divide-y divide-[var(--cazura-border)]">
          {previewSubscriptionRows.map((s) => (
            <SubscriptionCardRowItem
              key={s.id}
              row={s}
              onEdit={() => setEditing(toEditValues(s))}
              onDelete={() => onDelete(s.id)}
            />
          ))}
        </div>
      ) : null}

      {subscriptionRows.length > 0 ? (
        <Button
          type="button"
          variant="outline"
          className="h-auto w-full cursor-pointer gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium shadow-none"
          style={{
            background: "var(--cazura-panel)",
            borderColor: "var(--cazura-border)",
            color: "var(--cazura-text)",
          }}
          onClick={() => setViewAllOpen(true)}
        >
          Detailed View
          <ArrowUpRight className="size-3.5" strokeWidth={2} />
        </Button>
      ) : (
        <div
          className="flex w-full items-center justify-center rounded-lg border px-3 py-2 text-center text-xs font-medium shadow-none"
          style={{
            background: "var(--cazura-panel)",
            borderColor: "var(--cazura-border)",
            color: "var(--cazura-muted)",
          }}
        >
          We do not have any subs.
        </div>
      )}
      </div>

      <Dialog open={viewAllOpen} onOpenChange={setViewAllOpen}>
        <DialogContent
          className="w-full max-w-[calc(100%-2rem)] gap-0 border-[var(--cazura-border)] bg-[var(--cazura-panel)] p-0 text-[var(--cazura-text)] ring-[var(--cazura-border)] sm:max-w-lg"
          showCloseButton={false}
        >
          <div className="border-b border-[var(--cazura-border)] px-4 pt-4 pb-3">
            <DialogHeader className="gap-0 text-left">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-1">
                  <DialogTitle style={{ color: "var(--cazura-text)" }}>
                    Subscriptions
                  </DialogTitle>
                  <DialogDescription style={{ color: "var(--cazura-muted)" }}>
                    All recurring subscriptions and EMIs.
                  </DialogDescription>
                </div>
                <SubscriptionFormDialog
                  categories={categories}
                  paymentMethods={paymentMethods}
                  edit={editing}
                  onEditClear={() => setEditing(null)}
                  trigger={
                    <button
                      type="button"
                      className={cn(
                        subscriptionAddButtonClassName,
                        "shrink-0",
                      )}
                      style={subscriptionAddButtonStyle}
                    >
                      <Plus className="size-3.5" strokeWidth={2.5} />
                      <span className="sm:hidden">Add</span>
                      <span className="hidden sm:inline">Add Subscription</span>
                    </button>
                  }
                />
              </div>
            </DialogHeader>
          </div>
          <ScrollArea className="max-h-[min(60vh,420px)] overflow-hidden pb-4 pl-4 pr-3">
            <div className="flex flex-col divide-y divide-[var(--cazura-border)]">
              {subscriptionRows.map((s) => (
                <SubscriptionCardRowItem
                  key={s.id}
                  variant="dialog"
                  row={s}
                  onEdit={() => {
                    setViewAllOpen(false);
                    setEditing(toEditValues(s));
                  }}
                  onDelete={() => onDelete(s.id)}
                />
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
    </TooltipProvider>
  );
}
