"use server";

import { getPublishedBrandKit } from "@/db/brand-kits";
import type { ContentReview, RetrievalSnapshot, ReviewInput } from "@/domain/schemas";
import { ReviewInputSchema } from "@/domain/schemas";
import { runHybridReview } from "@/engine/hybrid";
import { applySuggestionDecision } from "@/engine/review";
import { appendAuditEvent, getReview, listReviews, saveReview } from "@/db/repository";
import { consumeRateLimit, reviewSubmitLimit } from "@/lib/rate-limit";
import { requireUser } from "@/lib/session";
import { transitionReview } from "@/lib/transition-review";

export type ActionResult<T> =
  | { ok: true; data: T; snapshot?: RetrievalSnapshot }
  | { ok: false; error: string };

export async function submitReviewAction(
  input: ReviewInput,
): Promise<ActionResult<ContentReview>> {
  const user = await requireUser();
  const limited = await consumeRateLimit({
    bucket: `review:${user.id}`,
    limit: reviewSubmitLimit(),
  });
  if (!limited.ok) return limited;
  const parsed = ReviewInputSchema.parse(input);
  const kit = await getPublishedBrandKit(user.orgId);
  if (!kit) {
    return { ok: false, error: "No published brand kit for this organisation" };
  }
  const result = await runHybridReview(
    { ...parsed, orgId: user.orgId },
    kit,
  );
  if (!result.ok) {
    if (result.review) {
      await saveReview({ ...result.review, orgId: user.orgId });
    }
    return { ok: false, error: result.error };
  }

  const review = {
    ...result.review,
    orgId: user.orgId,
    createdBy: user.id,
  };
  await saveReview(review, result.snapshot);
  await appendAuditEvent({
    orgId: user.orgId,
    actorId: user.id,
    action: "review.created",
    entityType: "ContentReview",
    entityId: review.id,
    after: {
      status: review.status,
      findingCount: review.findings.length,
      kitVersion: review.kitVersion,
      snapshotId: result.snapshot.id,
      modelOutcome: review.modelMeta?.outcome ?? "skipped",
    },
  });

  return { ok: true, data: review, snapshot: result.snapshot };
}

export async function decideSuggestionAction(
  reviewId: string,
  suggestionId: string,
  decision: "accept" | "reject",
): Promise<ActionResult<ContentReview>> {
  const user = await requireUser();
  const existing = await getReview(reviewId, user.orgId);
  if (!existing) {
    return { ok: false, error: "Review not found" };
  }

  try {
    const updated = applySuggestionDecision(existing, suggestionId, decision);
    await saveReview(updated);
    await appendAuditEvent({
      orgId: updated.orgId,
      actorId: user.id,
      action:
        decision === "accept"
          ? "suggestion.accepted"
          : "suggestion.rejected",
      entityType: "ContentReview",
      entityId: updated.id,
      before: { body: existing.body },
      after: {
        body: updated.body,
        suggestionId,
        decision,
      },
    });
    return { ok: true, data: updated };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Suggestion update failed",
    };
  }
}

export async function listReviewsAction(): Promise<ContentReview[]> {
  const user = await requireUser();
  return listReviews(user.orgId);
}

export async function getReviewAction(
  id: string,
): Promise<ContentReview | null> {
  const user = await requireUser();
  return getReview(id, user.orgId);
}

export async function transitionReviewAction(
  reviewId: string,
  action: unknown,
): Promise<ActionResult<ContentReview>> {
  const result = await transitionReview(reviewId, action);
  if (!result.ok) return result;
  return { ok: true, data: result.review };
}
