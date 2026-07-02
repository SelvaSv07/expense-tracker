"use client";

import { deleteTransaction } from "@/actions/transactions";
import type { ActivityRow } from "@/components/transactions/activity-row";
import type {
  PaymentMethodOption,
  TransactionCategoryOption,
} from "@/components/transactions/add-transaction-dialog";
import { EditTransactionDialog } from "@/components/transactions/edit-transaction-dialog";
import { useOptimisticTransactionsOptional } from "@/components/transactions/optimistic-transactions-context";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CategoryIconShelf,
  categoryIconShelfBorderStyle,
} from "@/lib/category-color";
import { formatInr } from "@/lib/money";
import { formatPaymentMethodLabel } from "@/lib/utils";
import { Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { toast } from "sonner";

function formatDetailDateTime(iso: string) {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `${date} · ${time}`;
}

function MetaLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span
        className="shrink-0 text-[11px] font-medium"
        style={{ color: "var(--cazura-label)" }}
      >
        {label}
      </span>
      <span
        className="min-w-0 text-right text-xs font-medium"
        style={{ color: "var(--cazura-text)" }}
      >
        {value}
      </span>
    </div>
  );
}

export function TransactionDetailDialog({
  row,
  onOpenChange,
  categories,
  paymentMethods,
}: {
  row: ActivityRow | null;
  onOpenChange: (open: boolean) => void;
  categories: TransactionCategoryOption[];
  paymentMethods: PaymentMethodOption[];
}) {
  const router = useRouter();
  const optimistic = useOptimisticTransactionsOptional();
  const open = row !== null;
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deletePending, setDeletePending] = useState(false);

  const canEdit = Boolean(row && !row.optimistic);

  function runDelete() {
    if (!row) return;
    startTransition(() => {
      optimistic?.applyOptimistic({ type: "remove", id: row.id });
    });
    setDeletePending(true);
    void (async () => {
      try {
        await deleteTransaction(row.id);
        router.refresh();
        setConfirmDeleteOpen(false);
        onOpenChange(false);
        toast.success("Transaction deleted");
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : "Could not delete transaction";
        startTransition(() => {
          if (optimistic) {
            optimistic.applyOptimistic({ type: "restore", row });
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

  const displayName = row?.transactionName?.trim() || row?.categoryName || "";
  const isIncome = row?.categoryType === "income";

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          onOpenChange(next);
          if (!next) {
            setEditOpen(false);
            setConfirmDeleteOpen(false);
          }
        }}
      >
        <DialogContent
          className="gap-3 border-[var(--cazura-border)] bg-[var(--cazura-panel)] p-4 text-[var(--cazura-text)] ring-[var(--cazura-border)] sm:max-w-[22rem]"
          showCloseButton
        >
          {row ? (
            <>
              <DialogHeader className="space-y-0 pb-2 pr-8 text-left">
                <DialogTitle className="text-[15px] leading-tight">
                  Transaction details
                </DialogTitle>
              </DialogHeader>

              <div className="flex items-start gap-3">
                <CategoryIconShelf
                  icon={row.categoryIcon}
                  color={row.categoryColor}
                  title={row.categoryName}
                  className="size-10 shrink-0 border p-1.5"
                  style={categoryIconShelfBorderStyle(row.categoryColor)}
                  iconClassName="size-4"
                />
                <div className="min-w-0 flex-1 pt-0.5">
                  <p
                    className="truncate text-sm font-bold leading-tight"
                    style={{ color: "var(--cazura-text)" }}
                  >
                    {displayName}
                  </p>
                  <p
                    className="mt-0.5 truncate text-[11px] font-medium"
                    style={{ color: "var(--cazura-muted)" }}
                  >
                    {row.categoryName}
                  </p>
                </div>
                <p
                  className="shrink-0 text-base font-bold leading-none tabular-nums"
                  style={{
                    color: isIncome
                      ? "var(--cazura-teal-mid)"
                      : "var(--cazura-red)",
                  }}
                >
                  {isIncome ? "+" : "−"}
                  {formatInr(row.amount)}
                </p>
              </div>

              <div
                className="space-y-2 rounded-lg border px-3 py-2.5"
                style={{
                  background: "var(--cazura-canvas)",
                  borderColor: "var(--cazura-border)",
                }}
              >
                <MetaLine
                  label="Time"
                  value={formatDetailDateTime(row.occurredAt)}
                />
                <MetaLine
                  label="Payment"
                  value={formatPaymentMethodLabel(row.paymentMethod)}
                />
                {row.note?.trim() ? (
                  <MetaLine label="Note" value={row.note.trim()} />
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 cursor-pointer gap-1.5 border-[var(--cazura-border)] bg-[var(--cazura-panel)] text-[var(--cazura-red)] hover:bg-red-500/5 hover:text-[var(--cazura-red)]"
                  disabled={row.optimistic || deletePending}
                  onClick={() => setConfirmDeleteOpen(true)}
                >
                  <Trash2 className="size-3.5" />
                  Delete
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 cursor-pointer gap-1.5 border-[var(--cazura-border)] bg-[var(--cazura-panel)] text-[var(--cazura-text)] hover:bg-[var(--cazura-canvas)]"
                  disabled={!canEdit || deletePending}
                  onClick={() => setEditOpen(true)}
                >
                  <Pencil className="size-3.5" />
                  Edit
                </Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <EditTransactionDialog
        row={row}
        categories={categories}
        paymentMethods={paymentMethods}
        open={editOpen}
        onOpenChange={(next) => {
          setEditOpen(next);
          if (!next) {
            onOpenChange(false);
          }
        }}
      />

      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent
          className="gap-3 border-[var(--cazura-border)] bg-[var(--cazura-panel)] p-4 text-[var(--cazura-text)] ring-[var(--cazura-border)] sm:max-w-[22rem]"
          showCloseButton
        >
          <DialogHeader className="text-left">
            <DialogTitle className="text-[15px]">Delete transaction?</DialogTitle>
            <DialogDescription
              className="text-xs"
              style={{ color: "var(--cazura-muted)" }}
            >
              This permanently removes the transaction. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-9 cursor-pointer border-[var(--cazura-border)] bg-[var(--cazura-panel)] text-[var(--cazura-text)] hover:bg-[var(--cazura-canvas)]"
              onClick={() => setConfirmDeleteOpen(false)}
              disabled={deletePending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="h-9 cursor-pointer gap-1.5"
              onClick={runDelete}
              disabled={deletePending}
            >
              <Trash2 className="size-3.5" />
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
