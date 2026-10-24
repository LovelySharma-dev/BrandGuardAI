import { describe, expect, it } from "vitest";

import { DEMO_BRAND_KIT } from "@/data/seed-kit";
import { applyEvidenceGate } from "@/engine/evidence-gate";
import {
  applySuggestionDecision,
  runDeterministicReview,
} from "@/engine/review";
import type { BrandKit, Finding } from "@/domain/schemas";

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
    expect(accepted.status).toBe(result.review.status);
    expect(accepted.status).not.toBe("approved");
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

  it("keeps a real citation and drops a fabricated one on the same finding", () => {
    const finding: Finding = {
      id: "find_mixed",
      reviewId: "rev_1",
      category: "factual_claim",
      span: null,
      status: "contradicted",
      severity: "blocker",
      summary: "Mixed citations",
      rationale: "One id is real.",
      citationIds: ["src_fact_founded", "src_from_another_review"],
      matchedText: "founded in 2015",
    };
    const gated = applyEvidenceGate([finding], {
      id: "snap_1",
      kitVersion: "1.0.0",
      sourceIds: ["src_fact_founded"],
      createdAt: new Date().toISOString(),
    });
    expect(gated[0].status).toBe("contradicted");
    expect(gated[0].citationIds).toEqual(["src_fact_founded"]);
    expect(gated[0].rationale).toMatch(/src_from_another_review/);
  });

  it("does not let an unrelated retrieved excerpt verify a model claim", () => {
    const finding: Finding = {
      id: "find_model",
      reviewId: "rev_1",
      category: "factual_claim",
      span: null,
      status: "verified",
      severity: "info",
      summary: "Publishing is approved",
      rationale: "The model cited a retrieved source.",
      citationIds: ["src_term_guide"],
      matchedText: "publishing",
      ruleId: "model_pass",
    };
    const gated = applyEvidenceGate([finding], {
      id: "snap_1",
      kitVersion: "1.0.0",
      sourceIds: ["src_term_guide"],
      passages: [
        {
          id: "src_term_guide",
          title: "Terminology guide v1",
          excerpt: DEMO_BRAND_KIT.sources[2]!.excerpt,
          sourceType: "terminology",
          kitVersion: "1.0.0",
        },
      ],
      createdAt: new Date().toISOString(),
    });
    expect(gated[0].status).toBe("indeterminate");
    expect(gated[0].citationIds).toEqual([]);
    expect(gated[0].evidenceGapReason).toBeTruthy();
  });

  it("accepts a model citation only when the pinned excerpt contains the claim", () => {
    const finding: Finding = {
      id: "find_model_ok",
      reviewId: "rev_1",
      category: "factual_claim",
      span: null,
      status: "verified",
      severity: "info",
      summary: "Founding year is supported",
      rationale: "The excerpt states the year.",
      citationIds: ["src_fact_founded"],
      matchedText: "founded in 2019",
      ruleId: "model_pass",
    };
    const gated = applyEvidenceGate([finding], {
      id: "snap_1",
      kitVersion: "1.0.0",
      sourceIds: ["src_fact_founded"],
      passages: [
        {
          id: "src_fact_founded",
          title: "Company fact sheet — founding",
          excerpt: DEMO_BRAND_KIT.sources[0]!.excerpt,
          sourceType: "fact",
          kitVersion: "1.0.0",
        },
      ],
      createdAt: new Date().toISOString(),
    });
    expect(gated[0].status).toBe("verified");
    expect(gated[0].citationIds).toEqual(["src_fact_founded"]);
  });

  it("abstains on short overlaps, unrelated numbers, negation, and paraphrases", () => {
    const excerpt = "Inkloom was founded in 2019. Do not claim earlier founding dates.";
    const snapshot = {
      id: "snap_1",
      kitVersion: "1.0.0",
      sourceIds: ["src_fact_founded"],
      passages: [
        {
          id: "src_fact_founded",
          title: "Company fact sheet — founding",
          excerpt,
          sourceType: "fact" as const,
          kitVersion: "1.0.0",
        },
      ],
      createdAt: new Date().toISOString(),
    };
    const model = (matchedText: string, status: Finding["status"] = "verified"): Finding => ({
      id: "find_model",
      reviewId: "rev_1",
      category: "factual_claim",
      span: null,
      status,
      severity: "info",
      summary: "Model verdict",
      rationale: "The model assigned a retrieved source.",
      citationIds: ["src_fact_founded"],
      matchedText,
      ruleId: "model_pass",
    });

    for (const matchedText of ["2019", "founded", "design", "the year 2019"]) {
      const gated = applyEvidenceGate([model(matchedText)], snapshot);
      expect(gated[0]?.status).toBe("indeterminate");
      expect(gated[0]?.citationIds).toEqual([]);
    }

    const negated = applyEvidenceGate([model("founded in 2019")], {
      ...snapshot,
      passages: [
        {
          ...snapshot.passages[0]!,
          excerpt: "Do not say founded in 2019 in the public draft.",
        },
      ],
    });
    expect(negated[0]?.status).toBe("indeterminate");

    const contradicted = applyEvidenceGate(
      [model("founded in 2019", "contradicted")],
      {
        ...snapshot,
        passages: [
          {
            ...snapshot.passages[0]!,
            excerpt: "Do not say founded in 2019 in the public draft.",
          },
        ],
      },
    );
    expect(contradicted[0]?.status).toBe("contradicted");
    expect(contradicted[0]?.citationIds).toEqual(["src_fact_founded"]);

    for (const matchedText of [
      "Inkloom opened its doors in 2019",
      "The 2019 catalog lists spring colors",
    ]) {
      const gated = applyEvidenceGate([model(matchedText)], snapshot);
      expect(gated[0]?.status).toBe("indeterminate");
    }
  });
});

describe("fact pattern precision", () => {
  function statuses(body: string) {
    const result = runDeterministicReview({ body });
    expect(result.ok).toBe(true);
    if (!result.ok) return [];
    return result.review.findings
      .filter((finding) => finding.category === "factual_claim")
      .map((finding) => finding.status);
  }

  it("verifies the approved founding sentence and the approved customer sentence", () => {
    expect(statuses("Inkloom was founded in 2019.")).toContain("verified");
    expect(statuses("Trusted by more than 2,000 design teams.")).toContain("verified");
  });

  it("contradicts a direct conflict and a denial of an approved fact", () => {
    expect(statuses("Inkloom was founded in 2015.")).toContain("contradicted");
    expect(statuses("Inkloom was not founded in 2019.")).toEqual(["contradicted"]);
    expect(statuses("We are not trusted by more than 2,000 design teams.")).toEqual([
      "contradicted",
    ]);
  });

  it("does not verify unrelated dates, names, or customer wording", () => {
    expect(statuses("Our catalog number is 2019.")).toEqual([]);
    expect(statuses("The team established a partnership in 2019.")).toEqual([]);
    expect(statuses("We are serving 2,000 teams this quarter.")).toEqual([]);
    expect(statuses("Inkloom was founded after the 2019 rebrand.")).toEqual([]);
  });

  it("does not turn a denied false year or missing evidence into a contradiction", () => {
    expect(statuses("Inkloom was not founded in 2015.")).toEqual([]);
    expect(statuses("Inkloom opened its doors recently.")).toEqual([]);
  });
});

describe("unpublished sources", () => {
  it("does not verify a fact whose source is missing from the published kit", () => {
    const kit: BrandKit = {
      ...DEMO_BRAND_KIT,
      sources: DEMO_BRAND_KIT.sources.filter((source) => source.id !== "src_fact_founded"),
    };
    const result = runDeterministicReview(
      { body: "Inkloom was founded in 2019." },
      kit,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const finding = result.review.findings.find((item) => item.ruleId === "fact_founded_2019");
    expect(finding?.status).toBe("indeterminate");
    expect(finding?.citationIds).toEqual([]);
  });
});
