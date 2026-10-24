import { appendAuditEvent, getUserById } from "@/db/repository";
import { getDb } from "@/db/client";
import { ReviewRoleSchema, type ReviewRole } from "@/domain/workflow";
import { getSessionIdentity } from "@/lib/session";

export type MembershipResult =
  | { ok: true; role: ReviewRole }
  | { ok: false; error: string };

/**
 * The only application path that changes a membership role.
 * Authors and reviewers cannot grant roles. Nobody can change their own role.
 * The target must belong to the actor's organisation.
 */
export async function changeMemberRole(
  targetUserId: string,
  role: unknown,
): Promise<MembershipResult> {
  const parsed = ReviewRoleSchema.safeParse(role);
  if (!parsed.success) return { ok: false, error: "Unknown role" };

  const identity = await getSessionIdentity();
  if (!identity) return { ok: false, error: "Sign in required" };

  const actor = await getUserById(identity.userId);
  if (!actor) return { ok: false, error: "Unknown actor" };
  if (actor.role !== "admin") {
    return { ok: false, error: "Only an admin can change membership roles" };
  }
  if (actor.id === targetUserId) {
    return { ok: false, error: "You cannot change your own role" };
  }

  const target = await getUserById(targetUserId);
  if (!target || target.orgId !== actor.orgId) {
    return { ok: false, error: "Member not found" };
  }

  const db = await getDb();
  const updated = await db.query<{ id: string }>(
    `UPDATE users SET role = $1
     WHERE id = $2 AND org_id = $3 AND id <> $4
     RETURNING id`,
    [parsed.data, target.id, actor.orgId, actor.id],
  );
  if (updated.rows.length !== 1) {
    return { ok: false, error: "Member not found" };
  }

  await appendAuditEvent({
    orgId: actor.orgId,
    actorId: actor.id,
    action: "member.role_changed",
    entityType: "User",
    entityId: target.id,
    before: { role: target.role },
    after: { role: parsed.data },
  });
  return { ok: true, role: parsed.data };
}
