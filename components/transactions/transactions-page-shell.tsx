"use client";

import { ExpenseBreakdownCazura } from "@/components/transactions/expense-breakdown-cazura";
import { OptimisticTransactionsProvider } from "@/components/transactions/optimistic-transactions-context";
import { TransactionStatMiniCards } from "@/components/transactions/transaction-stat-mini-cards";
import { TransactionsActivityTable } from "@/components/transactions/transactions-activity-table";
import { TransactionsPageHeader } from "@/components/transactions/transactions-page-header";
import {
  TransactionsSubscriptionsCard,
  type SubscriptionCardRow,
} from "@/components/transactions/transactions-subscriptions-card";
import type { ActivityRow } from "@/components/transactions/activity-row";
import type {
  PaymentMethodOption,
  TransactionCategoryOption,
} from "@/components/transactions/add-transaction-dialog";
import type { TimePreset } from "@/lib/time-range";

export function TransactionsPageShell({
  activityRows,
  categoryOptions,
  paymentMethodOptions,
  subscriptionRows,
  categoryIcons,
  categoryColors,
  breakdown,
  agg,
  preset,
  basePath,
  monthKey,
  custom,
}: {
  activityRows: ActivityRow[];
  categoryOptions: TransactionCategoryOption[];
  paymentMethodOptions: PaymentMethodOption[];
  subscriptionRows: SubscriptionCardRow[];
  categoryIcons: Record<string, string | null>;
  categoryColors: Record<string, string>;
  breakdown: { name: string; value: number }[];
  agg: {
    income: number;
    prevIncome: number;
    expense: number;
    prevExpense: number;
  };
  preset: TimePreset;
  basePath: string;
  monthKey?: string;
  custom?: { from: Date; to: Date };
}) {
  return (
    <OptimisticTransactionsProvider initialRows={activityRows}>
      <div className="flex flex-col gap-4 pb-2">
        <TransactionsPageHeader
          preset={preset}
          basePath={basePath}
          monthKey={monthKey}
          custom={custom}
          categories={categoryOptions}
          paymentMethods={paymentMethodOptions}
        />

        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-4">
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <TransactionStatMiniCards
              income={agg.income}
              prevIncome={agg.prevIncome}
              expense={agg.expense}
              prevExpense={agg.prevExpense}
            />
            <TransactionsActivityTable />
          </div>

          <div className="flex w-full shrink-0 flex-col gap-4 lg:w-[276px]">
            <ExpenseBreakdownCazura
              breakdown={breakdown}
              categoryIcons={categoryIcons}
              categoryColors={categoryColors}
            />
            <TransactionsSubscriptionsCard
              categories={categoryOptions}
              paymentMethods={paymentMethodOptions}
              subscriptions={subscriptionRows}
            />
          </div>
        </div>
      </div>
    </OptimisticTransactionsProvider>
  );
}
