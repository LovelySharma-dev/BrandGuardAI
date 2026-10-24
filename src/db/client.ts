import { mkdirSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { Pool, neonConfig } from "@neondatabase/serverless";

import { seedDatabase } from "@/db/seed";
import type { AppDatabase } from "@/db/sql";

/**
 * Uses hosted Postgres when DATABASE_URL connects.
 * Otherwise uses embedded Postgres under .data/pglite.
 * Migrations use a direct connection. A malformed DIRECT_URL is ignored
 * and the direct host is derived by removing "-pooler" from DATABASE_URL.
 */

let database: Promise<AppDatabase> | null = null;
let persistenceMode: "hosted" | "local" = "local";
let persistenceDetail = "Not connected yet.";

export function getDb(): Promise<AppDatabase> {
  if (!database) {
    database = openAppDatabase().catch((error: unknown) => {
      database = null;
      throw error;
    });
  }
  return database;
}

export function persistenceStatus(): {
  mode: "hosted" | "local";
  detail: string;
} {
  return { mode: persistenceMode, detail: persistenceDetail };
}

export function __setDbForTests(db: AppDatabase): void {
  database = Promise.resolve(db);
  persistenceMode = "local";
  persistenceDetail = "Test database";
}

export function directConnectionString(
  pooled: string,
  direct: string | undefined,
): string {
  if (direct) {
    try {
      const host = new URL(direct).hostname;
      if (!host.includes(".neon.neon.") && !host.includes("-pooler")) {
        return direct;
      }
    } catch {
      // Derive a direct host from the pooled URL instead.
    }
  }
  const url = new URL(pooled);
  url.hostname = url.hostname.replace("-pooler", "");
  return url.toString();
}

function publicDatabaseError(error: unknown): string {
  const message = error instanceof Error ? error.message : "Connection failed";
  return message.replace(/postgres(?:ql)?:\/\/\S+/gi, "[connection]").slice(0, 180);
}

async function openAppDatabase(): Promise<AppDatabase> {
  const pooled = process.env.DATABASE_URL?.trim();
  if (pooled) {
    try {
      const hosted = await openHostedDatabase(pooled);
      persistenceMode = "hosted";
      persistenceDetail = "Connected to hosted Postgres.";
      return hosted;
    } catch (error) {
      persistenceDetail = `Hosted Postgres did not connect (${publicDatabaseError(error)}). Using local Postgres.`;
    }
  } else {
    persistenceDetail = "DATABASE_URL is not set. Using local Postgres.";
  }
  persistenceMode = "local";
  return openLocalDatabase();
}

async function openLocalDatabase(): Promise<AppDatabase> {
  const { PGlite } = await import("@electric-sql/pglite");
  const dir = path.join(process.cwd(), ".data", "pglite");
  mkdirSync(dir, { recursive: true });
  const db = new PGlite(dir);
  await migrateAndSeed(db);
  return db;
}

async function openHostedDatabase(pooled: string): Promise<AppDatabase> {
  if (typeof WebSocket === "undefined") {
    const ws = await import("ws");
    neonConfig.webSocketConstructor = ws.WebSocket as unknown as typeof WebSocket;
  }
  const direct = directConnectionString(pooled, process.env.DIRECT_URL);
  const migration = new Pool({
    connectionString: direct,
    max: 1,
    connectionTimeoutMillis: 8_000,
  });
  try {
    await migrateAndSeed(wrapPool(migration));
  } finally {
    await migration.end();
  }
  return wrapPool(
    new Pool({
      connectionString: pooled,
      max: 5,
      connectionTimeoutMillis: 8_000,
    }),
  );
}

function wrapPool(pool: Pool): AppDatabase {
  return {
    async query<T>(sql: string, params?: unknown[]) {
      const result = await pool.query(sql, params);
      return { rows: result.rows as T[] };
    },
    async exec(sql: string) {
      const statements = sql
        .split(";")
        .map((statement) => statement.trim())
        .filter((statement) => statement.length > 0);
      for (const statement of statements) {
        await pool.query(statement);
      }
    },
  };
}

export async function migrateAndSeed(db: AppDatabase): Promise<void> {
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

export async function resetAndSeed(db: AppDatabase): Promise<void> {
  await db.exec("TRUNCATE organisations CASCADE");
  await seedDatabase(db);
}
