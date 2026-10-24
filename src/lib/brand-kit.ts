import {
  FOUNDING_FACT_ID,
  bumpPatchVersion,
  getDraftBrandKit,
  getPublishedBrandKit,
  publishDraftBrandKit,
  upsertDraftBrandKit,
} from "@/db/brand-kits";
import { BrandKitSchema, type BrandKit } from "@/domain/schemas";
import { getCurrentUser } from "@/lib/session";

export type KitMutationResult =
  | { ok: true; kit: BrandKit }
  | { ok: false; error: string };

function withFoundingStatement(kit: BrandKit, statement: string): BrandKit {
  return BrandKitSchema.parse({
    ...kit,
    facts: kit.facts.map((fact) =>
      fact.id === FOUNDING_FACT_ID ? { ...fact, statement } : fact,
    ),
  });
}

async function requireAdmin(): Promise<
  { ok: true; orgId: string } | { ok: false; error: string }
> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sign in required" };
  if (user.role !== "admin") {
    return { ok: false, error: "Only an admin can edit the brand kit" };
  }
  return { ok: true, orgId: user.orgId };
}

/**
 * Writes the next patch version as a draft. The published row is not updated.
 * Reviews keep the published version they already stored.
 */
export async function saveFoundingStatementDraft(
  statement: string,
): Promise<KitMutationResult> {
  const actor = await requireAdmin();
  if (!actor.ok) return actor;

  const trimmed = statement.trim();
  if (!trimmed) return { ok: false, error: "Statement is required" };

  const published = await getPublishedBrandKit(actor.orgId);
  if (!published) return { ok: false, error: "No published brand kit" };

  const existingDraft = await getDraftBrandKit(actor.orgId);
  const base: BrandKit = existingDraft ?? {
    ...structuredClone(published),
    version: bumpPatchVersion(published.version),
  };
  const draft = withFoundingStatement(base, trimmed);
  await upsertDraftBrandKit(draft);
  return { ok: true, kit: draft };
}

export async function publishBrandKitDraft(): Promise<KitMutationResult> {
  const actor = await requireAdmin();
  if (!actor.ok) return actor;

  const published = await publishDraftBrandKit(actor.orgId);
  if (!published) return { ok: false, error: "No draft to publish" };
  return { ok: true, kit: published };
}
