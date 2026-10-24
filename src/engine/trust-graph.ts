import { z } from "zod";

import type {
  ContentReview,
  Finding,
  RetrievalSnapshot,
  SnapshotPassage,
} from "@/domain/schemas";

export const TrustEdgeTypeSchema = z.enum([
  "CLAIM_SUPPORTED_BY_EVIDENCE",
  "CLAIM_CONTRADICTED_BY_EVIDENCE",
  "CLAIM_MISSING_EVIDENCE",
  "CLAIM_VIOLATES_POLICY",
  "CLAIM_HAS_FINDING",
  "FINDING_ADDRESSED_BY_SUGGESTION",
  "REVIEW_DECIDED_BY_HUMAN",
]);

const ClaimNodeSchema = z.object({
  id: z.string(),
  kind: z.literal("claim"),
  findingId: z.string(),
  label: z.string(),
  text: z.string(),
});

const EvidenceNodeSchema = z.object({
  id: z.string(),
  kind: z.literal("evidence"),
  findingId: z.string(),
  sourceId: z.string(),
  title: z.string(),
  excerpt: z.string(),
  kitVersion: z.string(),
  sourceType: z.string(),
});

const PolicyNodeSchema = z.object({
  id: z.string(),
  kind: z.literal("policy"),
  findingId: z.string(),
  ruleId: z.string(),
  title: z.string(),
  detail: z.string(),
  kitVersion: z.string().optional(),
});

const FindingNodeSchema = z.object({
  id: z.string(),
  kind: z.literal("finding"),
  findingId: z.string(),
  status: z.string(),
  summary: z.string(),
  rationale: z.string(),
});

const DecisionNodeSchema = z.object({
  id: z.string(),
  kind: z.literal("decision"),
  action: z.string(),
  actorId: z.string(),
  at: z.string(),
  reason: z.string().optional(),
});

const GapNodeSchema = z.object({
  id: z.string(),
  kind: z.literal("gap"),
  findingId: z.string(),
  reason: z.string(),
});

export const TrustNodeSchema = z.discriminatedUnion("kind", [
  ClaimNodeSchema,
  EvidenceNodeSchema,
  PolicyNodeSchema,
  FindingNodeSchema,
  DecisionNodeSchema,
  GapNodeSchema,
]);

export const TrustEdgeSchema = z.object({
  id: z.string(),
  type: TrustEdgeTypeSchema,
  from: z.string(),
  to: z.string(),
  findingId: z.string().optional(),
  label: z.string(),
  detail: z.string().optional(),
});

export const TrustGraphSchema = z.object({
  reviewId: z.string(),
  nodes: z.array(TrustNodeSchema),
  edges: z.array(TrustEdgeSchema),
});

export type TrustNode = z.infer<typeof TrustNodeSchema>;
export type TrustEdge = z.infer<typeof TrustEdgeSchema>;
export type TrustGraph = z.infer<typeof TrustGraphSchema>;

const HUMAN_ACTIONS = new Set(["approve", "reject", "request_changes"]);

/**
 * Reads a review and the snapshot stored for that review.
 * A passage is evidence only when its id is in that snapshot and its kit
 * version is the review's pinned version. This function does not change
 * finding status and does not approve the draft.
 */
export function buildTrustGraph(
  review: ContentReview,
  snapshot: RetrievalSnapshot | null,
): TrustGraph {
  const nodes: TrustNode[] = [];
  const edges: TrustEdge[] = [];
  const snapshotProblem = explainSnapshot(review, snapshot);
  const usable = snapshotProblem ? null : snapshot;

  for (const finding of review.findings) {
    const claimId = `claim:${finding.id}`;
    const findingNodeId = `finding:${finding.id}`;
    const claimText = finding.matchedText?.trim() || finding.summary;
    nodes.push({
      id: claimId,
      kind: "claim",
      findingId: finding.id,
      label: "Draft claim",
      text: claimText,
    });
    nodes.push({
      id: findingNodeId,
      kind: "finding",
      findingId: finding.id,
      status: finding.status,
      summary: finding.summary,
      rationale: finding.rationale,
    });
    edges.push({
      id: `edge:${finding.id}:finding`,
      type: "CLAIM_HAS_FINDING",
      from: claimId,
      to: findingNodeId,
      findingId: finding.id,
      label: `Automated finding: ${finding.status.replaceAll("_", " ")}`,
    });

    if (finding.status === "policy_hit") {
      addPolicy(review, finding, usable, snapshotProblem, nodes, edges);
    } else if (finding.status === "verified" || finding.status === "contradicted") {
      addCitedEvidence(review, finding, usable, snapshotProblem, nodes, edges);
    } else {
      addGap(
        finding,
        finding.evidenceGapReason?.trim() ||
          "No pinned source supports this finding. That is an evidence gap, not a contradiction.",
        nodes,
        edges,
        "status",
      );
      if (finding.citationIds.length > 0) {
        addGap(
          finding,
          "Citation ids on this finding are not treated as proof for this status.",
          nodes,
          edges,
          "citations",
        );
      }
    }

    if (finding.suggestion) {
      const accepted = finding.suggestion.accepted;
      edges.push({
        id: `edge:${finding.id}:suggestion`,
        type: "FINDING_ADDRESSED_BY_SUGGESTION",
        from: findingNodeId,
        to: claimId,
        findingId: finding.id,
        label:
          accepted === null
            ? "Suggestion pending. Accepting it does not approve the draft."
            : accepted
              ? "Suggestion accepted. The draft changed. The review was not approved by this action."
              : "Suggestion rejected. The draft was left unchanged.",
        detail: finding.suggestion.proposedText,
      });
    }
  }

  if (review.decision && HUMAN_ACTIONS.has(review.decision.action)) {
    const decisionId = `decision:${review.id}`;
    nodes.push({
      id: decisionId,
      kind: "decision",
      action: review.decision.action,
      actorId: review.decision.actorId,
      at: review.decision.at,
      reason: review.decision.reason,
    });
    edges.push({
      id: `edge:${review.id}:decision`,
      type: "REVIEW_DECIDED_BY_HUMAN",
      from: `review:${review.id}`,
      to: decisionId,
      label: "A person recorded this decision. It is separate from the automated findings.",
      detail: review.decision.reason,
    });
  }

  return TrustGraphSchema.parse({ reviewId: review.id, nodes, edges });
}

export function trustLines(graph: TrustGraph, findingId?: string): string[] {
  const edges = graph.edges.filter((edge) =>
    findingId ? edge.findingId === findingId || edge.type === "REVIEW_DECIDED_BY_HUMAN" : true,
  );
  if (edges.length === 0) return ["No relationships are stored for this review."];
  return edges.map((edge) => {
    const from = nodeLabel(graph, edge.from);
    const to = nodeLabel(graph, edge.to);
    const extra = edge.detail ? ` ${edge.detail}` : "";
    return `${from} — ${edge.label} — ${to}.${extra ? ` ${extra}` : ""}`.trim();
  });
}

function nodeLabel(graph: TrustGraph, id: string): string {
  const node = graph.nodes.find((item) => item.id === id);
  if (!node) {
    if (id.startsWith("review:")) return "This review";
    return id;
  }
  switch (node.kind) {
    case "claim":
      return `Claim “${node.text}”`;
    case "evidence":
      return `Evidence “${node.title}” (kit v${node.kitVersion}): ${node.excerpt}`;
    case "policy":
      return node.kitVersion
        ? `Policy “${node.title}” (kit v${node.kitVersion}): ${node.detail}`
        : `Policy “${node.title}”: ${node.detail}`;
    case "finding":
      return `Finding “${node.summary}”`;
    case "decision":
      return `Human decision ${node.action.replaceAll("_", " ")}`;
    case "gap":
      return "Evidence gap";
  }
}

function explainSnapshot(
  review: ContentReview,
  snapshot: RetrievalSnapshot | null,
): string | null {
  if (!snapshot || !review.snapshotId) {
    return review.snapshotId
      ? "The retrieval snapshot stored for this review was not available, so no source is shown."
      : "This review has no retrieval snapshot, so no source can be shown.";
  }
  if (snapshot.id !== review.snapshotId) {
    return "This snapshot belongs to a different review, so its sources are not shown as evidence.";
  }
  if (snapshot.kitVersion !== review.kitVersion) {
    return `This snapshot is pinned to kit v${snapshot.kitVersion}, not this review's kit v${review.kitVersion}.`;
  }
  return null;
}

function addCitedEvidence(
  review: ContentReview,
  finding: Finding,
  snapshot: RetrievalSnapshot | null,
  snapshotProblem: string | null,
  nodes: TrustNode[],
  edges: TrustEdge[],
): void {
  if (!snapshot || snapshotProblem) {
    addGap(
      finding,
      snapshotProblem ?? explainSnapshot(review, snapshot)!,
      nodes,
      edges,
      "snapshot",
    );
    return;
  }
  if (finding.citationIds.length === 0) {
    addGap(
      finding,
      finding.evidenceGapReason?.trim() ||
        "This finding has no citation in the retrieval snapshot.",
      nodes,
      edges,
      "uncited",
    );
    return;
  }
  const seen = new Set<string>();
  finding.citationIds.forEach((sourceId, index) => {
    if (seen.has(sourceId)) return;
    seen.add(sourceId);
    const passage = resolvePassage(snapshot, review, sourceId);
    if (passage.ok === false) {
      addGap(finding, passage.reason, nodes, edges, `source-${index}`);
      return;
    }
    const nodeId = `evidence:${finding.id}:${sourceId}`;
    nodes.push({
      id: nodeId,
      kind: "evidence",
      findingId: finding.id,
      sourceId,
      title: passage.passage.title,
      excerpt: passage.passage.excerpt,
      kitVersion: passage.passage.kitVersion,
      sourceType: passage.passage.sourceType,
    });
    edges.push({
      id: `edge:${finding.id}:evidence:${sourceId}`,
      type:
        finding.status === "verified"
          ? "CLAIM_SUPPORTED_BY_EVIDENCE"
          : "CLAIM_CONTRADICTED_BY_EVIDENCE",
      from: `claim:${finding.id}`,
      to: nodeId,
      findingId: finding.id,
      label:
        finding.status === "verified"
          ? "The stored finding cites this pinned excerpt as support."
          : "The stored finding cites this pinned excerpt as a conflict.",
      detail: finding.rationale,
    });
  });
}

function addPolicy(
  review: ContentReview,
  finding: Finding,
  snapshot: RetrievalSnapshot | null,
  snapshotProblem: string | null,
  nodes: TrustNode[],
  edges: TrustEdge[],
): void {
  const sourceId = finding.citationIds[0];
  const passage =
    snapshot && !snapshotProblem && sourceId
      ? resolvePassage(snapshot, review, sourceId)
      : null;
  const pinned = passage && passage.ok ? passage.passage : null;
  const ruleId = finding.ruleId ?? "";
  nodes.push({
    id: `policy:${finding.id}:${ruleId || "unspecified"}`,
    kind: "policy",
    findingId: finding.id,
    ruleId,
    title: pinned?.title ?? (ruleId || "Recorded rule"),
    detail:
      pinned?.excerpt ??
      "The rule id is stored on the finding. No pinned excerpt is available for this review.",
    kitVersion: pinned?.kitVersion,
  });
  edges.push({
    id: `edge:${finding.id}:policy`,
    type: "CLAIM_VIOLATES_POLICY",
    from: `claim:${finding.id}`,
    to: `policy:${finding.id}:${ruleId || "unspecified"}`,
    findingId: finding.id,
    label: ruleId
      ? `The stored finding records policy ${ruleId}.`
      : "The stored finding records a policy hit without a rule id.",
    detail: finding.rationale,
  });
  if (!pinned) {
    addGap(
      finding,
      passage && passage.ok === false
        ? passage.reason
        : snapshotProblem ??
            (snapshot
              ? "No pinned policy excerpt is available for this finding."
              : explainSnapshot(review, snapshot)!),
      nodes,
      edges,
      "policy",
    );
  }
}

const KIND_ORDER: Record<TrustNode["kind"], number> = {
  claim: 0,
  finding: 1,
  evidence: 2,
  policy: 3,
  gap: 4,
  decision: 5,
};

/** Nodes for one finding, in reading order. The human decision is not included. */
export function chainForFinding(graph: TrustGraph, findingId: string): TrustNode[] {
  return graph.nodes
    .filter(
      (node) =>
        node.kind !== "decision" && "findingId" in node && node.findingId === findingId,
    )
    .sort((a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind] || a.id.localeCompare(b.id));
}

export function edgesTouching(graph: TrustGraph, nodeId: string): TrustEdge[] {
  return graph.edges.filter((edge) => edge.from === nodeId || edge.to === nodeId);
}

function addGap(
  finding: Finding,
  reason: string,
  nodes: TrustNode[],
  edges: TrustEdge[],
  suffix: string,
): void {
  const id = `gap:${finding.id}:${suffix}`;
  nodes.push({ id, kind: "gap", findingId: finding.id, reason });
  edges.push({
    id: `edge:${id}`,
    type: "CLAIM_MISSING_EVIDENCE",
    from: `claim:${finding.id}`,
    to: id,
    findingId: finding.id,
    label: reason,
  });
}

function resolvePassage(
  snapshot: RetrievalSnapshot,
  review: ContentReview,
  sourceId: string,
): { ok: true; passage: SnapshotPassage } | { ok: false; reason: string } {
  if (!snapshot.sourceIds.includes(sourceId)) {
    return {
      ok: false,
      reason: `Citation ${sourceId} is not in this review's retrieval snapshot.`,
    };
  }
  const passage = snapshot.passages?.find((item) => item.id === sourceId);
  if (!passage) {
    return {
      ok: false,
      reason: `Citation ${sourceId} is listed on the snapshot, but no excerpt was stored.`,
    };
  }
  if (passage.kitVersion !== review.kitVersion) {
    return {
      ok: false,
      reason: `The stored excerpt for ${sourceId} is from kit v${passage.kitVersion}, not this review's kit v${review.kitVersion}.`,
    };
  }
  return { ok: true, passage };
}
