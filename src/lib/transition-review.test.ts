import { PGlite } from "@electric-sql/pglite";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { DEMO_BRAND_KIT } from "@/data/seed-kit";
import { ContentReviewSchema, ReviewStatusSchema } from "@/domain/schemas";
import type { ReviewStatus } from "@/domain/schemas";
import {
  REVIEW_TRANSITIONS,
  type ReviewAction,
  type ReviewRole,
} from "@/domain/workflow";
import { __setDbForTests, migrateAndSeed, resetAndSeed } from "@/db/client";
import {
  __setUserRoleForTests,
  getReview,
  listAuditEvents,
  saveReview,
} from "@/db/repository";
import {
  DEMO_ADMIN_ID,
  DEMO_AUTHOR_ID,
  DEMO_REVIEWER_ID,
  OTHER_REVIEW_ID,
} from "@/db/seed";
import { runDeterministicReview } from "@/engine/review";
import { createId } from "@/engine/ids";
import { __setSessionIdentityForTests } from "@/lib/session";
import { transitionReview } from "@/lib/transition-review";

const ACTOR: Record<ReviewRole, string> = {
  author: DEMO_AUTHOR_ID,
  reviewer: DEMO_REVIEWER_ID,
  admin: DEMO_ADMIN_ID,
};

const MATRIX: readonly [ReviewStatus, ReviewAction, ReviewRole, ReviewStatus][] = [
  ["draft", "submit", "author", "in_review"],
  ["draft", "submit", "admin", "in_review"],
  ["needs_revision", "submit", "author", "in_review"],
  ["needs_revision", "submit", "admin", "in_review"],
  ["in_review", "approve", "reviewer", "approved"],
  ["in_review", "approve", "admin", "approved"],
  ["in_review", "reject", "reviewer", "rejected"],
  ["in_review", "reject", "admin", "rejected"],
  ["in_review", "request_changes", "reviewer", "needs_revision"],
  ["in_review", "request_changes", "admin", "needs_revision"],
  ["pending_approval", "approve", "reviewer", "approved"],
  ["pending_approval", "approve", "admin", "approved"],
  ["pending_approval", "reject", "reviewer", "rejected"],
  ["pending_approval", "reject", "admin", "rejected"],
  ["pending_approval", "request_changes", "reviewer", "needs_revision"],
  ["pending_approval", "request_changes", "admin", "needs_revision"],
];

let db: PGlite;

beforeAll(async () => {
  db = new PGlite();
  __setDbForTests(db);
  await migrateAndSeed(db);
}, 30000);

beforeEach(async () => {
  await resetAndSeed(db);
  __setSessionIdentityForTests(null);
});

async function seedReview(status: ReviewStatus, orgId = "org_demo") {
  const now = "2026-01-01T00:00:00.000Z";
  const review = ContentReviewSchema.parse({
    id: createId("rev"),
    orgId,
    title: "Queue item",
    body: "Grounded copy for the approval queue.",
    intent: { goal: "", audience: "", channel: "", mustKeep: [] },
    status,
    kitVersion: "1.0.0",
    snapshotId: null,
    findings: [],
    revisions: [],
    createdAt: now,
    updatedAt: now,
  });
  await saveReview(review);
  return review;
}

describe("transitionReview allow-list", () => {
  it("matches the transition matrix exactly", () => {
    expect(REVIEW_TRANSITIONS).toEqual(
      MATRIX.map(([from, action, role, to]) => ({ from, action, role, to })),
    );
  });

  it.each(MATRIX)(
    "%s + %s as %s moves to %s and writes one audit row",
    async (from, action, role, to) => {
      const review = await seedReview(from);
      __setSessionIdentityForTests({ userId: ACTOR[role] });
      const result = await transitionReview(review.id, decisionFor(action));

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.review.status).toBe(to);
      expect((await getReview(review.id, "org_demo"))?.status).toBe(to);

      const audits = await listAuditEvents("org_demo");
      expect(audits).toHaveLength(1);
      expect(audits[0]).toMatchObject({
        id: result.auditId,
        actorId: ACTOR[role],
        action: `review.${action}`,
        entityType: "ContentReview",
        entityId: review.id,
        before: { status: from },
        after: {
          status: to,
          action,
          ...(action === "reject" || action === "request_changes"
            ? { reason: "Needs a documented human reason." }
            : {}),
        },
      });
    },
  );
});

function decisionFor(action: ReviewAction) {
  if (action === "reject" || action === "request_changes") {
    return { action, reason: "Needs a documented human reason." };
  }
  return action;
}

describe("transitionReview denials", () => {
  it.each(ReviewStatusSchema.options)(
    "an author cannot approve from %s",
    async (from) => {
      const review = await seedReview(from);
      const before = await getReview(review.id, "org_demo");
      __setSessionIdentityForTests({ userId: DEMO_AUTHOR_ID });
      const result = await transitionReview(review.id, "approve");

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error).toMatch(/cannot approve/i);
      expect(await getReview(review.id, "org_demo")).toEqual(before);
      expect(await listAuditEvents("org_demo")).toEqual([]);
    },
  );

  it("reloads the role from the user row, ignoring a previous reviewer role", async () => {
    const review = await seedReview("in_review");
    await __setUserRoleForTests(DEMO_REVIEWER_ID, "author");
    __setSessionIdentityForTests({ userId: DEMO_REVIEWER_ID });

    const denied = await transitionReview(review.id, "approve");

    expect(denied.ok).toBe(false);
    expect((await getReview(review.id, "org_demo"))?.status).toBe("in_review");
    expect(await listAuditEvents("org_demo")).toEqual([]);
  });

  it("does not change another organisation's review", async () => {
    const before = await getReview(OTHER_REVIEW_ID, "org_other");
    __setSessionIdentityForTests({ userId: DEMO_REVIEWER_ID });
    const result = await transitionReview(OTHER_REVIEW_ID, "approve");

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/not found/i);
    expect(await getReview(OTHER_REVIEW_ID, "org_other")).toEqual(before);
    expect(await listAuditEvents("org_other")).toEqual([]);
  });

  it("a model actor cannot set approved", async () => {
    const review = await seedReview("in_review");
    __setSessionIdentityForTests({ userId: "model:engine" });
    const result = await transitionReview(review.id, "approve");

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/unknown actor/i);
    expect((await getReview(review.id, "org_demo"))?.status).toBe("in_review");
    expect(await listAuditEvents("org_demo")).toEqual([]);
  });

  it("does not write an audit row when reject has no reason", async () => {
    const review = await seedReview("in_review");
    __setSessionIdentityForTests({ userId: DEMO_REVIEWER_ID });
    const result = await transitionReview(review.id, "reject");

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/reason/i);
    expect((await getReview(review.id, "org_demo"))?.status).toBe("in_review");
    expect(await listAuditEvents("org_demo")).toEqual([]);
  });

  it("does not let the creator approve, even with a reviewer role", async () => {
    const review = await seedReview("in_review");
    await saveReview({ ...review, createdBy: DEMO_REVIEWER_ID });
    __setSessionIdentityForTests({ userId: DEMO_REVIEWER_ID });
    const result = await transitionReview(review.id, "approve");

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/you created/i);
    expect((await getReview(review.id, "org_demo"))?.status).toBe("in_review");
    expect(await listAuditEvents("org_demo")).toEqual([]);
  });

  it("keeps one approval when two decisions race", async () => {
    const review = await seedReview("in_review");
    __setSessionIdentityForTests({ userId: DEMO_REVIEWER_ID });
    const [first, second] = await Promise.all([
      transitionReview(review.id, "approve"),
      transitionReview(review.id, "approve"),
    ]);
    const outcomes = [first, second];
    expect(outcomes.filter((item) => item.ok)).toHaveLength(1);
    expect(outcomes.filter((item) => !item.ok)).toHaveLength(1);
    expect((await getReview(review.id, "org_demo"))?.status).toBe("approved");
    const audits = await listAuditEvents("org_demo");
    expect(audits).toHaveLength(1);
    expect(audits[0]?.action).toBe("review.approve");
  });

  it("rejects a missing session without writing", async () => {
    const review = await seedReview("in_review");
    __setSessionIdentityForTests(null);
    const result = await transitionReview(review.id, "approve");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/sign in/i);
    expect(await listAuditEvents("org_demo")).toEqual([]);
  });

  it("rejects an unknown action without writing", async () => {
    const review = await seedReview("in_review");
    __setSessionIdentityForTests({ userId: DEMO_ADMIN_ID });
    const result = await transitionReview(review.id, "auto_approve");

    expect(result.ok).toBe(false);
    expect((await getReview(review.id, "org_demo"))?.status).toBe("in_review");
    expect(await listAuditEvents("org_demo")).toEqual([]);
  });

  it("appends an audit row per legal transition and leaves earlier rows unchanged", async () => {
    const review = await seedReview("in_review");

    __setSessionIdentityForTests({ userId: DEMO_REVIEWER_ID });
    const requested = await transitionReview(review.id, {
      action: "request_changes",
      reason: "The founding year still disagrees with the kit.",
    });
    expect(requested.ok).toBe(true);

    __setSessionIdentityForTests({ userId: DEMO_AUTHOR_ID });
    const resubmitted = await transitionReview(review.id, "submit");
    expect(resubmitted.ok).toBe(true);

    __setSessionIdentityForTests({ userId: DEMO_REVIEWER_ID });
    const approved = await transitionReview(review.id, "approve");
    expect(approved.ok).toBe(true);
    expect((await getReview(review.id, "org_demo"))?.status).toBe("approved");

    const audits = await listAuditEvents("org_demo");
    expect(audits.map((event) => event.action)).toEqual([
      "review.request_changes",
      "review.submit",
      "review.approve",
    ]);
    const first = audits[0];

    __setSessionIdentityForTests({ userId: DEMO_AUTHOR_ID });
    const denied = await transitionReview(review.id, "approve");
    expect(denied.ok).toBe(false);
    expect((await getReview(review.id, "org_demo"))?.status).toBe("approved");
    const after = await listAuditEvents("org_demo");
    expect(after).toHaveLength(3);
    expect(after[0]).toEqual(first);
  });
});

describe("approved is a human transition", () => {
  it("the deterministic engine does not set approved", () => {
    const result = runDeterministicReview(
      {
        title: "Clean",
        body: "Our content review keeps claims grounded in the brand kit.",
        orgId: "org_demo",
      },
      DEMO_BRAND_KIT,
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.review.status).not.toBe("approved");
  });
});
