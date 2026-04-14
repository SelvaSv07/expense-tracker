"use client";

import { AddGoalDialog } from "@/components/goals/add-goal-dialog";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

export function GoalsPageHeader() {
  return (
    <div className="flex flex-col gap-2.5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 flex-1">
        <p
          className="text-[22px] leading-tight font-bold tracking-tight"
          style={{ color: "var(--cazura-text)" }}
        >
          Goals
        </p>
        <p
          className="mt-1 text-[13px] font-medium"
          style={{ color: "var(--cazura-muted)" }}
        >
          Save toward what matters and watch your progress grow
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2.5">
        <AddGoalDialog
          trigger={
            <button
              type="button"
              className={cn(
                buttonVariants({ size: "sm" }),
                "h-8 gap-1.5 rounded-lg border px-3 text-xs font-medium shadow-[0_2px_8px_rgba(0,0,0,0.1)]",
              )}
              style={{
                background: "var(--cazura-teal)",
                borderColor: "#629298",
                color: "var(--cazura-panel)",
              }}
            >
              <Plus className="size-3.5" strokeWidth={2.5} />
              New Goal
            </button>
          }
        />
      </div>
    </div>
  );
}
