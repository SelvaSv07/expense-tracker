"use client";

import { getAiSettingsPreview, saveAiSettings, testAiKey } from "@/actions/ai-settings";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CUSTOM_MODEL_VALUE,
  DEFAULT_OPENAI_MODEL_ID,
  formatModelTier,
  OPENAI_MODEL_PRESETS,
} from "@/lib/ai/openai-model-options";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";

const presetIds = new Set(OPENAI_MODEL_PRESETS.map((p) => p.id));

function resolveSelectionFromStoredModel(stored: string) {
  if (presetIds.has(stored)) {
    return { select: stored, custom: "" };
  }
  return { select: CUSTOM_MODEL_VALUE, custom: stored };
}

export function AiSettingsManager() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [configured, setConfigured] = useState(false);
  const [keyLast4, setKeyLast4] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [modelSelect, setModelSelect] = useState<string>(DEFAULT_OPENAI_MODEL_ID);
  const [customModelId, setCustomModelId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const effectiveModel = useMemo(() => {
    if (modelSelect === CUSTOM_MODEL_VALUE) return customModelId.trim();
    return modelSelect;
  }, [modelSelect, customModelId]);

  const activePreset = useMemo(
    () =>
      modelSelect === CUSTOM_MODEL_VALUE
        ? null
        : OPENAI_MODEL_PRESETS.find((p) => p.id === modelSelect),
    [modelSelect],
  );

  useEffect(() => {
    startTransition(async () => {
      try {
        const preview = await getAiSettingsPreview();
        setConfigured(preview.configured);
        setKeyLast4(preview.keyLast4);
        const { select, custom } = resolveSelectionFromStoredModel(preview.model);
        setModelSelect(select);
        setCustomModelId(custom);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not load AI settings");
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canSaveModelOnly = configured && effectiveModel.length > 0;
  const canSaveWithKey = apiKey.trim().length >= 20 && effectiveModel.length > 0;
  const saveDisabled =
    pending ||
    effectiveModel.length === 0 ||
    (modelSelect === CUSTOM_MODEL_VALUE && customModelId.trim().length === 0) ||
    (!canSaveWithKey && !canSaveModelOnly);

  const saveButtonLabel =
    apiKey.trim().length > 0 || !configured ? "Save key & model" : "Save model";

  function onSave() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        const result = await saveAiSettings({
          apiKey: apiKey.trim().length > 0 ? apiKey : undefined,
          model: effectiveModel,
        });
        setConfigured(true);
        setKeyLast4(result.keyLast4);
        setApiKey("");
        if (apiKey.trim().length > 0) {
          setMessage("API key and model saved.");
        } else {
          setMessage("Model updated. New chats will use this model.");
        }
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
          Change the model any time—no need to re-enter the key.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="openai-key">OpenAI API Key</Label>
          <Input
            id="openai-key"
            type="password"
            placeholder={
              configured ? `Configured (••••${keyLast4 ?? ""}) — paste a new key to replace` : "sk-..."
            }
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            autoComplete="off"
          />
          <p className="text-xs text-[var(--cazura-muted)]">
            Current key: {configured ? `••••${keyLast4 ?? "----"}` : "Not configured"}
          </p>
        </div>

        <div className="space-y-3 rounded-lg border border-[var(--cazura-border)] bg-[var(--cazura-canvas)] p-4">
          <div>
            <Label className="text-base">Model</Label>
            <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
              Pick a recommended model (speed vs. intelligence) or enter any model ID your OpenAI
              account can access. See{" "}
              <a
                className="font-medium text-[var(--cazura-teal-mid)] underline-offset-2 hover:underline"
                href="https://developers.openai.com/api/docs/models/all"
                target="_blank"
                rel="noreferrer"
              >
                OpenAI model docs
              </a>
              .
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ai-model-preset" className="sr-only">
              Preset models
            </Label>
            <Select
              value={modelSelect}
              onValueChange={(v) => {
                if (!v) return;
                setModelSelect(v);
                if (v !== CUSTOM_MODEL_VALUE) setCustomModelId("");
              }}
            >
              <SelectTrigger id="ai-model-preset" className="w-full bg-[var(--cazura-panel)]">
                <SelectValue placeholder="Choose a model" />
              </SelectTrigger>
              <SelectContent>
                {OPENAI_MODEL_PRESETS.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.label} — {formatModelTier(p.tier)}
                  </SelectItem>
                ))}
                <SelectItem value={CUSTOM_MODEL_VALUE}>Custom model ID…</SelectItem>
              </SelectContent>
            </Select>

            {activePreset ? (
              <p className="text-muted-foreground text-xs leading-snug">{activePreset.hint}</p>
            ) : null}

            {modelSelect === CUSTOM_MODEL_VALUE ? (
              <div className="space-y-2 pt-1">
                <Label htmlFor="ai-model-custom">Custom model ID</Label>
                <Input
                  id="ai-model-custom"
                  className="bg-[var(--cazura-panel)] font-mono text-sm"
                  value={customModelId}
                  onChange={(e) => setCustomModelId(e.target.value)}
                  placeholder="e.g. gpt-5.4 or your org-specific deployment id"
                  spellCheck={false}
                />
                <p className="text-muted-foreground text-xs">
                  Use the exact id from the API or your OpenAI dashboard. Invalid ids will fail at
                  chat time.
                </p>
              </div>
            ) : null}
          </div>
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {message ? <p className="text-sm text-emerald-700">{message}</p> : null}

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={saveDisabled}
            onClick={onSave}
            title={
              apiKey.trim().length > 0
                ? "Save API key and model"
                : configured
                  ? "Save model only"
                  : "Enter your API key and save"
            }
          >
            {saveButtonLabel}
          </Button>
          <Button type="button" variant="outline" disabled={pending || !configured} onClick={onTest}>
            Test connection
          </Button>
        </div>

        {!configured ? (
          <p className="text-muted-foreground text-xs">
            First time: paste your API key and choose a model, then use{" "}
            <span className="font-medium">Save key &amp; model</span>. After that, use{" "}
            <span className="font-medium">Save model</span> whenever you want to switch models.
          </p>
        ) : (
          <p className="text-muted-foreground text-xs">
            Your key stays on file until you paste a new one. Use <span className="font-medium">Save
            model</span> to switch models instantly.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
