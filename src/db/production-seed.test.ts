import { PGlite } from "@electric-sql/pglite";
import { describe, expect, it } from "vitest";

import { __setDbForTests, migrateAndSeed } from "@/db/client";

describe("production seed", () => {
  it("does not insert demo accounts into an empty production database", async () => {
    const env = process.env as { NODE_ENV?: string };
    const previous = env.NODE_ENV;
    env.NODE_ENV = "production";
    try {
      const db = new PGlite();
      __setDbForTests(db);
      await migrateAndSeed(db);
      const users = await db.query<{ count: number }>(
        "SELECT count(*)::int AS count FROM users",
      );
      expect(Number(users.rows[0]?.count ?? 0)).toBe(0);
    } finally {
      env.NODE_ENV = previous;
    }
  });
});
