import { GoalProgressCard } from "@/components/goals/goal-progress-card";
import { GoalsHistorySidebar } from "@/components/goals/goals-contribution-sidebar";
import { GoalsPageHeader } from "@/components/goals/goals-page-header";
import { GoalsSavingsChartCard } from "@/components/goals/goals-savings-chart-card";
import { GoalsStatMiniCards } from "@/components/goals/goals-stat-mini-cards";
import { db } from "@/db";
import { goalContributions, goals } from "@/db/schema";
import {
  getGoalContributionSeries,
  getGoalMetrics,
  listGoals,
} from "@/lib/queries";
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

  const goalOptions = goalList.map((g) => ({ id: g.id, name: g.name }));

  return (
    <div className="flex flex-col gap-4 pb-2">
      <GoalsPageHeader />

      <GoalsStatMiniCards
        totalSaved={metrics.totalSaved}
        active={metrics.active}
        avgMonthly={metrics.avgMonthly}
      />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          {goalList.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center gap-2 rounded-xl border px-6 py-14 text-center"
              style={{
                background: "var(--cazura-panel)",
                borderColor: "var(--cazura-border)",
              }}
            >
              <p
                className="text-[15px] font-bold"
                style={{ color: "var(--cazura-text)" }}
              >
                No goals yet
              </p>
              <p className="max-w-sm text-sm" style={{ color: "var(--cazura-muted)" }}>
                Create a goal with &quot;New Goal&quot; to start tracking savings and
                contributions.
              </p>
            </div>
          ) : (
            <div
              className="overflow-hidden rounded-xl border p-2 sm:p-3"
              style={{
                background: "var(--cazura-panel)",
                borderColor: "var(--cazura-border)",
              }}
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                {goalList.map((g) => (
                  <GoalProgressCard
                    key={g.id}
                    id={g.id}
                    goals={goalOptions}
                    name={g.name}
                    savedAmount={g.savedAmount}
                    targetAmount={g.targetAmount}
                    targetDate={g.targetDate}
                  />
                ))}
              </div>
            </div>
          )}

          <GoalsSavingsChartCard series={series} />
        </div>

        <div className="flex w-full shrink-0 flex-col gap-4 lg:w-[340px]">
          <GoalsHistorySidebar history={history} />
        </div>
      </div>
    </div>
  );
}
