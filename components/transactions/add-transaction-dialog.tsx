"use client";

import { createTransaction } from "@/actions/transactions";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CategoryIcon } from "@/lib/category-icon";
import { parseInrInput } from "@/lib/money";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

function toDatetimeLocalValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const schema = z.object({
  kind: z.enum(["income", "expense"]),
  categoryId: z.string().min(1, "Choose a category"),
  amount: z.string().min(1),
  occurredAt: z.string().min(1),
  note: z.string().optional(),
  paymentMethod: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export type TransactionCategoryOption = {
  id: string;
  name: string;
  type: string;
  icon: string | null;
};

export function AddTransactionDialog({
  categories,
}: {
  categories: TransactionCategoryOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const defaults = useMemo(() => {
    const expense = categories.filter((c) => c.type === "expense");
    const income = categories.filter((c) => c.type === "income");
    if (expense.length > 0) {
      return { kind: "expense" as const, categoryId: expense[0]!.id };
    }
    if (income.length > 0) {
      return { kind: "income" as const, categoryId: income[0]!.id };
    }
    return { kind: "expense" as const, categoryId: "" };
  }, [categories]);

  const expenseCount = useMemo(
    () => categories.filter((c) => c.type === "expense").length,
    [categories],
  );
  const incomeCount = useMemo(
    () => categories.filter((c) => c.type === "income").length,
    [categories],
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      kind: defaults.kind,
      categoryId: defaults.categoryId,
      occurredAt: toDatetimeLocalValue(new Date()),
      amount: "",
      note: "",
      paymentMethod: "Credit Card",
    },
  });

  const kind = form.watch("kind");
  const filteredCategories = useMemo(
    () => categories.filter((c) => c.type === kind),
    [categories, kind],
  );

  useEffect(() => {
    const currentId = form.getValues("categoryId");
    if (filteredCategories.some((c) => c.id === currentId)) return;
    form.setValue("categoryId", filteredCategories[0]?.id ?? "", {
      shouldValidate: true,
    });
  }, [kind, filteredCategories, form]);

  async function onSubmit(values: FormValues) {
    const amt = parseInrInput(values.amount);
    if (amt <= 0) {
      form.setError("amount", { message: "Enter a positive amount" });
      return;
    }
    await createTransaction({
      categoryId: values.categoryId,
      amount: amt,
      occurredAt: new Date(values.occurredAt),
      note: values.note || undefined,
      paymentMethod: values.paymentMethod || undefined,
    });
    setOpen(false);
    form.reset({
      kind: defaults.kind,
      categoryId: defaults.categoryId,
      occurredAt: toDatetimeLocalValue(new Date()),
      amount: "",
      note: "",
      paymentMethod: "Credit Card",
    });
    router.refresh();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          const d = defaults;
          form.reset({
            kind: d.kind,
            categoryId: d.categoryId,
            occurredAt: toDatetimeLocalValue(new Date()),
            amount: "",
            note: "",
            paymentMethod: "Credit Card",
          });
        }
      }}
    >
      <DialogTrigger
        className={cn(buttonVariants({ size: "sm" }), "gap-1")}
      >
        <Plus className="size-4" />
        Add transaction
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add transaction</DialogTitle>
          <DialogDescription>
            Choose income or expense, then a category. Amounts are always
            positive.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Type</Label>
            <Controller
              control={form.control}
              name="kind"
              render={({ field }) => (
                <Tabs
                  value={field.value}
                  onValueChange={(v) => {
                    const nextKind = v as "income" | "expense";
                    field.onChange(nextKind);
                    const nextList = categories.filter(
                      (c) => c.type === nextKind,
                    );
                    form.setValue("categoryId", nextList[0]?.id ?? "", {
                      shouldValidate: true,
                    });
                  }}
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="expense" disabled={expenseCount === 0}>
                      Expense
                    </TabsTrigger>
                    <TabsTrigger value="income" disabled={incomeCount === 0}>
                      Income
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              )}
            />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Controller
              control={form.control}
              name="categoryId"
              render={({ field }) => {
                const selected = filteredCategories.find(
                  (c) => c.id === field.value,
                );
                return (
                  <Select
                    value={field.value ?? ""}
                    onValueChange={(v) => field.onChange(v ?? "")}
                  >
                    <SelectTrigger className="w-full min-w-0">
                      <SelectValue placeholder="Choose category">
                        {selected ? (
                          <span className="flex items-center gap-2">
                            <CategoryIcon
                              name={selected.icon}
                              className="size-4 shrink-0"
                            />
                            <span className="truncate">{selected.name}</span>
                          </span>
                        ) : null}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {filteredCategories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          <CategoryIcon
                            name={c.icon}
                            className="size-4 shrink-0"
                          />
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                );
              }}
            />
            {form.formState.errors.categoryId ? (
              <p className="text-destructive text-sm">
                {form.formState.errors.categoryId.message}
              </p>
            ) : null}
            {filteredCategories.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No {kind} categories yet. Add one in Settings.
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (₹)</Label>
            <Input id="amount" {...form.register("amount")} placeholder="0.00" />
            {form.formState.errors.amount ? (
              <p className="text-destructive text-sm">
                {form.formState.errors.amount.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="occurredAt">Date & time</Label>
            <Input
              id="occurredAt"
              type="datetime-local"
              {...form.register("occurredAt")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Method</Label>
            <Input id="paymentMethod" {...form.register("paymentMethod")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="note">Note</Label>
            <Input id="note" {...form.register("note")} />
          </div>
          <DialogFooter>
            <Button
              type="submit"
              disabled={filteredCategories.length === 0}
            >
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
