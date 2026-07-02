"use client";

import { bulkCreateTransactions } from "@/actions/transactions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategoryIconShelf } from "@/lib/category-color";
import { cn } from "@/lib/utils";
import {
  annotateWithSuggestedCategories,
  type CategoryCandidate,
} from "@/lib/statement-categorizer";
import { formatInr } from "@/lib/money";
import {
  parseStatementBuffer,
  type ColumnRole,
  type DetectedColumns,
  type ParsedTransaction,
} from "@/lib/statement-parser";
import { FileSpreadsheet, FileUp, Loader2, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

export type ImportCategoryOption = CategoryCandidate & {
  icon: string | null;
  color: string;
};

export type ImportPaymentMethodOption = {
  id: string;
  name: string;
};

type ReviewRow = ParsedTransaction & {
  selected: boolean;
  categoryId: string | null;
  suggestedCategoryId: string | null;
  /** User-visible name (parsed from narration; editable in the UI). */
  displayName: string;
  /** Resolved payment method: detected → "Card" → first available. */
  paymentMethod: string | null;
};

const NONE_CATEGORY = "__none__";
const BULK_NONE = "__bulk_none__";
const NO_METHOD = "__no_method__";

function formatDateForInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function ImportStatementDialog({
  categories,
  paymentMethods,
  defaultPaymentMethod,
  trigger,
}: {
  categories: ImportCategoryOption[];
  paymentMethods: ImportPaymentMethodOption[];
  defaultPaymentMethod: string;
  trigger?: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [fileMeta, setFileMeta] = useState<{
    name: string;
    size: number;
  } | null>(null);
  const [parseResult, setParseResult] = useState<{
    transactions: ParsedTransaction[];
    warnings: string[];
    sheetName: string;
    detectedColumns: DetectedColumns | null;
  } | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [bulkAssign, setBulkAssign] = useState<string>(BULK_NONE);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setFileMeta(null);
    setParseResult(null);
    setParseError(null);
    setBulkAssign(BULK_NONE);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const handleClose = (next: boolean) => {
    if (pending) return;
    setOpen(next);
    if (!next) reset();
  };

  const reviewRows: ReviewRow[] = useMemo(() => {
    if (!parseResult) return [];
    const annotated = annotateWithSuggestedCategories(
      parseResult.transactions,
      categories,
    );
    return annotated.map((t) => {
      // Pick the most relevant payment method for this row.
      // 1. Detected method that matches a user-defined method (case-insensitive).
      // 2. User's default (Card-preferred).
      // 3. null (user picks later).
      let picked: string | null = null;
      if (t.detectedPaymentMethod) {
        const direct = paymentMethods.find(
          (m) => m.name.toLowerCase() === t.detectedPaymentMethod!.toLowerCase(),
        );
        if (direct) picked = direct.name;
        else if (
          t.detectedPaymentMethod.toLowerCase() === "card" &&
          defaultPaymentMethod
        )
          picked = defaultPaymentMethod;
      }
      if (!picked) picked = defaultPaymentMethod || null;
      return {
        ...t,
        selected: true,
        categoryId: t.suggestedCategoryId,
        displayName: t.name || t.description,
        paymentMethod: picked,
      };
    });
  }, [parseResult, categories, paymentMethods, defaultPaymentMethod]);

  const updateRow = useCallback((idx: number, patch: Partial<ReviewRow>) => {
    setReviewOverride((curr) => {
      const next = [...curr];
      next[idx] = { ...(next[idx] ?? {}), ...patch } as ReviewRow;
      return next;
    });
  }, []);

  // Override map (kept as a sparse array of diffs over derived rows).
  const [reviewOverride, setReviewOverride] = useState<
    Array<Partial<ReviewRow> | undefined>
  >([]);

  const materialRows: ReviewRow[] = useMemo(() => {
    return reviewRows.map((row, idx) => {
      const ov = reviewOverride[idx];
      return ov ? { ...row, ...ov } : row;
    });
  }, [reviewRows, reviewOverride]);

  const selectedCount = materialRows.filter((r) => r.selected).length;
  const importableCount = materialRows.filter(
    (r) => r.selected && r.categoryId,
  ).length;
  const issuesCount = selectedCount - importableCount;

  async function handleFile(file: File) {
    setParsing(true);
    setParseError(null);
    setReviewOverride([]);
    try {
      const buf = await file.arrayBuffer();
      const result = parseStatementBuffer(buf);
      setFileMeta({ name: file.name, size: file.size });
      setParseResult(result);
      if (result.transactions.length === 0) {
        setParseError(
          result.warnings[0] ?? "No transactions could be parsed from this file.",
        );
      }
    } catch (e) {
      setParseError(
        e instanceof Error ? e.message : "Could not read this file.",
      );
      setParseResult(null);
      setFileMeta(null);
    } finally {
      setParsing(false);
    }
  }

  function applyBulkAssign(value: string) {
    setBulkAssign(value);
    if (value === BULK_NONE) return;
    setReviewOverride((curr) =>
      materialRows.map((row, idx) => ({
        ...(curr[idx] ?? {}),
        selected: true,
        categoryId: value === NONE_CATEGORY ? null : value,
      })),
    );
  }

  function toggleAllSelected(selected: boolean) {
    setReviewOverride((curr) =>
      materialRows.map((row, idx) => ({
        ...(curr[idx] ?? {}),
        selected,
      })),
    );
  }

  async function handleImport() {
    if (!materialRows.length) return;
    const payload = materialRows
      .filter((r) => r.selected && r.categoryId)
      .map((r) => ({
        categoryId: r.categoryId as string,
        amount: r.amount,
        occurredAt: r.occurredAt,
        transactionName: r.displayName?.trim() || undefined,
        note: r.description || undefined,
        paymentMethod: r.paymentMethod ?? undefined,
      }));
    if (!payload.length) {
      toast.error("Pick a category for each selected transaction first.");
      return;
    }
    startTransition(async () => {
      try {
        const n = await bulkCreateTransactions({ rows: payload });
        toast.success(
          n === 1 ? "Imported 1 transaction." : `Imported ${n} transactions.`,
        );
        handleClose(false);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Import failed.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      {trigger ? (
        <span
          role="button"
          tabIndex={0}
          onClick={() => setOpen(true)}
          className={cn(
            buttonVariants({ size: "sm" }),
            "h-8 cursor-pointer gap-1.5 rounded-lg border px-3 text-xs font-medium shadow-[0_2px_8px_rgba(0,0,0,0.1)]",
          )}
        >
          {trigger}
        </span>
      ) : (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="cursor-pointer gap-1.5"
          onClick={() => setOpen(true)}
        >
          <FileUp className="size-3.5" />
          Import statement
        </Button>
      )}
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl">
        <DialogHeader className="border-b px-5 pt-4 pb-3 pr-12 text-left">
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="size-4" />
            Import bank statement
          </DialogTitle>
          <DialogDescription>
            Upload an <code className="text-xs">.xls</code>,{" "}
            <code className="text-xs">.xlsx</code>, or{" "}
            <code className="text-xs">.csv</code> statement. We auto-detect
            columns and suggest a category per row using your saved category
            keywords.
          </DialogDescription>
        </DialogHeader>

        {!fileMeta ? (
          <div className="flex flex-col gap-3 px-5 py-5">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={parsing}
              className={cn(
                "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/40 px-6 py-10 text-sm transition-colors hover:bg-muted/60",
                parsing && "cursor-not-allowed opacity-60",
              )}
            >
              {parsing ? (
                <Loader2 className="text-muted-foreground size-6 animate-spin" />
              ) : (
                <Upload className="text-muted-foreground size-6" />
              )}
              <span className="font-medium">
                {parsing ? "Reading file…" : "Choose a file to upload"}
              </span>
              <span className="text-muted-foreground text-xs">
                Files stay on this device — parsing happens in your browser.
              </span>
            </button>
            <input
              ref={inputRef}
              type="file"
              accept=".xls,.xlsx,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
            {parseError ? (
              <p className="text-destructive text-sm">{parseError}</p>
            ) : null}
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="bg-muted/40 flex flex-wrap items-center gap-2 border-b px-5 py-3 text-xs">
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">
                <div className="flex min-w-0 items-center gap-2">
                  <FileSpreadsheet className="text-muted-foreground size-4 shrink-0" />
                  <span className="truncate font-medium">{fileMeta.name}</span>
                  <span className="text-muted-foreground">
                    {(fileMeta.size / 1024).toFixed(1)} KB
                  </span>
                </div>
                <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1">
                  {parseResult ? (
                    <>
                      <span>Sheet: {parseResult.sheetName || "—"}</span>
                      <span>
                        {parseResult.transactions.length} parsed ·{" "}
                        {selectedCount} selected
                      </span>
                    </>
                  ) : null}
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 self-center px-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40"
                onClick={reset}
                disabled={pending}
              >
                <X className="size-3.5" />
                Clear
              </Button>
            </div>

            {parseResult && parseResult.warnings.length > 0 ? (
              <details className="text-muted-foreground border-b px-5 py-2 text-xs">
                <summary className="cursor-pointer font-medium">
                  {parseResult.warnings.length} warning
                  {parseResult.warnings.length === 1 ? "" : "s"}
                </summary>
                <ul className="mt-1 list-disc space-y-0.5 pl-5">
                  {parseResult.warnings.slice(0, 50).map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                  {parseResult.warnings.length > 50 ? (
                    <li>…and {parseResult.warnings.length - 50} more.</li>
                  ) : null}
                </ul>
              </details>
            ) : null}

            <div className="flex flex-wrap items-center gap-2 border-b px-5 py-2">
              <span className="text-muted-foreground text-xs">
                {selectedCount === materialRows.length && materialRows.length > 0
                  ? "All selected"
                  : selectedCount === 0
                    ? "None selected"
                    : `${selectedCount} of ${materialRows.length} selected`}
              </span>
              <div className="ml-auto flex items-center gap-2">
                <Label className="text-xs">Bulk-assign category</Label>
                <Select
                  value={bulkAssign}
                  onValueChange={(v) => applyBulkAssign(v ?? BULK_NONE)}
                >
                  <SelectTrigger className="h-7 w-[200px] text-xs">
                    <SelectValue placeholder="Pick a category…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={BULK_NONE}>— none —</SelectItem>
                    <SelectItem value={NONE_CATEGORY}>(Uncategorized)</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="sticky top-0 z-10 grid grid-cols-[24px_130px_minmax(0,1fr)_150px_120px_92px] items-center gap-x-2 border-b border-border bg-muted px-5 py-1.5 text-xs font-medium text-muted-foreground">
                <div className="flex items-center justify-center">
                  <Checkbox
                    checked={
                      materialRows.length > 0 &&
                      materialRows.every((r) => r.selected)
                    }
                    indeterminate={
                      selectedCount > 0 && selectedCount < materialRows.length
                    }
                    onCheckedChange={(v) => toggleAllSelected(Boolean(v))}
                    disabled={pending || materialRows.length === 0}
                    aria-label="Select all rows"
                  />
                </div>
                <span>Date</span>
                <span>Name</span>
                <span>Category</span>
                <span>Method</span>
                <span className="text-right">Amount</span>
              </div>
              <div>
                {materialRows.map((row, idx) => {
                  const cat = categories.find((c) => c.id === row.categoryId);
                  const methodValue = paymentMethods.some(
                    (m) => m.name === row.paymentMethod,
                  )
                    ? (row.paymentMethod as string)
                    : NO_METHOD;
                  return (
                    <div
                      key={idx}
                      className={cn(
                        "grid grid-cols-[24px_130px_minmax(0,1fr)_150px_120px_92px] items-center gap-x-2 border-b px-5 py-1.5 text-sm transition-colors last:border-b-0",
                        !row.selected && "bg-muted/30 opacity-60",
                      )}
                    >
                      <div className="flex items-center justify-center">
                        <Checkbox
                          checked={row.selected}
                          onCheckedChange={(v) =>
                            updateRow(idx, { selected: Boolean(v) })
                          }
                        />
                      </div>
                      <input
                        type="date"
                        value={formatDateForInput(row.occurredAt)}
                        onChange={(e) => {
                          const next = new Date(
                            `${e.target.value}T00:00:00Z`,
                          );
                          if (!Number.isNaN(next.getTime()))
                            updateRow(idx, { occurredAt: next });
                        }}
                        className="bg-background w-full min-w-0 rounded border px-1.5 py-1 text-xs"
                        disabled={!row.selected}
                      />
                      <div className="min-w-0">
                        <input
                          type="text"
                          value={row.displayName}
                          onChange={(e) =>
                            updateRow(idx, { displayName: e.target.value })
                          }
                          placeholder="Transaction name"
                          title={row.description}
                          disabled={!row.selected}
                          className="bg-background w-full min-w-0 rounded border border-transparent px-1.5 py-1 text-xs hover:border-input focus:border-input focus:outline-none disabled:cursor-not-allowed"
                        />
                      </div>
                      <Select
                        value={row.categoryId ?? NONE_CATEGORY}
                        onValueChange={(v) =>
                          updateRow(idx, {
                            categoryId: v === NONE_CATEGORY ? null : v,
                          })
                        }
                        disabled={!row.selected}
                      >
                        <SelectTrigger className="h-8 w-full min-w-0 text-xs">
                          <SelectValue placeholder="Choose category…">
                            {cat ? (
                              <span className="flex items-center gap-1.5">
                                <CategoryIconShelf
                                  icon={cat.icon}
                                  color={cat.color}
                                  className="size-4 rounded"
                                  iconClassName="size-2.5"
                                />
                                <span className="truncate">{cat.name}</span>
                              </span>
                            ) : row.suggestedCategoryId ? (
                              <span className="text-muted-foreground italic">
                                ★{" "}
                                {categories.find(
                                  (c) => c.id === row.suggestedCategoryId,
                                )?.name ?? "Suggested"}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">
                                Choose…
                              </span>
                            )}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {row.suggestedCategoryId &&
                          row.suggestedCategoryId !== row.categoryId ? (
                            <SelectItem
                              value={row.suggestedCategoryId}
                              className="font-medium"
                            >
                              ★ Use suggested (
                              {categories.find(
                                (c) => c.id === row.suggestedCategoryId,
                              )?.name ?? ""}
                              )
                            </SelectItem>
                          ) : null}
                          <SelectItem value={NONE_CATEGORY}>
                            (Uncategorized)
                          </SelectItem>
                          {categories
                            .filter((c) => c.type === row.direction)
                            .map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={methodValue}
                        onValueChange={(v) =>
                          updateRow(idx, {
                            paymentMethod: v === NO_METHOD ? null : v,
                          })
                        }
                        disabled={!row.selected}
                      >
                        <SelectTrigger className="h-8 w-full min-w-0 text-xs">
                          <SelectValue placeholder="Method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NO_METHOD}>
                            (none)
                          </SelectItem>
                          {paymentMethods.map((m) => (
                            <SelectItem key={m.id} value={m.name}>
                              {m.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div
                        className={cn(
                          "text-right font-medium tabular-nums",
                          row.direction === "income"
                            ? "text-emerald-600"
                            : "text-rose-600",
                        )}
                        title={row.description}
                      >
                        {row.direction === "income" ? "+" : "−"}
                        {formatInr(row.amount)}
                      </div>
                    </div>
                  );
                })}
                {materialRows.length === 0 ? (
                  <p className="text-muted-foreground px-5 py-8 text-center text-sm">
                    No transactions detected. Check that the file has a header
                    row with date and amount columns.
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="mt-0 mx-0 mb-0 gap-2 border-t rounded-b-xl rounded-t-none bg-muted/50 px-5 py-3 sm:items-center sm:justify-between">
          <p className="text-muted-foreground text-xs">
            {fileMeta && parseResult
              ? `${selectedCount} selected · ${importableCount} ready${
                  issuesCount
                    ? ` · ${issuesCount} need a category`
                    : ""
                }`
              : "Pick a statement file to begin."}
          </p>
          <div className="flex gap-2">
            <DialogClose
              render={
                <Button
                  type="button"
                  variant="outline"
                  className="cursor-pointer"
                  disabled={pending}
                />
              }
            >
              Cancel
            </DialogClose>
            <Button
              type="button"
              className="cursor-pointer"
              disabled={
                pending ||
                !parseResult ||
                importableCount === 0 ||
                issuesCount > 0
              }
              onClick={handleImport}
            >
              {pending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : null}
              Import {importableCount} transaction
              {importableCount === 1 ? "" : "s"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}