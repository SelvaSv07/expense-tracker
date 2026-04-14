import { AiSettingsManager } from "@/components/settings/ai-settings-manager";
import { getSession } from "@/lib/session";
import { ChevronLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function SettingsAiPage() {
  const session = await getSession();
  if (!session?.user) redirect("/sign-in");

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
            <Sparkles className="size-5 text-[var(--cazura-muted)]" strokeWidth={1.8} />
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">AI</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Configure OpenAI access for Cazura AI assistant.
            </p>
          </div>
        </div>
      </div>
      <AiSettingsManager />
    </div>
  );
}
