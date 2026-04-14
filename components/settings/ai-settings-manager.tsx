"use client";

import { getAiSettingsPreview, saveAiSettings, testAiKey } from "@/actions/ai-settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

export function AiSettingsManager() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [configured, setConfigured] = useState(false);
  const [model, setModel] = useState("gpt-4.1-mini");
  const [keyLast4, setKeyLast4] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    startTransition(async () => {
      try {
        const preview = await getAiSettingsPreview();
        setConfigured(preview.configured);
        setKeyLast4(preview.keyLast4);
        setModel(preview.model);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not load AI settings");
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onSave() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        const result = await saveAiSettings({ apiKey, model });
        setConfigured(true);
        setKeyLast4(result.keyLast4);
        setApiKey("");
        setMessage("AI key saved successfully.");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not save AI settings");
      }
    });
  }

  function onTest() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        await testAiKey();
        setMessage("Connection successful. Your OpenAI key is valid.");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not validate OpenAI key");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI provider settings</CardTitle>
        <CardDescription>
          Bring your own OpenAI key. The key is encrypted at rest and never shown in full.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="openai-key">OpenAI API Key</Label>
          <Input
            id="openai-key"
            type="password"
            placeholder={configured ? `Configured (••••${keyLast4 ?? ""})` : "sk-..."}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <p className="text-xs text-[var(--cazura-muted)]">
            Current key: {configured ? `••••${keyLast4 ?? "----"}` : "Not configured"}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="ai-model">Default model</Label>
          <Input
            id="ai-model"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="gpt-4.1-mini"
          />
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {message ? <p className="text-sm text-emerald-700">{message}</p> : null}

        <div className="flex flex-wrap gap-2">
          <Button type="button" disabled={pending || apiKey.trim().length === 0} onClick={onSave}>
            Save key
          </Button>
          <Button type="button" variant="outline" disabled={pending || !configured} onClick={onTest}>
            Test connection
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
