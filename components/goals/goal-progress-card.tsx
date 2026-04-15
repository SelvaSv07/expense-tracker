"use client";

import { AddContributionDialog } from "@/components/goals/add-contribution-dialog";
import { DeleteGoalMenu } from "@/components/goals/delete-goal-menu";
import { Button } from "@/components/ui/button";
import { formatInr } from "@/lib/money";
import { ChevronRight, Plus, Target } from "lucide-react";
import { useState } from "react";

export function GoalProgressCard({
  id,
  goals,
  name,
  savedAmount,
  targetAmount,
  targetDate,
}: {
  id: string;
  goals: { id: string; name: string }[];
  name: string;
  savedAmount: number;
  targetAmount: number;
  targetDate: Date | null;
}) {
  const [contributionOpen, setContributionOpen] = useState(false);
  const pct =
    targetAmount > 0
      ? Math.min(100, Math.round((savedAmount / targetAmount) * 100))
      : 0;
  const remaining = Math.max(0, targetAmount - savedAmount);

  return (
    <div className="relative min-w-0">
      <AddContributionDialog
        goals={goals}
        defaultGoalId={id}
        goalLabel={name}
        open={contributionOpen}
        onOpenChange={setContributionOpen}
      />
      <div
        className="group flex flex-col gap-4 rounded-xl border p-3 sm:p-4"
        style={{
          background: "#f6f6f6",
          borderColor: "var(--cazura-border)",
        }}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex items-center justify-center rounded-md border border-[var(--cazura-border)] bg-[var(--cazura-panel)] p-1">
              <Target
                className="size-3.5"
                strokeWidth={2}
                style={{ color: "var(--cazura-teal-mid)" }}
              />
            </div>
            <div className="flex min-w-0 items-center gap-0.5">
              <span
                className="truncate text-sm font-medium"
                style={{ color: "var(--cazura-text)" }}
              >
                {name}
              </span>
              <ChevronRight
                className="size-3 shrink-0"
                strokeWidth={2}
                color="var(--cazura-muted)"
              />
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              size="sm"
              className="h-7 cursor-pointer gap-1.5 border-transparent bg-[var(--cazura-teal)] px-2.5 text-xs font-medium text-white opacity-100 shadow-none transition-[opacity,background-color] hover:bg-[var(--cazura-teal-mid)] sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
              onClick={() => setContributionOpen(true)}
            >
              <Plus className="size-3.5" strokeWidth={2.25} aria-hidden />
              Add contribution
            </Button>
            {targetDate ? (
              <p
                className="shrink-0 text-[11px] font-medium whitespace-nowrap"
                style={{ color: "#98b8a8" }}
              >
                Until{" "}
                <strong className="font-bold">
                  {targetDate.toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </strong>
              </p>
            ) : (
              <p
                className="shrink-0 text-[11px] font-medium whitespace-nowrap"
                style={{ color: "var(--cazura-muted)" }}
              >
                No target date
              </p>
            )}
            <DeleteGoalMenu goalId={id} goalName={name} />
          </div>
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
              {pct}% complete
            </p>
            <p
              className="absolute top-11 left-1/2 -translate-x-1/2 text-center text-[22px] font-bold"
              style={{ color: "var(--cazura-teal)" }}
            >
              {formatInr(savedAmount)}
            </p>
            <p
              className="absolute top-[5.25rem] left-1/2 w-full -translate-x-1/2 text-center text-[11px] font-medium"
              style={{ color: "#809b9e" }}
            >
              target{" "}
              <strong className="font-bold">{formatInr(targetAmount)}</strong>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px] font-medium sm:grid-cols-3">
          <div
            className="rounded-lg border px-2 py-1.5"
            style={{
              background: "var(--cazura-panel)",
              borderColor: "var(--cazura-border)",
            }}
          >
            <p style={{ color: "var(--cazura-muted)" }}>Saved</p>
            <p style={{ color: "var(--cazura-text)" }}>{formatInr(savedAmount)}</p>
          </div>
          <div
            className="rounded-lg border px-2 py-1.5"
            style={{
              background: "var(--cazura-panel)",
              borderColor: "var(--cazura-border)",
            }}
          >
            <p style={{ color: "var(--cazura-muted)" }}>Remaining</p>
            <p style={{ color: "var(--cazura-text)" }}>{formatInr(remaining)}</p>
          </div>
          <div
            className="col-span-2 rounded-lg border px-2 py-1.5 sm:col-span-1"
            style={{
              background: "var(--cazura-panel)",
              borderColor: "var(--cazura-border)",
            }}
          >
            <p style={{ color: "var(--cazura-muted)" }}>Progress</p>
            <p style={{ color: "var(--cazura-teal)" }}>{pct}%</p>
          </div>
        </div>
      </div>
    </div>
  );
}
