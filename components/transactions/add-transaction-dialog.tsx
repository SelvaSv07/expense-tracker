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
import { parseInrInput } from "@/lib/money";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

const schema = z.object({
  categoryId: z.string().min(1),
  amount: z.string().min(1),
  occurredAt: z.string().min(1),
  note: z.string().optional(),
  paymentMethod: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function AddTransactionDialog({
  walletId,
  categories,
}: {
  walletId: string;
  categories: { id: string; name: string; type: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      occurredAt: new Date().toISOString().slice(0, 16),
      amount: "",
      categoryId: categories[0]?.id ?? "",
      note: "",
      paymentMethod: "Credit Card",
    },
  });

  async function onSubmit(values: FormValues) {
    const amt = parseInrInput(values.amount);
    if (amt <= 0) {
      form.setError("amount", { message: "Enter a positive amount" });
      return;
    }
    await createTransaction({
      walletId,
      categoryId: values.categoryId,
      amount: amt,
      occurredAt: new Date(values.occurredAt),
      note: values.note || undefined,
      paymentMethod: values.paymentMethod || undefined,
    });
    setOpen(false);
    form.reset();
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
            Amounts are always positive; category type determines income vs
            expense.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Category</Label>
            <Controller
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(v) => field.onChange(v ?? "")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}{" "}
                        <span className="text-muted-foreground">
                          ({c.type})
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
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
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
