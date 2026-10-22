import { ContentReviewSchema, type ContentReview } from "@/domain/schemas";
import {
  resolveTransition,
  ReviewActionSchema,
  type ReviewAction,
  type ReviewRole,
} from "@/domain/workflow";
import { appendAuditEvent, getReview, getUserById, saveReview } from "@/db/repository";
import { getSessionIdentity } from "@/lib/session";

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
  const parsedAction = ReviewActionSchema.safeParse(action);
  if (!parsedAction.success) {
    return { ok: false, error: "Unknown action" };
  }

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

  const denial = denyTransition(review, parsedAction.data, user.role);
  if (denial) return denial;

  const toStatus = resolveTransition(
    review.status,
    parsedAction.data,
    user.role,
  );
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

  const updated = ContentReviewSchema.parse({
    ...review,
    status: toStatus,
    updatedAt: new Date().toISOString(),
  });
  await saveReview(updated);

  const audit = await appendAuditEvent({
    orgId: review.orgId,
    actorId: user.id,
    action: `review.${parsedAction.data}`,
    entityType: "ContentReview",
    entityId: review.id,
    before: { status: review.status },
    after: { status: toStatus, action: parsedAction.data },
  });

  return { ok: true, review: updated, auditId: audit.id };
}

function denyTransition(
  review: ContentReview,
  action: ReviewAction,
  role: ReviewRole,
): TransitionResult | null {
  if (action === "approve" && role === "author") {
    return { ok: false, error: "Authors cannot approve reviews" };
  }
  if (review.status === "engine_error") {
    return { ok: false, error: "This transition is not allowed" };
  }
  return null;
}
