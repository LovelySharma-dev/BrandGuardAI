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

export type StatusCount = Record<string, number>;

export type ConfusionCell = {
  expected: string;
  actual: string;
  count: number;
};

export type ClassMetric = {
  status: string;
  expected: number;
  matched: number;
  recall: number | null;
  predicted?: number;
  precision?: number | null;
};

export type FixtureScore = {
  id: string;
  ok: boolean;
  failures: string[];
  expectationsChecked: number;
  expectationsMet: number;
  /** Citation ids that remained on a rendered finding outside the snapshot. */
  forgedCitationsAccepted: string[];
  exhaustive: boolean;
  statusExpected: StatusCount;
  statusMatched: StatusCount;
  statusPredicted: StatusCount;
  confusion: Array<{ expected: string; actual: string }>;
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
  /** Recall over labelled expectations. Not a binary accuracy score. */
  classRecall: ClassMetric[];
  /** Precision only where fixtures declare an exhaustive label set. */
  exhaustivePrecision: ClassMetric[];
  confusion: ConfusionCell[];
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
    classRecall: [],
    exhaustivePrecision: [],
    confusion: [],
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

function emptyScoreFields(): Pick<
  FixtureScore,
  "exhaustive" | "statusExpected" | "statusMatched" | "statusPredicted" | "confusion"
> {
  return {
    exhaustive: false,
    statusExpected: {},
    statusMatched: {},
    statusPredicted: {},
    confusion: [],
  };
}

function bump(counts: StatusCount, status: string): void {
  counts[status] = (counts[status] ?? 0) + 1;
}

function sameIdentity(finding: Finding, expected: ExpectedFinding): boolean {
  if (expected.ruleId && finding.ruleId === expected.ruleId) return true;
  if (expected.matchedText) {
    const needle = expected.matchedText.toLowerCase();
    const haystack = `${finding.matchedText ?? ""} ${finding.summary}`.toLowerCase();
    return haystack.includes(needle);
  }
  return false;
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
      ...emptyScoreFields(),
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
      ...emptyScoreFields(),
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
      ...emptyScoreFields(),
    };
  }

  const failures: string[] = [];
  const forged = forgedCitationsOn(result.review.findings, result.snapshot);
  if (forged.length > 0) {
    failures.push(`Rendered forged citations: ${forged.join(", ")}`);
  }

  const used = new Set<number>();
  let expectationsMet = 0;
  const statusExpected: StatusCount = {};
  const statusMatched: StatusCount = {};
  const confusion: Array<{ expected: string; actual: string }> = [];
  fixture.expected.forEach((expected, index) => {
    bump(statusExpected, expected.status);
    const matchAt = result.review.findings.findIndex(
      (finding, findingIndex) =>
        !used.has(findingIndex) && findingMatches(finding, expected),
    );
    if (matchAt === -1) {
      const confusedAt = result.review.findings.findIndex(
        (finding, findingIndex) =>
          !used.has(findingIndex) &&
          finding.status !== expected.status &&
          sameIdentity(finding, expected),
      );
      if (confusedAt !== -1) {
        const actual = result.review.findings[confusedAt]?.status ?? "missing";
        confusion.push({ expected: expected.status, actual });
        used.add(confusedAt);
        failures.push(
          `${expectationLabel(expected, index)} was ${actual} instead`,
        );
        return;
      }
      failures.push(`${expectationLabel(expected, index)} was not produced`);
      return;
    }
    used.add(matchAt);
    expectationsMet += 1;
    bump(statusMatched, expected.status);
  });

  const statusPredicted: StatusCount = {};
  result.review.findings.forEach((finding) => bump(statusPredicted, finding.status));

  for (const status of fixture.absentStatuses ?? []) {
    if (result.review.findings.some((finding) => finding.status === status)) {
      failures.push(`Status ${status} was produced and should have been absent`);
    }
  }

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
    exhaustive: fixture.exhaustive === true,
    statusExpected,
    statusMatched,
    statusPredicted,
    confusion,
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
        ...emptyScoreFields(),
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
    ...summarizeClassMetrics(scores),
    scores,
    note: "Recall is the share of labelled expectations that matched, by status. Precision is calculated only for fixtures marked exhaustive. An unlabelled finding is not treated as a false positive.",
  };
}

function rate(matched: number, total: number): number | null {
  if (total === 0) return null;
  return matched / total;
}

function summarizeClassMetrics(scores: FixtureScore[]): {
  classRecall: ClassMetric[];
  exhaustivePrecision: ClassMetric[];
  confusion: ConfusionCell[];
} {
  const expected: StatusCount = {};
  const matched: StatusCount = {};
  const exhaustiveExpected: StatusCount = {};
  const exhaustiveMatched: StatusCount = {};
  const exhaustivePredicted: StatusCount = {};
  const confusion = new Map<string, ConfusionCell>();

  for (const score of scores) {
    for (const [status, count] of Object.entries(score.statusExpected)) {
      expected[status] = (expected[status] ?? 0) + count;
    }
    for (const [status, count] of Object.entries(score.statusMatched)) {
      matched[status] = (matched[status] ?? 0) + count;
    }
    if (score.exhaustive) {
      for (const [status, count] of Object.entries(score.statusExpected)) {
        exhaustiveExpected[status] = (exhaustiveExpected[status] ?? 0) + count;
      }
      for (const [status, count] of Object.entries(score.statusMatched)) {
        exhaustiveMatched[status] = (exhaustiveMatched[status] ?? 0) + count;
      }
      for (const [status, count] of Object.entries(score.statusPredicted)) {
        exhaustivePredicted[status] = (exhaustivePredicted[status] ?? 0) + count;
      }
    }
    for (const cell of score.confusion) {
      const key = `${cell.expected}->${cell.actual}`;
      const current = confusion.get(key) ?? {
        expected: cell.expected,
        actual: cell.actual,
        count: 0,
      };
      current.count += 1;
      confusion.set(key, current);
    }
  }

  const statuses = [...new Set([...Object.keys(expected), ...Object.keys(matched)])].sort();
  return {
    classRecall: statuses.map((status) => ({
      status,
      expected: expected[status] ?? 0,
      matched: matched[status] ?? 0,
      recall: rate(matched[status] ?? 0, expected[status] ?? 0),
    })),
    exhaustivePrecision: [...new Set([
      ...Object.keys(exhaustiveExpected),
      ...Object.keys(exhaustivePredicted),
    ])]
      .sort()
      .map((status) => ({
        status,
        expected: exhaustiveExpected[status] ?? 0,
        matched: exhaustiveMatched[status] ?? 0,
        predicted: exhaustivePredicted[status] ?? 0,
        recall: rate(exhaustiveMatched[status] ?? 0, exhaustiveExpected[status] ?? 0),
        precision: rate(exhaustiveMatched[status] ?? 0, exhaustivePredicted[status] ?? 0),
      })),
    confusion: [...confusion.values()],
  };
}
