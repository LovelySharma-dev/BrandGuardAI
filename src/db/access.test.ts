import { PGlite } from "@electric-sql/pglite";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { __setDbForTests, migrateAndSeed, resetAndSeed } from "@/db/client";
import {
  DEMO_PASSWORD,
  verifyPassword,
} from "@/lib/password";
import {
  DEMO_AUTHOR_ID,
  OTHER_REVIEW_ID,
} from "@/db/seed";
import {
  createSession,
  findUserByEmail,
  getReview,
  listReviews,
  userIdForSessionToken,
} from "@/db/repository";
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
});
