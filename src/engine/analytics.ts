import type { BrandKit, ContentReview } from "@/domain/schemas";

export type RuleTally = {
  ruleId: string;
  label: string;
  count: number;
  reviewCount: number;
};

export type VagueGuideline = {
  key: string;
  label: string;
  count: number;
  reason: string;
};

function ruleLabel(ruleId: string, kit: BrandKit | null): string {
  const term = kit?.termRules.find((rule) => rule.id === ruleId);
  if (term) return term.message;
  const policy = kit?.claimPolicies.find((item) => item.id === ruleId);
  if (policy) return policy.message;
  const fact = kit?.facts.find((item) => item.id === ruleId);
  if (fact) return fact.statement;
  if (ruleId === "color_token") return "Color is not in the published kit tokens.";
  if (ruleId === "color_contrast") return "Color contrast is below 4.5:1.";
  if (ruleId === "model_pass") return "Added by the model pass.";
  return ruleId;
}

export function summarizeReviews(
  reviews: ContentReview[],
  kit: BrandKit | null,
): { recurring: RuleTally[]; vague: VagueGuideline[] } {
  const rules = new Map<string, { count: number; reviews: Set<string> }>();
  const vague = new Map<string, VagueGuideline>();

  for (const review of reviews) {
    const seenInReview = new Set<string>();
    for (const finding of review.findings) {
      if (finding.ruleId) {
        const current = rules.get(finding.ruleId) ?? {
          count: 0,
          reviews: new Set<string>(),
        };
        current.count += 1;
        if (!seenInReview.has(finding.ruleId)) {
          current.reviews.add(review.id);
          seenInReview.add(finding.ruleId);
        }
        rules.set(finding.ruleId, current);
      }

      if (finding.status !== "indeterminate") continue;
      const key = finding.ruleId ?? finding.summary;
      const existing = vague.get(key);
      if (existing) {
        existing.count += 1;
        continue;
      }
      vague.set(key, {
        key,
        label: finding.ruleId
          ? ruleLabel(finding.ruleId, kit)
          : finding.summary,
        count: 1,
        reason:
          finding.evidenceGapReason ??
          "The check could not decide, so the guideline may be too vague to judge.",
      });
    }
  }

  return {
    recurring: [...rules.entries()]
      .map(([ruleId, tally]) => ({
        ruleId,
        label: ruleLabel(ruleId, kit),
        count: tally.count,
        reviewCount: tally.reviews.size,
      }))
      .sort((a, b) => b.count - a.count || a.ruleId.localeCompare(b.ruleId))
      .slice(0, 8),
    vague: [...vague.values()].sort((a, b) => b.count - a.count),
  };
}
