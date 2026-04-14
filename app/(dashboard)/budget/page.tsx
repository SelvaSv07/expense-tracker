import { BudgetLastSixCard } from "@/components/budget/budget-last-six-card";
import { BudgetPageHeader } from "@/components/budget/budget-page-header";
import { BudgetSideStatCards } from "@/components/budget/budget-side-stat-cards";
import { BudgetSpendingBreakdown } from "@/components/budget/budget-spending-breakdown";
import { BudgetSpendingFlow } from "@/components/budget/budget-spending-flow";
import {
  BudgetTotalCard,
  segmentsFromBreakdown,
} from "@/components/budget/budget-total-card";
import {
  getBudgetBreakdownForMonth,
  getBudgetPercentLastNMonths,
  getBudgetUsageForRange,
  getBudgetVsSpentByMonth,
  getTransactionAggregates,
  listCategories,
} from "@/lib/queries";
import {
  parseTimeFromSearchParams,
  timeQueryString,
} from "@/lib/search-params-time";
import {
  getRangeFromPreset,
  getWeeklyChartMonthContext,
} from "@/lib/time-range";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

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
  const now = new Date();
  const range = getRangeFromPreset(preset, now, custom, monthRef);
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

  const [usage, agg, bar, radarSix, table] = await Promise.all([
    getBudgetUsageForRange(userId, preset, custom, monthRef),
    getTransactionAggregates(userId, preset, custom, monthRef),
    getBudgetVsSpentByMonth(userId, chartYear),
    getBudgetPercentLastNMonths(userId, viewMonthDate, 6),
    getBudgetBreakdownForMonth(userId, viewMonthDate),
  ]);

  const prevNav = new Date(
    viewMonth.year,
    viewMonth.monthIndex - 1,
    1,
  );
  const nextNav = new Date(
    viewMonth.year,
    viewMonth.monthIndex + 1,
    1,
  );
  const mk = (d: Date) => monthKeyFromRef(d.getFullYear(), d.getMonth());
  const prevHref = `/budget?${timeQueryString("month", undefined, { monthKey: mk(prevNav) })}`;
  const nextHref = `/budget?${timeQueryString("month", undefined, { monthKey: mk(nextNav) })}`;

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

      <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
        <div className="min-w-0 flex-1">
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
        <BudgetSideStatCards
          income={agg.income}
          prevIncome={agg.prevIncome}
          expense={agg.expense}
          prevExpense={agg.prevExpense}
        />
      </div>

      <BudgetSpendingFlow
        barData={bar}
        highlightMonthIndex={highlightMonthIndex}
        chartYear={chartYear}
      />

      <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
        <div className="w-full shrink-0 xl:w-[372px]">
          <BudgetLastSixCard data={radarSix} />
        </div>
        <div className="min-w-0 flex-1">
          <BudgetSpendingBreakdown
            rows={table}
            viewMonthLabel={viewMonthDate.toLocaleString("en-US", {
              month: "long",
              year: "numeric",
            })}
            prevHref={prevHref}
            nextHref={nextHref}
          />
        </div>
      </div>
    </div>
  );
}
