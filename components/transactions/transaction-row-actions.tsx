"use client";

import { deleteTransaction } from "@/actions/transactions";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { MoreHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";

export function TransactionRowActions({
  id,
  variant = "default",
}: {
  id: string;
  variant?: "default" | "cazura";
}) {
  const router = useRouter();
  const cazura = variant === "cazura";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          cazura
            ? "size-[30px] rounded-md border shadow-none"
            : "size-8",
        )}
        style={
          cazura
            ? {
                background: "var(--cazura-panel)",
                borderColor: "var(--cazura-border)",
              }
            : undefined
        }
      >
        <MoreHorizontal
          className={cn(cazura ? "size-3 text-[var(--cazura-label)]" : "size-4")}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          className="text-destructive"
          onClick={async () => {
            await deleteTransaction(id);
            router.refresh();
          }}
        >
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
