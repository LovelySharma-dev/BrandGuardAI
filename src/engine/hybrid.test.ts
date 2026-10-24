import { describe, expect, it } from "vitest";

import { DEMO_BRAND_KIT } from "@/data/seed-kit";
import { runHybridReview } from "@/engine/hybrid";
import { parseModelContent, safeModelError } from "@/engine/llm-adapter";
import { modelPassNotice } from "@/engine/model-notice";
import { isFreeModelId } from "@/engine/model-policy";
import { retrieveForReview } from "@/engine/retrieval";

describe("isFreeModelId", () => {
  it("accepts the free router and a :free id", () => {
    expect(isFreeModelId("openrouter/free")).toBe(true);
    expect(isFreeModelId("meta-llama/llama-3.3-70b-instruct:free")).toBe(true);
  });

  it("refuses a paid id and any fallback list", () => {
    expect(isFreeModelId("openai/gpt-4.1-mini")).toBe(false);
    expect(isFreeModelId("openrouter/free, openai/gpt-4.1-mini")).toBe(false);
    expect(isFreeModelId("a:free, b:free")).toBe(false);
  });
});

describe("retrieveForReview", () => {
  it("keeps the terminology source for a banned term and leaves unrelated sources out", () => {
    const result = retrieveForReview(
      "Please consult the brand bible before publishing.",
      DEMO_BRAND_KIT,
    );
    expect(result.snapshot.sourceIds).toContain("src_term_guide");
    expect(result.snapshot.sourceIds).not.toContain("src_fact_customers");
  });

  it("unions a deterministic citation even when the draft does not overlap that source", () => {
    const result = retrieveForReview("Hello there friend.", DEMO_BRAND_KIT, [
      "src_fact_founded",
    ]);
    expect(result.snapshot.sourceIds).toContain("src_fact_founded");
  });
});

describe("runHybridReview", () => {
  it("drops a forged model citation and does not approve the review", async () => {
    const result = await runHybridReview(
      { body: "Please consult the brand bible before publishing." },
      DEMO_BRAND_KIT,
      {
        model: "openrouter/free",
        complete: async () =>
          JSON.stringify({
            findings: [
              {
                category: "factual_claim",
                status: "verified",
                severity: "info",
                summary: "Invented support",
                rationale: "This citation is not in the snapshot.",
                citationIds: ["src_forged"],
                matchedText: "brand bible",
              },
            ],
          }),
      },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.review.status).not.toBe("approved");
    const forged = result.review.findings.find(
      (finding) => finding.summary === "Invented support",
    );
    expect(forged?.status).toBe("indeterminate");
    expect(forged?.citationIds).toEqual([]);
    expect(
      result.review.findings.some((finding) =>
        finding.citationIds.includes("src_forged"),
      ),
    ).toBe(false);
    expect(result.review.modelMeta?.outcome).toBe("completed");
  });

  it("keeps a model finding only when the retrieved excerpt contains the claim", async () => {
    const result = await runHybridReview(
      { body: "Inkloom was founded in 2019." },
      DEMO_BRAND_KIT,
      {
        model: "openrouter/free",
        complete: async () =>
          JSON.stringify({
            findings: [
              {
                category: "factual_claim",
                status: "verified",
                severity: "info",
                summary: "The founding year matches the fact sheet.",
                rationale: "The retrieved fact sheet states the founding year.",
                citationIds: ["src_fact_founded"],
                matchedText: "founded in 2019",
              },
            ],
          }),
      },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(
      result.review.findings.some(
        (finding) =>
          finding.summary === "The founding year matches the fact sheet." &&
          finding.citationIds.includes("src_fact_founded") &&
          finding.status === "verified",
      ),
    ).toBe(true);
    expect(result.snapshot.passages?.some((passage) => passage.id === "src_fact_founded")).toBe(
      true,
    );
  });

  it("abstains when a model cites a retrieved source that does not contain the claim", async () => {
    const result = await runHybridReview(
      { body: "Please consult the brand bible before publishing." },
      DEMO_BRAND_KIT,
      {
        model: "openrouter/free",
        complete: async () =>
          JSON.stringify({
            findings: [
              {
                category: "factual_claim",
                status: "verified",
                severity: "info",
                summary: "Publishing step is described in the terminology guide.",
                rationale: "The retrieved terminology guide is the source for this phrase.",
                citationIds: ["src_term_guide"],
                matchedText: "publishing",
              },
            ],
          }),
      },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const invented = result.review.findings.find(
      (finding) => finding.summary === "Publishing step is described in the terminology guide.",
    );
    expect(invented?.status).toBe("indeterminate");
    expect(invented?.citationIds).toEqual([]);
  });

  it("drops a model verified verdict that contradicts a deterministic finding", async () => {
    const result = await runHybridReview(
      { body: "Inkloom was founded in 2015." },
      DEMO_BRAND_KIT,
      {
        model: "openrouter/free",
        complete: async () =>
          JSON.stringify({
            findings: [
              {
                category: "factual_claim",
                status: "verified",
                severity: "info",
                summary: "The model calls 2015 supported.",
                rationale: "This disagrees with the deterministic contradiction.",
                citationIds: ["src_fact_founded"],
                matchedText: "founded",
              },
            ],
          }),
      },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(
      result.review.findings.some(
        (finding) => finding.summary === "The model calls 2015 supported.",
      ),
    ).toBe(false);
    expect(
      result.review.findings.some(
        (finding) =>
          finding.status === "contradicted" && finding.matchedText === "founded in 2015",
      ),
    ).toBe(true);
    expect(result.review.status).not.toBe("approved");
  });

  it("does not call the model when the id is paid", async () => {
    let called = false;
    const result = await runHybridReview(
      { body: "Please consult the brand bible before publishing." },
      DEMO_BRAND_KIT,
      {
        model: "openai/gpt-4.1-mini",
        complete: async () => {
          called = true;
          return "{\"findings\":[]}";
        },
      },
    );
    expect(called).toBe(false);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.review.modelMeta?.outcome).toBe("failed");
    expect(result.review.modelMeta?.model).toBe("refused");
    expect(
      result.review.findings.some((finding) => finding.ruleId === "term_brand_bible"),
    ).toBe(true);
  });

  it("repairs invalid JSON once and then keeps the deterministic finding", async () => {
    let calls = 0;
    const result = await runHybridReview(
      { body: "Please consult the brand bible before publishing." },
      DEMO_BRAND_KIT,
      {
        model: "openrouter/free",
        complete: async () => {
          calls += 1;
          if (calls === 1) return "not json";
          return JSON.stringify({ findings: [] });
        },
      },
    );
    expect(calls).toBe(2);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.review.modelMeta?.outcome).toBe("completed");
    expect(
      result.review.findings.some((finding) => finding.ruleId === "term_brand_bible"),
    ).toBe(true);
  });
});

describe("parseModelContent", () => {
  it("reads a fenced JSON object", () => {
    const parsed = parseModelContent('```json\n{"findings":[]}\n```');
    expect(parsed.ok).toBe(true);
  });

  it("rejects empty and malformed output", () => {
    expect(parseModelContent("").ok).toBe(false);
    expect(parseModelContent("not json").ok).toBe(false);
    expect(parseModelContent('{"findings":[{"status":"approved"}]}').ok).toBe(false);
  });
});

describe("optional model failures", () => {
  it("keeps deterministic findings when the model returns nothing", async () => {
    const result = await runHybridReview(
      { body: "Please consult the brand bible before publishing." },
      DEMO_BRAND_KIT,
      { model: "openrouter/free", complete: async () => "" },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.review.modelMeta?.outcome).toBe("failed");
    expect(result.review.status).not.toBe("approved");
    expect(result.review.findings.some((finding) => finding.ruleId === "term_brand_bible")).toBe(
      true,
    );
    expect(modelPassNotice(result.review.modelMeta)).toMatch(/deterministic checks/);
    expect(modelPassNotice(result.review.modelMeta)).not.toMatch(/finding_schema|sk-|bearer/i);
  });

  it("keeps deterministic findings when the model times out", async () => {
    const result = await runHybridReview(
      { body: "Please consult the brand bible before publishing." },
      DEMO_BRAND_KIT,
      {
        model: "openrouter/free",
        complete: async () => {
          throw new Error("The operation was aborted");
        },
      },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.review.modelMeta?.outcome).toBe("failed");
    expect(result.review.status).not.toBe("approved");
    expect(modelPassNotice(result.review.modelMeta)).toMatch(/timed out/);
  });

  it("hides a provider error that contains a key", () => {
    expect(safeModelError(new Error("bad bearer sk-test-secret"))).toBe("Model request failed");
  });
});
