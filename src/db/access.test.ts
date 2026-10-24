import { PGlite } from "@electric-sql/pglite";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { __setDbForTests, migrateAndSeed, resetAndSeed } from "@/db/client";
import {
  DEMO_PASSWORD,
  verifyPassword,
} from "@/lib/password";
import {
  DEMO_ADMIN_ID,
  DEMO_AUTHOR_ID,
  DEMO_REVIEWER_ID,
  OTHER_AUTHOR_ID,
  OTHER_REVIEW_ID,
} from "@/db/seed";
import {
  createSession,
  findUserByEmail,
  getReview,
  getSnapshot,
  getUserById,
  listReviews,
  saveReview,
  userIdForSessionToken,
} from "@/db/repository";
import { DEMO_BRAND_KIT } from "@/data/seed-kit";
import { runDeterministicReview } from "@/engine/review";
import { buildTrustGraph } from "@/engine/trust-graph";
import { changeMemberRole } from "@/lib/membership";
import { listReviewsForCurrentUser } from "@/lib/store";
import { __setSessionIdentityForTests } from "@/lib/session";

let db: PGlite;

beforeAll(async () => {
  db = new PGlite();
  __setDbForTests(db);
  await migrateAndSeed(db);
});

beforeEach(async () => {
  await resetAndSeed(db);
  __setSessionIdentityForTests(null);
});

describe("login and org scope", () => {
  it("accepts the demo password and rejects a different one", async () => {
    const user = await findUserByEmail("reviewer@demo.brandguard.test");
    expect(user?.role).toBe("reviewer");
    expect(user?.orgId).toBe("org_demo");
    expect(user && (await verifyPassword(DEMO_PASSWORD, user.passwordHash))).toBe(
      true,
    );
    expect(user && (await verifyPassword("wrong-password", user.passwordHash))).toBe(
      false,
    );
  });

  it("resolves a session token to the user row", async () => {
    const token = await createSession(DEMO_AUTHOR_ID);
    expect(await userIdForSessionToken(token)).toBe(DEMO_AUTHOR_ID);
    expect(await userIdForSessionToken("missing")).toBeNull();
  });

  it("hides organisation B reviews from an organisation A session", async () => {
    expect(await getReview(OTHER_REVIEW_ID, "org_demo")).toBeNull();
    const demo = await listReviews("org_demo");
    const other = await listReviews("org_other");
    expect(demo.some((review) => review.id === OTHER_REVIEW_ID)).toBe(false);
    expect(other.map((review) => review.id)).toContain(OTHER_REVIEW_ID);

    __setSessionIdentityForTests({ userId: DEMO_AUTHOR_ID });
    const visible = await listReviewsForCurrentUser();
    expect(visible.some((review) => review.id === OTHER_REVIEW_ID)).toBe(false);
    expect(visible.every((review) => review.orgId === "org_demo")).toBe(true);
  });

  it("does not load another organisation's snapshot into the trust graph", async () => {
    const result = runDeterministicReview(
      {
        title: "Org isolation",
        body: "Inkloom was founded in 2019.",
        orgId: "org_demo",
      },
      DEMO_BRAND_KIT,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    await saveReview(result.review, result.snapshot);

    const foreign = await getSnapshot(result.snapshot.id, "org_other");
    const own = await getSnapshot(result.snapshot.id, "org_demo");
    const hidden = buildTrustGraph(result.review, foreign);
    const visible = buildTrustGraph(result.review, own);

    expect(foreign).toBeNull();
    expect(own?.id).toBe(result.review.snapshotId);
    expect(hidden.nodes.some((node) => node.kind === "evidence")).toBe(false);
    expect(visible.nodes.some((node) => node.kind === "evidence")).toBe(true);
    expect(result.review.status).not.toBe("approved");
  });

  it("does not let an author or reviewer grant a role", async () => {
    const before = await getUserById(DEMO_AUTHOR_ID);
    __setSessionIdentityForTests({ userId: DEMO_AUTHOR_ID });
    const selfGrant = await changeMemberRole(DEMO_AUTHOR_ID, "admin");
    __setSessionIdentityForTests({ userId: DEMO_REVIEWER_ID });
    const reviewerGrant = await changeMemberRole(DEMO_AUTHOR_ID, "reviewer");
    __setSessionIdentityForTests(null);
    const signedOut = await changeMemberRole(DEMO_AUTHOR_ID, "admin");

    expect(selfGrant.ok).toBe(false);
    expect(reviewerGrant.ok).toBe(false);
    expect(signedOut.ok).toBe(false);
    expect((await getUserById(DEMO_AUTHOR_ID))?.role).toBe(before?.role);
  });

  it("does not let an admin change another organisation or their own role", async () => {
    __setSessionIdentityForTests({ userId: DEMO_ADMIN_ID });
    const crossOrg = await changeMemberRole(OTHER_AUTHOR_ID, "reviewer");
    const self = await changeMemberRole(DEMO_ADMIN_ID, "author");
    expect(crossOrg.ok).toBe(false);
    expect(self.ok).toBe(false);
    expect((await getUserById(OTHER_AUTHOR_ID))?.role).toBe("author");
    expect((await getUserById(DEMO_ADMIN_ID))?.role).toBe("admin");
  });
});
