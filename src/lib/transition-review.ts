import { z } from "zod";

import { commitReviewTransition, getReview, getUserById } from "@/db/repository";
import { ContentReviewSchema, type ContentReview } from "@/domain/schemas";
import {
  resolveTransition,
  ReviewActionSchema,
  type ReviewAction,
  type ReviewRole,
} from "@/domain/workflow";
import { getSessionIdentity } from "@/lib/session";

const ReviewDecisionInputSchema = z.union([
  ReviewActionSchema,
  z.object({
    action: ReviewActionSchema,
    reason: z.string().trim().max(500).optional(),
  }),
]);

export type TransitionResult =
  | { ok: true; review: ContentReview; auditId: string }
  | { ok: false; error: string };

/**
 * Sole writer of `approved`. The actor comes from the session.
 * The role is loaded from the users table inside this function.
 */
export async function transitionReview(
  reviewId: string,
  action: unknown,
): Promise<TransitionResult> {
  const parsedAction = ReviewDecisionInputSchema.safeParse(action);
  if (!parsedAction.success) {
    return { ok: false, error: "Unknown action" };
  }
  const decision = parsedAction.data;
  const actionName: ReviewAction =
    typeof decision === "string" ? decision : decision.action;
  const reason =
    typeof decision === "string" ? undefined : decision.reason?.trim();

  const identity = await getSessionIdentity();
  if (!identity) {
    return { ok: false, error: "Sign in required" };
  }

  const user = await getUserById(identity.userId);
  if (!user) {
    return { ok: false, error: "Unknown actor" };
  }

  const review = await getReview(reviewId, user.orgId);
  if (!review) {
    return { ok: false, error: "Review not found" };
  }

  if (
    (actionName === "reject" || actionName === "request_changes") &&
    (!reason || reason.length < 8)
  ) {
    return {
      ok: false,
      error: "Request changes and reject need a short reason",
    };
  }

  const denial = denyTransition(review, actionName, user.role, user.id);
  if (denial) return denial;

  const toStatus = resolveTransition(review.status, actionName, user.role);
  if (!toStatus) {
    return { ok: false, error: "This transition is not allowed" };
  }
  if (
    toStatus === "approved" &&
    user.role !== "reviewer" &&
    user.role !== "admin"
  ) {
    return { ok: false, error: "Authors cannot approve reviews" };
  }

  const at = new Date().toISOString();
  const updated = ContentReviewSchema.parse({
    ...review,
    status: toStatus,
    updatedAt: at,
    decision: {
      action: actionName,
      reason,
      actorId: user.id,
      at,
    },
  });
  const committed = await commitReviewTransition({
    review: updated,
    expectedStatus: review.status,
    audit: {
      orgId: review.orgId,
      actorId: user.id,
      action: `review.${actionName}`,
      entityType: "ContentReview",
      entityId: review.id,
      before: { status: review.status },
      after: { status: toStatus, action: actionName, reason },
    },
  });
  if (!committed.ok) {
    return {
      ok: false,
      error: "This review changed before the decision was saved",
    };
  }

  return { ok: true, review: updated, auditId: committed.auditId };
}

function denyTransition(
  review: ContentReview,
  action: ReviewAction,
  role: ReviewRole,
  actorId: string,
): TransitionResult | null {
  if (action === "approve" && role === "author") {
    return { ok: false, error: "Authors cannot approve reviews" };
  }
  if (action === "approve" && review.createdBy === actorId) {
    return { ok: false, error: "You cannot approve a review you created" };
  }
  if (review.status === "engine_error") {
    return { ok: false, error: "This transition is not allowed" };
  }
  return null;
}
