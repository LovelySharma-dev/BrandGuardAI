import {
  FOUNDING_FACT_ID,
  bumpPatchVersion,
  getDraftBrandKit,
  getPublishedBrandKit,
  publishDraftBrandKit,
  upsertDraftBrandKit,
} from "@/db/brand-kits";
import { BrandKitSchema, type BrandKit } from "@/domain/schemas";
import { createId } from "@/engine/ids";
import { applyKitDraftEdit } from "@/lib/kit-draft";
import { getCurrentUser } from "@/lib/session";
import { readPdfText, statementsFromText, validatePdfUpload } from "@/engine/pdf-text";
import { consumeRateLimit, pdfInspectLimit } from "@/lib/rate-limit";

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
  { ok: true; orgId: string; userId: string } | { ok: false; error: string }
> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sign in required" };
  if (user.role !== "admin") {
    return { ok: false, error: "Only an admin can edit the brand kit" };
  }
  return { ok: true, orgId: user.orgId, userId: user.id };
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

export async function saveBrandKitDraft(input: unknown): Promise<KitMutationResult> {
  const actor = await requireAdmin();
  if (!actor.ok) return actor;

  const published = await getPublishedBrandKit(actor.orgId);
  if (!published) return { ok: false, error: "No published brand kit" };
  const existingDraft = await getDraftBrandKit(actor.orgId);
  const base: BrandKit = existingDraft ?? {
    ...structuredClone(published),
    version: bumpPatchVersion(published.version),
  };
  const edited = applyKitDraftEdit(base, input);
  if (!edited.ok) return edited;
  await upsertDraftBrandKit(edited.kit);
  return { ok: true, kit: edited.kit };
}

export async function publishBrandKitDraft(): Promise<KitMutationResult> {
  const actor = await requireAdmin();
  if (!actor.ok) return actor;

  const published = await publishDraftBrandKit(actor.orgId);
  if (!published) return { ok: false, error: "No draft to publish" };
  return { ok: true, kit: published };
}

export async function inspectBrandPdf(
  fileName: string,
  bytes: Uint8Array,
): Promise<{ ok: true; statements: string[] } | { ok: false; error: string }> {
  const actor = await requireAdmin();
  if (!actor.ok) return actor;
  const limited = await consumeRateLimit({
    bucket: `pdf:${actor.userId}`,
    limit: pdfInspectLimit(),
  });
  if (!limited.ok) return limited;
  const check = validatePdfUpload(bytes, fileName);
  if (!check.ok) return check;

  const extracted = await readPdfText(bytes);
  if (!extracted.ok) return extracted;
  const statements = statementsFromText(extracted.text);
  if (statements.length === 0) {
    return { ok: false, error: "The PDF has no extractable sentences." };
  }
  return { ok: true, statements };
}

export async function addPdfStatementsToDraft(
  statements: string[],
): Promise<KitMutationResult> {
  const actor = await requireAdmin();
  if (!actor.ok) return actor;
  const limited = await consumeRateLimit({
    bucket: `pdf:${actor.userId}`,
    limit: pdfInspectLimit(),
  });
  if (!limited.ok) return limited;

  const cleaned = [
    ...new Set(
      statements
        .map((statement) => statement.trim())
        .filter((statement) => statement.length >= 20 && statement.length <= 280),
    ),
  ].slice(0, 8);
  if (cleaned.length === 0) {
    return { ok: false, error: "Choose at least one sentence from the PDF." };
  }

  const published = await getPublishedBrandKit(actor.orgId);
  if (!published) return { ok: false, error: "No published brand kit" };
  const existingDraft = await getDraftBrandKit(actor.orgId);
  const base: BrandKit = existingDraft ?? {
    ...structuredClone(published),
    version: bumpPatchVersion(published.version),
  };
  const sourceId = "src_pdf_import";
  const known = new Set(base.facts.map((fact) => fact.statement.toLowerCase()));
  const facts = cleaned
    .filter((statement) => !known.has(statement.toLowerCase()))
    .map((statement) => ({
      id: createId("fact"),
      statement,
      keywords: statement.split(/\s+/).filter(Boolean).slice(0, 4),
      sourceId,
      contradictingPhrases: [] as string[],
    }));
  if (facts.length === 0) {
    return { ok: false, error: "Those sentences are already in the draft kit." };
  }
  const sources = base.sources.some((source) => source.id === sourceId)
    ? base.sources
    : [
        ...base.sources,
        {
          id: sourceId,
          title: "Uploaded brand PDF",
          excerpt:
            "Sentences an admin accepted from an uploaded PDF. The file itself is not stored, and the draft is not approved until it is published.",
        },
      ];
  const draft = BrandKitSchema.parse({
    ...base,
    sources,
    facts: [...base.facts, ...facts],
  });
  await upsertDraftBrandKit(draft);
  return { ok: true, kit: draft };
}
