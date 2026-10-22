import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { DEMO_BRAND_KIT } from "@/data/seed-kit";
import {
  FindingSchema,
  type BrandKit,
  type Finding,
  type RetrievalSnapshot,
} from "@/domain/schemas";
import { applyEvidenceGate } from "@/engine/evidence-gate";
import {
  LabelledReviewFixtureSchema,
  type ExpectedFinding,
  type ForgedCitationProbe,
  type LabelledReviewFixture,
} from "@/engine/labelled-fixture";
import { runDeterministicReview } from "@/engine/review";

export type FixtureScore = {
  id: string;
  ok: boolean;
  failures: string[];
  expectationsChecked: number;
  expectationsMet: number;
  /** Citation ids that remained on a rendered finding outside the snapshot. */
  forgedCitationsAccepted: string[];
};

export type EvalReport = {
  /** True only when at least one fixture file was scored. */
  measured: boolean;
  fixtureCount: number;
  passed: number;
  failed: number;
  expectationsChecked: number;
  expectationsMet: number;
  forgedCitationsAccepted: number;
  scores: FixtureScore[];
  note: string;
};

function unmeasured(note: string): EvalReport {
  return {
    measured: false,
    fixtureCount: 0,
    passed: 0,
    failed: 0,
    expectationsChecked: 0,
    expectationsMet: 0,
    forgedCitationsAccepted: 0,
    scores: [],
    note,
  };
}

function sameIdSet(actual: string[], expected: string[]): boolean {
  if (actual.length !== expected.length) return false;
  const left = [...actual].sort();
  const right = [...expected].sort();
  return left.every((id, index) => id === right[index]);
}

function findingMatches(finding: Finding, expected: ExpectedFinding): boolean {
  if (finding.status !== expected.status) return false;
  if (expected.category && finding.category !== expected.category) return false;
  if (expected.ruleId && finding.ruleId !== expected.ruleId) return false;
  if (expected.matchedText) {
    const needle = expected.matchedText.toLowerCase();
    const haystack = `${finding.matchedText ?? ""} ${finding.summary}`.toLowerCase();
    if (!haystack.includes(needle)) return false;
  }
  if (
    expected.citationIds &&
    !sameIdSet(finding.citationIds, expected.citationIds)
  ) {
    return false;
  }
  return true;
}

function forgedCitationsOn(
  findings: Finding[],
  snapshot: RetrievalSnapshot,
): string[] {
  const allowed = new Set(snapshot.sourceIds);
  const forged: string[] = [];
  for (const finding of findings) {
    for (const id of finding.citationIds) {
      if (!allowed.has(id)) forged.push(id);
    }
  }
  return forged;
}

function expectationLabel(expected: ExpectedFinding, index: number): string {
  const rule = expected.ruleId ? ` rule ${expected.ruleId}` : "";
  const text = expected.matchedText ? ` “${expected.matchedText}”` : "";
  return `expected[${index}] ${expected.status}${rule}${text}`;
}

function scoreProbe(
  reviewId: string,
  probe: ForgedCitationProbe,
  snapshot: RetrievalSnapshot,
): string[] {
  const planted = FindingSchema.parse({
    id: "find_probe",
    reviewId,
    category: "factual_claim",
    span: null,
    status: probe.claimedStatus,
    severity: "info",
    summary: "Simulated model citation",
    rationale: "Probe input for the evidence gate.",
    citationIds: probe.citationIds,
  });
  const [gated] = applyEvidenceGate([planted], snapshot);
  const failures: string[] = [];
  const survived = probe.citationIds.filter((id) =>
    gated.citationIds.includes(id),
  );
  if (survived.length > 0) {
    failures.push(
      `Forged citation probe accepted: ${survived.join(", ")}`,
    );
  }
  if (gated.status === "verified" || gated.status === "contradicted") {
    failures.push(
      `Forged citation probe kept status ${gated.status}`,
    );
  }
  return failures;
}

export function scoreLabelledFixture(
  raw: unknown,
  kit: BrandKit = DEMO_BRAND_KIT,
): FixtureScore {
  const parsed = LabelledReviewFixtureSchema.safeParse(raw);
  if (!parsed.success) {
    const id =
      raw && typeof raw === "object" && "id" in raw && typeof raw.id === "string"
        ? raw.id
        : "invalid";
    return {
      id,
      ok: false,
      failures: parsed.error.issues.map((issue) => issue.message),
      expectationsChecked: 0,
      expectationsMet: 0,
      forgedCitationsAccepted: [],
    };
  }

  const fixture: LabelledReviewFixture = parsed.data;
  if (fixture.kitVersion !== kit.version) {
    return {
      id: fixture.id,
      ok: false,
      failures: [
        `Kit version ${fixture.kitVersion} does not match pinned kit ${kit.version}`,
      ],
      expectationsChecked: fixture.expected.length,
      expectationsMet: 0,
      forgedCitationsAccepted: [],
    };
  }

  const result = runDeterministicReview(
    {
      title: fixture.title,
      body: fixture.body,
      intent: fixture.intent,
      orgId: kit.orgId,
      kitVersion: fixture.kitVersion,
    },
    kit,
  );

  if (!result.ok || !result.review) {
    return {
      id: fixture.id,
      ok: false,
      failures: [result.ok ? "Review missing" : result.error],
      expectationsChecked: fixture.expected.length,
      expectationsMet: 0,
      forgedCitationsAccepted: [],
    };
  }

  const failures: string[] = [];
  const forged = forgedCitationsOn(result.review.findings, result.snapshot);
  if (forged.length > 0) {
    failures.push(`Rendered forged citations: ${forged.join(", ")}`);
  }

  const used = new Set<number>();
  let expectationsMet = 0;
  fixture.expected.forEach((expected, index) => {
    const matchAt = result.review.findings.findIndex(
      (finding, findingIndex) =>
        !used.has(findingIndex) && findingMatches(finding, expected),
    );
    if (matchAt === -1) {
      failures.push(`${expectationLabel(expected, index)} was not produced`);
      return;
    }
    used.add(matchAt);
    expectationsMet += 1;
  });

  if (
    fixture.expectNoBlockers &&
    result.review.findings.some((finding) => finding.severity === "blocker")
  ) {
    failures.push("Expected no blockers");
  }

  if (fixture.forgedCitationProbe) {
    failures.push(
      ...scoreProbe(
        result.review.id,
        fixture.forgedCitationProbe,
        result.snapshot,
      ),
    );
  }

  return {
    id: fixture.id,
    ok: failures.length === 0,
    failures,
    expectationsChecked: fixture.expected.length,
    expectationsMet,
    forgedCitationsAccepted: forged,
  };
}

export function scoreFixtureDirectory(
  dir: string,
  kit: BrandKit = DEMO_BRAND_KIT,
): EvalReport {
  if (!existsSync(dir) || !statSync(dir).isDirectory()) {
    return unmeasured(
      "Labelled fixture directory is not present. No precision or recall was measured.",
    );
  }

  const files = readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .sort();
  if (files.length === 0) {
    return unmeasured(
      "Labelled fixture directory has no JSON files. No precision or recall was measured.",
    );
  }

  const scores = files.map((name) => {
    const filePath = path.join(dir, name);
    let raw: unknown;
    try {
      raw = JSON.parse(readFileSync(filePath, "utf8")) as unknown;
    } catch {
      return {
        id: name,
        ok: false,
        failures: ["File is not valid JSON"],
        expectationsChecked: 0,
        expectationsMet: 0,
        forgedCitationsAccepted: [],
      } satisfies FixtureScore;
    }
    return scoreLabelledFixture(raw, kit);
  });

  const failed = scores.filter((score) => !score.ok).length;

  return {
    measured: true,
    fixtureCount: scores.length,
    passed: scores.length - failed,
    failed,
    expectationsChecked: scores.reduce(
      (count, score) => count + score.expectationsChecked,
      0,
    ),
    expectationsMet: scores.reduce(
      (count, score) => count + score.expectationsMet,
      0,
    ),
    forgedCitationsAccepted: scores.reduce(
      (count, score) => count + score.forgedCitationsAccepted.length,
      0,
    ),
    scores,
    note: "Counts are expectation matches on the deterministic engine. Precision and recall are not computed from a partial label set.",
  };
}
