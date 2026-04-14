import { CategoriesManager } from "@/components/settings/categories-manager";
import { getCategoryUsage, listCategories } from "@/lib/queries";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session?.user) redirect("/sign-in");

  const [categories, usage] = await Promise.all([
    listCategories(session.user.id),
    getCategoryUsage(session.user.id),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Preferences and data you use across Cazura. More options will live
          here later.
        </p>
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
