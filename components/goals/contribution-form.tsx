"use client";

import { addGoalContribution } from "@/actions/goals";
import { Button } from "@/components/ui/button";
import {
  DatePicker,
  TimeField,
  toDatetimeLocalValue,
} from "@/components/ui/datetime-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { parseInrInput } from "@/lib/money";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ContributionForm({
  goals,
  layout = "inline",
  defaultGoalId,
  onSuccess,
}: {
  goals: { id: string; name: string }[];
  layout?: "inline" | "stack";
  /** When set (e.g. opening from a goal card), pre-select this goal. */
  defaultGoalId?: string;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const initialGoal =
    defaultGoalId && goals.some((g) => g.id === defaultGoalId)
      ? defaultGoalId
      : (goals[0]?.id ?? "");
  const [goalId, setGoalId] = useState(initialGoal);
  const [amount, setAmount] = useState("");
  const [occurredAt, setOccurredAt] = useState(() =>
    toDatetimeLocalValue(new Date()),
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseInrInput(amount);
    if (!goalId || amt <= 0) return;
    await addGoalContribution({
      goalId,
      amount: amt,
      occurredAt: new Date(occurredAt),
    });
    setAmount("");
    onSuccess?.();
    router.refresh();
  }

  if (goals.length === 0) return null;

  const isStack = layout === "stack";
  const selectedGoal = goals.find((g) => g.id === goalId);

  return (
    <form
      onSubmit={onSubmit}
      className={
        isStack ? "flex flex-col gap-3" : "flex flex-wrap items-end gap-3"
      }
    >
      <div className="space-y-2">
        <Label>Goal</Label>
        <Select
          value={goalId}
          onValueChange={(v) => {
            if (v) setGoalId(v);
          }}
        >
          <SelectTrigger className={isStack ? "w-full min-w-0" : "w-[220px]"}>
            <SelectValue placeholder="Choose goal">
              {selectedGoal ? (
                <span className="truncate">{selectedGoal.name}</span>
              ) : null}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {goals.map((g) => (
              <SelectItem key={g.id} value={g.id}>
                {g.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Amount (₹)</Label>
        <Input
          className={isStack ? "w-full" : "w-[120px]"}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>
      <div
        className={
          isStack
            ? "flex flex-col gap-3"
            : "flex flex-wrap items-end gap-2"
        }
      >
        <div className={isStack ? "w-full space-y-2" : "space-y-2"}>
          <Label htmlFor="contribution-date">Date</Label>
          <DatePicker
            id="contribution-date"
            className={isStack ? "w-full" : "w-[140px]"}
            value={occurredAt}
            onChange={setOccurredAt}
          />
        </div>
        <div className={isStack ? "w-full space-y-2" : "space-y-2"}>
          <Label htmlFor="contribution-time">Time</Label>
          <TimeField
            id="contribution-time"
            className={isStack ? "w-full" : "w-[120px]"}
            value={occurredAt}
            onChange={setOccurredAt}
          />
        </div>
      </div>
      <Button type="submit" className={isStack ? "w-full" : undefined}>
        Add contribution
      </Button>
    </form>
  );
}
