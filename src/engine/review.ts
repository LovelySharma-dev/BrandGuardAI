import { DEMO_BRAND_KIT } from "@/data/seed-kit";
import {
  BrandKitSchema,
  ContentReviewSchema,
  ReviewInputSchema,
  type BrandKit,
  type ContentReview,
  type Finding,
  type RetrievalSnapshot,
  type ReviewInput,
} from "@/domain/schemas";
import { detectPromotionalClaims } from "@/engine/claims";
import { applyEvidenceGate } from "@/engine/evidence-gate";
import { checkFactualClaims } from "@/engine/facts";
import { createId } from "@/engine/ids";
import { detectTerminologyViolations } from "@/engine/terminology";

export type ReviewEngineResult =
  | { ok: true; review: ContentReview; snapshot: RetrievalSnapshot }
  | { ok: false; error: string; review?: ContentReview };

function buildSnapshot(kit: BrandKit): RetrievalSnapshot {
  return {
    id: createId("snap"),
    kitVersion: kit.version,
    sourceIds: kit.sources.map((s) => s.id),
    createdAt: new Date().toISOString(),
  };
}

function sortFindings(findings: Finding[]): Finding[] {
  const severityRank = { blocker: 0, warning: 1, info: 2 } as const;
  return [...findings].sort((a, b) => {
    const s = severityRank[a.severity] - severityRank[b.severity];
    if (s !== 0) return s;
    return (a.span?.start ?? 0) - (b.span?.start ?? 0);
  });
}

/**
 * Deterministic hybrid pass (validators only for Phase 1).
 * LLM adapter is intentionally not wired yet.
 */
export function runDeterministicReview(
  input: unknown,
  kit: BrandKit = DEMO_BRAND_KIT,
): ReviewEngineResult {
  const parsedKit = BrandKitSchema.safeParse(kit);
  if (!parsedKit.success) {
    return {
      ok: false,
      error: `Malformed brand kit: ${parsedKit.error.issues.map((i) => i.message).join("; ")}`,
    };
  }

  const parsedInput = ReviewInputSchema.safeParse(input);
  if (!parsedInput.success) {
    return {
      ok: false,
      error: parsedInput.error.issues.map((i) => i.message).join("; "),
    };
  }

  const data: ReviewInput = parsedInput.data;
  const reviewId = createId("rev");
  const now = new Date().toISOString();
  const snapshot = buildSnapshot(parsedKit.data);

  try {
    const rawFindings: Finding[] = [
      ...detectTerminologyViolations(reviewId, data.body, parsedKit.data),
      ...detectPromotionalClaims(reviewId, data.body, parsedKit.data),
      ...checkFactualClaims(reviewId, data.body, parsedKit.data),
    ];

    const gated = applyEvidenceGate(rawFindings, snapshot);
    const findings = sortFindings(gated);

    const hasBlocker = findings.some((f) => f.severity === "blocker");
    const review = ContentReviewSchema.parse({
      id: reviewId,
      orgId: data.orgId,
      title: data.title,
      body: data.body,
      intent: data.intent,
      status: hasBlocker ? "needs_revision" : "in_review",
      kitVersion: parsedKit.data.version,
      snapshotId: snapshot.id,
      findings,
      revisions: [
        {
          id: createId("revbody"),
          body: data.body,
          createdAt: now,
          note: "Original submission",
        },
      ],
      createdAt: now,
      updatedAt: now,
    });

    return { ok: true, review, snapshot };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown review engine error";
    const review = ContentReviewSchema.parse({
      id: reviewId,
      orgId: data.orgId,
      title: data.title,
      body: data.body,
      intent: data.intent,
      status: "engine_error",
      kitVersion: parsedKit.data.version,
      snapshotId: snapshot.id,
      findings: [],
      revisions: [],
      createdAt: now,
      updatedAt: now,
      errorMessage: message,
    });
    return { ok: false, error: message, review };
  }
}

export function applySuggestionDecision(
  review: ContentReview,
  suggestionId: string,
  decision: "accept" | "reject",
): ContentReview {
  const finding = review.findings.find(
    (f) => f.suggestion?.id === suggestionId,
  );
  if (!finding?.suggestion) {
    throw new Error("Suggestion not found on this review");
  }
  if (finding.suggestion.accepted !== null) {
    throw new Error("Suggestion already decided");
  }

  const now = new Date().toISOString();
  const accepted = decision === "accept";

  const findings = review.findings.map((f) => {
    if (f.suggestion?.id !== suggestionId) return f;
    return {
      ...f,
      suggestion: { ...f.suggestion, accepted },
    };
  });

  let body = review.body;
  const revisions = [...review.revisions];
  if (accepted) {
    body = finding.suggestion.proposedText;
    revisions.push({
      id: createId("revbody"),
      body,
      createdAt: now,
      note: `Accepted suggestion ${suggestionId}`,
    });
  }

  return ContentReviewSchema.parse({
    ...review,
    body,
    findings,
    revisions,
    updatedAt: now,
    status: accepted ? "needs_revision" : review.status,
  });
}
