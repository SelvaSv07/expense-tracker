"use client";

import { createCategory, deleteCategory } from "@/actions/categories";
import { Button, buttonVariants } from "@/components/ui/button";
import { CATEGORY_ICON_OPTIONS, CategoryIcon } from "@/lib/category-icon";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

const createFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(80),
  type: z.enum(["income", "expense"]),
  icon: z.enum(CATEGORY_ICON_OPTIONS as unknown as [string, ...string[]]),
});

type CreateFormValues = z.infer<typeof createFormSchema>;

type CategoryRow = {
  id: string;
  name: string;
  type: string;
  icon: string | null;
};

export function CategoriesManager({
  categories,
  usage,
}: {
  categories: CategoryRow[];
  usage: Record<string, { transactions: number; budgets: number }>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [addOpen, setAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const form = useForm<CreateFormValues>({
    resolver: zodResolver(createFormSchema),
    defaultValues: {
      name: "",
      type: "expense",
      icon: "tag",
    },
  });

  const selectedIcon = form.watch("icon");

  async function onCreate(values: CreateFormValues) {
    setFormError(null);
    startTransition(async () => {
      try {
        await createCategory(values);
        setAddOpen(false);
        form.reset({ name: "", type: "expense", icon: "tag" });
        router.refresh();
      } catch (e) {
        setFormError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  async function onConfirmDelete() {
    if (!deleteId) return;
    setDeleteError(null);
    startTransition(async () => {
      try {
        await deleteCategory(deleteId);
        setDeleteId(null);
        router.refresh();
      } catch (e) {
        setDeleteError(
          e instanceof Error ? e.message : "Could not delete category",
        );
      }
    });
  }

  const sorted = [...categories].sort((a, b) => {
    if (a.type !== b.type) return a.type.localeCompare(b.type);
    return a.name.localeCompare(b.name);
  });

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle>Categories</CardTitle>
          <CardDescription>
            Income and expense labels used across transactions and budgets.
            Delete is only allowed when a category has no transactions and no
            budget rows.
          </CardDescription>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger
            className={cn(buttonVariants({ size: "sm" }), "gap-1")}
          >
            <Plus className="size-4" />
            Add category
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>New category</DialogTitle>
              <DialogDescription>
                Choose a name, whether it counts as income or expense, and an
                icon.
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={form.handleSubmit(onCreate)}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="cat-name">Name</Label>
                <Input
                  id="cat-name"
                  placeholder="e.g. Subscriptions"
                  {...form.register("name")}
                />
                {form.formState.errors.name ? (
                  <p className="text-destructive text-sm">
                    {form.formState.errors.name.message}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Controller
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(v) =>
                        field.onChange(v as "income" | "expense")
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="expense">Expense</SelectItem>
                        <SelectItem value="income">Income</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label>Icon</Label>
                <Popover>
                  <PopoverTrigger
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      "w-full justify-start gap-2",
                    )}
                  >
                    <CategoryIcon
                      name={selectedIcon}
                      className="size-4 shrink-0"
                    />
                    <span className="text-muted-foreground text-sm">
                      {selectedIcon}
                    </span>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0" align="start">
                    <ScrollArea className="h-56 p-2">
                      <div className="grid grid-cols-6 gap-1">
                        {CATEGORY_ICON_OPTIONS.map((iconName) => (
                          <button
                            key={iconName}
                            type="button"
                            title={iconName}
                            onClick={() => {
                              form.setValue("icon", iconName, {
                                shouldValidate: true,
                              });
                            }}
                            className={cn(
                              "flex size-10 items-center justify-center rounded-md border border-transparent hover:bg-muted",
                              selectedIcon === iconName &&
                                "border-primary bg-muted",
                            )}
                          >
                            <CategoryIcon
                              name={iconName}
                              className="size-4"
                            />
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  </PopoverContent>
                </Popover>
                {form.formState.errors.icon ? (
                  <p className="text-destructive text-sm">
                    {form.formState.errors.icon.message}
                  </p>
                ) : null}
              </div>
              {formError ? (
                <p className="text-destructive text-sm">{formError}</p>
              ) : null}
              <DialogFooter>
                <Button type="submit" disabled={pending}>
                  Create
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12" />
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">In use</TableHead>
              <TableHead className="w-[52px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((c) => {
              const u = usage[c.id] ?? { transactions: 0, budgets: 0 };
              const blocked = u.transactions > 0 || u.budgets > 0;
              const useLabel =
                u.transactions > 0 && u.budgets > 0
                  ? `${u.transactions} tx, ${u.budgets} budget`
                  : u.transactions > 0
                    ? `${u.transactions} transaction${u.transactions === 1 ? "" : "s"}`
                    : u.budgets > 0
                      ? `${u.budgets} budget row${u.budgets === 1 ? "" : "s"}`
                      : "—";
              return (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="bg-muted flex size-8 items-center justify-center rounded-md">
                      <CategoryIcon
                        name={c.icon}
                        className="text-foreground size-4"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-muted-foreground capitalize">
                    {c.type}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-right text-sm">
                    {useLabel}
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive hover:text-destructive"
                      disabled={blocked || pending}
                      title={
                        blocked
                          ? "Remove transactions and budget rows using this category first"
                          : "Delete category"
                      }
                      onClick={() => {
                        setDeleteError(null);
                        setDeleteId(c.id);
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {sorted.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-muted-foreground py-8 text-center"
                >
                  No categories yet.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>

        <Dialog
          open={deleteId !== null}
          onOpenChange={(open) => {
            if (!open) {
              setDeleteId(null);
              setDeleteError(null);
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete category?</DialogTitle>
              <DialogDescription>
                {deleteId ? (
                  <>
                    Remove{" "}
                    <span className="text-foreground font-medium">
                      {sorted.find((c) => c.id === deleteId)?.name ?? "this"}
                    </span>{" "}
                    permanently. It must have no transactions and no budget
                    entries.
                  </>
                ) : null}
              </DialogDescription>
            </DialogHeader>
            {deleteError ? (
              <p className="text-destructive text-sm">{deleteError}</p>
            ) : null}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteId(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={pending}
                onClick={onConfirmDelete}
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
