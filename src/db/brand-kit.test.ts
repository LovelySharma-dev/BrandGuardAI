import { PGlite } from "@electric-sql/pglite";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { __setDbForTests, migrateAndSeed, resetAndSeed } from "@/db/client";
import {
  FOUNDING_FACT_ID,
  getBrandKitVersion,
  getDraftBrandKit,
  getPublishedBrandKit,
} from "@/db/brand-kits";
import { DEMO_ADMIN_ID, DEMO_AUTHOR_ID } from "@/db/seed";
import { getReview, saveReview } from "@/db/repository";
import { runDeterministicReview } from "@/engine/review";
import {
  publishBrandKitDraft,
  saveFoundingStatementDraft,
} from "@/lib/brand-kit";
import { __setSessionIdentityForTests } from "@/lib/session";

let db: PGlite;

function foundingStatement(kit: { facts: { id: string; statement: string }[] }) {
  return kit.facts.find((fact) => fact.id === FOUNDING_FACT_ID)?.statement;
}

beforeAll(async () => {
  db = new PGlite();
  __setDbForTests(db);
  await migrateAndSeed(db);
});

beforeEach(async () => {
  await resetAndSeed(db);
  __setSessionIdentityForTests(null);
});

describe("brand kit versions", () => {
  it("keeps a review pinned to 1.0.0 after a draft edit", async () => {
    const published = await getPublishedBrandKit("org_demo");
    expect(published?.version).toBe("1.0.0");
    expect(foundingStatement(published!)).toBe("Inkloom was founded in 2019.");

    const result = runDeterministicReview(
      {
        title: "Pinned review",
        body: "Inkloom was founded in 2019.",
        orgId: "org_demo",
      },
      published!,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    await saveReview({ ...result.review, orgId: "org_demo" }, result.snapshot);

    __setSessionIdentityForTests({ userId: DEMO_ADMIN_ID });
    const draft = await saveFoundingStatementDraft(
      "Inkloom was founded in 2018.",
    );
    expect(draft.ok).toBe(true);
    if (!draft.ok) return;
    expect(draft.kit.version).toBe("1.0.1");

    const stored = await getReview(result.review.id, "org_demo");
    expect(stored?.kitVersion).toBe("1.0.0");
    const pinned = await getBrandKitVersion("org_demo", "1.0.0");
    expect(foundingStatement(pinned!)).toBe("Inkloom was founded in 2019.");
    expect(foundingStatement((await getPublishedBrandKit("org_demo"))!)).toBe(
      "Inkloom was founded in 2019.",
    );
    expect((await getDraftBrandKit("org_demo"))?.version).toBe("1.0.1");
    expect(foundingStatement((await getDraftBrandKit("org_demo"))!)).toBe(
      "Inkloom was founded in 2018.",
    );
  });

  it("does not let an author change the published kit", async () => {
    __setSessionIdentityForTests({ userId: DEMO_AUTHOR_ID });
    const denied = await saveFoundingStatementDraft("Changed by an author.");
    expect(denied.ok).toBe(false);
    if (denied.ok) return;
    expect(denied.error).toMatch(/admin/i);
    expect(await getDraftBrandKit("org_demo")).toBeNull();
    expect(foundingStatement((await getPublishedBrandKit("org_demo"))!)).toBe(
      "Inkloom was founded in 2019.",
    );
  });

  it("publishes the draft as a new version and leaves 1.0.0 in place", async () => {
    __setSessionIdentityForTests({ userId: DEMO_ADMIN_ID });
    await saveFoundingStatementDraft("Inkloom was founded in 2018.");
    const published = await publishBrandKitDraft();
    expect(published.ok).toBe(true);
    if (!published.ok) return;
    expect(published.kit.version).toBe("1.0.1");
    expect((await getPublishedBrandKit("org_demo"))?.version).toBe("1.0.1");
    expect(foundingStatement((await getBrandKitVersion("org_demo", "1.0.0"))!)).toBe(
      "Inkloom was founded in 2019.",
    );
    expect(await getDraftBrandKit("org_demo")).toBeNull();
    expect(foundingStatement((await getPublishedBrandKit("org_other"))!)).toBe(
      "Inkloom was founded in 2019.",
    );
  });
});
