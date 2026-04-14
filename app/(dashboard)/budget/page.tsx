import { BudgetLastSixCard } from "@/components/budget/budget-last-six-card";
import { BudgetPageHeader } from "@/components/budget/budget-page-header";
import {
  BudgetExpenseCard,
  BudgetIncomeCard,
} from "@/components/budget/budget-side-stat-cards";
import { BudgetSpendingBreakdown } from "@/components/budget/budget-spending-breakdown";
import { BudgetSpendingFlow } from "@/components/budget/budget-spending-flow";
import { BudgetTotalCard } from "@/components/budget/budget-total-card";
import { segmentsFromBreakdown } from "@/lib/budget-segments";
import {
  getBudgetBreakdownForMonth,
  getBudgetBreakdownForRange,
  getBudgetPercentLastNMonths,
  getBudgetUsageForRange,
  getBudgetVsSpentByMonth,
  getBudgetVsSpentForYearRange,
  getTransactionAggregates,
  listCategories,
} from "@/lib/queries";
import {
  parseRadarWindowMonths,
  parseTimeFromSearchParams,
  timeQueryString,
} from "@/lib/search-params-time";
import {
  getPreviousRange,
  getRangeFromPreset,
  getWeeklyChartMonthContext,
  type TimePreset,
} from "@/lib/time-range";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

function budgetComparisonSuffix(preset: TimePreset): string {
  switch (preset) {
    case "year":
      return "from previous year";
    case "month":
      return "from previous month";
    case "today":
      return "from previous day";
    default:
      return "from previous period";
  }
}

function monthKeyFromRef(year: number, monthIndex: number) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
}

export default async function BudgetPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getSession();
  if (!session?.user) redirect("/sign-in");

  const spRaw = await searchParams;

  const yearStr = typeof spRaw.year === "string" ? spRaw.year : undefined;
  const monthNumStr =
    typeof spRaw.month === "string" ? spRaw.month : undefined;
  if (yearStr && monthNumStr) {
    const y = Number.parseInt(yearStr, 10);
    const mo = Number.parseInt(monthNumStr, 10);
    if (
      !Number.isNaN(y) &&
      !Number.isNaN(mo) &&
      mo >= 1 &&
      mo <= 12
    ) {
      const mKey = `${y}-${String(mo).padStart(2, "0")}`;
      redirect(`/budget?${timeQueryString("month", undefined, { monthKey: mKey })}`);
    }
  }

  const { preset, custom, monthRef, monthKey } =
    parseTimeFromSearchParams(spRaw);
  const radarMonths = parseRadarWindowMonths(spRaw);
  const now = new Date();
  const range = getRangeFromPreset(preset, now, custom, monthRef);
  const prevRange = getPreviousRange(preset, now, custom, monthRef);
  const viewMonth = getWeeklyChartMonthContext(
    preset,
    range,
    monthRef,
    now,
  );
  const viewMonthDate = new Date(
    viewMonth.year,
    viewMonth.monthIndex,
    1,
  );
  const chartYear = viewMonth.year;
  const highlightMonthIndex = viewMonth.monthIndex;

  const userId = session.user.id;
  const cats = await listCategories(userId);
  const expenseCats = cats.filter((c) => c.type === "expense");

  const [usage, agg, bar, barYearly, radarSix, table] = await Promise.all([
    getBudgetUsageForRange(userId, preset, custom, monthRef, { range }),
    getTransactionAggregates(userId, preset, custom, monthRef, {
      range,
      prev: prevRange,
    }),
    getBudgetVsSpentByMonth(userId, chartYear),
    getBudgetVsSpentForYearRange(userId, chartYear, 10),
    getBudgetPercentLastNMonths(userId, viewMonthDate, radarMonths),
    preset === "year"
      ? getBudgetBreakdownForRange(userId, range)
      : getBudgetBreakdownForMonth(userId, viewMonthDate),
  ]);

  const expenseCategoriesForBudget = expenseCats.map((c) => ({
    id: c.id,
    name: c.name,
    icon: c.icon,
    color: c.color,
  }));

  const segments = segmentsFromBreakdown(
    table.map((r) => ({
      spent: r.spent,
      categoryColor: r.categoryColor,
      categoryName: r.categoryName,
      categoryIcon: r.categoryIcon,
    })),
  );

  return (
    <div className="flex flex-col gap-4 pb-2">
      <BudgetPageHeader
        preset={preset}
        monthKey={monthKey}
        custom={custom}
        expenseCategories={expenseCategoriesForBudget}
        defaultMonth={viewMonthDate}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[3fr_1fr_1fr] lg:items-stretch">
        <div className="flex h-full min-h-0 min-w-0 flex-col">
          <BudgetTotalCard
            spent={usage.spent}
            budgeted={usage.budgeted}
            preset={preset}
            monthKey={
              monthKey ??
              monthKeyFromRef(viewMonth.year, viewMonth.monthIndex)
            }
            segments={segments}
          />
        </div>
        <BudgetIncomeCard
          income={agg.income}
          prevIncome={agg.prevIncome}
          comparisonSuffix={budgetComparisonSuffix(preset)}
        />
        <BudgetExpenseCard
          expense={agg.expense}
          prevExpense={agg.prevExpense}
          comparisonSuffix={budgetComparisonSuffix(preset)}
        />
      </div>

      <BudgetSpendingFlow
        barData={bar}
        yearlyBarData={barYearly}
        highlightMonthIndex={highlightMonthIndex}
        chartYear={chartYear}
      />

      <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
        <div className="w-full shrink-0 xl:w-[372px]">
          <BudgetLastSixCard
            data={radarSix}
            monthCount={radarMonths}
            anchorMonthKey={
              monthKey ?? monthKeyFromRef(viewMonth.year, viewMonth.monthIndex)
            }
          />
        </div>
        <div className="min-w-0 flex-1">
          <BudgetSpendingBreakdown
            rows={table}
            viewMonthLabel={
              preset === "year"
                ? `Year ${viewMonth.year}`
                : viewMonthDate.toLocaleString("en-US", {
                    month: "long",
                    year: "numeric",
                  })
            }
            monthNav={
              preset === "year"
                ? undefined
                : {
                    monthKey:
                      monthKey ??
                      monthKeyFromRef(viewMonth.year, viewMonth.monthIndex),
                    radarMonths,
                  }
            }
          />
        </div>
      </div>
    </div>
  );
}
