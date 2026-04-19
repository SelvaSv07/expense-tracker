"use client";

import type { ActivityRow } from "@/components/transactions/activity-row";
import type { ReactNode } from "react";
import { TransactionCategoryLabel } from "@/components/transactions/transaction-category-label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatInr } from "@/lib/money";
import { formatPaymentMethodLabel } from "@/lib/utils";

function DetailField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-1">
      <p className="text-xs font-medium" style={{ color: "var(--cazura-muted)" }}>
        {label}
      </p>
      <div className="text-sm break-words" style={{ color: "var(--cazura-text)" }}>
        {children}
      </div>
    </div>
  );
}

export function TransactionDetailDialog({
  row,
  onOpenChange,
}: {
  row: ActivityRow | null;
  onOpenChange: (open: boolean) => void;
}) {
  const open = row !== null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="border-[var(--cazura-border)] bg-[var(--cazura-panel)] text-[var(--cazura-text)] ring-[var(--cazura-border)] sm:max-w-md"
        showCloseButton
      >
        {row ? (
          <>
            <DialogHeader>
              <DialogTitle>Transaction details</DialogTitle>
              <DialogDescription style={{ color: "var(--cazura-muted)" }}>
                Full information for this entry.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 pt-1">
              <div>
                <p
                  className="mb-2 text-xs font-medium"
                  style={{ color: "var(--cazura-muted)" }}
                >
                  Category
                </p>
                <TransactionCategoryLabel
                  name={row.categoryName}
                  icon={row.categoryIcon}
                  color={row.categoryColor}
                  transactionName={row.transactionName}
                  note={row.note}
                  variant="cazura"
                />
              </div>
              {row.note?.trim() ? (
                <DetailField label="Note">{row.note}</DetailField>
              ) : null}
              <DetailField label="Type">
                {row.categoryType === "income" ? "Income" : "Expense"}
              </DetailField>
              <DetailField label="Date & time">
                {new Date(row.occurredAt).toLocaleString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })}
              </DetailField>
              <DetailField label="Amount">
                <span
                  className="text-base font-bold"
                  style={{
                    color:
                      row.categoryType === "income"
                        ? "var(--cazura-teal-mid)"
                        : "var(--cazura-red)",
                  }}
                >
                  {row.categoryType === "income" ? "+" : "−"}
                  {formatInr(row.amount)}
                </span>
              </DetailField>
              <DetailField label="Payment method">
                {formatPaymentMethodLabel(row.paymentMethod)}
              </DetailField>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
