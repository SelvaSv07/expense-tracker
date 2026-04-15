"use client";

import {
  AddTransactionDialog,
  type PaymentMethodOption,
  type TransactionCategoryOption,
} from "@/components/transactions/add-transaction-dialog";
import { buttonVariants } from "@/components/ui/button";
import {
  CategoryIconShelf,
  categoryIconShelfBorderStyle,
} from "@/lib/category-color";
import { formatInr } from "@/lib/money";
import { cn } from "@/lib/utils";
import { MoreHorizontal, Plus, Wand2 } from "lucide-react";
import Link from "next/link";

export type SubscriptionSpotlightItem = {
  id: string;
  label: string;
  timeLabel: string;
  amount: number;
  icon: string | null;
  color: string;
};

export function TransactionsSubscriptionsCard({
  categories,
  paymentMethods,
  items,
}: {
  categories: TransactionCategoryOption[];
  paymentMethods: PaymentMethodOption[];
  items: SubscriptionSpotlightItem[];
}) {
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
        <div
          className="flex items-center justify-center rounded-lg border p-1.5"
          style={{ borderColor: "var(--cazura-border)" }}
        >
          <MoreHorizontal
            className="size-3.5 text-[var(--cazura-label)]"
            strokeWidth={2}
          />
        </div>
      </div>

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
          <Wand2 className="size-3.5" strokeWidth={2} style={{ color: "#4b8575" }} />
          <span
            className="bg-gradient-to-r from-[var(--cazura-teal)] via-[var(--cazura-teal-light)] to-[var(--cazura-teal-soft)] bg-clip-text font-medium text-transparent"
            style={{ WebkitTextFillColor: "transparent" }}
          >
            Ask AI
          </span>
        </Link>
        <AddTransactionDialog
          categories={categories}
          paymentMethods={paymentMethods}
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
              Add
            </button>
          }
        />
      </div>

      <div className="flex flex-col gap-6">
        {items.length === 0 ? (
          <p
            className="text-center text-[11px] leading-relaxed"
            style={{ color: "var(--cazura-muted)" }}
          >
            No Entertainment, Shopping, or Utilities expenses in this range.
            Those appear here as a subscription-style short list.
          </p>
        ) : (
          items.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between gap-2"
            >
              <div className="flex min-w-0 items-center gap-2">
                <CategoryIconShelf
                  icon={s.icon}
                  color={s.color}
                  className="size-10 rounded-full border p-2"
                  style={categoryIconShelfBorderStyle(s.color)}
                  iconClassName="size-4"
                />
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span
                    className="truncate text-sm font-medium"
                    style={{ color: "var(--cazura-text)" }}
                  >
                    {s.label}
                  </span>
                  <span
                    className="text-[10px] text-[var(--cazura-label)]"
                  >
                    {s.timeLabel}
                  </span>
                </div>
              </div>
              <span
                className="shrink-0 text-xs font-bold whitespace-nowrap"
                style={{ color: "var(--cazura-text)" }}
              >
                {formatInr(s.amount)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
