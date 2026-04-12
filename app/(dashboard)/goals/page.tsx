import { SavingsLineChart } from "@/components/charts/savings-line-chart";
import { AddGoalDialog } from "@/components/goals/add-goal-dialog";
import { ContributionForm } from "@/components/goals/contribution-form";
import { MetricCard } from "@/components/dashboard/metric-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatInr } from "@/lib/money";
import {
  getGoalContributionSeries,
  getGoalMetrics,
  listGoals,
} from "@/lib/queries";
import { db } from "@/db";
import { goalContributions, goals } from "@/db/schema";
import { getSession } from "@/lib/session";
import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export default async function GoalsPage() {
  const session = await getSession();
  if (!session?.user) redirect("/sign-in");

  const userId = session.user.id;
  const [goalList, metrics, series] = await Promise.all([
    listGoals(userId),
    getGoalMetrics(userId),
    getGoalContributionSeries(userId),
  ]);

  const history = await db
    .select({
      id: goalContributions.id,
      amount: goalContributions.amount,
      occurredAt: goalContributions.occurredAt,
      goalName: goals.name,
    })
    .from(goalContributions)
    .innerJoin(goals, eq(goalContributions.goalId, goals.id))
    .where(eq(goals.userId, userId))
    .orderBy(desc(goalContributions.occurredAt))
    .limit(20);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Goals</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Save toward what matters.
          </p>
        </div>
        <AddGoalDialog />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard title="Total saved" value={metrics.totalSaved} />
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Active goals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{metrics.active}</p>
          </CardContent>
        </Card>
        <MetricCard
          title="Avg monthly contribution"
          value={metrics.avgMonthly}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add contribution</CardTitle>
          <CardDescription>Record money moved into a goal</CardDescription>
        </CardHeader>
        <CardContent>
          <ContributionForm goals={goalList.map((g) => ({ id: g.id, name: g.name }))} />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {goalList.map((g) => {
          const pct =
            g.targetAmount > 0
              ? Math.min(
                  100,
                  Math.round((g.savedAmount / g.targetAmount) * 100),
                )
              : 0;
          const remaining = Math.max(0, g.targetAmount - g.savedAmount);
          return (
            <Card key={g.id}>
              <CardHeader>
                <CardTitle className="text-lg">{g.name}</CardTitle>
                <CardDescription>
                  {g.targetDate
                    ? `Target ${g.targetDate.toLocaleDateString()}`
                    : "No target date"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{pct}%</span>
                </div>
                <Progress value={pct} className="h-2" />
                <div className="flex justify-between text-sm">
                  <span>Saved</span>
                  <span>{formatInr(g.savedAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Target</span>
                  <span>{formatInr(g.targetAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Remaining</span>
                  <span>{formatInr(remaining)}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {goalList.length === 0 ? (
          <Card className="lg:col-span-2">
            <CardContent className="text-muted-foreground py-12 text-center">
              No goals yet. Create one to start tracking savings.
            </CardContent>
          </Card>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Savings growth</CardTitle>
          <CardDescription>Cumulative contributions over time</CardDescription>
        </CardHeader>
        <CardContent>
          {series.length > 0 ? (
            <SavingsLineChart data={series} />
          ) : (
            <p className="text-muted-foreground text-sm">
              Contributions will appear here.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contribution history</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {history.map((h) => (
              <li
                key={h.id}
                className="flex justify-between border-b py-2 last:border-0"
              >
                <span>
                  {h.goalName}{" "}
                  <span className="text-muted-foreground">
                    · {h.occurredAt.toLocaleString()}
                  </span>
                </span>
                <span className="font-medium text-emerald-600">
                  +{formatInr(h.amount)}
                </span>
              </li>
            ))}
            {history.length === 0 ? (
              <li className="text-muted-foreground">No contributions yet.</li>
            ) : null}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
