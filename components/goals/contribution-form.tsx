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
}: {
  goals: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [goalId, setGoalId] = useState(goals[0]?.id ?? "");
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
    router.refresh();
  }

  if (goals.length === 0) return null;

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-3">
      <div className="space-y-2">
        <Label>Goal</Label>
        <Select value={goalId} onValueChange={(v) => v && setGoalId(v)}>
          <SelectTrigger className="w-[220px]">
            <SelectValue />
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
          className="w-[120px]"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-2">
          <Label htmlFor="contribution-date">Date</Label>
          <DatePicker
            id="contribution-date"
            className="w-[140px]"
            value={occurredAt}
            onChange={setOccurredAt}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contribution-time">Time</Label>
          <TimeField
            id="contribution-time"
            className="w-[120px]"
            value={occurredAt}
            onChange={setOccurredAt}
          />
        </div>
      </div>
      <Button type="submit">Add contribution</Button>
    </form>
  );
}
