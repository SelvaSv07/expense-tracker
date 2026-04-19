"use client";

import type { ActivityRow } from "@/components/transactions/activity-row";
import { useOptimisticTransactionsOptional } from "@/components/transactions/optimistic-transactions-context";
import { deleteTransaction } from "@/actions/transactions";
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
import { startTransition, useState } from "react";
import { toast } from "sonner";

export function TransactionRowActions({
  id,
  row,
  variant = "default",
}: {
  id: string;
  /** Used to restore the row if delete fails after an optimistic removal. */
  row?: ActivityRow;
  variant?: "default" | "cazura";
}) {
  const router = useRouter();
  const opt = useOptimisticTransactionsOptional();
  const cazura = variant === "cazura";
  const [deletePending, setDeletePending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  function runDelete() {
    startTransition(() => {
      if (opt && row) {
        opt.applyOptimistic({ type: "remove", id });
      }
    });
    setDeletePending(true);
    void (async () => {
      try {
        await deleteTransaction(id);
        router.refresh();
        setConfirmOpen(false);
        toast.success("Transaction deleted");
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : "Could not delete transaction";
        startTransition(() => {
          if (opt && row) {
            opt.applyOptimistic({ type: "restore", row });
          } else {
            router.refresh();
          }
        });
        toast.error(msg);
      } finally {
        setDeletePending(false);
      }
    })();
  }

  const confirmDialog = (
    <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
      <DialogContent
        className={
          cazura
            ? "border-[var(--cazura-border)] bg-[var(--cazura-panel)] text-[var(--cazura-text)] ring-[var(--cazura-border)] sm:max-w-md"
            : "sm:max-w-md"
        }
        showCloseButton
      >
        <DialogHeader>
          <DialogTitle>Delete transaction?</DialogTitle>
          <DialogDescription
            style={cazura ? { color: "var(--cazura-muted)" } : undefined}
          >
            This permanently removes the transaction. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className={cn(
              "cursor-pointer",
              cazura &&
                "border-[var(--cazura-border)] bg-[var(--cazura-panel)] text-[var(--cazura-text)] hover:bg-[var(--cazura-canvas)]",
            )}
            onClick={() => setConfirmOpen(false)}
            disabled={deletePending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="cursor-pointer gap-1.5"
            onClick={runDelete}
            disabled={deletePending}
          >
            <Trash2 className="size-4" />
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={deletePending}
          className={cn(
            buttonVariants({ variant: "ghost", size: "icon" }),
            cazura
              ? "size-[30px] rounded-md border shadow-none"
              : "size-8",
          )}
          style={
            cazura
              ? {
                  background: "var(--cazura-panel)",
                  borderColor: "var(--cazura-border)",
                }
              : undefined
          }
        >
          <MoreHorizontal
            className={cn(cazura ? "size-3 text-[var(--cazura-label)]" : "size-4")}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className={
            cazura
              ? "min-w-[9.5rem] border-[var(--cazura-border)] bg-[var(--cazura-panel)] p-1 text-[var(--cazura-text)] ring-[var(--cazura-border)]"
              : undefined
          }
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
