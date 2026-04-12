"use client";

import { setActiveWallet } from "@/actions/wallets";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Bell, ChevronDown, Search, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";

type WalletRow = {
  id: string;
  name: string;
  currency: string;
  isDefault: boolean;
};

export function AppHeader({
  user,
  wallets,
  activeWalletId,
}: {
  user: { name: string; email: string; image?: string | null };
  wallets: WalletRow[];
  activeWalletId: string;
}) {
  const router = useRouter();
  const active = wallets.find((w) => w.id === activeWalletId) ?? wallets[0];

  async function onWalletChange(id: string) {
    await setActiveWallet(id);
    router.refresh();
  }

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="bg-card sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b px-6">
      <div className="relative max-w-xl flex-1">
        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          placeholder="Search anything"
          className="bg-muted/50 h-9 pl-9"
          readOnly
        />
        <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 text-xs sm:block">
          ⌘ F
        </span>
      </div>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "gap-2",
            )}
          >
            <Wallet className="size-4" />
            <span className="hidden max-w-[120px] truncate sm:inline">
              {active?.name ?? "Wallet"}
            </span>
            <ChevronDown className="size-3 opacity-60" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Wallets</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {wallets.map((w) => (
              <DropdownMenuItem
                key={w.id}
                onClick={() => onWalletChange(w.id)}
                className={w.id === activeWalletId ? "bg-muted" : ""}
              >
                {w.name}
                {w.isDefault ? (
                  <span className="text-muted-foreground ml-2 text-xs">
                    Default
                  </span>
                ) : null}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" size="icon" className="relative" type="button">
          <Bell className="size-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "gap-2 px-2",
            )}
          >
            <Avatar className="size-8">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="hidden text-left text-sm leading-tight lg:block">
              <div className="font-medium">{user.name}</div>
              <div className="text-muted-foreground max-w-[160px] truncate text-xs">
                {user.email}
              </div>
            </div>
            <ChevronDown className="size-3 opacity-60" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>{user.email}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
