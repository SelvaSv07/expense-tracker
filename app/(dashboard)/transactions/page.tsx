import { ExpenseBreakdownCazura } from "@/components/transactions/expense-breakdown-cazura";
import { TransactionStatMiniCards } from "@/components/transactions/transaction-stat-mini-cards";
import { TransactionsActivityTable } from "@/components/transactions/transactions-activity-table";
import { TransactionsPageHeader } from "@/components/transactions/transactions-page-header";
import { TransactionsSubscriptionsCard } from "@/components/transactions/transactions-subscriptions-card";
import { materializeSubscriptionCharges } from "@/lib/subscription-materialize";
import { nextDueOnOrAfterUtc } from "@/lib/subscription-schedule";
import { parseTimeFromSearchParams } from "@/lib/search-params-time";
import {
  getExpenseBreakdown,
  getTransactionAggregates,
  listCategories,
  listPaymentMethods,
  listSubscriptionsWithCategory,
  listTransactionsWithCategory,
} from "@/lib/queries";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

function ordinalDay(d: number): string {
  if (d >= 11 && d <= 13) return `${d}th`;
  switch (d % 10) {
    case 1:
      return `${d}st`;
    case 2:
      return `${d}nd`;
    case 3:
      return `${d}rd`;
    default:
      return `${d}th`;
  }
}

function subscriptionScheduleSummary(sub: {
  scheduleType: string;
  billingDay: number;
  untilYear: number | null;
  untilMonth: number | null;
}): string {
  const dayPart = `Monthly on the ${ordinalDay(sub.billingDay)}`;
  if (sub.scheduleType !== "until") return `${dayPart} · Ongoing`;
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const mo = months[(sub.untilMonth ?? 1) - 1];
  return `${dayPart} · Until ${mo} ${sub.untilYear ?? ""}`;
}

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

  await materializeSubscriptionCharges(userId);

  const [agg, txs, breakdown, cats, payMethods, subs] = await Promise.all([
    getTransactionAggregates(userId, preset, custom, monthRef),
    listTransactionsWithCategory(userId, preset, custom, monthRef),
    getExpenseBreakdown(userId, preset, custom, monthRef),
    listCategories(userId),
    listPaymentMethods(userId),
    listSubscriptionsWithCategory(userId),
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

  const subscriptionRows = subs.map((s) => {
    const next = nextDueOnOrAfterUtc(
      new Date(),
      s.billingDay,
      s.createdAt,
      s.scheduleType,
      s.untilYear,
      s.untilMonth,
    );
    const nextDueLabel = next
      ? new Intl.DateTimeFormat("en-IN", {
          dateStyle: "medium",
          timeZone: "UTC",
        }).format(next)
      : "Ended";

    return {
      id: s.id,
      serviceName: s.serviceName,
      amount: s.amount,
      scheduleSummary: subscriptionScheduleSummary(s),
      nextDueLabel,
      categoryName: s.categoryName,
      categoryIcon: s.categoryIcon,
      categoryColor: s.categoryColor,
      categoryId: s.categoryId,
      paymentMethod: s.paymentMethod,
      note: s.note,
      scheduleType: s.scheduleType as "recurring" | "until",
      billingDay: s.billingDay,
      untilYear: s.untilYear,
      untilMonth: s.untilMonth,
    };
  });

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
            subscriptions={subscriptionRows}
          />
        </div>
      </div>
    </div>
  );
}
