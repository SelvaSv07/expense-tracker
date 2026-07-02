"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Bell,
  ChevronDown,
  Command,
  Crown,
  Menu,
  Search,
  X,
} from "lucide-react";
import { useState } from "react";

export function AppHeader({
  user,
  onMenuClick,
}: {
  user: { name: string; email: string; image?: string | null };
  onMenuClick?: () => void;
}) {
  const [searchOpen, setSearchOpen] = useState(false);

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header
      className="flex h-14 shrink-0 items-center justify-between gap-2 border-b px-3 sm:gap-4 sm:px-4"
      style={{
        background: "var(--cazura-panel)",
        borderColor: "var(--cazura-border)",
      }}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          type="button"
          className="size-8 shrink-0 rounded-lg border shadow-none lg:hidden"
          style={{
            background: "var(--cazura-panel)",
            borderColor: "var(--cazura-border)",
          }}
          aria-label="Open menu"
          onClick={onMenuClick}
        >
          <Menu className="size-4" strokeWidth={1.8} color="var(--cazura-text)" />
        </Button>

        {searchOpen ? (
          <div
            className="flex h-8 min-w-0 flex-1 items-center gap-1.5 rounded-lg border px-2.5 lg:hidden"
            style={{
              background: "var(--cazura-panel)",
              borderColor: "var(--cazura-border)",
            }}
          >
            <Search
              className="size-[13px] shrink-0"
              strokeWidth={2}
              color="var(--cazura-muted)"
            />
            <Input
              placeholder="Search anything"
              className="h-7 min-w-0 flex-1 border-0 bg-transparent p-0 text-xs shadow-none focus-visible:ring-0"
              style={{ color: "var(--cazura-muted)" }}
              readOnly
              autoFocus
            />
            <button
              type="button"
              className="shrink-0 rounded p-0.5 hover:opacity-80"
              aria-label="Close search"
              onClick={() => setSearchOpen(false)}
            >
              <X className="size-3.5" strokeWidth={2} color="var(--cazura-muted)" />
            </button>
          </div>
        ) : (
          <>
            <div
              className="relative hidden h-8 w-full max-w-[260px] shrink-0 items-center justify-between rounded-lg border px-2.5 lg:flex"
              style={{
                background: "var(--cazura-panel)",
                borderColor: "var(--cazura-border)",
              }}
            >
              <div className="flex min-w-0 items-center gap-1.5">
                <Search
                  className="size-[13px] shrink-0"
                  strokeWidth={2}
                  color="var(--cazura-muted)"
                />
                <Input
                  placeholder="Search anything"
                  className="h-7 border-0 bg-transparent p-0 text-xs shadow-none focus-visible:ring-0"
                  style={{ color: "var(--cazura-muted)" }}
                  readOnly
                />
              </div>
              <div className="flex items-center gap-1">
                <div
                  className="flex items-center rounded border px-0.5 py-0.5"
                  style={{
                    background: "var(--cazura-panel)",
                    borderColor: "var(--cazura-border)",
                  }}
                >
                  <Command
                    className="size-2.5"
                    strokeWidth={2}
                    color="var(--cazura-muted)"
                  />
                </div>
                <div
                  className="flex size-[15px] items-center justify-center rounded border text-[8px] font-bold"
                  style={{
                    background: "var(--cazura-panel)",
                    borderColor: "var(--cazura-border)",
                    color: "var(--cazura-muted)",
                  }}
                >
                  F
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              size="icon"
              type="button"
              className="size-8 shrink-0 rounded-lg border shadow-none lg:hidden"
              style={{
                background: "var(--cazura-panel)",
                borderColor: "var(--cazura-border)",
              }}
              aria-label="Search"
              onClick={() => setSearchOpen(true)}
            >
              <Search
                className="size-3.5"
                strokeWidth={1.8}
                color="var(--cazura-text)"
              />
            </Button>
          </>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
        <Button
          variant="outline"
          size="icon"
          className="size-8 shrink-0 rounded-lg border shadow-none"
          style={{
            background: "var(--cazura-panel)",
            borderColor: "var(--cazura-border)",
          }}
          type="button"
        >
          <Bell className="size-3.5" strokeWidth={1.8} color="var(--cazura-text)" />
        </Button>

        <div
          className="hidden h-[18px] w-px shrink-0 sm:block"
          style={{ background: "var(--cazura-border)" }}
        />

        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "h-auto gap-2 px-1",
            )}
          >
            <div className="relative shrink-0">
              <Avatar className="size-[30px] border border-[#c4dbdd]">
                {user.image ? (
                  <AvatarImage src={user.image} alt="" />
                ) : null}
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
              <div
                className="absolute -right-0.5 -bottom-0.5 flex size-3 items-center justify-center rounded-full border border-[#629298]"
                style={{
                  background: "linear-gradient(135deg, #3b6064 20%, #588d73 80%)",
                }}
              >
                <Crown className="size-[7px] text-white" strokeWidth={2.5} />
              </div>
            </div>
            <div className="hidden min-w-0 text-left leading-tight lg:block">
              <div
                className="truncate text-xs font-medium whitespace-nowrap"
                style={{ color: "var(--cazura-text)" }}
              >
                {user.name}
              </div>
              <div
                className="text-[10px] whitespace-nowrap"
                style={{ color: "var(--cazura-muted)" }}
              >
                {user.email}
              </div>
            </div>
            <ChevronDown
              className="hidden size-[13px] shrink-0 opacity-70 sm:block"
              strokeWidth={2}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled>{user.email}</DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
