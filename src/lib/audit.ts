import type { AuditEvent } from "@/domain/schemas";
import { createId } from "@/engine/ids";

const events: AuditEvent[] = [];

export function appendAuditEvent(
  event: Omit<AuditEvent, "id" | "at"> & { at?: string },
): AuditEvent {
  const row: AuditEvent = {
    id: createId("audit"),
    at: event.at ?? new Date().toISOString(),
    orgId: event.orgId,
    actorId: event.actorId,
    action: event.action,
    entityType: event.entityType,
    entityId: event.entityId,
    before: event.before,
    after: event.after,
  };
  events.push(row);
  return row;
}

export function listAuditEvents(orgId: string): AuditEvent[] {
  return events.filter((e) => e.orgId === orgId);
}

/** Test helper — not for production UI. */
export function __resetAuditForTests(): void {
  events.length = 0;
}
