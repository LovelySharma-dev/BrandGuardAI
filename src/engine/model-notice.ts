type ModelNotice = {
  outcome?: string;
  reason?: string;
};

/**
 * Judge-facing copy for the optional model pass.
 * The raw provider error stays off the page.
 */
export function modelPassNotice(meta: ModelNotice | undefined): string | null {
  if (!meta || meta.outcome === "completed") return null;
  if (meta.outcome === "skipped") {
    return "The optional model pass was skipped. These findings are from the deterministic checks.";
  }
  if (meta.outcome !== "failed") return null;
  if (meta.reason?.toLowerCase().includes("timed out")) {
    return "The optional model pass timed out. These findings are from the deterministic checks.";
  }
  return "The optional model pass did not return a usable result. These findings are from the deterministic checks.";
}
