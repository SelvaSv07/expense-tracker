"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  CreditCard,
  LayoutDashboard,
  Sparkles,
  Target,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AppHeader } from "./app-header";
import { LogoutButton } from "./logout-button";

const nav = [
  { href: "/overview", label: "Overview", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: CreditCard },
  { href: "/budget", label: "Budget", icon: BarChart3 },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/ai", label: "Cazura AI Assistant", icon: Sparkles },
];

type WalletRow = {
  id: string;
  name: string;
  currency: string;
  isDefault: boolean;
};

export function AppShell({
  children,
  user,
  wallets,
  activeWalletId,
}: {
  children: ReactNode;
  user: { name: string; email: string; image?: string | null };
  wallets: WalletRow[];
  activeWalletId: string;
}) {
  const pathname = usePathname();

  return (
    <div className="bg-muted/30 flex min-h-screen">
      <aside className="bg-card fixed inset-y-0 z-40 flex w-64 flex-col border-r">
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <div className="bg-primary flex size-8 items-center justify-center rounded-lg">
            <Wallet className="text-primary-foreground size-4" />
          </div>
          <span className="font-semibold tracking-tight">Cazura</span>
        </div>
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="space-y-1">
            {nav.map((item) => {
              const Icon = item.icon;
              const active =
                pathname === item.href ||
                (item.href !== "/overview" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>
        <Separator />
        <div className="p-3">
          <LogoutButton />
        </div>
      </aside>
      <div className="flex min-h-screen flex-1 flex-col pl-64">
        <AppHeader
          user={user}
          wallets={wallets}
          activeWalletId={activeWalletId}
        />
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
