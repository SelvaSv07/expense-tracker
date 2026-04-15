"use client";

import { cn } from "@/lib/utils";
import { MessageSquare, PanelLeft, Plus } from "lucide-react";

export function AiChatSidebar({
  collapsed,
  onToggleCollapse,
  onNewChat,
}: {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onNewChat: () => void;
}) {
  return (
    <aside
      className={cn(
        "flex shrink-0 flex-col gap-4 overflow-hidden border-[var(--cazura-border)] transition-[width,opacity,border-width] duration-200 ease-out",
        collapsed
          ? "w-0 border-0 opacity-0"
          : "w-full border-b md:w-[254px] md:border-r md:border-b-0 md:opacity-100",
      )}
      aria-hidden={collapsed}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-4 p-3">
        <div className="flex items-center gap-1">
          <p
            className="min-w-0 flex-1 text-base font-bold tracking-tight"
            style={{ color: "var(--cazura-text)" }}
          >
            Chat
          </p>
          <button
            type="button"
            className="flex shrink-0 items-center rounded-lg p-1 transition-colors hover:bg-[var(--cazura-canvas)]"
            style={{ color: "var(--cazura-text)" }}
            aria-label="New chat"
            onClick={onNewChat}
          >
            <Plus className="size-4" strokeWidth={1.8} />
          </button>
          <button
            type="button"
            className="flex shrink-0 items-center rounded-lg p-1 transition-colors hover:bg-[var(--cazura-canvas)]"
            style={{ color: "var(--cazura-text)" }}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={onToggleCollapse}
          >
            <PanelLeft className="size-4" strokeWidth={1.8} />
          </button>
        </div>

        <div
          className="flex min-h-[120px] flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-3 py-6 text-center"
          style={{
            borderColor: "var(--cazura-border)",
            color: "var(--cazura-muted)",
          }}
        >
          <MessageSquare className="size-8 opacity-40" strokeWidth={1.5} />
          <p className="text-xs leading-relaxed">
            Conversations stay in this browser session only and are not saved.
          </p>
        </div>
      </div>
    </aside>
  );
}
