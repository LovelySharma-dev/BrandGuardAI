import type { PGlite } from "@electric-sql/pglite";

import { ContentReviewSchema } from "@/domain/schemas";
import { DEMO_PASSWORD, hashPassword } from "@/lib/password";

export const DEMO_AUTHOR_ID = "user_demo_author";
export const DEMO_REVIEWER_ID = "user_demo_reviewer";
export const DEMO_ADMIN_ID = "user_demo_admin";
export const OTHER_AUTHOR_ID = "user_other_author";
export const OTHER_REVIEW_ID = "rev_other_org";

export const DEMO_ACCOUNTS = [
  {
    id: DEMO_AUTHOR_ID,
    orgId: "org_demo",
    email: "author@demo.brandguard.test",
    name: "Demo author",
    role: "author",
  },
  {
    id: DEMO_REVIEWER_ID,
    orgId: "org_demo",
    email: "reviewer@demo.brandguard.test",
    name: "Demo reviewer",
    role: "reviewer",
  },
  {
    id: DEMO_ADMIN_ID,
    orgId: "org_demo",
    email: "admin@demo.brandguard.test",
    name: "Demo admin",
    role: "admin",
  },
  {
    id: OTHER_AUTHOR_ID,
    orgId: "org_other",
    email: "author@other.brandguard.test",
    name: "Other author",
    role: "author",
  },
] as const;

const ORGS = [
  { id: "org_demo", name: "Demo organisation" },
  { id: "org_other", name: "Other organisation" },
] as const;

let demoHash: Promise<string> | null = null;

function passwordHash(): Promise<string> {
  demoHash ??= hashPassword(DEMO_PASSWORD, "brandguard-demo-salt");
  return demoHash;
}

export async function seedDatabase(db: PGlite): Promise<void> {
  const existing = await db.query<{ count: number }>(
    "SELECT count(*)::int AS count FROM users",
  );
  if (Number(existing.rows[0]?.count ?? 0) > 0) return;

  for (const org of ORGS) {
    await db.query(
      "INSERT INTO organisations (id, name) VALUES ($1, $2)",
      [org.id, org.name],
    );
  }

  const hash = await passwordHash();
  for (const account of DEMO_ACCOUNTS) {
    await db.query(
      `INSERT INTO users (id, org_id, email, name, role, password_hash)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [account.id, account.orgId, account.email, account.name, account.role, hash],
    );
  }

  const now = "2026-01-01T00:00:00.000Z";
  const review = ContentReviewSchema.parse({
    id: OTHER_REVIEW_ID,
    orgId: "org_other",
    title: "Other organisation launch",
    body: "A draft that belongs to the other organisation.",
    intent: { goal: "", audience: "", channel: "", mustKeep: [] },
    status: "in_review",
    kitVersion: "1.0.0",
    snapshotId: null,
    findings: [],
    revisions: [],
    createdAt: now,
    updatedAt: now,
  });
  await db.query(
    `INSERT INTO reviews (
       id, org_id, title, body, intent, status, kit_version, snapshot_id,
       findings, revisions, error_message, created_at, updated_at
     ) VALUES (
       $1, $2, $3, $4, $5::jsonb, $6, $7, $8,
       $9::jsonb, $10::jsonb, $11, $12, $13
     )`,
    [
      review.id,
      review.orgId,
      review.title,
      review.body,
      JSON.stringify(review.intent),
      review.status,
      review.kitVersion,
      review.snapshotId,
      JSON.stringify(review.findings),
      JSON.stringify(review.revisions),
      null,
      review.createdAt,
      review.updatedAt,
    ],
  );
}
