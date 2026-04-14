"use client";

import { ContributionForm } from "@/components/goals/contribution-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function AddContributionDialog({
  goals,
  defaultGoalId,
  goalLabel,
  open,
  onOpenChange,
}: {
  goals: { id: string; name: string }[];
  defaultGoalId: string;
  goalLabel: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (goals.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle>Add contribution</DialogTitle>
          <DialogDescription>
            Record money moved into &quot;{goalLabel}&quot;. You can pick another goal
            in the list if needed.
          </DialogDescription>
        </DialogHeader>
        {open ? (
          <ContributionForm
            key={defaultGoalId}
            goals={goals}
            defaultGoalId={defaultGoalId}
            layout="stack"
            onSuccess={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
