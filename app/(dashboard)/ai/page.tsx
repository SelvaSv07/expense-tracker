import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Sparkles } from "lucide-react";

export default function AiPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Cazura AI Assistant
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Smart insights for your money — coming soon.
        </p>
      </div>
      <Card className="max-w-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="text-primary size-5" />
            <CardTitle>Under construction</CardTitle>
          </div>
          <CardDescription>
            We&apos;re building AI-powered budgeting tips, anomaly detection,
            and natural-language queries. Check back later.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          This placeholder keeps the nav item usable while we ship the feature.
        </CardContent>
      </Card>
    </div>
  );
}
