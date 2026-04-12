import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { IncomeExpenseChart } from "@/components/charts/income-expense-chart";
import { CustomRangePicker } from "@/components/dashboard/custom-range-picker";
import { MetricCard } from "@/components/dashboard/metric-card";
import { TimeframeToolbar } from "@/components/dashboard/timeframe-toolbar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatInr } from "@/lib/money";
import { parseTimeFromSearchParams } from "@/lib/search-params-time";
import {
  getBalance,
  getBudgetUsageForRange,
  getCashFlowByMonth,
  getTodaySpend,
  getTransactionAggregates,
  listGoals,
  listTransactionsWithCategory,
  listWallets,
} from "@/lib/queries";
import { cn } from "@/lib/utils";
import { resolveWalletId } from "@/lib/wallet-server";
import { getSession } from "@/lib/session";
import { Plus, Send } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getSession();
  if (!session?.user) redirect("/sign-in");

  const sp = await searchParams;
  const { preset, custom } = parseTimeFromSearchParams(sp);
  const userId = session.user.id;
  const walletId = await resolveWalletId(userId);
  const [wallets] = await Promise.all([
    listWallets(userId),
  ]);
  const wallet = wallets.find((w) => w.id === walletId);
  if (!wallet) redirect("/sign-in");

  const [
    agg,
    balance,
    cash,
    recent,
    budgetUse,
    goals,
    todaySpend,
  ] = await Promise.all([
    getTransactionAggregates(walletId, preset, custom),
    getBalance(walletId, wallet.openingBalance),
    getCashFlowByMonth(walletId, new Date().getFullYear(), "month"),
    listTransactionsWithCategory(walletId, preset, custom),
    getBudgetUsageForRange(walletId, preset, custom),
    listGoals(userId),
    getTodaySpend(walletId),
  ]);

  const primaryGoal = goals[0];
  const deltaIncome = agg.income - agg.prevIncome;
  const deltaExpense = agg.expense - agg.prevExpense;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Overview</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Quick summary of your finances.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <TimeframeToolbar preset={preset} basePath="/overview" />
          <CustomRangePicker basePath="/overview" />
          <Link
            href="/transactions"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Export
          </Link>
          <Link
            href="/transactions"
            className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
          >
            <Plus className="mr-1 size-4" />
            Add transaction
          </Link>
        </div>
      </div>

      <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-emerald-50/80 to-background">
        <CardContent className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-muted-foreground text-sm">Total balance</p>
            <p className="text-4xl font-semibold tracking-tight">
              {formatInr(balance)}
            </p>
            <p className="text-muted-foreground mt-2 text-sm">
              Today&apos;s spend: {formatInr(todaySpend)}
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/transactions"
              className={cn(
                buttonVariants({
                  variant: "secondary",
                  size: "icon",
                  className: "rounded-full",
                }),
              )}
            >
              <Plus className="size-4" />
            </Link>
            <Button size="icon" variant="secondary" className="rounded-full" type="button">
              <Send className="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <MetricCard
          title="Incomes"
          value={agg.income}
          deltaLabel="vs previous period"
          delta={deltaIncome}
          trend={deltaIncome >= 0 ? "up" : "down"}
        />
        <MetricCard
          title="Expenses"
          value={agg.expense}
          deltaLabel="vs previous period"
          delta={deltaExpense}
          trend={deltaExpense <= 0 ? "down" : "up"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Cash flow</CardTitle>
            <CardDescription>Income vs expenses by month ({new Date().getFullYear()})</CardDescription>
          </CardHeader>
          <CardContent>
            <IncomeExpenseChart data={cash} />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Saving goal</CardTitle>
              <CardDescription>
                {primaryGoal ? primaryGoal.name : "No goals yet"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {primaryGoal ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Saved</span>
                    <span className="font-medium">
                      {formatInr(primaryGoal.savedAmount)} /{" "}
                      {formatInr(primaryGoal.targetAmount)}
                    </span>
                  </div>
                  <div className="bg-muted h-2 overflow-hidden rounded-full">
                    <div
                      className="bg-primary h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(
                          100,
                          (primaryGoal.savedAmount /
                            primaryGoal.targetAmount) *
                            100,
                        )}%`,
                      }}
                    />
                  </div>
                  <Link
                    href="/goals"
                    className={cn(
                      buttonVariants({ variant: "link", className: "h-auto px-0" }),
                    )}
                  >
                    View all goals
                  </Link>
                </div>
              ) : (
                <Link
                  href="/goals"
                  className={cn(buttonVariants({ size: "sm" }))}
                >
                  Create a goal
                </Link>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Budget tracking</CardTitle>
              <CardDescription>Used vs budgeted (selected period)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Budgeted</span>
                  <span>{formatInr(budgetUse.budgeted)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Spent</span>
                  <span>{formatInr(budgetUse.spent)}</span>
                </div>
                <div className="bg-muted mt-2 h-2 overflow-hidden rounded-full">
                  <div
                    className="bg-primary h-full rounded-full"
                    style={{
                      width: `${budgetUse.budgeted > 0 ? Math.min(100, (budgetUse.spent / budgetUse.budgeted) * 100) : 0}%`,
                    }}
                  />
                </div>
                <Link
                  href="/budget"
                  className={cn(
                    buttonVariants({ variant: "link", className: "h-auto px-0" }),
                  )}
                >
                  Manage budgets
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent transactions</CardTitle>
            <CardDescription>Latest activity in this period</CardDescription>
          </div>
          <Link
            href="/transactions"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            View all
          </Link>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recent.slice(0, 8).map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="font-medium">
                    {tx.categoryName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {tx.occurredAt.toLocaleDateString()}
                  </TableCell>
                  <TableCell
                    className={
                      tx.categoryType === "income"
                        ? "text-right text-emerald-600"
                        : "text-right text-red-600"
                    }
                  >
                    {tx.categoryType === "income" ? "+" : "-"}
                    {formatInr(tx.amount)}
                  </TableCell>
                </TableRow>
              ))}
              {recent.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-muted-foreground">
                    No transactions in this range.
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
