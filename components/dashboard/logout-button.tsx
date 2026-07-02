"use client";

import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export function LogoutButton({ collapsed }: { collapsed?: boolean }) {
  const router = useRouter();
  return (
    <button
      type="button"
      title={collapsed ? "Logout" : undefined}
      className={cn(
        "text-[var(--cazura-red)] hover:bg-[var(--cazura-panel)] flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-[7px] text-[13px] font-medium transition-colors",
        collapsed && "justify-center px-0",
      )}
      onClick={async () => {
        await authClient.signOut();
        router.push("/sign-in");
        router.refresh();
      }}
    >
      <LogOut className="size-[17px] shrink-0" strokeWidth={1.8} />
      {!collapsed ? "Logout" : null}
    </button>
  );
}
