"use client";

import { deleteBudget } from "@/actions/budgets";
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

export function DeleteBudgetButton({
  budgetId,
  variant = "default",
}: {
  budgetId: string;
  variant?: "default" | "cazura-icon";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const cazura = variant === "cazura-icon";

  function runDelete() {
    startTransition(async () => {
      await deleteBudget(budgetId);
      router.refresh();
      setConfirmOpen(false);
    });
  }

  const confirmDialog = (
    <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
      <DialogContent
        className="border-[var(--cazura-border)] bg-[var(--cazura-panel)] text-[var(--cazura-text)] ring-[var(--cazura-border)] sm:max-w-md"
        showCloseButton
      >
        <DialogHeader>
          <DialogTitle>Remove budget?</DialogTitle>
          <DialogDescription style={{ color: "var(--cazura-muted)" }}>
            Remove this category budget for this month? Spending history is not
            deleted.
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
  );

  if (cazura) {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger
            disabled={pending}
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon-sm" }),
              "size-8 cursor-pointer rounded-md border shadow-none hover:bg-[var(--cazura-canvas)] disabled:opacity-50",
            )}
            style={{
              borderColor: "var(--cazura-border)",
              color: "var(--cazura-label)",
            }}
            aria-label="Open budget actions"
          >
            <MoreHorizontal className="size-3" strokeWidth={2} />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="min-w-[9.5rem] border-[var(--cazura-border)] bg-[var(--cazura-panel)] p-1 text-[var(--cazura-text)] ring-[var(--cazura-border)]"
          >
            <DropdownMenuItem
              variant="destructive"
              className="cursor-pointer gap-2 text-destructive focus:bg-red-500/10 focus:text-destructive [&_svg]:text-destructive"
              onClick={() => setConfirmOpen(true)}
            >
              <Trash2 className="size-4 shrink-0" strokeWidth={2} />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {confirmDialog}
      </>
    );
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        disabled={pending}
        title="Remove budget for this month"
        className="text-destructive hover:text-destructive"
        onClick={() => setConfirmOpen(true)}
        aria-label="Remove budget"
      >
        <Trash2 className="size-4" />
      </Button>
      {confirmDialog}
    </>
  );
}
