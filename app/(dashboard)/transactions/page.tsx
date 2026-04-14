import { ExpensePieChart } from "@/components/charts/expense-pie-chart";
import { AddTransactionDialog } from "@/components/transactions/add-transaction-dialog";
import { ExportMenu } from "@/components/transactions/export-menu";
import { TransactionCategoryLabel } from "@/components/transactions/transaction-category-label";
import { TransactionRowActions } from "@/components/transactions/transaction-row-actions";
import { CustomRangePicker } from "@/components/dashboard/custom-range-picker";
import { MetricCard } from "@/components/dashboard/metric-card";
import { TimeframeToolbar } from "@/components/dashboard/timeframe-toolbar";
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
import { parseTimeFromSearchParams } from "@/lib/search-params-time";
import {
  getExpenseBreakdown,
  getTransactionAggregates,
  listCategories,
  listTransactionsWithCategory,
} from "@/lib/queries";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

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

  const [agg, txs, breakdown, cats] = await Promise.all([
    getTransactionAggregates(userId, preset, custom, monthRef),
    listTransactionsWithCategory(userId, preset, custom, monthRef),
    getExpenseBreakdown(userId, preset, custom, monthRef),
    listCategories(userId),
  ]);

  const deltaIncome = agg.income - agg.prevIncome;
  const deltaExpense = agg.expense - agg.prevExpense;

  const pieData = breakdown.map((b) => ({ name: b.name, value: b.value }));

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Full history and expense breakdown.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <TimeframeToolbar
            preset={preset}
            basePath="/transactions"
            monthKey={monthKey}
          />
          <CustomRangePicker basePath="/transactions" />
          <ExportMenu preset={preset} custom={custom} monthKey={monthKey} />
          <AddTransactionDialog categories={cats} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="Total volume"
          value={agg.totalVolume}
          deltaLabel="vs previous"
          delta={agg.totalVolume - agg.prevTotalVolume}
          trend={
            agg.totalVolume >= agg.prevTotalVolume ? "up" : "down"
          }
        />
        <MetricCard
          title="Incomes"
          value={agg.income}
          deltaLabel="vs previous"
          delta={deltaIncome}
          trend={deltaIncome >= 0 ? "up" : "down"}
        />
        <MetricCard
          title="Expenses"
          value={agg.expense}
          deltaLabel="vs previous"
          delta={deltaExpense}
          trend={deltaExpense <= 0 ? "down" : "up"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="min-w-0 lg:col-span-2">
          <CardHeader>
            <CardTitle>Transaction activity</CardTitle>
            <CardDescription>All entries in the selected range</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead className="w-[52px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {txs.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>
                      <TransactionCategoryLabel
                        name={tx.categoryName}
                        icon={tx.categoryIcon}
                        note={tx.note}
                      />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {tx.occurredAt.toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {tx.occurredAt.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell
                      className={
                        tx.categoryType === "income"
                          ? "text-right font-medium text-emerald-600"
                          : "text-right font-medium text-red-600"
                      }
                    >
                      {tx.categoryType === "income" ? "+" : "-"}
                      {formatInr(tx.amount)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {tx.paymentMethod ?? "—"}
                    </TableCell>
                    <TableCell>
                      <TransactionRowActions id={tx.id} />
                    </TableCell>
                  </TableRow>
                ))}
                {txs.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-muted-foreground py-8 text-center"
                    >
                      No transactions yet. Add one to get started.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Expense breakdown</CardTitle>
            <CardDescription>By category</CardDescription>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ExpensePieChart data={pieData} />
            ) : (
              <p className="text-muted-foreground text-sm">
                No expense data in this range.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
