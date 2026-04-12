"use client";

import { upsertBudget } from "@/actions/budgets";
import { Button } from "@/components/ui/button";
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
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SetBudgetForm({
  walletId,
  expenseCategories,
  defaultMonth,
}: {
  walletId: string;
  expenseCategories: { id: string; name: string }[];
  defaultMonth: Date;
}) {
  const router = useRouter();
  const [categoryId, setCategoryId] = useState(expenseCategories[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [month, setMonth] = useState(
    `${defaultMonth.getFullYear()}-${String(defaultMonth.getMonth() + 1).padStart(2, "0")}`,
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseInrInput(amount);
    if (!categoryId || amt <= 0) return;
    const [y, m] = month.split("-").map(Number);
    const yearMonth = new Date(y!, (m ?? 1) - 1, 1);
    await upsertBudget({
      walletId,
      categoryId,
      yearMonth,
      amount: amt,
    });
    setAmount("");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-3">
      <div className="space-y-2">
        <Label>Month</Label>
        <Input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="w-[180px]"
        />
      </div>
      <div className="space-y-2">
        <Label>Category</Label>
        <Select
          value={categoryId}
          onValueChange={(v) => v && setCategoryId(v)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {expenseCategories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Budget (₹)</Label>
        <Input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          className="w-[120px]"
        />
      </div>
      <Button type="submit">Save budget</Button>
    </form>
  );
}
