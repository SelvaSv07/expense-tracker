"use client";

import { upsertBudget } from "@/actions/budgets";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { CategoryIconShelf } from "@/lib/category-color";
import { parseInrInput } from "@/lib/money";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

export type BudgetExpenseCategory = {
  id: string;
  name: string;
  icon: string | null;
};

function monthInputValue(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function AddBudgetDialog({
  expenseCategories,
  defaultMonth,
}: {
  expenseCategories: BudgetExpenseCategory[];
  defaultMonth: Date;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [month, setMonth] = useState(monthInputValue(defaultMonth));
  const [categoryId, setCategoryId] = useState(
    expenseCategories[0]?.id ?? "",
  );
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setMonth(monthInputValue(defaultMonth));
    setCategoryId(expenseCategories[0]?.id ?? "");
    setAmount("");
    setError(null);
  }, [open, defaultMonth, expenseCategories]);

  const selected = expenseCategories.find((c) => c.id === categoryId);

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
    const yearMonth = new Date(y!, (m ?? 1) - 1, 1);
    startTransition(async () => {
      try {
        await upsertBudget({
          categoryId,
          yearMonth,
          amount: amt,
        });
        setOpen(false);
        router.refresh();
      } catch {
        setError("Could not save budget.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className={cn(buttonVariants({ size: "sm" }), "gap-1")}
        disabled={expenseCategories.length === 0}
      >
        <Plus className="size-4" />
        Add budget
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add budget</DialogTitle>
          <DialogDescription>
            Set a spending limit for one expense category in a calendar month.
            Spending is tracked only in that month. Other months stay
            independent—add budgets there when you need them.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="budget-month">Month</Label>
            <Input
              id="budget-month"
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={categoryId}
              onValueChange={(v) => setCategoryId(v ?? "")}
            >
              <SelectTrigger className="w-full min-w-0">
                <SelectValue placeholder="Choose category">
                  {selected ? (
                    <span className="flex items-center gap-2">
                      <CategoryIconShelf
                        icon={selected.icon}
                        color={selected.color}
                        className="size-8"
                        iconClassName="size-4"
                      />
                      <span className="truncate">{selected.name}</span>
                    </span>
                  ) : null}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {expenseCategories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <CategoryIconShelf
                      icon={c.icon}
                      color={c.color}
                      className="size-8"
                      iconClassName="size-4"
                    />
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-muted-foreground text-xs">
              One budget per category per month. Saving again updates the
              amount.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="budget-amount">Budget amount</Label>
            <Input
              id="budget-amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />
          </div>
          {error ? (
            <p className="text-destructive text-sm">{error}</p>
          ) : null}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              Save budget
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
