import {
  AuditEventSchema,
  ContentReviewSchema,
  RetrievalSnapshotSchema,
  type AuditEvent,
  type ContentReview,
  type RetrievalSnapshot,
} from "@/domain/schemas";
import { ReviewRoleSchema, type ReviewRole } from "@/domain/workflow";
import { getDb } from "@/db/client";
import { createId } from "@/engine/ids";

export type StoredUser = {
  id: string;
  orgId: string;
  orgName: string;
  email: string;
  name: string;
  role: ReviewRole;
  passwordHash: string;
};

type ReviewRow = {
  id: string;
  org_id: string;
  title: string;
  body: string;
  intent: unknown;
  status: string;
  kit_version: string;
  snapshot_id: string | null;
  findings: unknown;
  revisions: unknown;
  error_message: string | null;
  created_at: string | Date;
  updated_at: string | Date;
};

function asJson(value: unknown): unknown {
  if (typeof value === "string") return JSON.parse(value) as unknown;
  return value;
}

function iso(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function toReview(row: ReviewRow): ContentReview {
  return ContentReviewSchema.parse({
    id: row.id,
    orgId: row.org_id,
    title: row.title,
    body: row.body,
    intent: asJson(row.intent),
    status: row.status,
    kitVersion: row.kit_version,
    snapshotId: row.snapshot_id,
    findings: asJson(row.findings),
    revisions: asJson(row.revisions),
    errorMessage: row.error_message ?? undefined,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  });
}

export async function getUserById(id: string): Promise<StoredUser | null> {
  const db = await getDb();
  const result = await db.query<{
    id: string;
    org_id: string;
    org_name: string;
    email: string;
    name: string;
    role: string;
    password_hash: string;
  }>(
    `SELECT users.id, users.org_id, organisations.name AS org_name, users.email,
            users.name, users.role, users.password_hash
     FROM users
     JOIN organisations ON organisations.id = users.org_id
     WHERE users.id = $1`,
    [id],
  );
  return mapUser(result.rows[0]);
}

export async function findUserByEmail(email: string): Promise<StoredUser | null> {
  const db = await getDb();
  const result = await db.query<{
    id: string;
    org_id: string;
    org_name: string;
    email: string;
    name: string;
    role: string;
    password_hash: string;
  }>(
    `SELECT users.id, users.org_id, organisations.name AS org_name, users.email,
            users.name, users.role, users.password_hash
     FROM users
     JOIN organisations ON organisations.id = users.org_id
     WHERE lower(users.email) = lower($1)`,
    [email],
  );
  return mapUser(result.rows[0]);
}

function mapUser(
  row:
    | {
        id: string;
        org_id: string;
        org_name: string;
        email: string;
        name: string;
        role: string;
        password_hash: string;
      }
    | undefined,
): StoredUser | null {
  if (!row) return null;
  const role = ReviewRoleSchema.safeParse(row.role);
  if (!role.success) return null;
  return {
    id: row.id,
    orgId: row.org_id,
    orgName: row.org_name,
    email: row.email,
    name: row.name,
    role: role.data,
    passwordHash: row.password_hash,
  };
}

export async function createSession(userId: string): Promise<string> {
  const db = await getDb();
  const token = createId("sess") + createId("tok");
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  await db.query(
    "INSERT INTO sessions (token, user_id, expires_at) VALUES ($1, $2, $3)",
    [token, userId, expires],
  );
  return token;
}

export async function userIdForSessionToken(token: string): Promise<string | null> {
  const db = await getDb();
  const result = await db.query<{ user_id: string }>(
    "SELECT user_id FROM sessions WHERE token = $1 AND expires_at > now()",
    [token],
  );
  return result.rows[0]?.user_id ?? null;
}

export async function deleteSession(token: string): Promise<void> {
  const db = await getDb();
  await db.query("DELETE FROM sessions WHERE token = $1", [token]);
}

export async function __setUserRoleForTests(
  userId: string,
  role: ReviewRole,
): Promise<void> {
  const db = await getDb();
  await db.query("UPDATE users SET role = $1 WHERE id = $2", [role, userId]);
}

export async function saveReview(
  review: ContentReview,
  snapshot?: RetrievalSnapshot,
): Promise<void> {
  const db = await getDb();
  const parsed = ContentReviewSchema.parse(review);
  if (snapshot) {
    const snap = RetrievalSnapshotSchema.parse(snapshot);
    if (snap.id !== parsed.snapshotId) {
      throw new Error("Snapshot id does not match the review");
    }
    await db.query(
      `INSERT INTO snapshots (id, org_id, kit_version, source_ids, created_at)
       VALUES ($1, $2, $3, $4::jsonb, $5)
       ON CONFLICT (id) DO NOTHING`,
      [
        snap.id,
        parsed.orgId,
        snap.kitVersion,
        JSON.stringify(snap.sourceIds),
        snap.createdAt,
      ],
    );
  }

  await db.query(
    `INSERT INTO reviews (
       id, org_id, title, body, intent, status, kit_version, snapshot_id,
       findings, revisions, error_message, created_at, updated_at
     ) VALUES (
       $1, $2, $3, $4, $5::jsonb, $6, $7, $8,
       $9::jsonb, $10::jsonb, $11, $12, $13
     )
     ON CONFLICT (id) DO UPDATE SET
       title = EXCLUDED.title,
       body = EXCLUDED.body,
       intent = EXCLUDED.intent,
       status = EXCLUDED.status,
       kit_version = EXCLUDED.kit_version,
       snapshot_id = EXCLUDED.snapshot_id,
       findings = EXCLUDED.findings,
       revisions = EXCLUDED.revisions,
       error_message = EXCLUDED.error_message,
       updated_at = EXCLUDED.updated_at
     WHERE reviews.org_id = EXCLUDED.org_id`,
    [
      parsed.id,
      parsed.orgId,
      parsed.title,
      parsed.body,
      JSON.stringify(parsed.intent),
      parsed.status,
      parsed.kitVersion,
      parsed.snapshotId,
      JSON.stringify(parsed.findings),
      JSON.stringify(parsed.revisions),
      parsed.errorMessage ?? null,
      parsed.createdAt,
      parsed.updatedAt,
    ],
  );
}

export async function getReview(
  id: string,
  orgId: string,
): Promise<ContentReview | null> {
  const db = await getDb();
  const result = await db.query<ReviewRow>(
    "SELECT * FROM reviews WHERE id = $1 AND org_id = $2",
    [id, orgId],
  );
  const row = result.rows[0];
  return row ? toReview(row) : null;
}

export async function listReviews(orgId: string): Promise<ContentReview[]> {
  const db = await getDb();
  const result = await db.query<ReviewRow>(
    "SELECT * FROM reviews WHERE org_id = $1 ORDER BY updated_at DESC, id ASC",
    [orgId],
  );
  return result.rows.map(toReview);
}

export async function getSnapshot(
  id: string,
  orgId: string,
): Promise<RetrievalSnapshot | null> {
  const db = await getDb();
  const result = await db.query<{
    id: string;
    kit_version: string;
    source_ids: unknown;
    created_at: string | Date;
  }>(
    "SELECT id, kit_version, source_ids, created_at FROM snapshots WHERE id = $1 AND org_id = $2",
    [id, orgId],
  );
  const row = result.rows[0];
  if (!row) return null;
  return RetrievalSnapshotSchema.parse({
    id: row.id,
    kitVersion: row.kit_version,
    sourceIds: asJson(row.source_ids),
    createdAt: iso(row.created_at),
  });
}

export async function appendAuditEvent(
  event: Omit<AuditEvent, "id" | "at"> & { at?: string },
): Promise<AuditEvent> {
  const db = await getDb();
  const row = AuditEventSchema.parse({
    id: createId("audit"),
    at: event.at ?? new Date().toISOString(),
    orgId: event.orgId,
    actorId: event.actorId,
    action: event.action,
    entityType: event.entityType,
    entityId: event.entityId,
    before: event.before,
    after: event.after,
  });
  await db.query(
    `INSERT INTO audit_events (
       id, org_id, actor_id, action, entity_type, entity_id, before, after, at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9)`,
    [
      row.id,
      row.orgId,
      row.actorId,
      row.action,
      row.entityType,
      row.entityId,
      JSON.stringify(row.before ?? null),
      JSON.stringify(row.after ?? null),
      row.at,
    ],
  );
  return row;
}

export async function listAuditEvents(orgId: string): Promise<AuditEvent[]> {
  const db = await getDb();
  const result = await db.query<{
    id: string;
    org_id: string;
    actor_id: string;
    action: string;
    entity_type: string;
    entity_id: string;
    before: unknown;
    after: unknown;
    at: string | Date;
  }>(
    `SELECT id, org_id, actor_id, action, entity_type, entity_id, before, after, at
     FROM audit_events
     WHERE org_id = $1
     ORDER BY seq ASC`,
    [orgId],
  );
  return result.rows.map((row) =>
    AuditEventSchema.parse({
      id: row.id,
      orgId: row.org_id,
      actorId: row.actor_id,
      action: row.action,
      entityType: row.entity_type,
      entityId: row.entity_id,
      before: asJson(row.before) ?? undefined,
      after: asJson(row.after) ?? undefined,
      at: iso(row.at),
    }),
  );
}
