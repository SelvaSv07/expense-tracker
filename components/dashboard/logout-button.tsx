"use client";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  return (
    <Button
      variant="outline"
      className="w-full justify-start"
      type="button"
      onClick={async () => {
        await authClient.signOut();
        router.push("/sign-in");
        router.refresh();
      }}
    >
      <LogOut className="mr-2 size-4" />
      Logout
    </Button>
  );
}
