import { beforeEach, describe, expect, it } from "vitest";

import { DEMO_BRAND_KIT } from "@/data/seed-kit";
import { applyEvidenceGate } from "@/engine/evidence-gate";
import {
  applySuggestionDecision,
  runDeterministicReview,
} from "@/engine/review";
import { __resetAuditForTests } from "@/lib/audit";
import { __resetStoreForTests } from "@/lib/store";
import type { BrandKit, Finding } from "@/domain/schemas";

beforeEach(() => {
  __resetStoreForTests();
  __resetAuditForTests();
});

describe("runDeterministicReview", () => {
  it("accepts compliant content with optional verified facts", () => {
    const result = runDeterministicReview({
      title: "Clean",
      body: "Inkloom was founded in 2019. Trusted by more than 2,000 design teams. Our content review keeps claims grounded.",
      orgId: "org_demo",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.review.findings.some((f) => f.severity === "blocker")).toBe(
      false,
    );
    expect(
      result.review.findings.some(
        (f) => f.status === "verified" && f.category === "factual_claim",
      ),
    ).toBe(true);
    expect(
      result.review.findings.every(
        (f) =>
          f.status !== "verified" ||
          (f.citationIds.length > 0 &&
            f.citationIds.every((id) => result.snapshot.sourceIds.includes(id))),
      ),
    ).toBe(true);
  });

  it("flags terminology violations as policy_hit", () => {
    const result = runDeterministicReview({
      body: "Please consult the brand bible before publishing.",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const hit = result.review.findings.find((f) => f.ruleId === "term_brand_bible");
    expect(hit?.status).toBe("policy_hit");
    expect(hit?.category).toBe("terminology");
    expect(hit?.suggestion?.proposedText).toContain("brand kit");
  });

  it("marks absolute promotional claims as unsupported, not verified", () => {
    const result = runDeterministicReview({
      body: "We are the best in the world at brand governance.",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const claim = result.review.findings.find(
      (f) => f.ruleId === "claim_best",
    );
    expect(claim?.status).toBe("unsupported");
    expect(claim?.citationIds).toEqual([]);
    expect(claim?.evidenceGapReason).toBeTruthy();
  });

  it("distinguishes contradicted facts from missing evidence", () => {
    const contradicted = runDeterministicReview({
      body: "Inkloom was founded in 2015 and serves marketers.",
    });
    expect(contradicted.ok).toBe(true);
    if (!contradicted.ok) return;
    const bad = contradicted.review.findings.find(
      (f) => f.status === "contradicted",
    );
    expect(bad).toBeTruthy();
    expect(bad?.citationIds.length).toBeGreaterThan(0);

    const unsupported = runDeterministicReview({
      body: "Inkloom was founded in 2021 according to rumour.",
    });
    expect(unsupported.ok).toBe(true);
    if (!unsupported.ok) return;
    const gap = unsupported.review.findings.find(
      (f) => f.status === "unsupported" && f.category === "factual_claim",
    );
    expect(gap).toBeTruthy();
    expect(gap?.citationIds).toEqual([]);
  });

  it("rejects empty submissions", () => {
    const result = runDeterministicReview({ body: "   " });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.toLowerCase()).toContain("content");
  });

  it("reports malformed brand kits", () => {
    const broken = {
      ...DEMO_BRAND_KIT,
      termRules: [{ id: "x" }],
    } as unknown as BrandKit;
    const result = runDeterministicReview(
      { body: "Hello world compliant copy." },
      broken,
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/malformed/i);
  });

  it("supports accept and reject of corrections", () => {
    const result = runDeterministicReview({
      body: "Update the brand bible today.",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const suggestion = result.review.findings.find((f) => f.suggestion)
      ?.suggestion;
    expect(suggestion).toBeTruthy();

    const accepted = applySuggestionDecision(
      result.review,
      suggestion!.id,
      "accept",
    );
    expect(accepted.body).toContain("brand kit");
    expect(accepted.revisions.length).toBeGreaterThan(
      result.review.revisions.length,
    );

    const rejectedBase = runDeterministicReview({
      body: "Update the brand bible today.",
    });
    if (!rejectedBase.ok) return;
    const sug2 = rejectedBase.review.findings.find((f) => f.suggestion)
      ?.suggestion;
    const rejected = applySuggestionDecision(
      rejectedBase.review,
      sug2!.id,
      "reject",
    );
    expect(rejected.body).toBe(rejectedBase.review.body);
    expect(rejected.findings.find((f) => f.suggestion?.id === sug2!.id)
      ?.suggestion?.accepted).toBe(false);
  });
});

describe("applyEvidenceGate", () => {
  it("strips forged citations and downgrades status", () => {
    const finding: Finding = {
      id: "find_1",
      reviewId: "rev_1",
      category: "factual_claim",
      span: null,
      status: "verified",
      severity: "info",
      summary: "Fake cite",
      rationale: "Should not pass",
      citationIds: ["src_not_in_snapshot"],
    };
    const gated = applyEvidenceGate([finding], {
      id: "snap_1",
      kitVersion: "1.0.0",
      sourceIds: ["src_fact_founded"],
      createdAt: new Date().toISOString(),
    });
    expect(gated[0].status).toBe("indeterminate");
    expect(gated[0].citationIds).toEqual([]);
  });
});
