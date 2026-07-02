"use client";

import { LogoutButton } from "@/components/dashboard/logout-button";
import { cn } from "@/lib/utils";
import {
  ArrowLeftRight,
  LayoutDashboard,
  Map,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Sparkles,
  Target,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
  collapsed,
  onNavigate,
}: NavDef & {
  active: boolean;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      onClick={onNavigate}
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-lg border px-2 py-[7px] text-[13px] transition-colors",
        collapsed && "justify-center px-0",
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
      {!collapsed ? <span className="flex-1">{label}</span> : null}
      {!collapsed && badge ? (
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

export function SidebarNav({
  collapsed = false,
  onNavigate,
  onToggleCollapse,
  showCollapseToggle = false,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
  onToggleCollapse?: () => void;
  showCollapseToggle?: boolean;
}) {
  const pathname = usePathname();

  function isMainActive(href: string, label: string) {
    if (label === "Overview") return pathname === "/overview";
    if (label === "Transactions") return pathname.startsWith("/transactions");
    if (label === "Budget") return pathname.startsWith("/budget");
    if (label === "Goals") return pathname.startsWith("/goals");
    return pathname === href;
  }

  return (
    <>
      <div
        className={cn(
          "mb-2 flex items-center py-2",
          collapsed ? "justify-center px-0" : "justify-between px-0",
        )}
      >
        <div className={cn("flex items-center gap-2", collapsed && "justify-center")}>
          <div
            className="relative flex size-[30px] shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/20 text-white shadow-[0_2px_3px_-1px_rgba(42,42,42,0.14)]"
            style={{ background: "var(--cazura-teal)" }}
          >
            <Wallet className="size-4" strokeWidth={2} />
          </div>
          {!collapsed ? (
            <span
              className="text-[18px] font-bold tracking-tight"
              style={{ color: "var(--cazura-text)" }}
            >
              Cazura
            </span>
          ) : null}
        </div>
        {showCollapseToggle && onToggleCollapse ? (
          <button
            type="button"
            className="cursor-pointer text-[var(--cazura-label)] hover:text-[var(--cazura-muted)]"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={onToggleCollapse}
          >
            {collapsed ? (
              <PanelLeftOpen className="size-[17px]" strokeWidth={1.8} />
            ) : (
              <PanelLeftClose className="size-[17px]" strokeWidth={1.8} />
            )}
          </button>
        ) : null}
      </div>

      <div
        className="mb-3 h-px shrink-0"
        style={{ background: "var(--cazura-border)" }}
      />

      <Link
        href="/ai"
        title={collapsed ? "Cazura AI Assistant" : undefined}
        onClick={onNavigate}
        className={cn(
          "mb-2 flex cursor-pointer items-center gap-2 rounded-lg border px-2 py-[7px] transition-colors",
          collapsed && "justify-center px-0",
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
        {!collapsed ? (
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
        ) : null}
      </Link>

      <div className="min-h-0 flex-1 overflow-hidden pr-1">
        <div className="space-y-3 pb-4">
          <div>
            {!collapsed ? (
              <p className="text-[var(--cazura-label)] mb-1.5 px-2 text-[11px] font-medium tracking-wide">
                MAIN MENU
              </p>
            ) : null}
            <nav className="flex flex-col gap-0.5">
              {mainMenu.map((item) => (
                <NavItem
                  key={`${item.label}-${item.href}`}
                  {...item}
                  active={isMainActive(item.href, item.label)}
                  collapsed={collapsed}
                  onNavigate={onNavigate}
                />
              ))}
            </nav>
          </div>

          <div>
            {!collapsed ? (
              <p className="text-[var(--cazura-label)] mb-1.5 px-2 text-[11px] font-medium tracking-wide">
                TOOLS
              </p>
            ) : null}
            <nav className="flex flex-col gap-0.5">
              {toolsMenu.map((item) => (
                <NavItem
                  key={item.label}
                  {...item}
                  active={pathname.startsWith(item.href)}
                  collapsed={collapsed}
                  onNavigate={onNavigate}
                />
              ))}
            </nav>
          </div>
        </div>
      </div>

      <LogoutButton collapsed={collapsed} />
    </>
  );
}
