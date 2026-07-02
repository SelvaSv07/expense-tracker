"use client";

import { updateTransaction } from "@/actions/transactions";
import type { ActivityRow } from "@/components/transactions/activity-row";
import type {
  PaymentMethodOption,
  TransactionCategoryOption,
} from "@/components/transactions/add-transaction-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DatePicker,
  TimeField,
  toDatetimeLocalValue,
} from "@/components/ui/datetime-picker";
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
import { CategoryIconShelf } from "@/lib/category-color";
import { parseInrInput } from "@/lib/money";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { TrendingDown, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const schema = z.object({
  kind: z.enum(["income", "expense"]),
  categoryId: z.string().min(1, "Choose a category"),
  amount: z.string().min(1, "Enter an amount"),
  occurredAt: z.string().min(1, "Choose date and time"),
  transactionName: z.string().optional(),
  note: z.string().optional(),
  paymentMethod: z.string().min(1, "Choose a payment method"),
});

type FormValues = z.infer<typeof schema>;

export function EditTransactionDialog({
  row,
  categories,
  paymentMethods,
  open,
  onOpenChange,
}: {
  row: ActivityRow | null;
  categories: TransactionCategoryOption[];
  paymentMethods: PaymentMethodOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const expenseCount = useMemo(
    () => categories.filter((c) => c.type === "expense").length,
    [categories],
  );
  const incomeCount = useMemo(
    () => categories.filter((c) => c.type === "income").length,
    [categories],
  );

  const form = useForm<FormValues>({
    mode: "onSubmit",
    reValidateMode: "onChange",
    resolver: zodResolver(schema),
    defaultValues: {
      kind: "expense",
      categoryId: "",
      occurredAt: toDatetimeLocalValue(new Date()),
      amount: "",
      transactionName: "",
      note: "",
      paymentMethod: "",
    },
  });

  const kind = form.watch("kind");
  const { isSubmitted } = form.formState;
  const filteredCategories = useMemo(
    () =>
      categories
        .filter((c) => c.type === kind)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [categories, kind],
  );

  useEffect(() => {
    if (!row || !open) return;
    const categoryId =
      row.categoryId ??
      categories.find(
        (c) => c.name === row.categoryName && c.type === row.categoryType,
      )?.id ??
      "";
    form.reset({
      kind: row.categoryType,
      categoryId,
      occurredAt: toDatetimeLocalValue(new Date(row.occurredAt)),
      amount: String(row.amount),
      transactionName: row.transactionName ?? "",
      note: row.note ?? "",
      paymentMethod: row.paymentMethod ?? paymentMethods[0]?.name ?? "",
    });
  }, [row, open, categories, paymentMethods, form]);

  useEffect(() => {
    const currentId = form.getValues("categoryId");
    if (filteredCategories.some((c) => c.id === currentId)) return;
    form.setValue("categoryId", "", { shouldValidate: isSubmitted });
  }, [filteredCategories, form, isSubmitted]);

  async function onSubmit(values: FormValues) {
    if (!row) return;
    const amt = parseInrInput(values.amount);
    if (amt <= 0) {
      form.setError("amount", { message: "Enter a positive amount" });
      return;
    }

    try {
      await updateTransaction({
        id: row.id,
        categoryId: values.categoryId,
        amount: amt,
        occurredAt: new Date(values.occurredAt),
        transactionName: values.transactionName || undefined,
        note: values.note || undefined,
        paymentMethod: values.paymentMethod,
      });
      onOpenChange(false);
      router.refresh();
      toast.success("Transaction updated");
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Could not update transaction";
      toast.error(msg);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-3 px-4 pt-3 pb-4">
        <DialogHeader className="pr-8 pb-2 text-left">
          <DialogTitle>Edit transaction</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-3"
        >
          <div className="space-y-2 pb-4">
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
                    const nextList = categories
                      .filter((c) => c.type === nextKind)
                      .sort((a, b) => a.name.localeCompare(b.name));
                    form.setValue("categoryId", nextList[0]?.id ?? "", {
                      shouldValidate: form.formState.isSubmitted,
                    });
                  }}
                >
                  <TabsList
                    variant="line"
                    className="grid h-auto w-full grid-cols-2 gap-2 bg-transparent p-0"
                  >
                    <TabsTrigger
                      value="expense"
                      disabled={expenseCount === 0}
                      className={cn(
                        "h-11 cursor-pointer gap-2 border-2 py-2 shadow-none after:hidden",
                        "border-[color-mix(in_srgb,var(--cazura-red)35%,transparent)] bg-[color-mix(in_srgb,var(--cazura-red)8%,transparent)]",
                        "text-[var(--cazura-red)] [&_svg]:text-[var(--cazura-red)]",
                        "data-active:!border-[var(--cazura-red)] data-active:!bg-[var(--cazura-red)] data-active:!text-white data-active:!shadow-none data-active:[&_svg]:!text-white",
                        "hover:opacity-90 disabled:cursor-not-allowed",
                      )}
                    >
                      <TrendingDown className="size-4 shrink-0" />
                      Expenses
                    </TabsTrigger>
                    <TabsTrigger
                      value="income"
                      disabled={incomeCount === 0}
                      className={cn(
                        "h-11 cursor-pointer gap-2 border-2 py-2 shadow-none after:hidden",
                        "border-[color-mix(in_srgb,var(--cazura-teal-mid)35%,transparent)] bg-[color-mix(in_srgb,var(--cazura-teal-mid)10%,transparent)]",
                        "text-[var(--cazura-teal-mid)] [&_svg]:text-[var(--cazura-teal-mid)]",
                        "data-active:!border-[var(--cazura-teal-mid)] data-active:!bg-[var(--cazura-teal-mid)] data-active:!text-white data-active:!shadow-none data-active:[&_svg]:!text-white",
                        "hover:opacity-90 disabled:cursor-not-allowed",
                      )}
                    >
                      <TrendingUp className="size-4 shrink-0" />
                      Income
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              )}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-transactionName">Transaction name</Label>
            <Input
              id="edit-transactionName"
              {...form.register("transactionName")}
              placeholder="e.g. Weekly groceries"
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
                    modal={false}
                    value={field.value ? field.value : null}
                    onValueChange={(v) => field.onChange(v ?? "")}
                  >
                    <SelectTrigger className="!h-auto min-h-8 w-full min-w-0 cursor-pointer py-1.5">
                      <SelectValue placeholder="Choose category">
                        {selected ? (
                          <span className="flex min-h-0 items-center gap-2">
                            <CategoryIconShelf
                              icon={selected.icon}
                              color={selected.color}
                              title={selected.name}
                              className="size-6 shrink-0 rounded-md"
                              iconClassName="size-3.5"
                            />
                            <span className="truncate">{selected.name}</span>
                          </span>
                        ) : null}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {filteredCategories.map((c) => (
                        <SelectItem
                          key={c.id}
                          value={c.id}
                          className="cursor-pointer"
                        >
                          <CategoryIconShelf
                            icon={c.icon}
                            color={c.color}
                            title={c.name}
                            className="size-8"
                            iconClassName="size-4"
                          />
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                );
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-amount">Amount (INR)</Label>
            <Input id="edit-amount" {...form.register("amount")} placeholder="0" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-occurredAt-date">Date</Label>
              <Controller
                control={form.control}
                name="occurredAt"
                render={({ field }) => (
                  <DatePicker
                    id="edit-occurredAt-date"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-occurredAt-time">Time</Label>
              <Controller
                control={form.control}
                name="occurredAt"
                render={({ field }) => (
                  <TimeField
                    id="edit-occurredAt-time"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                )}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Payment method</Label>
            <Controller
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={paymentMethods.length === 0}
                >
                  <SelectTrigger className="w-full min-w-0">
                    <SelectValue placeholder="Choose method" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((m) => (
                      <SelectItem key={m.id} value={m.name}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-note">Note</Label>
            <Input id="edit-note" {...form.register("note")} />
          </div>
          <DialogFooter className="mt-0 gap-2 sm:justify-end">
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
              disabled={
                filteredCategories.length === 0 || paymentMethods.length === 0
              }
            >
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
