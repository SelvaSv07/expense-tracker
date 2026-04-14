"use client";

import { authClient } from "@/lib/auth-client";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="text-[var(--cazura-red)] hover:bg-[var(--cazura-panel)] flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-[7px] text-[13px] font-medium transition-colors"
      onClick={async () => {
        await authClient.signOut();
        router.push("/sign-in");
        router.refresh();
      }}
    >
      <LogOut className="size-[17px] shrink-0" strokeWidth={1.8} />
      Logout
    </button>
  );
}
