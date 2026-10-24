import { PGlite } from "@electric-sql/pglite";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import {
  decideSuggestionAction,
  getReviewAction,
} from "@/app/actions/review";
import { DEMO_BRAND_KIT } from "@/data/seed-kit";
import { __setDbForTests, migrateAndSeed, resetAndSeed } from "@/db/client";
import {
  getReview,
  getSnapshot,
  listAuditEvents,
  saveReview,
} from "@/db/repository";
import {
  DEMO_AUTHOR_ID,
  DEMO_REVIEWER_ID,
  OTHER_AUTHOR_ID,
  OTHER_REVIEW_ID,
} from "@/db/seed";
import { runDeterministicReview } from "@/engine/review";
import { buildTrustGraph } from "@/engine/trust-graph";
import { __setSessionIdentityForTests } from "@/lib/session";
import { transitionReview } from "@/lib/transition-review";

const MIXED =
  "Inkloom was founded in 2019. Later copy says founded in 2015. We are the best in the world.";
const CLEAN = "Inkloom was founded in 2019.";
const FOREIGN_BODY = "Foreign excerpt token zeta-orbit-4419 stays in the other organisation.";

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

function reviewed(body: string) {
  const result = runDeterministicReview(
    { title: "Workflow", body, orgId: "org_demo" },
    DEMO_BRAND_KIT,
  );
  if (!result.ok) throw new Error(result.error);
  return result;
}

describe("author and reviewer workflow", () => {
  it("accepts a suggestion without approving, then keeps a reviewer decision separate", async () => {
    const mixed = reviewed(MIXED);
    const statuses = mixed.review.findings.map((finding) => finding.status);
    expect(statuses).toEqual(
      expect.arrayContaining(["verified", "contradicted", "unsupported"]),
    );
    expect(mixed.review.status).toBe("needs_revision");
    expect(mixed.review.decision).toBeUndefined();

    const contradicted = mixed.review.findings.find(
      (finding) => finding.status === "contradicted",
    );
    expect(contradicted?.suggestion?.id).toBeTruthy();
    await saveReview(
      { ...mixed.review, createdBy: DEMO_AUTHOR_ID },
      mixed.snapshot,
    );

    __setSessionIdentityForTests({ userId: DEMO_AUTHOR_ID });
    const accepted = await decideSuggestionAction(
      mixed.review.id,
      contradicted!.suggestion!.id,
      "accept",
    );
    expect(accepted.ok).toBe(true);
    if (!accepted.ok) return;
    expect(accepted.data.body).not.toBe(MIXED);
    expect(accepted.data.body).toContain("founded in 2019");
    expect(accepted.data.status).toBe("needs_revision");
    expect(accepted.data.decision).toBeUndefined();
    expect(accepted.data.findings.map((finding) => finding.status)).toEqual(
      mixed.review.findings.map((finding) => finding.status),
    );
    expect(
      accepted.data.findings.find((finding) => finding.id === contradicted!.id)
        ?.suggestion?.accepted,
    ).toBe(true);

    const storedMixed = await getReview(mixed.review.id, "org_demo");
    expect(storedMixed?.status).toBe("needs_revision");
    expect(storedMixed?.decision).toBeUndefined();

    const authorApproval = await transitionReview(mixed.review.id, "approve");
    expect(authorApproval.ok).toBe(false);
    expect((await getReview(mixed.review.id, "org_demo"))?.status).toBe(
      "needs_revision",
    );

    const clean = reviewed(CLEAN);
    expect(clean.review.status).toBe("in_review");
    expect(clean.review.findings.some((finding) => finding.status === "verified")).toBe(
      true,
    );
    await saveReview(
      { ...clean.review, createdBy: DEMO_AUTHOR_ID },
      clean.snapshot,
    );

    const creatorDenied = await transitionReview(clean.review.id, "approve");
    expect(creatorDenied.ok).toBe(false);
    if (creatorDenied.ok) return;
    expect(creatorDenied.error).toMatch(/cannot approve/i);
    expect((await getReview(clean.review.id, "org_demo"))?.status).toBe(
      "in_review",
    );
    expect((await getReview(clean.review.id, "org_demo"))?.decision).toBeUndefined();

    __setSessionIdentityForTests({ userId: DEMO_REVIEWER_ID });
    const approved = await transitionReview(clean.review.id, "approve");
    expect(approved.ok).toBe(true);
    if (!approved.ok) return;

    const saved = await getReview(clean.review.id, "org_demo");
    expect(saved?.status).toBe("approved");
    expect(saved?.decision).toMatchObject({
      action: "approve",
      actorId: DEMO_REVIEWER_ID,
    });
    expect(saved?.findings.every((finding) => finding.status === "verified")).toBe(
      true,
    );

    const snapshot = await getSnapshot(clean.snapshot.id, "org_demo");
    const graph = buildTrustGraph(saved!, snapshot);
    const evidence = graph.nodes.find((node) => node.kind === "evidence");
    const decision = graph.nodes.find((node) => node.kind === "decision");
    expect(evidence && evidence.kind === "evidence" ? evidence.excerpt : "").toContain(
      "2019",
    );
    expect(decision).toMatchObject({
      kind: "decision",
      action: "approve",
      actorId: DEMO_REVIEWER_ID,
    });
    expect(graph.nodes.find((node) => node.kind === "finding")).toMatchObject({
      status: "verified",
    });

    const demoAudit = await listAuditEvents("org_demo");
    expect(demoAudit.map((event) => event.action)).toEqual(
      expect.arrayContaining(["suggestion.accepted", "review.approve"]),
    );
    expect(demoAudit.every((event) => event.orgId === "org_demo")).toBe(true);
    expect(await listAuditEvents("org_other")).toEqual([]);
  });
});

describe("organisation isolation at the action boundary", () => {
  it("does not return another organisation's review, snapshot, or audit trail", async () => {
    const foreign = reviewed(FOREIGN_BODY);
    const secretSnapshot = {
      ...foreign.snapshot,
      sourceIds: [...foreign.snapshot.sourceIds, "src_foreign_only"],
      passages: [
        ...(foreign.snapshot.passages ?? []),
        {
          id: "src_foreign_only",
          title: "Foreign source",
          excerpt: "zeta-orbit-4419",
          sourceType: "other" as const,
          kitVersion: foreign.snapshot.kitVersion,
        },
      ],
    };
    await saveReview(
      {
        ...foreign.review,
        id: "rev_foreign_secret",
        orgId: "org_other",
        createdBy: OTHER_AUTHOR_ID,
        snapshotId: secretSnapshot.id,
      },
      secretSnapshot,
    );

    __setSessionIdentityForTests({ userId: DEMO_AUTHOR_ID });
    const hidden = await getReviewAction("rev_foreign_secret");
    expect(hidden).toBeNull();
    expect(await getReview(OTHER_REVIEW_ID, "org_demo")).toBeNull();
    expect(await getSnapshot(secretSnapshot.id, "org_demo")).toBeNull();
    expect(
      (await getSnapshot(secretSnapshot.id, "org_other"))?.passages?.some((passage) =>
        passage.excerpt.includes("zeta-orbit-4419"),
      ),
    ).toBe(true);

    const ownAttempt = buildTrustGraph(foreign.review, null);
    expect(ownAttempt.nodes.some((node) => node.kind === "evidence")).toBe(false);
    expect(JSON.stringify(ownAttempt)).not.toContain("zeta-orbit-4419");

    const leaked = await decideSuggestionAction(
      "rev_foreign_secret",
      "sug_missing",
      "accept",
    );
    expect(leaked.ok).toBe(false);
    if (leaked.ok) return;
    expect(leaked.error).toBe("Review not found");
    expect(leaked.error).not.toContain("zeta-orbit-4419");
    expect((await getReview("rev_foreign_secret", "org_other"))?.body).toBe(
      FOREIGN_BODY,
    );

    __setSessionIdentityForTests({ userId: OTHER_AUTHOR_ID });
    const demo = reviewed(CLEAN);
    await saveReview({ ...demo.review, createdBy: DEMO_AUTHOR_ID }, demo.snapshot);
    const crossed = await getReviewAction(demo.review.id);
    expect(crossed).toBeNull();
    const denied = await decideSuggestionAction(demo.review.id, "sug_missing", "reject");
    expect(denied.ok).toBe(false);
    if (denied.ok) return;
    expect(denied.error).toBe("Review not found");
    expect((await getReview(demo.review.id, "org_demo"))?.body).toBe(CLEAN);
    expect(await listAuditEvents("org_demo")).toEqual([]);
    expect(await listAuditEvents("org_other")).toEqual([]);
  });
});
