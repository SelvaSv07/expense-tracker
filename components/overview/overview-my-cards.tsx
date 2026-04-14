import { formatInr } from "@/lib/money";

export function OverviewMyCards({
  budgeted,
  spent,
}: {
  budgeted: number;
  spent: number;
}) {
  const pct =
    budgeted > 0 ? Math.min(100, Math.round((spent / budgeted) * 100)) : 0;

  return (
    <div
      id="budget-summary"
      className="flex flex-col gap-3 rounded-xl border p-3 scroll-mt-24"
      style={{
        background: "var(--cazura-panel)",
        borderColor: "var(--cazura-border)",
      }}
    >
      <div className="flex items-center gap-2">
        <span
          className="flex-1 text-[15px] font-bold"
          style={{ color: "var(--cazura-text)" }}
        >
          Budget vs spend
        </span>
      </div>

      <p
        className="text-[13px] leading-snug"
        style={{ color: "var(--cazura-muted)" }}
      >
        How much of your planned budget you have used in the selected period.
      </p>

      <div className="flex flex-col gap-1.5">
        <p
          className="text-[13px] font-medium"
          style={{ color: "var(--cazura-muted)" }}
        >
          Spending vs budget
        </p>
        <div className="flex items-end justify-between gap-2">
          <p
            className="text-lg font-bold"
            style={{ color: "var(--cazura-teal)" }}
          >
            {formatInr(spent)}{" "}
            <span className="text-base font-normal">spent</span>
          </p>
          <p className="text-[13px]" style={{ color: "var(--cazura-label)" }}>
            {formatInr(budgeted)} budgeted
          </p>
        </div>
        <div
          className="relative h-2 overflow-hidden rounded-lg"
          style={{ background: "#f0f0f0" }}
        >
          <div
            className="absolute top-0 left-0 h-full rounded-lg border border-[#809b9e]"
            style={{
              background: "var(--cazura-teal)",
              width: `${pct}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
