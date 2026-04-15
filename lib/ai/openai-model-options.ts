/**
 * Curated OpenAI API model IDs for the settings picker.
 * Copy matches OpenAI’s model docs; use “Custom” for any other id your account can call.
 * @see https://developers.openai.com/api/docs/models/all
 */
export type OpenAiModelTier = "fast" | "balanced" | "smart";

export type OpenAiModelPreset = {
  id: string;
  label: string;
  tier: OpenAiModelTier;
  /** Short hint for the settings UI (summarized from OpenAI docs) */
  hint: string;
};

export const OPENAI_MODEL_PRESETS: OpenAiModelPreset[] = [
  {
    id: "gpt-5.4",
    label: "GPT-5.4",
    tier: "smart",
    hint: "Flagship frontier model for advanced reasoning, coding, and professional workflows. About 1M token context window.",
  },
  {
    id: "gpt-5.4-mini",
    label: "GPT-5.4 mini",
    tier: "balanced",
    hint: "Faster, more cost-efficient GPT-5.4—strong for coding, computer use, and subagents.",
  },
  {
    id: "gpt-5.4-nano",
    label: "GPT-5.4 nano",
    tier: "fast",
    hint: "Cheapest and fastest GPT-5.4-class model for simple, high-volume tasks.",
  },
  {
    id: "gpt-4.1",
    label: "GPT-4.1",
    tier: "balanced",
    hint: "Smartest non-reasoning model: strong instruction following and tool calling, ~1M context, no reasoning step.",
  },
];

/** Default when no model is stored yet; matches a preset id above. */
export const DEFAULT_OPENAI_MODEL_ID = "gpt-5.4-mini";

export const CUSTOM_MODEL_VALUE = "__custom__";

const tierLabel: Record<OpenAiModelTier, string> = {
  fast: "Fast",
  balanced: "Balanced",
  smart: "Smart",
};

export function formatModelTier(tier: OpenAiModelTier): string {
  return tierLabel[tier];
}
