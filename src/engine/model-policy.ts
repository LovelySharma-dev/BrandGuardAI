/** A free id is the OpenRouter router, or one model id ending in `:free`. */
export function isFreeModelId(model: string): boolean {
  const parts = model
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  if (parts.length !== 1) return false;
  const part = parts[0];
  return part === "openrouter/free" || part.endsWith(":free");
}

export function configuredFreeModel():
  | { ok: true; model: string }
  | { ok: false; reason: string } {
  const model = process.env.LLM_MODEL?.trim() || "openrouter/free";
  if (!isFreeModelId(model)) {
    return {
      ok: false,
      reason:
        "LLM_MODEL must be openrouter/free or an id ending in :free. The model pass was not called.",
    };
  }
  return { ok: true, model };
}
