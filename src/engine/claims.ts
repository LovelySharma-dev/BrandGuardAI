import type { BrandKit, Finding } from "@/domain/schemas";
import { createId } from "@/engine/ids";

/**
 * Detects configured absolute promotional claims.
 * Hits are `unsupported` (or policy-framed) — never `verified` from pattern match alone.
 */
export function detectPromotionalClaims(
  reviewId: string,
  body: string,
  kit: BrandKit,
): Finding[] {
  const findings: Finding[] = [];
  const lower = body.toLowerCase();

  for (const policy of kit.claimPolicies) {
    if (!policy.enabled) continue;
    const needle = policy.pattern.toLowerCase();
    let from = 0;
    while (from < lower.length) {
      const idx = lower.indexOf(needle, from);
      if (idx === -1) break;

      const end = idx + policy.pattern.length;
      const matchedText = body.slice(idx, end);
      const findingId = createId("find");
      const suggestionId = createId("sug");

      // Soften absolute claims without inventing substitute metrics.
      const softened = softenClaim(body, idx, end, matchedText);

      findings.push({
        id: findingId,
        reviewId,
        category: "promotional_claim",
        span: { start: idx, end },
        status: "unsupported",
        severity: policy.severity,
        summary: policy.message,
        rationale: `Claim policy “${policy.id}” matched “${matchedText}”. Pattern matching is not factual verification — status is unsupported until an approved fact can support the claim.`,
        citationIds: [],
        evidenceGapReason:
          "No approved fact in the pinned brand kit supports this absolute claim.",
        ruleId: policy.id,
        matchedText,
        suggestion: {
          id: suggestionId,
          findingId,
          proposedText: softened,
          rationale:
            "Replace the absolute claim with qualified language that does not invent metrics.",
          accepted: null,
        },
      });

      from = end;
    }
  }

  return findings;
}

function softenClaim(
  body: string,
  start: number,
  end: number,
  matched: string,
): string {
  const lower = matched.toLowerCase();
  let replacement = "a leading option for";
  if (lower.includes("best in the world")) {
    replacement = "a focused";
  } else if (lower.includes("#1") || lower.includes("best")) {
    replacement = "a strong";
  } else if (lower.includes("never fails") || lower.includes("guaranteed")) {
    replacement = "designed to support";
  } else if (lower.includes("100%")) {
    replacement = "highly";
  }
  return body.slice(0, start) + replacement + body.slice(end);
}
