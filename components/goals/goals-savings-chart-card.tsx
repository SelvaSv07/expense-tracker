import { SavingsLineChart } from "@/components/charts/savings-line-chart";
import { MoreHorizontal } from "lucide-react";

export function GoalsSavingsChartCard({
  series,
}: {
  series: { date: string; cumulative: number }[];
}) {
  return (
    <div
      className="flex flex-col gap-3 rounded-xl border p-3"
      style={{
        background: "var(--cazura-panel)",
        borderColor: "var(--cazura-border)",
      }}
    >
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p
            className="text-[15px] font-bold"
            style={{ color: "var(--cazura-text)" }}
          >
            Savings growth
          </p>
          <p className="mt-0.5 text-xs font-medium" style={{ color: "var(--cazura-muted)" }}>
            Cumulative contributions over time
          </p>
        </div>
        <button
          type="button"
          className="flex shrink-0 items-center justify-center rounded-lg border p-1.5"
          style={{ borderColor: "var(--cazura-border)" }}
          aria-label="More"
        >
          <MoreHorizontal
            className="size-3.5"
            strokeWidth={2}
            color="var(--cazura-label)"
          />
        </button>
      </div>
      {series.length > 0 ? (
        <SavingsLineChart data={series} />
      ) : (
        <p className="py-8 text-center text-sm" style={{ color: "var(--cazura-muted)" }}>
          Contributions will appear here once you add them.
        </p>
      )}
    </div>
  );
}
