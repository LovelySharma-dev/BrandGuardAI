import { PGlite } from "@electric-sql/pglite";

import { DEMO_BRAND_KIT } from "@/data/seed-kit";
import { __setDbForTests, migrateAndSeed, resetAndSeed } from "@/db/client";
import { getReview, listAuditEvents, saveReview } from "@/db/repository";
import {
  DEMO_ADMIN_ID,
  DEMO_AUTHOR_ID,
  DEMO_REVIEWER_ID,
  OTHER_REVIEW_ID,
} from "@/db/seed";
import { ContentReviewSchema, type BrandKit, type Finding } from "@/domain/schemas";
import { applyEvidenceGate, passageSupportsClaim } from "@/engine/evidence-gate";
import { runHybridReview } from "@/engine/hybrid";
import { createId } from "@/engine/ids";
import { openRouterComplete } from "@/engine/llm-adapter";
import { runDeterministicReview } from "@/engine/review";
import { changeMemberRole } from "@/lib/membership";
import { __setSessionIdentityForTests } from "@/lib/session";
import { transitionReview } from "@/lib/transition-review";

export type IntegrityCase = {
  id: string;
  category: string;
  expected: string;
  actual: string;
  pass: boolean;
  explanation: string;
};

export type IntegrityReport = {
  caseCount: number;
  passed: number;
  failed: number;
  passRate: number;
  cases: IntegrityCase[];
};

function verdict(
  id: string,
  category: string,
  expected: string,
  actual: string,
  pass: boolean,
): IntegrityCase {
  return {
    id,
    category,
    expected,
    actual,
    pass,
    explanation: pass ? "Matched the expected safety behaviour." : actual,
  };
}

function findingStatus(findings: Finding[], status: Finding["status"], ruleId?: string): string {
  const hit = findings.find(
    (finding) => finding.status === status && (ruleId ? finding.ruleId === ruleId : true),
  );
  if (!hit) return "absent";
  return `${hit.status} citations=${hit.citationIds.join(",") || "none"}`;
}

export async function runIntegrityBenchmark(): Promise<IntegrityReport> {
  const cases: IntegrityCase[] = [];
  const kit = DEMO_BRAND_KIT;

  const supported = runDeterministicReview(
    { title: "Supported", body: "Inkloom was founded in 2019.", orgId: kit.orgId },
    kit,
  );
  cases.push(
    verdict(
      "01-supported-fact",
      "supported claim",
      "verified with src_fact_founded",
      supported.ok
        ? findingStatus(supported.review.findings, "verified", "fact_founded_2019")
        : supported.error,
      supported.ok &&
        supported.review.findings.some(
          (finding) =>
            finding.status === "verified" &&
            finding.citationIds.includes("src_fact_founded") &&
            finding.ruleId === "fact_founded_2019",
        ) &&
        supported.review.status !== "approved",
    ),
  );

  const contradicted = runDeterministicReview(
    { title: "Contradicted", body: "Inkloom was founded in 2015.", orgId: kit.orgId },
    kit,
  );
  cases.push(
    verdict(
      "02-contradiction",
      "conflicting claim",
      "contradicted with src_fact_founded, not approved",
      contradicted.ok
        ? findingStatus(contradicted.review.findings, "contradicted", "fact_founded_2019")
        : contradicted.error,
      contradicted.ok &&
        contradicted.review.status !== "approved" &&
        contradicted.review.findings.some(
          (finding) =>
            finding.status === "contradicted" &&
            finding.citationIds.includes("src_fact_founded"),
        ),
    ),
  );

  const unsupported = runDeterministicReview(
    { title: "Unsupported", body: "Inkloom is the best in the world platform.", orgId: kit.orgId },
    kit,
  );
  cases.push(
    verdict(
      "03-unsupported",
      "plausible claim with no approved fact",
      "unsupported with an evidence gap, not contradicted",
      unsupported.ok
        ? findingStatus(unsupported.review.findings, "unsupported", "claim_best")
        : unsupported.error,
      unsupported.ok &&
        unsupported.review.findings.some(
          (finding) =>
            finding.ruleId === "claim_best" &&
            finding.status === "unsupported" &&
            finding.citationIds.length === 0 &&
            Boolean(finding.evidenceGapReason),
        ) &&
        !unsupported.review.findings.some((finding) => finding.status === "contradicted"),
    ),
  );

  const ambiguous = runDeterministicReview(
    {
      title: "Ambiguous",
      body: "Our timeline mentions 2019 without a founding claim.",
      orgId: kit.orgId,
    },
    kit,
  );
  cases.push(
    verdict(
      "04-ambiguous",
      "ambiguous evidence",
      "no verified or contradicted finding",
      ambiguous.ok
        ? ambiguous.review.findings.map((finding) => finding.status).join(",") || "no findings"
        : ambiguous.error,
      ambiguous.ok &&
        !ambiguous.review.findings.some(
          (finding) => finding.status === "verified" || finding.status === "contradicted",
        ),
    ),
  );

  const unpublishedKit: BrandKit = {
    ...kit,
    sources: kit.sources.filter((source) => source.id !== "src_fact_founded"),
  };
  const unpublished = runDeterministicReview(
    { title: "Unpublished source", body: "Inkloom was founded in 2019.", orgId: kit.orgId },
    unpublishedKit,
  );
  cases.push(
    verdict(
      "05-unpublished-source",
      "source missing from the published kit",
      "indeterminate, not verified",
      unpublished.ok
        ? findingStatus(unpublished.review.findings, "indeterminate", "fact_founded_2019")
        : unpublished.error,
      unpublished.ok &&
        unpublished.review.findings.some(
          (finding) =>
            finding.ruleId === "fact_founded_2019" &&
            finding.status === "indeterminate" &&
            finding.citationIds.length === 0,
        ),
    ),
  );

  const forged = applyEvidenceGate(
    [
      {
        id: "find_forged",
        reviewId: "rev_bench",
        category: "factual_claim",
        span: null,
        status: "verified",
        severity: "info",
        summary: "Fabricated citation",
        rationale: "The model invented a source id.",
        citationIds: ["src_fabricated"],
        matchedText: "founded in 2019",
        ruleId: "model_pass",
      },
    ],
    {
      id: "snap_bench",
      kitVersion: kit.version,
      sourceIds: ["src_fact_founded"],
      passages: [
        {
          id: "src_fact_founded",
          title: "Founding",
          excerpt: "Inkloom was founded in 2019.",
          sourceType: "fact",
          kitVersion: kit.version,
        },
      ],
      createdAt: "2026-01-01T00:00:00.000Z",
    },
  );
  cases.push(
    verdict(
      "06-fabricated-citation",
      "fabricated citation id",
      "indeterminate and the fabricated id is dropped",
      `${forged[0]?.status} citations=${forged[0]?.citationIds.join(",") || "none"}`,
      forged[0]?.status === "indeterminate" && forged[0].citationIds.length === 0,
    ),
  );

  const crossReview = applyEvidenceGate(
    [
      {
        id: "find_cross",
        reviewId: "rev_bench",
        category: "factual_claim",
        span: null,
        status: "verified",
        severity: "info",
        summary: "Citation from another review",
        rationale: "This id belongs to a different snapshot.",
        citationIds: ["src_other_review_only"],
        matchedText: "founded in 2019",
        ruleId: "model_pass",
      },
    ],
    {
      id: "snap_this_review",
      kitVersion: kit.version,
      sourceIds: ["src_fact_founded"],
      createdAt: "2026-01-01T00:00:00.000Z",
    },
  );
  cases.push(
    verdict(
      "07-cross-review-citation",
      "citation from another review",
      "indeterminate and the foreign id is dropped",
      `${crossReview[0]?.status} citations=${crossReview[0]?.citationIds.join(",") || "none"}`,
      crossReview[0]?.status === "indeterminate" &&
        !crossReview[0].citationIds.includes("src_other_review_only"),
    ),
  );

  const terminology = runDeterministicReview(
    { title: "Term", body: "Please consult the brand bible before publishing.", orgId: kit.orgId },
    kit,
  );
  cases.push(
    verdict(
      "08-terminology",
      "terminology policy",
      "policy_hit for brand bible",
      terminology.ok
        ? findingStatus(terminology.review.findings, "policy_hit", "term_brand_bible")
        : terminology.error,
      terminology.ok &&
        terminology.review.findings.some(
          (finding) =>
            finding.ruleId === "term_brand_bible" && finding.status === "policy_hit",
        ),
    ),
  );

  const forbidden = runDeterministicReview(
    { title: "Forbidden", body: "This workflow offers guaranteed approval.", orgId: kit.orgId },
    kit,
  );
  cases.push(
    verdict(
      "09-forbidden-claim",
      "forbidden claim",
      "policy_hit and not approved",
      forbidden.ok
        ? findingStatus(forbidden.review.findings, "policy_hit", "term_guaranteed_approval")
        : forbidden.error,
      forbidden.ok &&
        forbidden.review.status !== "approved" &&
        forbidden.review.findings.some(
          (finding) =>
            finding.ruleId === "term_guaranteed_approval" &&
            finding.status === "policy_hit" &&
            finding.severity === "blocker",
        ),
    ),
  );

  const suggestion = await runHybridReview(
    { title: "Suggestion", body: "Our content review keeps claims grounded.", orgId: kit.orgId },
    kit,
    {
      model: "openrouter/free",
      complete: async () =>
        JSON.stringify({
          findings: [
            {
              category: "factual_claim",
              status: "suggestion_only",
              severity: "info",
              summary: "Consider naming the audience.",
              rationale: "Editorial advice with no factual verdict.",
              citationIds: [],
            },
          ],
        }),
    },
  );
  cases.push(
    verdict(
      "10-suggestion-only",
      "editorial suggestion",
      "suggestion_only and the review stays unapproved",
      suggestion.ok
        ? `${findingStatus(suggestion.review.findings, "suggestion_only")} status=${suggestion.review.status}`
        : suggestion.error,
      suggestion.ok &&
        suggestion.review.status !== "approved" &&
        suggestion.review.findings.some((finding) => finding.status === "suggestion_only"),
    ),
  );

  const previousKey = process.env.OPENROUTER_API_KEY;
  const previousModel = process.env.LLM_MODEL;
  delete process.env.OPENROUTER_API_KEY;
  process.env.LLM_MODEL = "openrouter/free";
  try {
    let keyError = "";
    try {
      await openRouterComplete([{ role: "user", content: "ping" }]);
      keyError = "openRouterComplete returned without a key";
    } catch (error) {
      keyError = error instanceof Error ? error.message : "unknown";
    }
    const missing = await runHybridReview(
      { title: "No key", body: "Please consult the brand bible before publishing.", orgId: kit.orgId },
      kit,
    );
    cases.push(
      verdict(
        "11-missing-model-key",
        "missing model key",
        "deterministic policy hit remains; model is skipped; no approval",
        missing.ok
          ? `key=${keyError}; outcome=${missing.review.modelMeta?.outcome}; ${findingStatus(missing.review.findings, "policy_hit", "term_brand_bible")}`
          : missing.error,
        keyError === "OPENROUTER_API_KEY is not set" &&
          missing.ok &&
          missing.review.modelMeta?.outcome === "skipped" &&
          missing.review.status !== "approved" &&
          missing.review.findings.some((finding) => finding.ruleId === "term_brand_bible"),
      ),
    );
  } finally {
    if (previousKey === undefined) delete process.env.OPENROUTER_API_KEY;
    else process.env.OPENROUTER_API_KEY = previousKey;
    if (previousModel === undefined) delete process.env.LLM_MODEL;
    else process.env.LLM_MODEL = previousModel;
  }

  const malformed = await runHybridReview(
    { title: "Malformed", body: "Please consult the brand bible before publishing.", orgId: kit.orgId },
    kit,
    { model: "openrouter/free", complete: async () => "not json" },
  );
  const timedOut = await runHybridReview(
    { title: "Timeout", body: "Please consult the brand bible before publishing.", orgId: kit.orgId },
    kit,
    {
      model: "openrouter/free",
      complete: async () => {
        throw new Error("The operation was aborted");
      },
    },
  );
  cases.push(
    verdict(
      "12-provider-failure",
      "malformed response and timeout",
      "both failures keep the deterministic policy hit and stay unapproved",
      `malformed=${malformed.ok ? malformed.review.modelMeta?.outcome : malformed.error}; timeout=${timedOut.ok ? timedOut.review.modelMeta?.outcome : timedOut.error}`,
      malformed.ok &&
        timedOut.ok &&
        malformed.review.modelMeta?.outcome === "failed" &&
        timedOut.review.modelMeta?.outcome === "failed" &&
        malformed.review.status !== "approved" &&
        timedOut.review.status !== "approved" &&
        malformed.review.findings.some((finding) => finding.ruleId === "term_brand_bible") &&
        timedOut.review.findings.some((finding) => finding.ruleId === "term_brand_bible"),
    ),
  );

  const pinned = runDeterministicReview(
    { title: "Pinned", body: "Inkloom was founded in 2019.", orgId: kit.orgId },
    kit,
  );
  const newer: BrandKit = { ...kit, version: "1.0.1" };
  const rerun = runDeterministicReview(
    { title: "Pinned", body: "Inkloom was founded in 2019.", orgId: kit.orgId },
    newer,
  );
  cases.push(
    verdict(
      "13-pinned-kit",
      "newer kit does not rewrite an older review",
      "first review stays on 1.0.0 and the rerun is a new review on 1.0.1",
      pinned.ok && rerun.ok
        ? `${pinned.review.kitVersion}/${pinned.review.id} then ${rerun.review.kitVersion}/${rerun.review.id}`
        : "review failed",
      pinned.ok &&
        rerun.ok &&
        pinned.review.kitVersion === "1.0.0" &&
        pinned.snapshot.kitVersion === "1.0.0" &&
        pinned.snapshot.passages?.every((passage) => passage.kitVersion === "1.0.0") === true &&
        rerun.review.kitVersion === "1.0.1" &&
        rerun.review.id !== pinned.review.id &&
        pinned.review.kitVersion === "1.0.0",
    ),
  );

  const db = new PGlite();
  __setDbForTests(db);
  await migrateAndSeed(db);
  await resetAndSeed(db);
  __setSessionIdentityForTests(null);
  try {
    __setSessionIdentityForTests({ userId: DEMO_REVIEWER_ID });
    const cross = await transitionReview(OTHER_REVIEW_ID, "approve");
    const hidden = await getReview(OTHER_REVIEW_ID, "org_demo");
    const untouched = await getReview(OTHER_REVIEW_ID, "org_other");
    cases.push(
      verdict(
        "14-cross-organisation",
        "cross-organisation access",
        "reviewer in org_demo cannot read or approve org_other",
        `${cross.ok ? "approved" : cross.error}; visible=${hidden ? "yes" : "no"}; other=${untouched?.status ?? "missing"}`,
        !cross.ok &&
          hidden === null &&
          untouched?.status === "in_review" &&
          (await listAuditEvents("org_other")).length === 0,
      ),
    );

    const now = "2026-01-01T00:00:00.000Z";
    const queued = ContentReviewSchema.parse({
      id: createId("rev"),
      orgId: "org_demo",
      title: "Unauthorised approval",
      body: "A draft waiting for a reviewer.",
      intent: { goal: "", audience: "", channel: "", mustKeep: [] },
      status: "in_review",
      kitVersion: "1.0.0",
      snapshotId: null,
      findings: [],
      revisions: [],
      createdAt: now,
      updatedAt: now,
    });
    await saveReview(queued);
    __setSessionIdentityForTests({ userId: DEMO_AUTHOR_ID });
    const denied = await transitionReview(queued.id, "approve");
    cases.push(
      verdict(
        "15-unauthorised-approval",
        "author approval attempt",
        "author is rejected and the review stays in_review with no audit row",
        denied.ok ? "approved" : denied.error,
        !denied.ok &&
          (await getReview(queued.id, "org_demo"))?.status === "in_review" &&
          (await listAuditEvents("org_demo")).length === 0,
      ),
    );

    __setSessionIdentityForTests({ userId: DEMO_AUTHOR_ID });
    const granted = await changeMemberRole(DEMO_AUTHOR_ID, "admin");
    __setSessionIdentityForTests({ userId: DEMO_REVIEWER_ID });
    const reviewerGrant = await changeMemberRole(DEMO_AUTHOR_ID, "admin");
    cases.push(
      verdict(
        "16-role-grant",
        "role escalation",
        "author and reviewer cannot change membership roles",
        `author=${granted.ok ? "changed" : granted.error}; reviewer=${reviewerGrant.ok ? "changed" : reviewerGrant.error}`,
        !granted.ok && !reviewerGrant.ok,
      ),
    );

    const own = ContentReviewSchema.parse({
      ...queued,
      id: createId("rev"),
      createdBy: DEMO_ADMIN_ID,
    });
    await saveReview(own);
    __setSessionIdentityForTests({ userId: DEMO_ADMIN_ID });
    const self = await transitionReview(own.id, "approve");
    cases.push(
      verdict(
        "17-self-approval",
        "creator approval",
        "an admin cannot approve a review they created",
        self.ok ? "approved" : self.error,
        !self.ok && (await getReview(own.id, "org_demo"))?.status === "in_review",
      ),
    );

    const negated = runDeterministicReview(
      { body: "Inkloom was not founded in 2019.", orgId: "org_demo" },
      DEMO_BRAND_KIT,
    );
    cases.push(
      verdict(
        "18-negated-approved-fact",
        "negated approved fact",
        "contradicted, with the approved source",
        negated.ok
          ? negated.review.findings
              .map((finding) => `${finding.status}:${finding.matchedText ?? ""}`)
              .join("; ") || "none"
          : negated.error,
        negated.ok &&
          negated.review.findings.some(
            (finding) =>
              finding.status === "contradicted" &&
              finding.citationIds.includes("src_fact_founded"),
          ) &&
          !negated.review.findings.some((finding) => finding.status === "verified"),
      ),
    );

    const unrelated = runDeterministicReview(
      { body: "The 2019 catalog lists spring colors for design teams.", orgId: "org_demo" },
      DEMO_BRAND_KIT,
    );
    cases.push(
      verdict(
        "19-unrelated-year",
        "unrelated year and customer words",
        "no verified or contradicted finding",
        unrelated.ok
          ? unrelated.review.findings.map((finding) => finding.status).join(", ") || "none"
          : unrelated.error,
        unrelated.ok &&
          !unrelated.review.findings.some(
            (finding) => finding.status === "verified" || finding.status === "contradicted",
          ),
      ),
    );

    const paraphrase = passageSupportsClaim(
      {
        id: "src_fact_founded",
        title: "Founding",
        excerpt: "Inkloom was founded in 2019.",
        sourceType: "fact",
        kitVersion: "1.0.0",
      },
      {
        id: "find_para",
        reviewId: "rev_bench",
        category: "factual_claim",
        span: null,
        status: "verified",
        severity: "info",
        summary: "Paraphrase",
        rationale: "The model restated the fact in different words.",
        citationIds: ["src_fact_founded"],
        matchedText: "Inkloom opened its doors in 2019",
        ruleId: "model_pass",
      },
    );
    cases.push(
      verdict(
        "20-paraphrase-abstain",
        "relevant paraphrase",
        "the excerpt does not establish the paraphrase",
        paraphrase ? "supported" : "abstain",
        paraphrase === false,
      ),
    );
  } finally {
    __setSessionIdentityForTests(null);
  }

  const passed = cases.filter((item) => item.pass).length;
  return {
    caseCount: cases.length,
    passed,
    failed: cases.length - passed,
    passRate: cases.length === 0 ? 0 : passed / cases.length,
    cases,
  };
}

export function formatEvaluationSummary(input: {
  fixturesPassed: number;
  fixturesFailed: number;
  fixtureCount: number;
  classRecall: Array<{ status: string; expected: number; matched: number; recall: number | null }>;
  exhaustivePrecision: Array<{
    status: string;
    precision?: number | null;
    predicted?: number;
    matched: number;
  }>;
  confusion: Array<{ expected: string; actual: string; count: number }>;
  integrity: IntegrityReport;
}): string {
  const lines = [
    `Fixtures: ${input.fixturesPassed}/${input.fixtureCount} passed (${input.fixturesFailed} failed).`,
    "Fixture scores use the deterministic reviewer only. They are not a model-accuracy score.",
    "Class recall (labelled expectations only; partial labels are not treated as the full finding set):",
  ];
  if (input.classRecall.length === 0) lines.push("  none");
  for (const row of input.classRecall) {
    const recall = row.recall === null ? "n/a" : row.recall.toFixed(2);
    lines.push(`  ${row.status}: matched ${row.matched}/${row.expected} recall ${recall}`);
  }
  lines.push("Exhaustive-fixture precision:");
  if (input.exhaustivePrecision.length === 0) lines.push("  none (no exhaustive fixtures)");
  for (const row of input.exhaustivePrecision) {
    const precision = row.precision === null || row.precision === undefined ? "n/a" : row.precision.toFixed(2);
    lines.push(
      `  ${row.status}: matched ${row.matched}/${row.predicted ?? 0} precision ${precision}`,
    );
  }
  lines.push(
    input.confusion.length === 0
      ? "Confusion: none"
      : `Confusion: ${input.confusion.map((cell) => `${cell.expected}->${cell.actual} ${cell.count}`).join("; ")}`,
  );
  lines.push(
    "Integrity cases are separate. They cover the evidence gate, model overrides, and authorization.",
    "Rate limits are checked in the unit suite. This score does not include them.",
    `Integrity cases: ${input.integrity.passed}/${input.integrity.caseCount} passed (rate ${input.integrity.passRate.toFixed(2)}).`,
  );
  for (const item of input.integrity.cases) {
    lines.push(
      `  ${item.pass ? "PASS" : "FAIL"} ${item.id} — expected ${item.expected}; actual ${item.actual}`,
    );
  }
  return lines.join("\n");
}
