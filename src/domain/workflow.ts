import type { ReviewStatus } from "@/domain/schemas";
import { z } from "zod";

/** Membership roles. A model is not a role and cannot appear in the allow-list. */
export const ReviewRoleSchema = z.enum(["author", "reviewer", "admin"]);

export const ReviewActionSchema = z.enum([
  "submit",
  "approve",
  "reject",
  "request_changes",
]);

export type ReviewRole = z.infer<typeof ReviewRoleSchema>;
export type ReviewAction = z.infer<typeof ReviewActionSchema>;

export type ReviewTransition = {
  from: ReviewStatus;
  action: ReviewAction;
  role: ReviewRole;
  to: ReviewStatus;
};

/**
 * (fromStatus, action, role) → toStatus.
 * `request_changes` lands on `needs_revision`, the status this schema already
 * uses for the workflow doc's `changes_requested`.
 * No row lets an author, or any non-human actor, reach `approved`.
 */
export const REVIEW_TRANSITIONS: readonly ReviewTransition[] = [
  { from: "draft", action: "submit", role: "author", to: "in_review" },
  { from: "draft", action: "submit", role: "admin", to: "in_review" },
  {
    from: "needs_revision",
    action: "submit",
    role: "author",
    to: "in_review",
  },
  {
    from: "needs_revision",
    action: "submit",
    role: "admin",
    to: "in_review",
  },
  { from: "in_review", action: "approve", role: "reviewer", to: "approved" },
  { from: "in_review", action: "approve", role: "admin", to: "approved" },
  { from: "in_review", action: "reject", role: "reviewer", to: "rejected" },
  { from: "in_review", action: "reject", role: "admin", to: "rejected" },
  {
    from: "in_review",
    action: "request_changes",
    role: "reviewer",
    to: "needs_revision",
  },
  {
    from: "in_review",
    action: "request_changes",
    role: "admin",
    to: "needs_revision",
  },
  {
    from: "pending_approval",
    action: "approve",
    role: "reviewer",
    to: "approved",
  },
  {
    from: "pending_approval",
    action: "approve",
    role: "admin",
    to: "approved",
  },
  {
    from: "pending_approval",
    action: "reject",
    role: "reviewer",
    to: "rejected",
  },
  {
    from: "pending_approval",
    action: "reject",
    role: "admin",
    to: "rejected",
  },
  {
    from: "pending_approval",
    action: "request_changes",
    role: "reviewer",
    to: "needs_revision",
  },
  {
    from: "pending_approval",
    action: "request_changes",
    role: "admin",
    to: "needs_revision",
  },
];

export function resolveTransition(
  from: ReviewStatus,
  action: ReviewAction,
  role: ReviewRole,
): ReviewStatus | null {
  if (action === "approve" && role === "author") return null;

  const match = REVIEW_TRANSITIONS.find(
    (row) => row.from === from && row.action === action && row.role === role,
  );
  if (!match) return null;
  if (match.to === "approved" && role !== "reviewer" && role !== "admin") {
    return null;
  }
  return match.to;
}
