"use client";

import { AddTransactionDialog } from "@/components/transactions/add-transaction-dialog";
import { buttonVariants } from "@/components/ui/button";
import type {
  PaymentMethodOption,
  TransactionCategoryOption,
} from "@/components/transactions/add-transaction-dialog";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

export function OverviewAddTransactionTrigger({
  categories,
  paymentMethods,
}: {
  categories: TransactionCategoryOption[];
  paymentMethods: PaymentMethodOption[];
}) {
  return (
    <AddTransactionDialog
      categories={categories}
      paymentMethods={paymentMethods}
      trigger={
        <span
          role="button"
          tabIndex={0}
          aria-label="Add transaction"
          className={cn(
            buttonVariants({ size: "icon" }),
            "inline-flex size-8 cursor-pointer rounded-full border-0 shadow-[0_4px_12px_rgba(59,96,100,0.5)]",
          )}
          style={{ background: "var(--cazura-teal)" }}
        >
          <Plus className="size-[15px] text-white" strokeWidth={2.5} />
        </span>
      }
    />
  );
}
