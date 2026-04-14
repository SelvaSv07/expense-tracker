import { CategoriesManager } from "@/components/settings/categories-manager";
import { getCategoryUsage, listCategories } from "@/lib/queries";
import { getSession } from "@/lib/session";
import { ChevronLeft, Tags } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function SettingsCategoriesPage() {
  const session = await getSession();
  if (!session?.user) redirect("/sign-in");

  const [categories, usage] = await Promise.all([
    listCategories(session.user.id),
    getCategoryUsage(session.user.id),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/settings"
          className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 text-sm font-medium"
        >
          <ChevronLeft className="size-4" />
          Settings
        </Link>
        <div className="flex items-start gap-3">
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-lg border"
            style={{
              background: "var(--cazura-canvas)",
              borderColor: "var(--cazura-border)",
            }}
          >
            <Tags
              className="size-5 text-[var(--cazura-muted)]"
              strokeWidth={1.8}
            />
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Categories</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Create and organize labels for income and expenses. These appear
              when you add transactions and budgets.
            </p>
          </div>
        </div>
      </div>

      <CategoriesManager
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          type: c.type,
          icon: c.icon,
          color: c.color,
        }))}
        usage={usage}
      />
    </div>
  );
}
