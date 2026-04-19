"use client";

import {
  createSubscription,
  updateSubscription,
} from "@/actions/subscriptions";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { CategoryIconShelf } from "@/lib/category-color";
import { parseInrInput } from "@/lib/money";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  cloneElement,
  isValidElement,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { Controller, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { z } from "zod";

import type {
  PaymentMethodOption,
  TransactionCategoryOption,
} from "@/components/transactions/add-transaction-dialog";

const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
] as const;

const BILLING_DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

const formSchema = z
  .object({
    serviceName: z.string().min(1, "Required"),
    categoryId: z.string().min(1, "Choose a category"),
    amount: z.string().min(1, "Enter an amount"),
    paymentMethod: z.string().min(1, "Choose a payment method"),
    note: z.string().optional(),
    scheduleType: z.enum(["recurring", "until"]),
    billingDay: z.string().min(1),
    untilMonth: z.string().optional(),
    untilYear: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.scheduleType === "until") {
      if (!data.untilMonth) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Required",
          path: ["untilMonth"],
        });
      }
      const y = Number(data.untilYear);
      if (!data.untilYear?.trim() || !Number.isInteger(y) || y < 1990 || y > 2100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Valid year required",
          path: ["untilYear"],
        });
      }
    }
  });

type FormValues = z.infer<typeof formSchema>;

export type SubscriptionEditValues = {
  id: string;
  serviceName: string;
  amount: number;
  categoryId: string;
  paymentMethod: string | null;
  note: string | null;
  scheduleType: "recurring" | "until";
  billingDay: number;
  untilYear: number | null;
  untilMonth: number | null;
};

function mergeDialogOpenTrigger(
  node: ReactNode,
  onOpen: () => void,
): ReactNode {
  if (!isValidElement(node)) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className={cn(buttonVariants({ size: "sm" }), "cursor-pointer gap-1")}
      >
        {node}
      </button>
    );
  }
  const el = node as ReactElement<{
    onClick?: (e: React.MouseEvent) => void;
    className?: string;
  }>;
  return cloneElement(el, {
    className: cn("cursor-pointer", el.props.className),
    onClick: (e: React.MouseEvent) => {
      el.props.onClick?.(e);
      onOpen();
    },
  });
}

export function SubscriptionFormDialog({
  categories,
  paymentMethods,
  edit,
  onEditClear,
  trigger,
}: {
  categories: TransactionCategoryOption[];
  paymentMethods: PaymentMethodOption[];
  /** When set, dialog opens in edit mode until cleared. */
  edit: SubscriptionEditValues | null;
  onEditClear: () => void;
  trigger?: ReactNode;
}) {
  const router = useRouter();
  const expenseCategories = useMemo(
    () => categories.filter((c) => c.type === "expense"),
    [categories],
  );

  const defaults = useMemo(
    (): FormValues => ({
      serviceName: "",
      categoryId: expenseCategories[0]?.id ?? "",
      amount: "",
      paymentMethod: paymentMethods[0]?.name ?? "",
      note: "",
      scheduleType: "recurring",
      billingDay: "1",
      untilMonth: String(new Date().getUTCMonth() + 1),
      untilYear: String(new Date().getUTCFullYear()),
    }),
    [expenseCategories, paymentMethods],
  );

  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaults,
  });

  useEffect(() => {
    if (edit) {
      form.reset({
        serviceName: edit.serviceName,
        categoryId: edit.categoryId,
        amount: String(edit.amount),
        paymentMethod: edit.paymentMethod ?? paymentMethods[0]?.name ?? "",
        note: edit.note ?? "",
        scheduleType: edit.scheduleType,
        billingDay: String(edit.billingDay),
        untilMonth: edit.untilMonth != null ? String(edit.untilMonth) : defaults.untilMonth,
        untilYear:
          edit.untilYear != null ? String(edit.untilYear) : defaults.untilYear,
      });
      setServerError(null);
      setOpen(true);
    }
  }, [edit, form, paymentMethods, defaults]);

  const scheduleType = form.watch("scheduleType");

  async function onSubmit(values: FormValues) {
    setServerError(null);
    const amt = parseInrInput(values.amount);
    if (amt <= 0) {
      form.setError("amount", { message: "Enter a valid amount" });
      return;
    }

    const billingDay = Number(values.billingDay);
    const payload = {
      serviceName: values.serviceName,
      categoryId: values.categoryId,
      amount: amt,
      paymentMethod: values.paymentMethod,
      note: values.note?.trim() || undefined,
      scheduleType: values.scheduleType,
      billingDay,
      untilYear:
        values.scheduleType === "until"
          ? Number(values.untilYear)
          : undefined,
      untilMonth:
        values.scheduleType === "until"
          ? Number(values.untilMonth)
          : undefined,
    };

    try {
      if (edit) {
        await updateSubscription(edit.id, payload);
      } else {
        await createSubscription(payload);
      }
      setOpen(false);
      onEditClear();
      form.reset(defaults);
      router.refresh();
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          onEditClear();
          form.reset(defaults);
          setServerError(null);
        }
      }}
    >
      {trigger ? (
        mergeDialogOpenTrigger(trigger, () => {
          onEditClear();
          setServerError(null);
          form.reset(defaults);
          setOpen(true);
        })
      ) : null}

      <DialogContent className="max-h-[min(90vh,640px)] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {edit ? "Edit subscription" : "Add subscription"}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-3"
        >
          <div className="space-y-1.5">
            <Label htmlFor="sub-service">Service name</Label>
            <Input
              id="sub-service"
              placeholder="e.g. Netflix, home loan EMI"
              {...form.register("serviceName")}
            />
            {form.formState.errors.serviceName && (
              <p className="text-destructive text-xs">
                {form.formState.errors.serviceName.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sub-amount">Amount (INR)</Label>
            <Input id="sub-amount" inputMode="decimal" {...form.register("amount")} />
            {form.formState.errors.amount && (
              <p className="text-destructive text-xs">
                {form.formState.errors.amount.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Category</Label>
            <Controller
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseCategories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        <span className="flex items-center gap-2">
                          <CategoryIconShelf
                            icon={c.icon}
                            color={c.color}
                            className="size-7 rounded-md border p-1"
                            iconClassName="size-3.5"
                          />
                          {c.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.categoryId && (
              <p className="text-destructive text-xs">
                {form.formState.errors.categoryId.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Payment method</Label>
            <Controller
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Method" />
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
            {form.formState.errors.paymentMethod && (
              <p className="text-destructive text-xs">
                {form.formState.errors.paymentMethod.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sub-note">Note (optional)</Label>
            <Input id="sub-note" {...form.register("note")} />
          </div>

          <div className="space-y-2">
            <Label>Schedule</Label>
            <Controller
              control={form.control}
              name="scheduleType"
              render={({ field }) => (
                <Tabs
                  value={field.value}
                  onValueChange={(v) =>
                    field.onChange(v as "recurring" | "until")
                  }
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="recurring">Recurring</TabsTrigger>
                    <TabsTrigger value="until">Until end date</TabsTrigger>
                  </TabsList>
                </Tabs>
              )}
            />
            <p className="text-muted-foreground text-[11px] leading-snug">
              {scheduleType === "recurring"
                ? "A charge is recorded every month on the day you pick, for as long as the subscription exists."
                : "Charges run each month on that day through the end month you choose (good for EMIs)."}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>Payment day of month</Label>
            <Controller
              control={form.control}
              name="billingDay"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Day" />
                  </SelectTrigger>
                  <SelectContent className="max-h-48">
                    {BILLING_DAYS.map((d) => (
                      <SelectItem key={d} value={String(d)}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {scheduleType === "until" ? (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label>End month</Label>
                <Controller
                  control={form.control}
                  name="untilMonth"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Month" />
                      </SelectTrigger>
                      <SelectContent>
                        {MONTHS.map((m) => (
                          <SelectItem key={m.value} value={String(m.value)}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {form.formState.errors.untilMonth && (
                  <p className="text-destructive text-xs">
                    {form.formState.errors.untilMonth.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sub-until-y">End year</Label>
                <Input
                  id="sub-until-y"
                  inputMode="numeric"
                  {...form.register("untilYear")}
                />
                {form.formState.errors.untilYear && (
                  <p className="text-destructive text-xs">
                    {form.formState.errors.untilYear.message}
                  </p>
                )}
              </div>
            </div>
          ) : null}

          {serverError ? (
            <p className="text-destructive text-sm">{serverError}</p>
          ) : null}

          <DialogFooter className="gap-2 sm:justify-end">
            <DialogClose
              render={
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              }
            />
            <Button type="submit">{edit ? "Save" : "Add subscription"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
