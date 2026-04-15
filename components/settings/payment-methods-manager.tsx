"use client";

import {
  createPaymentMethod,
  deletePaymentMethod,
  updatePaymentMethod,
} from "@/actions/payment-methods";
import { Button } from "@/components/ui/button";
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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(80),
});

type FormValues = z.infer<typeof formSchema>;

export type PaymentMethodRow = {
  id: string;
  name: string;
  sortOrder: number;
};

export function PaymentMethodsManager({
  methods,
  usageByName,
}: {
  methods: PaymentMethodRow[];
  usageByName: Record<string, number>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "" },
  });

  function openCreate() {
    setEditingId(null);
    setFormError(null);
    form.reset({ name: "" });
    setDialogOpen(true);
  }

  function openEdit(m: PaymentMethodRow) {
    setEditingId(m.id);
    setFormError(null);
    form.reset({ name: m.name });
    setDialogOpen(true);
  }

  async function onSubmit(values: FormValues) {
    setFormError(null);
    startTransition(async () => {
      try {
        if (editingId) {
          await updatePaymentMethod({
            paymentMethodId: editingId,
            name: values.name,
          });
        } else {
          await createPaymentMethod({ name: values.name });
        }
        setDialogOpen(false);
        setEditingId(null);
        form.reset({ name: "" });
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
        await deletePaymentMethod(deleteId);
        setDeleteId(null);
        router.refresh();
      } catch (e) {
        setDeleteError(
          e instanceof Error ? e.message : "Could not delete payment method",
        );
      }
    });
  }

  const sorted = [...methods].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.name.localeCompare(b.name);
  });

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle>Payment methods</CardTitle>
          <CardDescription>
            Options shown when you add a transaction (e.g. Cash, Card, UPI).
            Renaming a method updates existing transactions that use it.
          </CardDescription>
        </div>
        <Button
          type="button"
          size="sm"
          className="gap-1"
          onClick={openCreate}
        >
          <Plus className="size-4" />
          Add method
        </Button>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setEditingId(null);
              form.reset({ name: "" });
              setFormError(null);
            }
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Edit payment method" : "New payment method"}
              </DialogTitle>
              <DialogDescription>
                Use a short label you will recognize on your statement or in
                exports.
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="pm-name">Name</Label>
                <Input
                  id="pm-name"
                  placeholder="e.g. Bank transfer"
                  {...form.register("name")}
                />
                {form.formState.errors.name ? (
                  <p className="text-destructive text-sm">
                    {form.formState.errors.name.message}
                  </p>
                ) : null}
              </div>
              {formError ? (
                <p className="text-destructive text-sm">{formError}</p>
              ) : null}
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={pending}>
                  {editingId ? "Save" : "Create"}
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
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Transactions</TableHead>
              <TableHead className="w-[52px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((m) => {
              const n = usageByName[m.name] ?? 0;
              const blocked = n > 0;
              return (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.name}</TableCell>
                  <TableCell className="text-muted-foreground text-right text-sm">
                    {n === 0 ? "—" : `${n} transaction${n === 1 ? "" : "s"}`}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-0.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        disabled={pending}
                        title="Edit payment method"
                        onClick={() => openEdit(m)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive hover:text-destructive"
                        disabled={blocked || pending}
                        title={
                          blocked
                            ? "Remove or reassign transactions using this method first"
                            : "Delete payment method"
                        }
                        onClick={() => {
                          setDeleteError(null);
                          setDeleteId(m.id);
                        }}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {sorted.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-muted-foreground py-8 text-center"
                >
                  No payment methods yet.
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
              <DialogTitle>Delete payment method?</DialogTitle>
              <DialogDescription>
                {deleteId ? (
                  <>
                    Remove{" "}
                    <span className="text-foreground font-medium">
                      {sorted.find((m) => m.id === deleteId)?.name ?? "this"}
                    </span>
                    . It must not be used by any transactions.
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
