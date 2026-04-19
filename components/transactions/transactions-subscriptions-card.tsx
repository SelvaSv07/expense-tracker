"use client";

import { deleteSubscription } from "@/actions/subscriptions";
import {
  AddTransactionDialog,
  type PaymentMethodOption,
  type TransactionCategoryOption,
} from "@/components/transactions/add-transaction-dialog";
import {
  SubscriptionFormDialog,
  type SubscriptionEditValues,
} from "@/components/transactions/subscription-form-dialog";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CategoryIconShelf,
  categoryIconShelfBorderStyle,
} from "@/lib/category-color";
import { formatInr } from "@/lib/money";
import { cn } from "@/lib/utils";
import { MoreHorizontal, Pencil, Plus, Trash2, Wand2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
    <div
      className="flex flex-col gap-3 rounded-xl border p-3"
      style={{
        background: "var(--cazura-panel)",
        borderColor: "var(--cazura-border)",
      }}
    >
      <div className="flex items-center gap-2">
        <span
          className="flex-1 text-[15px] font-bold"
          style={{ color: "var(--cazura-text)" }}
        >
          Subscriptions
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <Link
            href="/ai"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "h-8 flex-1 gap-1.5 rounded-lg border text-xs font-medium shadow-[0_0_8px_rgba(59,96,100,0.1)]",
            )}
            style={{
              borderColor: "#cbdcde",
              background: "linear-gradient(to right, #eff3f1, #e1ede7)",
            }}
          >
            <Wand2
              className="size-3.5"
              strokeWidth={2}
              style={{ color: "#4b8575" }}
            />
            <span
              className="bg-gradient-to-r from-[var(--cazura-teal)] via-[var(--cazura-teal-light)] to-[var(--cazura-teal-soft)] bg-clip-text font-medium text-transparent"
              style={{ WebkitTextFillColor: "transparent" }}
            >
              Ask AI
            </span>
          </Link>
          <SubscriptionFormDialog
            categories={categories}
            paymentMethods={paymentMethods}
            edit={editing}
            onEditClear={() => setEditing(null)}
            trigger={
              <button
                type="button"
                className={cn(
                  buttonVariants({ size: "sm" }),
                  "h-8 flex-1 gap-1.5 rounded-lg border text-xs font-medium shadow-[0_2px_8px_rgba(0,0,0,0.1)]",
                )}
                style={{
                  background: "var(--cazura-teal)",
                  borderColor: "#629298",
                  color: "var(--cazura-panel)",
                }}
              >
                <Plus className="size-3.5" strokeWidth={2.5} />
                Subscription
              </button>
            }
          />
        </div>
        <AddTransactionDialog
          categories={categories}
          paymentMethods={paymentMethods}
          trigger={
            <button
              type="button"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "h-8 w-full gap-1.5 rounded-lg border text-xs font-medium",
              )}
              style={{
                borderColor: "var(--cazura-border)",
                color: "var(--cazura-text)",
              }}
            >
              <Plus className="size-3.5" strokeWidth={2} />
              One-off transaction
            </button>
          }
        />
      </div>

      <div className="flex flex-col gap-4">
        {subscriptionRows.length === 0 ? (
          <p
            className="text-center text-[11px] leading-relaxed"
            style={{ color: "var(--cazura-muted)" }}
          >
            No subscriptions yet. Add one to log fixed monthly charges or EMIs
            automatically when the billing day arrives (checked when you open
            this page, at most once per day).
          </p>
        ) : (
          subscriptionRows.map((s) => (
            <div
              key={s.id}
              className="flex items-start justify-between gap-2"
            >
              <div className="flex min-w-0 flex-1 items-start gap-2">
                <CategoryIconShelf
                  icon={s.categoryIcon}
                  color={s.categoryColor}
                  className="size-10 shrink-0 rounded-full border p-2"
                  style={categoryIconShelfBorderStyle(s.categoryColor)}
                  iconClassName="size-4"
                />
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span
                    className="truncate text-sm font-medium"
                    style={{ color: "var(--cazura-text)" }}
                  >
                    {s.serviceName}
                  </span>
                  <span
                    className="text-[10px] text-[var(--cazura-label)]"
                  >
                    {s.categoryName}
                  </span>
                  <span
                    className="text-[10px] leading-snug text-[var(--cazura-label)]"
                  >
                    {s.scheduleSummary}
                    <span className="text-[var(--cazura-muted)]"> · </span>
                    Next: {s.nextDueLabel}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <DropdownMenu>
                  <DropdownMenuTrigger
                    className="flex items-center justify-center rounded-md border p-1"
                    style={{ borderColor: "var(--cazura-border)" }}
                  >
                    <MoreHorizontal
                      className="size-3 text-[var(--cazura-label)]"
                      strokeWidth={2}
                    />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-[120px]">
                    <DropdownMenuItem
                      onClick={() => setEditing(toEditValues(s))}
                    >
                      <Pencil className="size-3.5" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => onDelete(s.id)}
                    >
                      <Trash2 className="size-3.5" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <span
                  className="text-xs font-bold whitespace-nowrap"
                  style={{ color: "var(--cazura-text)" }}
                >
                  {formatInr(s.amount)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
