"use client";

import { createCategory, deleteCategory } from "@/actions/categories";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  CATEGORY_COLOR_OPTIONS,
  CategoryIconShelf,
} from "@/lib/category-color";
import { CATEGORY_ICON_OPTIONS } from "@/lib/category-icon";
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
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

const createFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(80),
  type: z.enum(["income", "expense"]),
  icon: z.enum(CATEGORY_ICON_OPTIONS as unknown as [string, ...string[]]),
  color: z.enum(CATEGORY_COLOR_OPTIONS as unknown as [string, ...string[]]),
});

type CreateFormValues = z.infer<typeof createFormSchema>;

function formatCategoryIconLabel(iconId: string) {
  return iconId
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

type CategoryRow = {
  id: string;
  name: string;
  type: string;
  icon: string | null;
  color: string;
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
      color: CATEGORY_COLOR_OPTIONS[0],
    },
  });

  const selectedIcon = form.watch("icon");
  const selectedColor = form.watch("color");

  async function onCreate(values: CreateFormValues) {
    setFormError(null);
    startTransition(async () => {
      try {
        await createCategory(values);
        setAddOpen(false);
        form.reset({
          name: "",
          type: "expense",
          icon: "tag",
          color: CATEGORY_COLOR_OPTIONS[0],
        });
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
                Choose a name, type, color, and icon. The color appears behind
                the icon everywhere this category is shown.
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
                      <SelectTrigger className="w-full min-w-0">
                        <SelectValue placeholder="Type">
                          {field.value === "expense" ? "Expense" : "Income"}
                        </SelectValue>
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
                <Label>Color</Label>
                <div className="grid grid-cols-6 gap-2">
                  {CATEGORY_COLOR_OPTIONS.map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      title={hex}
                      onClick={() =>
                        form.setValue("color", hex, { shouldValidate: true })
                      }
                      className={cn(
                        "flex size-10 items-center justify-center rounded-lg border-2 border-transparent",
                        selectedColor === hex && "border-primary",
                      )}
                    >
                      <span
                        className="size-6 rounded-md"
                        style={{
                          backgroundColor: `color-mix(in srgb, ${hex} 35%, transparent)`,
                          boxShadow: `inset 0 0 0 1px ${hex}`,
                        }}
                      />
                    </button>
                  ))}
                </div>
                {form.formState.errors.color ? (
                  <p className="text-destructive text-sm">
                    {form.formState.errors.color.message}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="category-icon-picker">Icon</Label>
                <Popover>
                  <PopoverTrigger
                    id="category-icon-picker"
                    className={cn(
                      "w-full min-w-0 cursor-pointer rounded-lg border border-input bg-transparent p-0 text-sm shadow-xs transition-colors outline-none select-none",
                      "hover:bg-accent/50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                      "dark:bg-input/30 dark:hover:bg-input/50",
                    )}
                  >
                    <span className="flex min-h-10 w-full items-center gap-3 py-2 pl-5 pr-3">
                      <CategoryIconShelf
                        icon={selectedIcon}
                        color={selectedColor}
                        className="size-8 shrink-0 self-center"
                        iconClassName="size-4"
                      />
                      <span className="min-w-0 flex-1 truncate text-left text-sm font-medium leading-snug">
                        {formatCategoryIconLabel(selectedIcon)}
                      </span>
                      <ChevronDown
                        className="size-4 shrink-0 self-center text-muted-foreground"
                        aria-hidden
                      />
                    </span>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[min(calc(100vw-2rem),22rem)] p-0"
                    align="start"
                  >
                    <div className="text-muted-foreground border-b px-3 py-2 text-xs font-medium">
                      Choose an icon
                    </div>
                    <ScrollArea className="h-56 p-2">
                      <div className="grid grid-cols-6 gap-1.5">
                        {CATEGORY_ICON_OPTIONS.map((iconName) => (
                          <button
                            key={iconName}
                            type="button"
                            title={formatCategoryIconLabel(iconName)}
                            onClick={() => {
                              form.setValue("icon", iconName, {
                                shouldValidate: true,
                              });
                            }}
                            className={cn(
                              "flex size-11 items-center justify-center rounded-lg border border-transparent transition-colors hover:bg-muted/80",
                              selectedIcon === iconName &&
                                "border-primary bg-muted/60 ring-2 ring-primary/25",
                            )}
                          >
                            <CategoryIconShelf
                              icon={iconName}
                              color={selectedColor}
                              className="size-9"
                              iconClassName="size-4"
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
                    <CategoryIconShelf
                      icon={c.icon}
                      color={c.color}
                      className="size-8"
                      iconClassName="size-4"
                    />
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
