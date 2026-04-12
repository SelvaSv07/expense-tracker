import { BudgetBarChart } from "@/components/charts/budget-bar-chart";
import { BudgetRadarChart } from "@/components/charts/budget-radar-chart";
import { SetBudgetForm } from "@/components/budget/set-budget-form";
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
import { formatInr } from "@/lib/money";
import {
  getBudgetBreakdownForMonth,
  getBudgetPercentByMonth,
  getBudgetUsageForRange,
  getBudgetVsSpentByMonth,
  getTransactionAggregates,
  listCategories,
} from "@/lib/queries";
import { getRangeFromPreset } from "@/lib/time-range";
import { resolveWalletId } from "@/lib/wallet-server";
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

  const walletId = await resolveWalletId(session.user.id);
  const cats = await listCategories(session.user.id);
  const expenseCats = cats.filter((c) => c.type === "expense");

  const range = getRangeFromPreset("month", viewMonth);
  const agg = await getTransactionAggregates(walletId, "month", {
    from: range.start,
    to: range.end,
  });
  const usage = await getBudgetUsageForRange(walletId, "month", {
    from: range.start,
    to: range.end,
  });

  const bar = await getBudgetVsSpentByMonth(walletId, year);
  const radar = await getBudgetPercentByMonth(walletId, year);
  const table = await getBudgetBreakdownForMonth(walletId, viewMonth);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Budget</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Plan monthly limits and track spending.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Set budget</CardTitle>
          <CardDescription>
            Per category, per month (expense categories only).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SetBudgetForm
            walletId={walletId}
            expenseCategories={expenseCats}
            defaultMonth={viewMonth}
          />
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
        <CardHeader>
          <CardTitle>Budget spending breakdown</CardTitle>
          <CardDescription>
            {viewMonth.toLocaleString("en-US", { month: "long", year: "numeric" })}
          </CardDescription>
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {table.map((row) => (
                <TableRow key={row.categoryId}>
                  <TableCell className="font-medium">{row.categoryName}</TableCell>
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
                </TableRow>
              ))}
              {table.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-muted-foreground py-8 text-center"
                  >
                    No budgets for this month. Add one above.
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
