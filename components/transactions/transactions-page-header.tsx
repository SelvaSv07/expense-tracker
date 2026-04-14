"use client";

import { AddTransactionDialog } from "@/components/transactions/add-transaction-dialog";
import type { TransactionCategoryOption } from "@/components/transactions/add-transaction-dialog";
import { ExportMenu } from "@/components/transactions/export-menu";
import { TimeframeToolbar } from "@/components/dashboard/timeframe-toolbar";
import { buttonVariants } from "@/components/ui/button";
import type { TimePreset } from "@/lib/time-range";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

export function TransactionsPageHeader({
  preset,
  basePath,
  monthKey,
  custom,
  categories,
}: {
  preset: TimePreset;
  basePath: string;
  monthKey?: string;
  custom?: { from: Date; to: Date };
  categories: TransactionCategoryOption[];
}) {
  return (
    <div className="flex flex-col gap-2.5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 flex-1">
        <p
          className="text-[22px] leading-tight font-bold tracking-tight"
          style={{ color: "var(--cazura-text)" }}
        >
          Transactions
        </p>
        <p
          className="mt-1 text-[13px] font-medium"
          style={{ color: "var(--cazura-muted)" }}
        >
          View and manage all your income and expenses in one place
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2.5">
        <TimeframeToolbar
          preset={preset}
          basePath={basePath}
          variant="cazura"
          monthKey={monthKey}
          custom={custom}
        />
        <ExportMenu
          preset={preset}
          custom={custom}
          monthKey={monthKey}
          variant="cazura"
        />
        <AddTransactionDialog
          categories={categories}
          trigger={
            <button
              type="button"
              className={cn(
                buttonVariants({ size: "sm" }),
                "h-8 gap-1.5 rounded-lg border px-3 text-xs font-medium shadow-[0_2px_8px_rgba(0,0,0,0.1)]",
              )}
              style={{
                background: "var(--cazura-teal)",
                borderColor: "#629298",
                color: "var(--cazura-panel)",
              }}
            >
              <Plus className="size-3.5" strokeWidth={2.5} />
              Add Transaction
            </button>
          }
        />
      </div>
    </div>
  );
}
