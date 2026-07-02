"use client";

import { AddTransactionDialog } from "@/components/transactions/add-transaction-dialog";
import type {
  PaymentMethodOption,
  TransactionCategoryOption,
} from "@/components/transactions/add-transaction-dialog";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

export function AddTransactionFab({
  categories,
  paymentMethods,
}: {
  categories: TransactionCategoryOption[];
  paymentMethods: PaymentMethodOption[];
}) {
  return (
    <div className="pointer-events-none fixed right-4 bottom-5 z-40 sm:hidden">
      <span
        aria-hidden
        className="fab-ring-pulse pointer-events-none absolute inset-0 rounded-full bg-[var(--cazura-teal)]"
      />
      <AddTransactionDialog
        categories={categories}
        paymentMethods={paymentMethods}
        trigger={
          <button
            type="button"
            aria-label="Add transaction"
            className={cn(
              buttonVariants({ size: "icon" }),
              "group pointer-events-auto relative size-14 rounded-full border-0",
              "shadow-[0_4px_16px_rgba(59,96,100,0.45)]",
              "transition-[transform,box-shadow,background-color] duration-300 ease-out",
              "hover:scale-105 hover:shadow-[0_10px_28px_rgba(59,96,100,0.55)]",
              "active:scale-95 active:duration-150",
              "animate-in fade-in slide-in-from-bottom-6 zoom-in-90 duration-500 ease-out fill-mode-both",
              "motion-reduce:animate-none motion-reduce:transition-none",
            )}
            style={{ background: "var(--cazura-teal)" }}
          >
            <Plus
              className="size-6 text-white transition-transform duration-300 ease-out group-hover:rotate-90 group-active:rotate-0 group-active:scale-90 motion-reduce:transition-none motion-reduce:group-hover:rotate-0"
              strokeWidth={2.5}
            />
          </button>
        }
      />
    </div>
  );
}
