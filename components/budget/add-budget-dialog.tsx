"use client";

import { upsertBudget } from "@/actions/budgets";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CategoryIconShelf,
  categoryIconShelfBorderStyle,
} from "@/lib/category-color";
import { parseInrInput } from "@/lib/money";
import { cn } from "@/lib/utils";
import { CalendarDays, Plus, Repeat2 } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  cloneElement,
  isValidElement,
  useCallback,
  useState,
  useTransition,
  type ReactElement,
  type ReactNode,
} from "react";

function mergeDialogOpenTrigger(
  node: ReactNode,
  onOpen: () => void,
  disabled?: boolean,
): ReactNode {
  if (!isValidElement(node)) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          onOpen();
        }}
        className={cn(buttonVariants({ size: "sm" }), "cursor-pointer gap-1")}
      >
        {node}
      </button>
    );
  }
  const el = node as ReactElement<{
    onClick?: (e: React.MouseEvent) => void;
    className?: string;
    disabled?: boolean;
  }>;
  return cloneElement(el, {
    className: cn("cursor-pointer", el.props.className),
    disabled: disabled || el.props.disabled,
    onClick: (e: React.MouseEvent) => {
      el.props.onClick?.(e);
      if (disabled || el.props.disabled) return;
      onOpen();
    },
  });
}

export type BudgetExpenseCategory = {
  id: string;
  name: string;
  icon: string | null;
  color: string;
};

function monthInputValue(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function categoryTriggerShelf(c: BudgetExpenseCategory) {
  return (
    <CategoryIconShelf
      icon={c.icon}
      color={c.color}
      className="size-9 shrink-0 border p-1.5"
      style={categoryIconShelfBorderStyle(c.color)}
      iconClassName="size-4"
    />
  );
}

export function AddBudgetDialog({
  expenseCategories,
  defaultMonth,
  trigger,
}: {
  expenseCategories: BudgetExpenseCategory[];
  defaultMonth: Date;
  /** Optional trigger; defaults to “Add budget”. */
  trigger?: ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [budgetType, setBudgetType] = useState<"month" | "recurring">("month");
  const [month, setMonth] = useState(monthInputValue(defaultMonth));
  const [categoryId, setCategoryId] = useState(
    expenseCategories[0]?.id ?? "",
  );
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);

  const resetFormForOpen = useCallback(() => {
    setBudgetType("month");
    setMonth(monthInputValue(defaultMonth));
    setCategoryId(expenseCategories[0]?.id ?? "");
    setAmount("");
    setError(null);
  }, [defaultMonth, expenseCategories]);

  const sortedCategories = [...expenseCategories].sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  const selected = sortedCategories.find((c) => c.id === categoryId);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const amt = parseInrInput(amount);
    if (!categoryId) {
      setError("Choose a category.");
      return;
    }
    if (amt <= 0) {
      setError("Enter a positive budget amount.");
      return;
    }
    const [y, m] = month.split("-").map(Number);
    const monthDate = new Date(y!, (m ?? 1) - 1, 1);
    startTransition(async () => {
      try {
        await upsertBudget({
          categoryId,
          amount: amt,
          recurring: budgetType === "recurring",
          month: monthDate,
        });
        setOpen(false);
        router.refresh();
      } catch {
        setError("Could not save budget.");
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) resetFormForOpen();
      }}
    >
      {trigger ? (
        mergeDialogOpenTrigger(
          trigger,
          () => {
            resetFormForOpen();
            setOpen(true);
          },
          expenseCategories.length === 0,
        )
      ) : (
        <DialogTrigger
          className={cn(buttonVariants({ size: "sm" }), "gap-1")}
          disabled={expenseCategories.length === 0}
        >
          <Plus className="size-4" />
          Add budget
        </DialogTrigger>
      )}
      <DialogContent className="gap-3 px-4 pt-3 pb-4 sm:max-w-md">
        <DialogHeader className="pr-8 pb-2 text-left">
          <DialogTitle>Add budget</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <div className="mb-5 space-y-2">
            <Label>Type</Label>
            <Tabs
              value={budgetType}
              onValueChange={(v) =>
                setBudgetType(v === "recurring" ? "recurring" : "month")
              }
            >
              <TabsList
                variant="line"
                className="grid h-auto w-full grid-cols-2 gap-2 bg-transparent p-0"
              >
                <TabsTrigger
                  value="month"
                  className={cn(
                    "h-11 cursor-pointer gap-2 border-2 py-2 shadow-none after:hidden",
                    "border-[color-mix(in_srgb,var(--cazura-teal-mid)35%,transparent)] bg-[color-mix(in_srgb,var(--cazura-teal-mid)10%,transparent)]",
                    "text-[var(--cazura-teal-mid)] [&_svg]:text-[var(--cazura-teal-mid)]",
                    "data-active:!border-[var(--cazura-teal-mid)] data-active:!bg-[var(--cazura-teal-mid)] data-active:!text-white data-active:!shadow-none data-active:[&_svg]:!text-white",
                    "hover:opacity-90",
                  )}
                >
                  <CalendarDays className="size-4 shrink-0" strokeWidth={1.8} />
                  Month
                </TabsTrigger>
                <TabsTrigger
                  value="recurring"
                  className={cn(
                    "h-11 cursor-pointer gap-2 border-2 py-2 shadow-none after:hidden",
                    "border-[color-mix(in_srgb,#7c3aed35%,transparent)] bg-[color-mix(in_srgb,#7c3aed12%,transparent)]",
                    "text-[#7c3aed] [&_svg]:text-[#7c3aed]",
                    "data-active:!border-[#7c3aed] data-active:!bg-[#7c3aed] data-active:!text-white data-active:!shadow-none data-active:[&_svg]:!text-white",
                    "hover:opacity-90",
                  )}
                >
                  <Repeat2 className="size-4 shrink-0" strokeWidth={1.8} />
                  Recurring
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="space-y-2">
            <Label htmlFor="budget-month">
              {budgetType === "month" ? "Month" : "Starts from"}
            </Label>
            <Input
              id="budget-month"
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              modal={false}
              value={categoryId ? categoryId : null}
              onValueChange={(v) => setCategoryId(v ?? "")}
            >
              <SelectTrigger className="!h-auto min-h-14 w-full min-w-0 cursor-pointer rounded-lg py-2.5 pl-2.5">
                <SelectValue placeholder="Choose category">
                  {selected ? (
                    <span className="flex min-w-0 items-center gap-3">
                      {categoryTriggerShelf(selected)}
                      <span className="truncate font-medium">{selected.name}</span>
                    </span>
                  ) : null}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {sortedCategories.map((c) => (
                  <SelectItem
                    key={c.id}
                    value={c.id}
                    className="cursor-pointer py-3"
                  >
                    <span className="flex items-center gap-3">
                      {categoryTriggerShelf(c)}
                      <span>{c.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {expenseCategories.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No expense categories yet. Add one in Settings.
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="budget-amount">Budget amount (INR)</Label>
            <Input
              id="budget-amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="h-11"
            />
          </div>

          {error ? (
            <p className="text-destructive text-sm">{error}</p>
          ) : null}

          <DialogFooter className="mt-1 gap-2 sm:justify-end">
            <DialogClose
              render={
                <Button type="button" variant="outline" className="cursor-pointer" />
              }
            >
              Cancel
            </DialogClose>
            <Button
              type="submit"
              className="cursor-pointer"
              disabled={pending || expenseCategories.length === 0}
            >
              Save budget
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
