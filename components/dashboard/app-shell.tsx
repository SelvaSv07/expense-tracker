"use client";

import { cn } from "@/lib/utils";
import {
  ArrowLeftRight,
  LayoutDashboard,
  Map,
  PanelLeftClose,
  Settings,
  Sparkles,
  Target,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AppHeader } from "./app-header";
import { LogoutButton } from "./logout-button";

type NavDef = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: string;
};

const mainMenu: NavDef[] = [
  { href: "/overview", label: "Overview", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/budget", label: "Budget", icon: Map },
  { href: "/goals", label: "Goals", icon: Target },
];

const toolsMenu: NavDef[] = [
  { href: "/settings", label: "Settings", icon: Settings },
];

function NavItem({
  href,
  label,
  icon: Icon,
  badge,
  active,
}: NavDef & { active: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-lg border px-2 py-[7px] text-[13px] transition-colors",
        active
          ? "border-[var(--cazura-border)] bg-[var(--cazura-panel)] font-bold text-[var(--cazura-teal)]"
          : "border-transparent font-normal text-[var(--cazura-muted)] hover:bg-[var(--cazura-panel)]/80 hover:text-[var(--cazura-text)]",
      )}
    >
      <Icon
        className={cn(
          "size-[17px] shrink-0",
          active ? "text-[var(--cazura-teal)]" : "text-[var(--cazura-muted)]",
        )}
        strokeWidth={1.8}
      />
      <span className="flex-1">{label}</span>
      {badge ? (
        <span
          className="rounded-[10px] border border-[#809b9e] px-[7px] py-px text-[9px] font-bold text-[var(--cazura-panel)]"
          style={{ background: "var(--cazura-teal)" }}
        >
          {badge}
        </span>
      ) : null}
    </Link>
  );
}

export function AppShell({
  children,
  user,
}: {
  children: ReactNode;
  user: { name: string; email: string; image?: string | null };
}) {
  const pathname = usePathname();
  const isAiAssistantPage = pathname === "/ai";

  function isMainActive(href: string, label: string) {
    if (label === "Overview") return pathname === "/overview";
    if (label === "Transactions") return pathname.startsWith("/transactions");
    if (label === "Budget") return pathname.startsWith("/budget");
    if (label === "Goals") return pathname.startsWith("/goals");
    return pathname === href;
  }

  return (
    <div
      className="bg-[var(--cazura-canvas)] relative box-border h-svh max-h-svh min-h-0 overflow-hidden p-4"
      style={{ fontFamily: '"Satoshi", sans-serif' }}
    >
      <aside className="fixed top-4 bottom-4 left-4 z-40 flex w-[220px] flex-col overflow-hidden">
        <div className="mb-2 flex items-center justify-between px-0 py-2">
          <div className="flex items-center gap-2">
            <div
              className="relative flex size-[30px] shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/20 text-white shadow-[0_2px_3px_-1px_rgba(42,42,42,0.14)]"
              style={{ background: "var(--cazura-teal)" }}
            >
              <Wallet className="size-4" strokeWidth={2} />
            </div>
            <span
              className="text-[18px] font-bold tracking-tight"
              style={{ color: "var(--cazura-text)" }}
            >
              Cazura
            </span>
          </div>
          <button
            type="button"
            className="cursor-pointer text-[var(--cazura-label)] hover:text-[var(--cazura-muted)]"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose className="size-[17px]" strokeWidth={1.8} />
          </button>
        </div>

        <div
          className="mb-3 h-px shrink-0"
          style={{ background: "var(--cazura-border)" }}
        />

        <Link
          href="/ai"
          className={cn(
            "mb-2 flex cursor-pointer items-center gap-2 rounded-lg border px-2 py-[7px] transition-colors",
            pathname === "/ai"
              ? "border-[var(--cazura-border)] bg-[var(--cazura-panel)] font-bold"
              : "border-transparent font-normal hover:bg-[var(--cazura-panel)]/80",
          )}
        >
          <Sparkles
            className={cn(
              "size-[17px] shrink-0",
              pathname === "/ai"
                ? "text-[var(--cazura-teal)]"
                : "text-[var(--cazura-teal-light)]",
            )}
            strokeWidth={1.8}
          />
          <span
            className={cn(
              "bg-clip-text text-[13px] text-transparent",
              pathname === "/ai"
                ? "bg-gradient-to-r from-[var(--cazura-teal)] via-[var(--cazura-teal-light)] to-[var(--cazura-teal-soft)] font-bold"
                : "bg-gradient-to-r from-[var(--cazura-teal)] via-[var(--cazura-teal-light)] to-[var(--cazura-teal-soft)] font-medium",
            )}
            style={{ WebkitTextFillColor: "transparent" }}
          >
            Cazura AI Assistant
          </span>
        </Link>

        <div className="min-h-0 flex-1 overflow-hidden pr-1">
          <div className="space-y-3 pb-4">
            <div>
              <p className="text-[var(--cazura-label)] mb-1.5 px-2 text-[11px] font-medium tracking-wide">
                MAIN MENU
              </p>
              <nav className="flex flex-col gap-0.5">
                {mainMenu.map((item) => (
                  <NavItem
                    key={`${item.label}-${item.href}`}
                    {...item}
                    active={isMainActive(item.href, item.label)}
                  />
                ))}
              </nav>
            </div>

            <div>
              <p className="text-[var(--cazura-label)] mb-1.5 px-2 text-[11px] font-medium tracking-wide">
                TOOLS
              </p>
              <nav className="flex flex-col gap-0.5">
                {toolsMenu.map((item) => (
                  <NavItem
                    key={item.label}
                    {...item}
                    active={pathname.startsWith(item.href)}
                  />
                ))}
              </nav>
            </div>
          </div>
        </div>

        <LogoutButton />
      </aside>

      <div
        className={cn(
          "border-[var(--cazura-panel-border)] ml-[236px] flex h-[calc(100svh-2rem)] min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border",
          isAiAssistantPage
            ? "bg-[var(--cazura-canvas)]"
            : "bg-[var(--cazura-panel)]",
        )}
        style={
          isAiAssistantPage
            ? {
                backgroundImage:
                  "radial-gradient(circle at center, var(--cazura-border) 1px, transparent 1px)",
                backgroundSize: "10px 10px",
              }
            : undefined
        }
      >
        <AppHeader user={user} />
        <main
          className={cn(
            "min-h-0 flex-1 overflow-x-hidden",
            isAiAssistantPage
              ? "flex flex-col overflow-hidden"
              : "overflow-y-auto px-4 pt-4 pb-6 lg:px-4",
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
