"use client";

import { AddBudgetDialog } from "@/components/budget/add-budget-dialog";
import type { BudgetExpenseCategory } from "@/components/budget/add-budget-dialog";
import { TimeframeToolbar } from "@/components/dashboard/timeframe-toolbar";
import { ExportMenu } from "@/components/transactions/export-menu";
import { buttonVariants } from "@/components/ui/button";
import type { TimePreset } from "@/lib/time-range";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

export function BudgetPageHeader({
  preset,
  monthKey,
  custom,
  expenseCategories,
  defaultMonth,
}: {
  preset: TimePreset;
  monthKey?: string;
  custom?: { from: Date; to: Date };
  expenseCategories: BudgetExpenseCategory[];
  defaultMonth: Date;
}) {
  return (
    <div className="flex flex-col gap-2.5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 flex-1">
        <p
          className="text-[22px] leading-tight font-bold tracking-tight"
          style={{ color: "var(--cazura-text)" }}
        >
          Budget
        </p>
        <p
          className="mt-1 text-[13px] font-medium"
          style={{ color: "var(--cazura-muted)" }}
        >
          Track and optimize your spending
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2.5">
        <TimeframeToolbar
          preset={preset}
          basePath="/budget"
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
        <AddBudgetDialog
          expenseCategories={expenseCategories}
          defaultMonth={defaultMonth}
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
              Set New Budget
            </button>
          }
        />
      </div>
    </div>
  );
}
