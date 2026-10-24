import type { BrandKit, Finding } from "@/domain/schemas";
import { createId } from "@/engine/ids";

export type ColorToken = BrandKit["colorTokens"][number];

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const match = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return null;
  const value = Number.parseInt(match[1], 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function channel(value: number): number {
  const scaled = value / 255;
  return scaled <= 0.03928
    ? scaled / 12.92
    : ((scaled + 0.055) / 1.055) ** 2.4;
}

/** WCAG relative contrast. Returns null when either color is not a 6-digit hex. */
export function contrastRatio(left: string, right: string): number | null {
  const a = hexToRgb(left);
  const b = hexToRgb(right);
  if (!a || !b) return null;
  const l1 = 0.2126 * channel(a.r) + 0.7152 * channel(a.g) + 0.0722 * channel(a.b);
  const l2 = 0.2126 * channel(b.r) + 0.7152 * channel(b.g) + 0.0722 * channel(b.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function detectVisualMismatches(
  reviewId: string,
  body: string,
  kit: BrandKit,
): Finding[] {
  const tokens = kit.colorTokens ?? [];
  if (tokens.length === 0) return [];

  const found = [...body.matchAll(/#[0-9A-Fa-f]{6}\b/g)].map((match) => ({
    hex: match[0].toUpperCase(),
    start: match.index ?? 0,
  }));
  if (found.length === 0) return [];

  const known = new Map(
    tokens.map((token) => [token.hex.toUpperCase(), token]),
  );
  const background = tokens.find((token) => token.role === "background");
  const findings: Finding[] = [];
  const seen = new Set<string>();

  for (const color of found) {
    if (seen.has(color.hex)) continue;
    seen.add(color.hex);
    const token = known.get(color.hex);
    if (!token) {
      findings.push({
        id: createId("find"),
        reviewId,
        category: "terminology",
        span: { start: color.start, end: color.start + color.hex.length },
        status: "policy_hit",
        severity: "warning",
        summary: `${color.hex} is not a published kit color.`,
        rationale:
          "The draft uses a hex color that is not in the published color tokens. This is a token check, not a factual verification.",
        citationIds: [],
        matchedText: color.hex,
        ruleId: "color_token",
      });
      continue;
    }
    if (!background || token.role === "background") continue;
    const ratio = contrastRatio(token.hex, background.hex);
    if (ratio != null && ratio < 4.5) {
      findings.push({
        id: createId("find"),
        reviewId,
        category: "terminology",
        span: { start: color.start, end: color.start + color.hex.length },
        status: "policy_hit",
        severity: "warning",
        summary: `${token.name} on ${background.name} is below 4.5:1 contrast.`,
        rationale: `Measured contrast is ${ratio.toFixed(2)}:1. Text at this size needs at least 4.5:1 against the kit background. The check was skipped for pairs that are not both published tokens.`,
        citationIds: [],
        matchedText: color.hex,
        ruleId: "color_contrast",
      });
    }
  }

  return findings;
}
