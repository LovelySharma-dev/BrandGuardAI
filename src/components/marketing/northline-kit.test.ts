import { describe, expect, it } from "vitest";

import { runDeterministicReview } from "@/engine/review";
import { NORTHLINE_DRAFT, NORTHLINE_KIT } from "@/components/marketing/northline-kit";

describe("Northline landing demo", () => {
  it("returns a term hit, an evidence gap, a contradiction, and a supported sentence", () => {
    const result = runDeterministicReview(
      {
        title: "Northline launch",
        body: NORTHLINE_DRAFT,
        orgId: NORTHLINE_KIT.orgId,
      },
      NORTHLINE_KIT,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.review.status).not.toBe("approved");
    const statuses = result.review.findings.map((finding) => finding.status);
    expect(statuses).toContain("policy_hit");
    expect(statuses).toContain("unsupported");
    expect(statuses).toContain("contradicted");
    expect(statuses).toContain("verified");
    const allowed = new Set(NORTHLINE_KIT.sources.map((source) => source.id));
    for (const finding of result.review.findings) {
      expect(finding.citationIds.every((id) => allowed.has(id))).toBe(true);
    }
    const term = result.review.findings.find((finding) => finding.matchedText === "miracle cure");
    expect(term?.citationIds).toContain("src_term_guide");
    const gap = result.review.findings.find((finding) => finding.matchedText === "clinically proven");
    expect(gap?.status).toBe("unsupported");
    expect(gap?.citationIds).toEqual([]);
  });
});
