"use client";

import {
  AddTransactionDialog,
  type PaymentMethodOption,
  type TransactionCategoryOption,
} from "@/components/transactions/add-transaction-dialog";
import {
  ImportStatementDialog,
  type ImportCategoryOption,
  type ImportPaymentMethodOption,
} from "@/components/transactions/import-statement-dialog";
import { ExportMenu } from "@/components/transactions/export-menu";
import { TimeframeToolbar } from "@/components/dashboard/timeframe-toolbar";
import { buttonVariants } from "@/components/ui/button";
import type { TimePreset } from "@/lib/time-range";
import { cn } from "@/lib/utils";
import { FileUp, Plus } from "lucide-react";

export function TransactionsPageHeader({
  preset,
  basePath,
  monthKey,
  custom,
  categories,
  paymentMethods,
  importCategories,
  importPaymentMethods,
  defaultPaymentMethod,
}: {
  preset: TimePreset;
  basePath: string;
  monthKey?: string;
  custom?: { from: Date; to: Date };
  categories: TransactionCategoryOption[];
  paymentMethods: PaymentMethodOption[];
  importCategories: ImportCategoryOption[];
  importPaymentMethods: ImportPaymentMethodOption[];
  defaultPaymentMethod: string;
}) {
  const timeframeToolbar = (
    <TimeframeToolbar
      preset={preset}
      basePath={basePath}
      variant="cazura"
      monthKey={monthKey}
      custom={custom}
    />
  );

  return (
    <div className="flex flex-col gap-2.5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2 sm:block">
          <p
            className="text-[22px] leading-tight font-bold tracking-tight"
            style={{ color: "var(--cazura-text)" }}
          >
            Transactions
          </p>
          <div className="shrink-0 sm:hidden">{timeframeToolbar}</div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="hidden sm:block">{timeframeToolbar}</div>
        <ExportMenu
          preset={preset}
          custom={custom}
          monthKey={monthKey}
          variant="cazura"
        />
        <ImportStatementDialog
          categories={importCategories}
          paymentMethods={importPaymentMethods}
          defaultPaymentMethod={defaultPaymentMethod}
          trigger={
            <span className="flex items-center gap-1.5">
              <FileUp className="size-3.5" strokeWidth={2.5} />
              Import
            </span>
          }
        />
        <div className="hidden sm:block">
          <AddTransactionDialog
            categories={categories}
            paymentMethods={paymentMethods}
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
    </div>
  );
}
