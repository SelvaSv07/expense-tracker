"use client";

import { cn } from "@/lib/utils";
import { MessageSquare, PanelLeft, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";

type ChatGroup = {
  label: string;
  items: { id: string; title: string; active?: boolean }[];
};

function groupConversations(
  items: { id: string; title: string; updatedAt: string }[],
): ChatGroup[] {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const groups: Record<string, { id: string; title: string; active?: boolean }[]> = {
    TODAY: [],
    YESTERDAY: [],
    OLDER: [],
  };

  for (const c of items) {
    const age = now - new Date(c.updatedAt).getTime();
    if (age < dayMs) groups.TODAY.push({ id: c.id, title: c.title });
    else if (age < 2 * dayMs) groups.YESTERDAY.push({ id: c.id, title: c.title });
    else groups.OLDER.push({ id: c.id, title: c.title });
  }

  return (["TODAY", "YESTERDAY", "OLDER"] as const)
    .map((label) => ({ label, items: groups[label] }))
    .filter((g) => g.items.length > 0);
}

export function AiChatSidebar({
  collapsed,
  onToggleCollapse,
  conversations,
  activeConversationId,
  onSelectConversation,
  onCreateConversation,
}: {
  collapsed: boolean;
  onToggleCollapse: () => void;
  conversations: { id: string; title: string; updatedAt: string }[];
  activeConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  onCreateConversation: () => void;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const grouped = groupConversations(conversations);
    const q = query.trim().toLowerCase();
    if (!q) {
      return grouped.map((g) => ({
        ...g,
        items: g.items.map((i) => ({
          ...i,
          active: i.id === activeConversationId,
        })),
      }));
    }
    return grouped
      .map((g) => ({
      ...g,
      items: g.items.filter((i) => i.title.toLowerCase().includes(q)),
    }))
      .map((g) => ({
        ...g,
        items: g.items.map((i) => ({
          ...i,
          active: i.id === activeConversationId,
        })),
      }))
      .filter((g) => g.items.length > 0);
  }, [conversations, query, activeConversationId]);

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
          <p className="min-w-0 flex-1 text-base font-bold tracking-tight"
            style={{ color: "var(--cazura-text)" }}
          >
            All Chats
          </p>
          <button
            type="button"
            className="flex shrink-0 items-center rounded-lg p-1 transition-colors hover:bg-[var(--cazura-canvas)]"
            style={{ color: "var(--cazura-text)" }}
            aria-label="New chat"
            onClick={onCreateConversation}
          >
            <Plus className="size-4" strokeWidth={1.8} />
          </button>
          <button
            type="button"
            className="flex shrink-0 items-center rounded-lg p-1 transition-colors hover:bg-[var(--cazura-canvas)]"
            style={{ color: "var(--cazura-text)" }}
            aria-label={collapsed ? "Expand chat list" : "Collapse chat list"}
            onClick={onToggleCollapse}
          >
            <PanelLeft className="size-4" strokeWidth={1.8} />
          </button>
        </div>

        <div
          className="flex items-center gap-2 rounded-lg border px-3 py-2"
          style={{
            background: "var(--cazura-panel)",
            borderColor: "var(--cazura-border)",
          }}
        >
          <Search
            className="size-4 shrink-0"
            strokeWidth={1.8}
            color="var(--cazura-muted)"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            className="min-w-0 flex-1 border-0 bg-transparent text-xs outline-none placeholder:text-[var(--cazura-muted)]"
            style={{ color: "var(--cazura-text)" }}
          />
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
          {filtered.map((group) => (
            <div key={group.label} className="space-y-2">
              <p
                className="text-[10px] font-medium tracking-wide"
                style={{ color: "var(--cazura-label)" }}
              >
                {group.label}
              </p>
              <ul className="space-y-1">
                {group.items.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => onSelectConversation(item.id)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-lg p-2 text-left text-sm transition-colors",
                        item.active
                          ? "border font-bold shadow-sm"
                          : "font-medium hover:bg-[var(--cazura-canvas)]",
                      )}
                      style={
                        item.active
                          ? {
                              background: "var(--cazura-panel)",
                              borderColor: "var(--cazura-border)",
                              color: "var(--cazura-text)",
                            }
                          : { color: "#282828" }
                      }
                    >
                      <MessageSquare
                        className="size-4 shrink-0"
                        strokeWidth={1.8}
                        style={{
                          color: item.active
                            ? "var(--cazura-teal)"
                            : "var(--cazura-muted)",
                        }}
                      />
                      <span className="min-w-0 flex-1 truncate">{item.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
