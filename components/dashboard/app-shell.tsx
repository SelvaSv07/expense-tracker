"use client";

import { AppHeader } from "@/components/dashboard/app-header";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";

export function AppShell({
  children,
  user,
}: {
  children: ReactNode;
  user: { name: string; email: string; image?: string | null };
}) {
  const pathname = usePathname();
  const isAiAssistantPage = pathname === "/ai";
  const isTransactionsPage = pathname.startsWith("/transactions");

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  const desktopSidebarWidth = sidebarCollapsed ? 64 : 220;
  const shellStyle = {
    "--shell-sidebar-offset": `${desktopSidebarWidth + 16}px`,
  } as CSSProperties;

  return (
    <div
      className="bg-[var(--cazura-canvas)] relative box-border h-svh max-h-svh min-h-0 overflow-hidden p-0 lg:p-4"
      style={{ ...shellStyle, fontFamily: '"Satoshi", sans-serif' }}
    >
      <aside
        className={cn(
          "fixed top-2 bottom-2 left-2 z-40 hidden flex-col overflow-hidden transition-[width] duration-200 sm:top-3 sm:bottom-3 sm:left-3 lg:flex lg:top-4 lg:bottom-4 lg:left-4",
          sidebarCollapsed ? "w-16" : "w-[220px]",
        )}
      >
        <SidebarNav
          collapsed={sidebarCollapsed}
          showCollapseToggle
          onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
        />
      </aside>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent
          side="left"
          className="w-[min(280px,85vw)] border-[var(--cazura-border)] bg-[var(--cazura-canvas)] p-4"
          showCloseButton
        >
          <SidebarNav onNavigate={() => setMobileNavOpen(false)} />
        </SheetContent>
      </Sheet>

      <div
        className={cn(
          "ml-0 flex h-svh min-h-0 min-w-0 flex-col overflow-hidden transition-[margin] duration-200 lg:ml-[var(--shell-sidebar-offset)] lg:h-[calc(100svh-2rem)] lg:rounded-xl lg:border lg:border-[var(--cazura-panel-border)]",
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
        <AppHeader user={user} onMenuClick={() => setMobileNavOpen(true)} />
        <main
          className={cn(
            "min-h-0 flex-1 overflow-x-hidden",
            isAiAssistantPage
              ? "flex flex-col overflow-hidden"
              : isTransactionsPage
                ? "overflow-y-auto px-3 pt-3 pb-5 sm:px-4 sm:pt-4 sm:pb-6 lg:flex lg:flex-col lg:overflow-hidden lg:px-4 lg:pb-4 lg:[&>*]:flex lg:[&>*]:min-h-0 lg:[&>*]:flex-1 lg:[&>*]:flex-col"
                : "overflow-y-auto px-3 pt-3 pb-5 sm:px-4 sm:pt-4 sm:pb-6 lg:px-4",
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
