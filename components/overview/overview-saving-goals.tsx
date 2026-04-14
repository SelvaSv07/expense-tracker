import { buttonVariants } from "@/components/ui/button";
import { formatInr } from "@/lib/money";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  ChevronRight,
  MoreHorizontal,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

type Goal = {
  name: string;
  savedAmount: number;
  targetAmount: number;
  targetDate: Date | null;
};

export function OverviewSavingGoals({ goal }: { goal: Goal | null }) {
  const pct =
    goal && goal.targetAmount > 0
      ? Math.min(100, (goal.savedAmount / goal.targetAmount) * 100)
      : 0;

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
          Saving Goals
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

      {goal ? (
        <div
          className="flex flex-col gap-4 rounded-xl border p-3"
          style={{
            background: "#f6f6f6",
            borderColor: "var(--cazura-border)",
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <div
                className="flex items-center justify-center rounded-md border border-[var(--cazura-border)] bg-[var(--cazura-panel)] p-1"
              >
                <span className="text-xs">🎯</span>
              </div>
              <div className="flex min-w-0 items-center gap-0.5">
                <span
                  className="truncate text-sm font-medium"
                  style={{ color: "var(--cazura-text)" }}
                >
                  {goal.name}
                </span>
                <ChevronRight
                  className="size-3 shrink-0"
                  strokeWidth={2}
                  color="var(--cazura-muted)"
                />
              </div>
            </div>
            {goal.targetDate ? (
              <p
                className="shrink-0 text-[11px] font-medium whitespace-nowrap"
                style={{ color: "#98b8a8" }}
              >
                Until{" "}
                <strong className="font-bold">
                  {goal.targetDate.toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </strong>
              </p>
            ) : null}
          </div>

          <div className="flex justify-center">
            <div className="relative h-[110px] w-[220px]">
              <svg
                viewBox="0 0 220 110"
                className="absolute inset-0"
                aria-hidden
              >
                <path
                  pathLength={100}
                  d="M 20 100 A 90 90 0 0 1 200 100"
                  fill="none"
                  stroke="#ebebeb"
                  strokeWidth="14"
                  strokeLinecap="round"
                />
                <path
                  pathLength={100}
                  d="M 20 100 A 90 90 0 0 1 200 100"
                  fill="none"
                  stroke="var(--cazura-teal)"
                  strokeWidth="14"
                  strokeLinecap="round"
                  strokeDasharray={`${pct} ${100 - pct}`}
                />
              </svg>
              <p
                className="absolute top-8 left-1/2 -translate-x-1/2 text-center text-[10px] font-medium"
                style={{ color: "var(--cazura-muted)" }}
              >
                Saved
              </p>
              <p
                className="absolute top-11 left-1/2 -translate-x-1/2 text-center text-[22px] font-bold"
                style={{ color: "var(--cazura-teal)" }}
              >
                {formatInr(goal.savedAmount)}
              </p>
              <p
                className="absolute top-[5.25rem] left-1/2 w-full -translate-x-1/2 text-center text-[11px] font-medium"
                style={{ color: "#809b9e" }}
              >
                from target{" "}
                <strong className="font-bold">
                  {formatInr(goal.targetAmount)}
                </strong>
              </p>
            </div>
          </div>

          <div
            className="flex flex-col gap-1 rounded-lg border border-[#c7dde0] px-2.5 py-2"
            style={{
              backgroundImage: "linear-gradient(to right, #eff3f1, #e1ede7)",
            }}
          >
            <div className="flex items-center gap-1">
              <Sparkles
                className="size-[11px] shrink-0"
                strokeWidth={2}
                style={{ color: "var(--cazura-teal-light)" }}
              />
              <span
                className="flex-1 bg-gradient-to-r from-[var(--cazura-teal)] to-[var(--cazura-teal-soft)] bg-clip-text text-[11px] font-bold text-transparent"
                style={{ WebkitTextFillColor: "transparent" }}
              >
                AI Recommendation
              </span>
              <ArrowRight
                className="size-[13px] shrink-0"
                strokeWidth={2}
                color="var(--cazura-teal)"
              />
            </div>
            <p
              className="text-[10px] font-medium"
              style={{ color: "var(--cazura-teal)" }}
            >
              Consider increasing your monthly savings to reach your goal
              sooner.
            </p>
          </div>
        </div>
      ) : (
        <Link
          href="/goals"
          className={cn(buttonVariants({ size: "sm" }), "w-full")}
        >
          Create a goal
        </Link>
      )}
    </div>
  );
}
