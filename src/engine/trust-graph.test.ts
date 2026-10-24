import { describe, expect, it } from "vitest";

import { DEMO_BRAND_KIT } from "@/data/seed-kit";
import {
  ContentReviewSchema,
  type ContentReview,
  type RetrievalSnapshot,
} from "@/domain/schemas";
import { renderReviewReport } from "@/engine/report";
import { runDeterministicReview } from "@/engine/review";
import {
  buildTrustGraph,
  chainForFinding,
  trustLines,
  type TrustNode,
} from "@/engine/trust-graph";

function reviewed(body: string) {
  const result = runDeterministicReview(
    { title: "Trust graph", body, orgId: "org_demo" },
    DEMO_BRAND_KIT,
  );
  if (!result.ok) throw new Error(result.error);
  return result;
}

function findingOf(review: ContentReview, status: ContentReview["findings"][number]["status"]) {
  const finding = review.findings.find((item) => item.status === status);
  if (!finding) throw new Error(`No ${status} finding`);
  return finding;
}

function nodesFor(nodes: TrustNode[], findingId: string, kind: TrustNode["kind"]) {
  return nodes.filter(
    (node) => "findingId" in node && node.findingId === findingId && node.kind === kind,
  );
}

describe("evidence trust graph", () => {
  it("links a verified claim to the pinned snapshot excerpt", () => {
    const { review, snapshot } = reviewed("Inkloom was founded in 2019.");
    const finding = findingOf(review, "verified");
    const before = finding.status;
    const graph = buildTrustGraph(review, snapshot);
    const evidence = nodesFor(graph.nodes, finding.id, "evidence");
    const passage = snapshot.passages?.find((item) => item.id === finding.citationIds[0]);

    expect(before).toBe("verified");
    expect(finding.status).toBe("verified");
    expect(review.status).not.toBe("approved");
    expect(passage).toBeTruthy();
    expect(evidence).toEqual([
      expect.objectContaining({
        sourceId: finding.citationIds[0],
        excerpt: passage?.excerpt,
        kitVersion: review.kitVersion,
      }),
    ]);
    expect(graph.edges).toContainEqual(
      expect.objectContaining({
        type: "CLAIM_SUPPORTED_BY_EVIDENCE",
        findingId: finding.id,
        to: evidence[0]?.id,
        detail: finding.rationale,
      }),
    );
    expect(chainForFinding(graph, finding.id).map((node) => node.kind)).toEqual([
      "claim",
      "finding",
      "evidence",
    ]);
    expect(buildTrustGraph(review, snapshot)).toEqual(graph);
    expect(graph.edges).toContainEqual(
      expect.objectContaining({ type: "CLAIM_HAS_FINDING", findingId: finding.id }),
    );
    expect(trustLines(graph, finding.id).join("\n")).toContain(passage?.excerpt);
  });

  it("keeps an uncited snapshot passage out of the graph", () => {
    const { review, snapshot } = reviewed("Inkloom was founded in 2019.");
    const planted = "Uncited passage that must stay out of the graph.";
    const extra: RetrievalSnapshot = {
      ...snapshot,
      sourceIds: [...snapshot.sourceIds, "src_uncited"],
      passages: [
        ...(snapshot.passages ?? []),
        {
          id: "src_uncited",
          title: "Not cited",
          excerpt: planted,
          sourceType: "other",
          kitVersion: review.kitVersion,
        },
      ],
    };
    const graph = buildTrustGraph(review, extra);
    expect(JSON.stringify(graph)).not.toContain(planted);
    expect(graph.nodes.some((node) => node.kind === "evidence" && node.sourceId === "src_uncited")).toBe(
      false,
    );
  });

  it("shows one eligible source and a gap when a second citation is not in the snapshot", () => {
    const { review, snapshot } = reviewed("Inkloom was founded in 2019.");
    const finding = findingOf(review, "verified");
    const mixed = ContentReviewSchema.parse({
      ...review,
      findings: [
        {
          ...finding,
          citationIds: [finding.citationIds[0]!, finding.citationIds[0]!, "src_not_in_snapshot"],
        },
      ],
    });
    const graph = buildTrustGraph(mixed, snapshot);
    const evidence = nodesFor(graph.nodes, finding.id, "evidence");

    expect(evidence).toHaveLength(1);
    expect(new Set(evidence.map((node) => node.id)).size).toBe(1);
    expect(graph.nodes).toContainEqual(
      expect.objectContaining({
        kind: "gap",
        reason: expect.stringContaining("src_not_in_snapshot"),
      }),
    );
    expect(graph.nodes).toContainEqual(
      expect.objectContaining({ kind: "finding", status: "verified", findingId: finding.id }),
    );
  });

  it("shows a gap and no excerpt when the pinned snapshot is missing", () => {
    const { review, snapshot } = reviewed("Inkloom was founded in 2019.");
    const finding = findingOf(review, "verified");
    const excerpt = snapshot.passages?.find((item) => item.id === finding.citationIds[0])?.excerpt;
    const graph = buildTrustGraph(review, null);

    expect(excerpt).toBeTruthy();
    expect(nodesFor(graph.nodes, finding.id, "evidence")).toEqual([]);
    expect(graph.nodes).toContainEqual(
      expect.objectContaining({
        kind: "gap",
        reason: expect.stringContaining("not available"),
      }),
    );
    expect(JSON.stringify(graph)).not.toContain("Do not claim earlier founding dates.");
    expect(graph.nodes).toContainEqual(
      expect.objectContaining({ kind: "finding", status: "verified" }),
    );
  });

  it("links a contradicted claim to the pinned conflict and keeps the suggestion separate", () => {
    const { review, snapshot } = reviewed("Inkloom was founded in 2015.");
    const finding = findingOf(review, "contradicted");
    const graph = buildTrustGraph(review, snapshot);
    const passage = snapshot.passages?.find((item) => item.id === finding.citationIds[0]);

    expect(nodesFor(graph.nodes, finding.id, "evidence")).toEqual([
      expect.objectContaining({ excerpt: passage?.excerpt, kitVersion: review.kitVersion }),
    ]);
    expect(graph.edges).toContainEqual(
      expect.objectContaining({
        type: "CLAIM_CONTRADICTED_BY_EVIDENCE",
        findingId: finding.id,
      }),
    );
    expect(graph.edges).toContainEqual(
      expect.objectContaining({
        type: "FINDING_ADDRESSED_BY_SUGGESTION",
        findingId: finding.id,
        detail: finding.suggestion?.proposedText,
      }),
    );
    expect(graph.nodes.some((node) => node.kind === "decision")).toBe(false);
  });

  it("keeps an accepted suggestion separate from human approval", () => {
    const { review, snapshot } = reviewed("Inkloom was founded in 2015.");
    const finding = findingOf(review, "contradicted");
    const accepted = ContentReviewSchema.parse({
      ...review,
      findings: review.findings.map((item) =>
        item.id === finding.id && item.suggestion
          ? { ...item, suggestion: { ...item.suggestion, accepted: true } }
          : item,
      ),
    });
    const graph = buildTrustGraph(accepted, snapshot);

    expect(accepted.status).not.toBe("approved");
    expect(graph.nodes.some((node) => node.kind === "decision")).toBe(false);
    expect(graph.edges).toContainEqual(
      expect.objectContaining({
        type: "FINDING_ADDRESSED_BY_SUGGESTION",
        findingId: finding.id,
        label: expect.stringContaining("Suggestion accepted"),
      }),
    );
    expect(trustLines(graph).join(" ")).not.toMatch(/Human decision/);
  });

  it("does not treat a submit record as a human approval decision", () => {
    const { review, snapshot } = reviewed("Inkloom was founded in 2019.");
    const submitted = ContentReviewSchema.parse({
      ...review,
      decision: {
        action: "submit",
        actorId: "user_demo_author",
        at: "2026-10-24T17:39:12.331Z",
        reason: "Filed for review",
      },
    });
    const graph = buildTrustGraph(submitted, snapshot);

    expect(graph.nodes.some((node) => node.kind === "decision")).toBe(false);
    expect(JSON.stringify(graph)).not.toContain("Filed for review");
    expect(submitted.status).not.toBe("approved");
  });

  it("shows an evidence gap for an unsupported claim and ignores leftover citations", () => {
    const { review, snapshot } = reviewed("Inkloom is the best in the world.");
    const finding = findingOf(review, "unsupported");
    const cited = ContentReviewSchema.parse({
      ...review,
      findings: review.findings.map((item) =>
        item.id === finding.id ? { ...item, citationIds: ["src_fact_founded"] } : item,
      ),
    });
    const graph = buildTrustGraph(cited, snapshot);
    const evidence = nodesFor(graph.nodes, finding.id, "evidence");

    expect(evidence).toEqual([]);
    expect(nodesFor(graph.nodes, finding.id, "gap").length).toBeGreaterThan(0);
    expect(graph.edges).toContainEqual(
      expect.objectContaining({ type: "CLAIM_MISSING_EVIDENCE", findingId: finding.id }),
    );
    expect(trustLines(graph, finding.id).join(" ")).toMatch(/evidence gap|not treated as proof/i);
  });

  it("records a policy hit from the stored rule and pinned excerpt", () => {
    const { review, snapshot } = reviewed("Use our brand bible for synergy.");
    const finding = findingOf(review, "policy_hit");
    const graph = buildTrustGraph(review, snapshot);
    const policy = nodesFor(graph.nodes, finding.id, "policy");

    expect(finding.ruleId).toBeTruthy();
    expect(policy).toEqual([
      expect.objectContaining({
        ruleId: finding.ruleId,
        kitVersion: review.kitVersion,
      }),
    ]);
    expect(policy[0]?.kind === "policy" && policy[0].detail.length).toBeGreaterThan(0);
    expect(trustLines(graph, finding.id).join("\n")).toContain(
      policy[0]?.kind === "policy" ? policy[0].detail : "",
    );
    expect(graph.edges).toContainEqual(
      expect.objectContaining({
        type: "CLAIM_VIOLATES_POLICY",
        findingId: finding.id,
        detail: finding.rationale,
      }),
    );
  });

  it("keeps an indeterminate finding as a gap even when a citation id is stored", () => {
    const { review, snapshot } = reviewed("Inkloom was founded in 2019.");
    const finding = findingOf(review, "verified");
    const excerpt = snapshot.passages?.find((item) => item.id === finding.citationIds[0])?.excerpt;
    const indeterminate = ContentReviewSchema.parse({
      ...review,
      findings: [
        {
          ...finding,
          status: "indeterminate",
          evidenceGapReason: "The excerpt does not establish the claim.",
        },
      ],
    });
    const graph = buildTrustGraph(indeterminate, snapshot);

    expect(excerpt && excerpt.length).toBeGreaterThan(finding.matchedText?.length ?? 0);
    expect(nodesFor(graph.nodes, finding.id, "evidence")).toEqual([]);
    expect(graph.nodes).toContainEqual(
      expect.objectContaining({
        kind: "gap",
        reason: "The excerpt does not establish the claim.",
      }),
    );
    expect(JSON.stringify(graph)).not.toContain(excerpt);
    expect(finding.status).toBe("verified");
    expect(graph.nodes).toContainEqual(
      expect.objectContaining({ kind: "finding", status: "indeterminate", findingId: finding.id }),
    );
  });

  it("does not treat a missing or unlisted source as evidence", () => {
    const { review, snapshot } = reviewed("Inkloom was founded in 2019.");
    const finding = findingOf(review, "verified");
    const missing = ContentReviewSchema.parse({
      ...review,
      findings: [{ ...finding, citationIds: ["src_not_in_snapshot"] }],
    });
    const unlisted = buildTrustGraph(missing, snapshot);
    expect(unlisted.nodes.some((node) => node.kind === "evidence")).toBe(false);
    expect(unlisted.nodes).toContainEqual(
      expect.objectContaining({
        kind: "gap",
        reason: expect.stringContaining("src_not_in_snapshot"),
      }),
    );

    const noPassage: RetrievalSnapshot = {
      ...snapshot,
      passages: snapshot.passages?.filter((item) => item.id !== finding.citationIds[0]),
    };
    const listed = buildTrustGraph(review, noPassage);
    expect(nodesFor(listed.nodes, finding.id, "evidence")).toEqual([]);
    expect(listed.nodes).toContainEqual(
      expect.objectContaining({
        kind: "gap",
        reason: expect.stringContaining("no excerpt was stored"),
      }),
    );
    expect(finding.status).toBe("verified");
  });

  it("refuses a snapshot that belongs to another review", () => {
    const { review, snapshot } = reviewed("Inkloom was founded in 2019.");
    const other: RetrievalSnapshot = { ...snapshot, id: "snap_other_review" };
    const graph = buildTrustGraph(review, other);

    expect(graph.nodes.some((node) => node.kind === "evidence")).toBe(false);
    expect(graph.nodes).toContainEqual(
      expect.objectContaining({
        kind: "gap",
        reason: expect.stringContaining("different review"),
      }),
    );
    expect(review.status).not.toBe("approved");
    expect(JSON.stringify(graph)).not.toContain("Do not claim earlier founding dates.");
  });

  it("refuses an excerpt pinned to a different kit version", () => {
    const { review, snapshot } = reviewed("Inkloom was founded in 2019.");
    const finding = findingOf(review, "verified");
    const shifted: RetrievalSnapshot = {
      ...snapshot,
      passages: snapshot.passages?.map((item) =>
        item.id === finding.citationIds[0]
          ? { ...item, kitVersion: "9.9.9", excerpt: "A later kit invented this sentence." }
          : item,
      ),
    };
    const graph = buildTrustGraph(review, shifted);
    const serialized = JSON.stringify(graph);

    expect(nodesFor(graph.nodes, finding.id, "evidence")).toEqual([]);
    expect(serialized).not.toContain("A later kit invented this sentence.");
    expect(graph.nodes).toContainEqual(
      expect.objectContaining({
        kind: "gap",
        reason: expect.stringContaining("kit v9.9.9"),
      }),
    );
  });

  it("keeps a human decision separate from the automated finding", () => {
    const { review, snapshot } = reviewed("Inkloom was founded in 2019.");
    const finding = findingOf(review, "verified");
    const decided = ContentReviewSchema.parse({
      ...review,
      status: "approved",
      decision: {
        action: "approve",
        actorId: "user_demo_reviewer",
        at: "2026-10-24T17:39:12.331Z",
        reason: "The founding line matches the pinned kit.",
      },
    });
    const graph = buildTrustGraph(decided, snapshot);

    expect(graph.nodes).toContainEqual(
      expect.objectContaining({
        kind: "decision",
        action: "approve",
        actorId: "user_demo_reviewer",
      }),
    );
    expect(graph.edges).toContainEqual(
      expect.objectContaining({ type: "REVIEW_DECIDED_BY_HUMAN" }),
    );
    expect(finding.status).toBe("verified");
    expect(graph.nodes.filter((node) => node.kind === "finding")).toEqual([
      expect.objectContaining({ status: "verified", findingId: finding.id }),
    ]);
  });

  it("does not invent a human decision for an unapproved review", () => {
    const { review, snapshot } = reviewed("Inkloom was founded in 2019.");
    const graph = buildTrustGraph(review, snapshot);
    expect(review.decision).toBeUndefined();
    expect(graph.nodes.some((node) => node.kind === "decision")).toBe(false);
    expect(trustLines(graph).join(" ")).not.toMatch(/Human decision/);
  });

  it("creates no claim nodes when a review has no findings", () => {
    const { review, snapshot } = reviewed("Inkloom was founded in 2019.");
    const empty = ContentReviewSchema.parse({ ...review, findings: [] });
    const graph = buildTrustGraph(empty, snapshot);
    expect(graph.nodes).toEqual([]);
    expect(graph.edges).toEqual([]);
    expect(trustLines(graph)).toEqual(["No relationships are stored for this review."]);
  });

  it("adds the same relationships to the downloadable report", () => {
    const { review, snapshot } = reviewed("Inkloom was founded in 2019.");
    const report = renderReviewReport(review, snapshot);
    expect(report).toContain("## Evidence trust");
    expect(report).toContain("pinned excerpt as support");
    expect(report).toContain("do not create citations");
    expect(review.status).not.toBe("approved");
  });
});
