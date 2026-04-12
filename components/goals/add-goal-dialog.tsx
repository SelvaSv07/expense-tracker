"use client";

import { createGoal } from "@/actions/goals";
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
import { parseInrInput } from "@/lib/money";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1),
  targetAmount: z.string().min(1),
  targetDate: z.string().optional(),
  notes: z.string().optional(),
});

type Form = z.infer<typeof schema>;

export function AddGoalDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const form = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", targetAmount: "", targetDate: "", notes: "" },
  });

  async function onSubmit(values: Form) {
    const amt = parseInrInput(values.targetAmount);
    if (amt <= 0) return;
    await createGoal({
      name: values.name,
      targetAmount: amt,
      targetDate: values.targetDate
        ? new Date(values.targetDate)
        : undefined,
      notes: values.notes,
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
        Add goal
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New savings goal</DialogTitle>
          <DialogDescription>
            Track progress toward a target amount.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...form.register("name")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="targetAmount">Target (₹)</Label>
            <Input id="targetAmount" {...form.register("targetAmount")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="targetDate">Target date</Label>
            <Input id="targetDate" type="date" {...form.register("targetDate")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input id="notes" {...form.register("notes")} />
          </div>
          <DialogFooter>
            <Button type="submit">Create</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
