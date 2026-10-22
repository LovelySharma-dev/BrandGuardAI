import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { DEMO_BRAND_KIT } from "@/data/seed-kit";
import { scoreFixtureDirectory, scoreLabelledFixture } from "@/engine/eval";

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

function tempPack(): string {
  const dir = mkdtempSync(path.join(tmpdir(), "brandguard-fixtures-"));
  tempDirs.push(dir);
  return dir;
}

describe("scoreLabelledFixture", () => {
  it("matches a terminology policy hit on the pinned kit", () => {
    const score = scoreLabelledFixture({
      id: "policy-brand-bible",
      title: "Policy",
      body: "Please consult the brand bible before publishing.",
      kitVersion: DEMO_BRAND_KIT.version,
      expected: [
        {
          status: "policy_hit",
          ruleId: "term_brand_bible",
          matchedText: "brand bible",
          citationIds: ["src_term_guide"],
        },
      ],
    });
    expect(score.ok).toBe(true);
    expect(score.failures).toEqual([]);
    expect(score.forgedCitationsAccepted).toEqual([]);
  });

  it("keeps contradicted distinct from unsupported", () => {
    const contradicted = scoreLabelledFixture({
      id: "founded-2015",
      body: "Inkloom was founded in 2015 and serves marketers.",
      kitVersion: "1.0.0",
      expected: [
        {
          status: "contradicted",
          matchedText: "founded in 2015",
          citationIds: ["src_fact_founded"],
        },
      ],
    });
    expect(contradicted.ok).toBe(true);

    const unsupported = scoreLabelledFixture({
      id: "best-in-world",
      body: "We are the best in the world at brand governance.",
      kitVersion: "1.0.0",
      expected: [
        {
          status: "unsupported",
          ruleId: "claim_best",
          citationIds: [],
        },
      ],
    });
    expect(unsupported.ok).toBe(true);
  });

  it("fails when the expected status was not produced", () => {
    const score = scoreLabelledFixture({
      id: "wrong-status",
      body: "We are the best in the world at brand governance.",
      kitVersion: "1.0.0",
      expected: [{ status: "contradicted", ruleId: "claim_best" }],
    });
    expect(score.ok).toBe(false);
    expect(score.failures[0]).toMatch(/contradicted/);
  });

  it("rejects a kit version other than the pinned demo kit", () => {
    const score = scoreLabelledFixture({
      id: "wrong-kit",
      body: "Inkloom was founded in 2019.",
      kitVersion: "9.9.9",
      expected: [],
    });
    expect(score.ok).toBe(false);
    expect(score.failures[0]).toMatch(/9\.9\.9/);
  });

  it("rejects a forged citation probe", () => {
    const score = scoreLabelledFixture({
      id: "forged-cite",
      body: "Inkloom was founded in 2019.",
      kitVersion: "1.0.0",
      expected: [],
      forgedCitationProbe: {
        citationIds: ["src_not_in_snapshot"],
        claimedStatus: "verified",
      },
    });
    expect(score.ok).toBe(true);
    expect(score.forgedCitationsAccepted).toEqual([]);
  });

  it("fails closed when a probe citation survives as verified", () => {
    const score = scoreLabelledFixture({
      id: "real-id-labelled-forged",
      body: "Inkloom was founded in 2019.",
      kitVersion: "1.0.0",
      forgedCitationProbe: {
        citationIds: ["src_fact_founded"],
        claimedStatus: "verified",
      },
    });
    expect(score.ok).toBe(false);
    expect(score.failures.join(" ")).toMatch(/src_fact_founded/);
  });
});

describe("scoreFixtureDirectory", () => {
  it("does not invent metrics when the pack directory is missing", () => {
    const report = scoreFixtureDirectory(
      path.join(process.cwd(), "fixtures", "reviews"),
    );
    if (report.measured) {
      expect(report.forgedCitationsAccepted).toBe(0);
      expect(report.failed).toBe(0);
      return;
    }
    expect(report.fixtureCount).toBe(0);
    expect(report.passed).toBe(0);
    expect(report.note).toMatch(/not measured|no JSON|not present/i);
  });

  it("scores JSON files in a directory and skips a pass rate when the folder is empty", () => {
    const empty = tempPack();
    const missing = scoreFixtureDirectory(empty);
    expect(missing.measured).toBe(false);
    expect(missing.note).toMatch(/no JSON/i);

    const dir = tempPack();
    writeFileSync(
      path.join(dir, "clean.json"),
      JSON.stringify({
        id: "clean",
        body: "Our content review keeps claims grounded in the brand kit.",
        kitVersion: "1.0.0",
        expectNoBlockers: true,
        expected: [],
      }),
    );
    writeFileSync(path.join(dir, "broken.json"), "{");

    const report = scoreFixtureDirectory(dir);
    expect(report.measured).toBe(true);
    expect(report.fixtureCount).toBe(2);
    expect(report.failed).toBe(1);
    expect(report.scores.find((score) => score.id === "broken.json")?.failures).toEqual([
      "File is not valid JSON",
    ]);
    expect(report.forgedCitationsAccepted).toBe(0);
    expect(report.note).toMatch(/Precision and recall are not computed/);
  });
});
