"use server";

import { DEMO_BRAND_KIT } from "@/data/seed-kit";
import type { ContentReview, ReviewInput } from "@/domain/schemas";
import {
  applySuggestionDecision,
  runDeterministicReview,
} from "@/engine/review";
import { appendAuditEvent } from "@/lib/audit";
import { getReview, listReviews, saveReview } from "@/lib/store";

const DEMO_ACTOR = "user_demo_author";

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export async function submitReviewAction(
  input: ReviewInput,
): Promise<ActionResult<ContentReview>> {
  const result = runDeterministicReview(input, DEMO_BRAND_KIT);
  if (!result.ok) {
    if (result.review) {
      saveReview(result.review);
    }
    return { ok: false, error: result.error };
  }

  saveReview(result.review, result.snapshot);
  appendAuditEvent({
    orgId: result.review.orgId,
    actorId: DEMO_ACTOR,
    action: "review.created",
    entityType: "ContentReview",
    entityId: result.review.id,
    after: {
      status: result.review.status,
      findingCount: result.review.findings.length,
      kitVersion: result.review.kitVersion,
      snapshotId: result.snapshot.id,
    },
  });

  return { ok: true, data: result.review };
}

export async function decideSuggestionAction(
  reviewId: string,
  suggestionId: string,
  decision: "accept" | "reject",
): Promise<ActionResult<ContentReview>> {
  const existing = getReview(reviewId);
  if (!existing) {
    return { ok: false, error: "Review not found" };
  }

  try {
    const updated = applySuggestionDecision(existing, suggestionId, decision);
    saveReview(updated);
    appendAuditEvent({
      orgId: updated.orgId,
      actorId: DEMO_ACTOR,
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

export async function listReviewsAction(
  orgId = "org_demo",
): Promise<ContentReview[]> {
  return listReviews(orgId);
}

export async function getReviewAction(
  id: string,
): Promise<ContentReview | null> {
  return getReview(id) ?? null;
}
