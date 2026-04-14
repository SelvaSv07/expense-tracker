import { formatInr } from "@/lib/money";
import { MoreHorizontal } from "lucide-react";

export function GoalsHistorySidebar({
  history,
}: {
  history: {
    id: string;
    amount: number;
    occurredAt: Date;
    goalName: string;
  }[];
}) {
  return (
    <div
      className="flex flex-col gap-3 rounded-xl border p-3"
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
          Contribution history
        </span>
        <button
          type="button"
          className="flex items-center justify-center rounded-lg border p-1.5"
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
      <p className="text-xs font-medium" style={{ color: "var(--cazura-muted)" }}>
        Latest additions to your goals
      </p>
      <ul className="max-h-[320px] space-y-0 overflow-y-auto">
        {history.map((h) => (
          <li
            key={h.id}
            className="flex items-start justify-between gap-2 border-b py-2.5 text-sm last:border-0"
            style={{ borderColor: "var(--cazura-border)" }}
          >
            <span className="min-w-0" style={{ color: "var(--cazura-text)" }}>
              <span className="font-medium">{h.goalName}</span>
              <span
                className="mt-0.5 block text-[11px] font-medium"
                style={{ color: "var(--cazura-muted)" }}
              >
                {h.occurredAt.toLocaleString()}
              </span>
            </span>
            <span
              className="shrink-0 font-semibold"
              style={{ color: "var(--cazura-teal-mid)" }}
            >
              +{formatInr(h.amount)}
            </span>
          </li>
        ))}
        {history.length === 0 ? (
          <li className="py-6 text-center text-sm" style={{ color: "var(--cazura-muted)" }}>
            No contributions yet.
          </li>
        ) : null}
      </ul>
    </div>
  );
}
