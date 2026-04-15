import { getSession } from "@/lib/session";
import { ChevronRight, CreditCard, Sparkles, Tags } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

const settingsOptions = [
  {
    href: "/settings/categories",
    title: "Categories",
    description:
      "Income and expense labels, icons, and colors used across transactions and budgets.",
    icon: Tags,
  },
  {
    href: "/settings/payment-methods",
    title: "Payment methods",
    description:
      "Cash, card, UPI, and custom labels shown when you record how a transaction was paid.",
    icon: CreditCard,
  },
  {
    href: "/settings/ai",
    title: "AI",
    description:
      "Store your OpenAI API key securely and manage Cazura AI assistant behavior.",
    icon: Sparkles,
  },
] as const;

export default async function SettingsPage() {
  const session = await getSession();
  if (!session?.user) redirect("/sign-in");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage your account preferences and data. More options will appear here
          over time.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          General
        </p>
        <ul className="flex flex-col gap-2">
          {settingsOptions.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex items-center gap-3 rounded-xl border p-4 transition-opacity hover:opacity-90"
                style={{
                  background: "var(--cazura-panel)",
                  borderColor: "var(--cazura-border)",
                }}
              >
                <div
                  className="flex size-10 shrink-0 items-center justify-center rounded-lg border"
                  style={{
                    background: "var(--cazura-canvas)",
                    borderColor: "var(--cazura-border)",
                  }}
                >
                  <item.icon
                    className="size-5 text-[var(--cazura-muted)]"
                    strokeWidth={1.8}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className="font-semibold text-[var(--cazura-text)]"
                    style={{ fontSize: 15 }}
                  >
                    {item.title}
                  </p>
                  <p
                    className="mt-0.5 text-sm leading-snug"
                    style={{ color: "var(--cazura-muted)" }}
                  >
                    {item.description}
                  </p>
                </div>
                <ChevronRight
                  className="size-5 shrink-0 text-[var(--cazura-label)]"
                  strokeWidth={2}
                />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
