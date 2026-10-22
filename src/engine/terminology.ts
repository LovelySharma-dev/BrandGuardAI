import type { BrandKit, Finding } from "@/domain/schemas";
import { createId } from "@/engine/ids";

function findAllMatches(
  body: string,
  term: string,
): Array<{ start: number; end: number; text: string }> {
  const matches: Array<{ start: number; end: number; text: string }> = [];
  const lower = body.toLowerCase();
  const needle = term.toLowerCase();
  let from = 0;
  while (from < lower.length) {
    const idx = lower.indexOf(needle, from);
    if (idx === -1) break;
    matches.push({
      start: idx,
      end: idx + term.length,
      text: body.slice(idx, idx + term.length),
    });
    from = idx + Math.max(term.length, 1);
  }
  return matches;
}

export function detectTerminologyViolations(
  reviewId: string,
  body: string,
  kit: BrandKit,
): Finding[] {
  const findings: Finding[] = [];

  const claimedSpans: Array<{ start: number; end: number }> = [];

  for (const rule of kit.termRules) {
    if (!rule.enabled) continue;
    if (rule.type !== "banned") continue;

    // Prefer longest terms first so "AI audit" wins over overlapping shorter needles.
    const terms = [...rule.terms].sort((a, b) => b.length - a.length);

    for (const term of terms) {
      for (const match of findAllMatches(body, term)) {
        const overlaps = claimedSpans.some(
          (s) => match.start < s.end && match.end > s.start,
        );
        if (overlaps) continue;
        claimedSpans.push({ start: match.start, end: match.end });

        const suggestionId = createId("sug");
        const findingId = createId("find");
        const proposed =
          rule.preferredReplacement != null
            ? replaceSpan(body, match.start, match.end, rule.preferredReplacement)
            : body;

        findings.push({
          id: findingId,
          reviewId,
          category: "terminology",
          span: { start: match.start, end: match.end },
          status: "policy_hit",
          severity: rule.severity,
          summary: rule.message,
          rationale: `Terminology rule “${rule.id}” matched “${match.text}”. This is a policy hit, not a factual verification.`,
          citationIds: ["src_term_guide"].filter((id) =>
            kit.sources.some((s) => s.id === id),
          ),
          ruleId: rule.id,
          matchedText: match.text,
          suggestion:
            rule.preferredReplacement != null
              ? {
                  id: suggestionId,
                  findingId,
                  proposedText: proposed,
                  rationale: `Replace “${match.text}” with “${rule.preferredReplacement}” while preserving surrounding copy.`,
                  accepted: null,
                }
              : undefined,
        });
      }
    }
  }

  return findings;
}

function replaceSpan(
  body: string,
  start: number,
  end: number,
  replacement: string,
): string {
  return body.slice(0, start) + replacement + body.slice(end);
}
