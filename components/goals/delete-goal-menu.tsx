"use client";

import { deleteGoal } from "@/actions/goals";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function DeleteGoalMenu({
  goalId,
  goalName,
}: {
  goalId: string;
  goalName: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  function runDelete() {
    startTransition(async () => {
      await deleteGoal(goalId);
      router.refresh();
      setConfirmOpen(false);
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={pending}
          className={cn(
            buttonVariants({ variant: "ghost", size: "icon-sm" }),
            "size-7 shrink-0 cursor-pointer rounded-md border shadow-none hover:bg-[var(--cazura-canvas)] disabled:opacity-50",
          )}
          style={{
            borderColor: "var(--cazura-border)",
            color: "var(--cazura-label)",
          }}
          aria-label="Goal actions"
        >
          <MoreHorizontal className="size-3.5" strokeWidth={2} />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="min-w-40 border-[var(--cazura-border)] bg-[var(--cazura-panel)] p-1 text-[var(--cazura-text)] ring-[var(--cazura-border)]"
        >
          <DropdownMenuItem
            variant="destructive"
            className="cursor-pointer gap-2 text-destructive focus:bg-red-500/10 focus:text-destructive [&_svg]:text-destructive"
            onClick={() => setConfirmOpen(true)}
          >
            <Trash2 className="size-4 shrink-0" strokeWidth={2} />
            Delete goal
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent
          className="border-[var(--cazura-border)] bg-[var(--cazura-panel)] text-[var(--cazura-text)] ring-[var(--cazura-border)] sm:max-w-md"
          showCloseButton
        >
          <DialogHeader>
            <DialogTitle>Delete goal?</DialogTitle>
            <DialogDescription style={{ color: "var(--cazura-muted)" }}>
              Remove &quot;{goalName}&quot; and all contributions recorded for it. This
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer border-[var(--cazura-border)] bg-[var(--cazura-panel)] text-[var(--cazura-text)] hover:bg-[var(--cazura-canvas)]"
              onClick={() => setConfirmOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="cursor-pointer gap-1.5"
              onClick={runDelete}
              disabled={pending}
            >
              <Trash2 className="size-4" />
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
