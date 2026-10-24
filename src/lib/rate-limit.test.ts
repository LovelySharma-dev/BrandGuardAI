import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { __setDbForTests, migrateAndSeed } from "@/db/client";
import { consumeRateLimit } from "@/lib/rate-limit";

let db: PGlite;

beforeAll(async () => {
  db = new PGlite();
  __setDbForTests(db);
  await migrateAndSeed(db);
});

afterAll(() => {
  __setDbForTests(db);
});

describe("consumeRateLimit", () => {
  it("allows requests inside the limit and rejects the next one", async () => {
    const bucket = `login:test-${Date.now()}`;
    const first = await consumeRateLimit({ bucket, limit: 3, windowMs: 60_000 });
    const second = await consumeRateLimit({ bucket, limit: 3, windowMs: 60_000 });
    const third = await consumeRateLimit({ bucket, limit: 3, windowMs: 60_000 });
    const fourth = await consumeRateLimit({ bucket, limit: 3, windowMs: 60_000 });
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    expect(third.ok).toBe(true);
    expect(fourth.ok).toBe(false);
  });

  it("does not apply one bucket to a different key", async () => {
    const stamp = Date.now();
    for (let i = 0; i < 3; i += 1) {
      const used = await consumeRateLimit({
        bucket: `review:user-a-${stamp}`,
        limit: 3,
        windowMs: 60_000,
      });
      expect(used.ok).toBe(true);
    }
    const other = await consumeRateLimit({
      bucket: `review:user-b-${stamp}`,
      limit: 3,
      windowMs: 60_000,
    });
    expect(other.ok).toBe(true);
  });

  it("rejects when the rate-limit query fails", async () => {
    __setDbForTests({
      async query() {
        throw new Error("database unavailable");
      },
      async exec() {
        throw new Error("database unavailable");
      },
    });
    const result = await consumeRateLimit({
      bucket: "pdf:user",
      limit: 8,
      windowMs: 60_000,
    });
    expect(result.ok).toBe(false);
    __setDbForTests(db);
  });
});
