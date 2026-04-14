import { BudgetBarChart } from "@/components/charts/budget-bar-chart";
import { BudgetRadarChart } from "@/components/charts/budget-radar-chart";
import { AddBudgetDialog } from "@/components/budget/add-budget-dialog";
import { DeleteBudgetButton } from "@/components/budget/delete-budget-button";
import { TransactionCategoryLabel } from "@/components/transactions/transaction-category-label";
import { MetricCard } from "@/components/dashboard/metric-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { buttonVariants } from "@/components/ui/button";
import { formatInr } from "@/lib/money";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import {
  getBudgetBreakdownForMonth,
  getBudgetPercentByMonth,
  getBudgetUsageForRange,
  getBudgetVsSpentByMonth,
  getTransactionAggregates,
  listCategories,
} from "@/lib/queries";
import { getRangeFromPreset } from "@/lib/time-range";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function BudgetPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getSession();
  if (!session?.user) redirect("/sign-in");

  const sp = await searchParams;
  const yearStr = typeof sp.year === "string" ? sp.year : undefined;
  const year = yearStr ? Number.parseInt(yearStr, 10) : new Date().getFullYear();
  const monthStr = typeof sp.month === "string" ? sp.month : undefined;
  const monthIdx = monthStr
    ? Number.parseInt(monthStr, 10) - 1
    : new Date().getMonth();
  const viewMonth = new Date(year, monthIdx, 1);

  const userId = session.user.id;
  const cats = await listCategories(userId);
  const expenseCats = cats.filter((c) => c.type === "expense");

  const range = getRangeFromPreset("month", viewMonth);
  const agg = await getTransactionAggregates(userId, "month", {
    from: range.start,
    to: range.end,
  });
  const usage = await getBudgetUsageForRange(userId, "month", {
    from: range.start,
    to: range.end,
  });

  const bar = await getBudgetVsSpentByMonth(userId, year);
  const radar = await getBudgetPercentByMonth(userId, year);
  const table = await getBudgetBreakdownForMonth(userId, viewMonth);

  const prevNav = new Date(year, monthIdx - 1, 1);
  const nextNav = new Date(year, monthIdx + 1, 1);
  const monthHref = (d: Date) =>
    `/budget?year=${d.getFullYear()}&month=${d.getMonth() + 1}`;

  const expenseCategoriesForBudget = expenseCats.map((c) => ({
    id: c.id,
    name: c.name,
    icon: c.icon,
    color: c.color,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Budget</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Create monthly limits per expense category. Spend is compared only
          within that calendar month; each new month starts with its own
          budgets.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle>Monthly budgets</CardTitle>
            <CardDescription>
              Add as many category budgets as you need for any month. Each
              category can have one limit per month.
            </CardDescription>
          </div>
          <AddBudgetDialog
            expenseCategories={expenseCategoriesForBudget}
            defaultMonth={viewMonth}
          />
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          Spending in the breakdown below counts only transactions dated in that
          month. Budget caps do not roll forward—set them again when the month
          changes if you want the same limits.
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="Budget used"
          value={usage.spent}
          sublabel={`of ${formatInr(usage.budgeted)} budgeted`}
        />
        <MetricCard title="Incomes" value={agg.income} />
        <MetricCard title="Expenses" value={agg.expense} />
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle>Budget vs spent</CardTitle>
            <CardDescription>Monthly totals for {year}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <BudgetBarChart data={bar} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Budget usage %</CardTitle>
          <CardDescription>
            Percent of monthly budget consumed (spider chart)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BudgetRadarChart data={radar} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Budget spending breakdown</CardTitle>
            <CardDescription>
              {viewMonth.toLocaleString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </CardDescription>
          </div>
          <div className="flex items-center gap-1">
            <Link
              href={monthHref(prevNav)}
              className={cn(buttonVariants({ variant: "outline", size: "icon-sm" }))}
              aria-label="Previous month"
            >
              <ChevronLeft className="size-4" />
            </Link>
            <Link
              href={monthHref(nextNav)}
              className={cn(buttonVariants({ variant: "outline", size: "icon-sm" }))}
              aria-label="Next month"
            >
              <ChevronRight className="size-4" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Budgeted</TableHead>
                <TableHead className="text-right">Spent</TableHead>
                <TableHead className="w-[200px]">Progress</TableHead>
                <TableHead className="text-right">Used</TableHead>
                <TableHead className="w-[52px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {table.map((row) => (
                <TableRow key={row.budgetId}>
                  <TableCell>
                    <TransactionCategoryLabel
                      name={row.categoryName}
                      icon={row.categoryIcon}
                      color={row.categoryColor}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    {formatInr(row.budgeted)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatInr(row.spent)}
                  </TableCell>
                  <TableCell>
                    <div className="bg-muted h-2 overflow-hidden rounded-full">
                      <div
                        className="bg-primary h-full rounded-full"
                        style={{
                          width: `${row.budgeted > 0 ? Math.min(100, (row.spent / row.budgeted) * 100) : 0}%`,
                        }}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{row.pct}%</TableCell>
                  <TableCell>
                    <DeleteBudgetButton budgetId={row.budgetId} />
                  </TableCell>
                </TableRow>
              ))}
              {table.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-muted-foreground py-8 text-center"
                  >
                    No budgets for this month. Use Add budget to create one.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
