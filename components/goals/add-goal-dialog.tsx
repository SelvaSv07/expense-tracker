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
import { DateOnlyPicker } from "@/components/ui/datetime-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseInrInput } from "@/lib/money";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  cloneElement,
  isValidElement,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

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

const schema = z.object({
  name: z.string().min(1, "Enter a goal name"),
  targetAmount: z.string().min(1, "Enter a target amount"),
  targetDate: z.string().optional(),
  notes: z.string().optional(),
});

type Form = z.infer<typeof schema>;

function localDateFromYmd(ymd: string): Date {
  const [y, mo, day] = ymd.split("-").map(Number);
  return new Date(y, mo - 1, day);
}

export function AddGoalDialog({
  trigger,
}: {
  trigger?: ReactElement;
}) {
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
        ? localDateFromYmd(values.targetDate)
        : undefined,
      notes: values.notes,
    });
    setOpen(false);
    form.reset();
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        mergeDialogOpenTrigger(trigger, () => setOpen(true))
      ) : (
        <DialogTrigger
          className={cn(buttonVariants({ size: "sm" }), "cursor-pointer gap-1")}
        >
          <Plus className="size-4" />
          Add goal
        </DialogTrigger>
      )}
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
            <Controller
              name="targetDate"
              control={form.control}
              render={({ field }) => (
                <DateOnlyPicker
                  id="targetDate"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            />
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
