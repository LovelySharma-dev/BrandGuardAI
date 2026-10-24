import { mkdirSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { PGlite } from "@electric-sql/pglite";

import { seedDatabase } from "@/db/seed";

/**
 * Embedded Postgres (PGlite). The machine has a Postgres service, and its
 * local connections require a password that is not stored in this repo.
 * The SQL in src/db/migrations is ordinary Postgres.
 */

let database: Promise<PGlite> | null = null;

export function getDb(): Promise<PGlite> {
  if (!database) {
    database = openAppDatabase().catch((error: unknown) => {
      database = null;
      throw error;
    });
  }
  return database;
}

export function __setDbForTests(db: PGlite): void {
  database = Promise.resolve(db);
}

async function openAppDatabase(): Promise<PGlite> {
  const dir = path.join(process.cwd(), ".data", "pglite");
  mkdirSync(dir, { recursive: true });
  const db = new PGlite(dir);
  await migrateAndSeed(db);
  return db;
}

export async function migrateAndSeed(db: PGlite): Promise<void> {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    );
  `);
  const dir = path.join(process.cwd(), "src/db/migrations");
  const files = readdirSync(dir)
    .filter((name) => name.endsWith(".sql"))
    .sort();
  for (const file of files) {
    const id = file.slice(0, -".sql".length);
    const applied = await db.query<{ id: string }>(
      "SELECT id FROM schema_migrations WHERE id = $1",
      [id],
    );
    if (applied.rows.length > 0) continue;
    await db.exec(readFileSync(path.join(dir, file), "utf8"));
    await db.query("INSERT INTO schema_migrations (id) VALUES ($1)", [id]);
  }
  await seedDatabase(db);
}

export async function resetAndSeed(db: PGlite): Promise<void> {
  await db.exec("TRUNCATE organisations CASCADE");
  await seedDatabase(db);
}
