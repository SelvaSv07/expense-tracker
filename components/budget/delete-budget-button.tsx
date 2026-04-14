"use client";

import { deleteBudget } from "@/actions/budgets";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function DeleteBudgetButton({ budgetId }: { budgetId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className="text-destructive hover:text-destructive"
      disabled={pending}
      title="Remove budget for this month"
      onClick={() => {
        if (
          !confirm(
            "Remove this category budget for this month? Spending history is not deleted.",
          )
        ) {
          return;
        }
        startTransition(async () => {
          await deleteBudget(budgetId);
          router.refresh();
        });
      }}
    >
      <Trash2 className="size-4" />
    </Button>
  );
}
