import type { PGlite } from "@electric-sql/pglite";

import { BrandKitSchema, type BrandKit } from "@/domain/schemas";
import { getDb } from "@/db/client";

export const FOUNDING_FACT_ID = "fact_founded_2019";

type KitRow = {
  id: string;
  org_id: string;
  name: string;
  version: string;
  status: string;
  document: unknown;
};

function asJson(value: unknown): unknown {
  if (typeof value === "string") return JSON.parse(value) as unknown;
  return value;
}

function rowId(orgId: string, version: string): string {
  return `${orgId}:${version}`;
}

function toKit(row: KitRow): BrandKit {
  return BrandKitSchema.parse({
    ...(asJson(row.document) as Record<string, unknown>),
    orgId: row.org_id,
    name: row.name,
    version: row.version,
  });
}

export function bumpPatchVersion(version: string): string {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  if (!match) {
    throw new Error(`Cannot bump kit version ${version}`);
  }
  return `${match[1]}.${match[2]}.${Number(match[3]) + 1}`;
}

export async function getPublishedBrandKit(
  orgId: string,
): Promise<BrandKit | null> {
  const db = await getDb();
  const result = await db.query<KitRow>(
    `SELECT id, org_id, name, version, status, document
     FROM brand_kits
     WHERE org_id = $1 AND status = 'published'
     ORDER BY published_at DESC
     LIMIT 1`,
    [orgId],
  );
  const row = result.rows[0];
  return row ? toKit(row) : null;
}

export async function getBrandKitVersion(
  orgId: string,
  version: string,
): Promise<BrandKit | null> {
  const db = await getDb();
  const result = await db.query<KitRow>(
    `SELECT id, org_id, name, version, status, document
     FROM brand_kits
     WHERE org_id = $1 AND version = $2 AND status = 'published'`,
    [orgId, version],
  );
  const row = result.rows[0];
  return row ? toKit(row) : null;
}

export async function getDraftBrandKit(orgId: string): Promise<BrandKit | null> {
  const db = await getDb();
  const result = await db.query<KitRow>(
    `SELECT id, org_id, name, version, status, document
     FROM brand_kits
     WHERE org_id = $1 AND status = 'draft'`,
    [orgId],
  );
  const row = result.rows[0];
  return row ? toKit(row) : null;
}

/** Inserts a draft or updates the existing draft. Published rows are not updated. */
export async function upsertDraftBrandKit(kit: BrandKit): Promise<void> {
  const parsed = BrandKitSchema.parse(kit);
  const db = await getDb();
  await db.query(
    `INSERT INTO brand_kits (id, org_id, name, version, status, document, published_at)
     VALUES ($1, $2, $3, $4, 'draft', $5::jsonb, NULL)
     ON CONFLICT (id) DO UPDATE
     SET name = EXCLUDED.name,
         document = EXCLUDED.document
     WHERE brand_kits.status = 'draft'
       AND brand_kits.org_id = EXCLUDED.org_id`,
    [
      rowId(parsed.orgId, parsed.version),
      parsed.orgId,
      parsed.name,
      parsed.version,
      JSON.stringify(parsed),
    ],
  );
}

export async function publishDraftBrandKit(
  orgId: string,
): Promise<BrandKit | null> {
  const db = await getDb();
  const result = await db.query<KitRow>(
    `UPDATE brand_kits
     SET status = 'published', published_at = now()
     WHERE org_id = $1 AND status = 'draft'
     RETURNING id, org_id, name, version, status, document`,
    [orgId],
  );
  const row = result.rows[0];
  return row ? toKit(row) : null;
}

export async function insertPublishedBrandKit(
  db: PGlite,
  kit: BrandKit,
  publishedAt: string,
): Promise<void> {
  const parsed = BrandKitSchema.parse(kit);
  await db.query(
    `INSERT INTO brand_kits (id, org_id, name, version, status, document, published_at)
     VALUES ($1, $2, $3, $4, 'published', $5::jsonb, $6)
     ON CONFLICT (id) DO NOTHING`,
    [
      rowId(parsed.orgId, parsed.version),
      parsed.orgId,
      parsed.name,
      parsed.version,
      JSON.stringify(parsed),
      publishedAt,
    ],
  );
}
