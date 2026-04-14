"use client";

import { deleteBudget } from "@/actions/budgets";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function DeleteBudgetButton({
  budgetId,
  variant = "default",
}: {
  budgetId: string;
  variant?: "default" | "cazura-icon";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const cazura = variant === "cazura-icon";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      disabled={pending}
      title="Remove budget for this month"
      className={cn(
        !cazura && "text-destructive hover:text-destructive",
        cazura &&
          "size-8 rounded-md border shadow-none hover:bg-[var(--cazura-canvas)]",
      )}
      style={
        cazura
          ? {
              borderColor: "var(--cazura-border)",
              color: "var(--cazura-label)",
            }
          : undefined
      }
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
      {cazura ? (
        <MoreHorizontal className="size-3" strokeWidth={2} />
      ) : (
        <Trash2 className="size-4" />
      )}
    </Button>
  );
}
