import { ExpenseBreakdownCazura } from "@/components/transactions/expense-breakdown-cazura";
import { TransactionStatMiniCards } from "@/components/transactions/transaction-stat-mini-cards";
import { TransactionsActivityTable } from "@/components/transactions/transactions-activity-table";
import { TransactionsPageHeader } from "@/components/transactions/transactions-page-header";
import { TransactionsSubscriptionsCard } from "@/components/transactions/transactions-subscriptions-card";
import { parseTimeFromSearchParams } from "@/lib/search-params-time";
import {
  getExpenseBreakdown,
  getTransactionAggregates,
  listCategories,
  listPaymentMethods,
  listTransactionsWithCategory,
} from "@/lib/queries";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

const SUBSCRIPTION_STYLE_CATEGORIES = new Set([
  "Entertainment",
  "Shopping",
  "Utilities",
]);

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getSession();
  if (!session?.user) redirect("/sign-in");

  const sp = await searchParams;
  const { preset, custom, monthRef, monthKey } =
    parseTimeFromSearchParams(sp);
  const userId = session.user.id;

  const [agg, txs, breakdown, cats, payMethods] = await Promise.all([
    getTransactionAggregates(userId, preset, custom, monthRef),
    listTransactionsWithCategory(userId, preset, custom, monthRef),
    getExpenseBreakdown(userId, preset, custom, monthRef),
    listCategories(userId),
    listPaymentMethods(userId),
  ]);

  const categoryOptions = cats.map((c) => ({
    id: c.id,
    name: c.name,
    type: c.type,
    icon: c.icon,
    color: c.color,
  }));

  const categoryIcons = Object.fromEntries(
    cats.map((c) => [c.name, c.icon] as const),
  );

  const categoryColors = Object.fromEntries(
    cats.map((c) => [c.name, c.color] as const),
  );

  const paymentMethodOptions = payMethods.map((m) => ({
    id: m.id,
    name: m.name,
  }));

  const activityRows = txs.map((tx) => ({
    id: tx.id,
    amount: tx.amount,
    occurredAt: tx.occurredAt.toISOString(),
    transactionName: tx.transactionName,
    note: tx.note,
    paymentMethod: tx.paymentMethod,
    categoryName: tx.categoryName,
    categoryType: tx.categoryType as "income" | "expense",
    categoryIcon: tx.categoryIcon,
    categoryColor: tx.categoryColor,
  }));

  const subscriptionItems = txs
    .filter(
      (t) =>
        t.categoryType === "expense" &&
        SUBSCRIPTION_STYLE_CATEGORIES.has(t.categoryName),
    )
    .slice(0, 7)
    .map((t) => ({
      id: t.id,
      label: t.categoryName,
      timeLabel: t.occurredAt.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
      amount: t.amount,
      icon: t.categoryIcon,
      color: categoryColors[t.categoryName] ?? t.categoryColor,
    }));

  return (
    <div className="flex flex-col gap-4 pb-2">
      <TransactionsPageHeader
        preset={preset}
        basePath="/transactions"
        monthKey={monthKey}
        custom={custom}
        categories={categoryOptions}
        paymentMethods={paymentMethodOptions}
      />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <TransactionStatMiniCards
            totalVolume={agg.totalVolume}
            prevTotalVolume={agg.prevTotalVolume}
            income={agg.income}
            prevIncome={agg.prevIncome}
            expense={agg.expense}
            prevExpense={agg.prevExpense}
          />
          <TransactionsActivityTable rows={activityRows} />
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
            items={subscriptionItems}
          />
        </div>
      </div>
    </div>
  );
}
