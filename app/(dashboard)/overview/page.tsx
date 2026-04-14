import { OverviewBalanceBanner } from "@/components/overview/overview-balance-banner";
import { OverviewCashFlow } from "@/components/overview/overview-cash-flow";
import { OverviewIncomeExpenseCards } from "@/components/overview/overview-income-expense-cards";
import { OverviewMyCards } from "@/components/overview/overview-my-cards";
import { OverviewPageHeader } from "@/components/overview/overview-page-header";
import { OverviewRecentTransactions } from "@/components/overview/overview-recent-transactions";
import { OverviewSavingGoals } from "@/components/overview/overview-saving-goals";
import { parseCashFlowChartParams } from "@/lib/cash-flow-chart-params";
import { parseTimeFromSearchParams } from "@/lib/search-params-time";
import {
  getBalance,
  getBudgetUsageForRange,
  getCashFlowSeries,
  getTodaySpend,
  getTransactionAggregates,
  listGoals,
  listTransactionsWithCategory,
} from "@/lib/queries";
import {
  getRangeFromPreset,
  getWeeklyChartMonthContext,
} from "@/lib/time-range";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getSession();
  if (!session?.user) redirect("/sign-in");

  const sp = await searchParams;
  const { preset, custom, monthRef, monthKey } =
    parseTimeFromSearchParams(sp);
  const { cfYear, cfGranularity } = parseCashFlowChartParams(sp);
  const now = new Date();
  const range = getRangeFromPreset(preset, now, custom, monthRef);
  const weekFocus = getWeeklyChartMonthContext(
    preset,
    range,
    monthRef,
    now,
  );
  const userId = session.user.id;

  const [
    agg,
    balance,
    cash,
    recent,
    budgetUse,
    goals,
    todaySpend,
  ] = await Promise.all([
    getTransactionAggregates(userId, preset, custom, monthRef),
    getBalance(userId),
    getCashFlowSeries(
      userId,
      cfGranularity === "week" ? weekFocus.year : cfYear,
      cfGranularity,
      cfGranularity === "week"
        ? { weekMonthIndex: weekFocus.monthIndex }
        : undefined,
    ),
    listTransactionsWithCategory(userId, preset, custom, monthRef),
    getBudgetUsageForRange(userId, preset, custom, monthRef),
    listGoals(userId),
    getTodaySpend(userId),
  ]);

  const primaryGoal = goals[0];
  const deltaIncome = agg.income - agg.prevIncome;
  const deltaExpense = agg.expense - agg.prevExpense;
  const incomeSeries = cash.map((c) => c.income);
  const expenseSeries = cash.map((c) => c.expense);

  return (
    <div className="flex flex-col gap-4">
      <OverviewPageHeader
        preset={preset}
        basePath="/overview"
        monthKey={monthKey}
      />

      <OverviewBalanceBanner balance={balance} todaySpend={todaySpend} />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <OverviewIncomeExpenseCards
            income={agg.income}
            expense={agg.expense}
            deltaIncome={deltaIncome}
            deltaExpense={deltaExpense}
            prevIncome={agg.prevIncome}
            prevExpense={agg.prevExpense}
            incomeSeries={incomeSeries}
            expenseSeries={expenseSeries}
          />

          <OverviewCashFlow
            data={cash}
            year={cfYear}
            granularity={cfGranularity}
            weekFocus={weekFocus}
          />

          <OverviewRecentTransactions rows={recent} />
        </div>

        <div className="flex w-full shrink-0 flex-col gap-4 lg:w-[340px]">
          <OverviewMyCards
            budgeted={budgetUse.budgeted}
            spent={budgetUse.spent}
          />
          <OverviewSavingGoals
            goal={
              primaryGoal
                ? {
                    name: primaryGoal.name,
                    savedAmount: primaryGoal.savedAmount,
                    targetAmount: primaryGoal.targetAmount,
                    targetDate: primaryGoal.targetDate,
                  }
                : null
            }
          />
        </div>
      </div>
    </div>
  );
}
