import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getUserById, userIdForSessionToken } from "@/db/repository";
import type { StoredUser } from "@/db/repository";

export const SESSION_COOKIE = "bg_session";

export type SessionUser = Omit<StoredUser, "passwordHash">;

let identityOverride: { userId: string } | null | undefined;

/** `undefined` reads the cookie. Tests pass a user id, never a role. */
export function __setSessionIdentityForTests(
  identity: { userId: string } | null,
): void {
  identityOverride = identity;
}

export function __clearSessionOverrideForTests(): void {
  identityOverride = undefined;
}

export async function getSessionIdentity(): Promise<{ userId: string } | null> {
  if (identityOverride !== undefined) return identityOverride;
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const userId = await userIdForSessionToken(token);
  return userId ? { userId } : null;
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const identity = await getSessionIdentity();
  if (!identity) return null;
  const user = await getUserById(identity.userId);
  if (!user) return null;
  return {
    id: user.id,
    orgId: user.orgId,
    orgName: user.orgName,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
