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

export function TransactionRowActions({ id }: { id: string }) {
  const router = useRouter();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "size-8",
        )}
      >
        <MoreHorizontal className="size-4" />
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
