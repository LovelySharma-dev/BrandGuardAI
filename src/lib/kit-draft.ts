import { z } from "zod";

import { FOUNDING_FACT_ID } from "@/db/brand-kits";
import { BrandKitSchema, type BrandKit } from "@/domain/schemas";
import { createId } from "@/engine/ids";

const SeveritySchema = z.enum(["blocker", "warning", "info"]);

const FactEditSchema = z.object({
  id: z.string().trim().min(1).max(80),
  statement: z.string().trim().min(1).max(280),
  keywords: z.array(z.string().trim().min(1).max(40)).min(1).max(8),
  sourceId: z.string().trim().min(1),
  contradictingPhrases: z.array(z.string().trim().min(1).max(80)).max(12),
});

const TermEditSchema = z.object({
  id: z.string().trim().min(1).max(80),
  type: z.enum(["banned", "preferred"]),
  terms: z.array(z.string().trim().min(1).max(60)).min(1).max(8),
  preferredReplacement: z.string().trim().max(80).optional(),
  severity: SeveritySchema,
  message: z.string().trim().min(1).max(240),
  enabled: z.boolean(),
});

const PolicyEditSchema = z.object({
  id: z.string().trim().min(1).max(80),
  pattern: z.string().trim().min(1).max(80),
  severity: SeveritySchema,
  message: z.string().trim().min(1).max(240),
  enabled: z.boolean(),
});

export const KitDraftEditSchema = z.object({
  facts: z.array(FactEditSchema).min(1).max(24),
  termRules: z.array(TermEditSchema).max(24),
  claimPolicies: z.array(PolicyEditSchema).max(24),
});

export type KitDraftEdit = z.infer<typeof KitDraftEditSchema>;

function issueText(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.length > 0 ? `${issue.path.join(".")}: ` : "";
      return `${path}${issue.message}`;
    })
    .join("; ");
}

function resolveId(
  id: string,
  existing: Set<string>,
  prefix: "fact" | "term" | "claim",
): { ok: true; id: string } | { ok: false; error: string } {
  if (existing.has(id)) return { ok: true, id };
  if (id.startsWith("new-")) return { ok: true, id: createId(prefix) };
  return { ok: false, error: `Unknown kit id ${id}.` };
}

/**
 * Builds the next draft document from an admin edit.
 * Sources, color tokens, and the version on `base` stay as they are.
 * The founding fact cannot be removed. A fact must cite a source already on the kit.
 */
export function applyKitDraftEdit(
  base: BrandKit,
  input: unknown,
): { ok: true; kit: BrandKit } | { ok: false; error: string } {
  const parsed = KitDraftEditSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: issueText(parsed.error) };
  const edit = parsed.data;

  if (!edit.facts.some((fact) => fact.id === FOUNDING_FACT_ID)) {
    return { ok: false, error: "The founding fact has to stay in the draft." };
  }

  const sourceIds = new Set(base.sources.map((source) => source.id));
  const factIds = new Set(base.facts.map((fact) => fact.id));
  const termIds = new Set(base.termRules.map((rule) => rule.id));
  const policyIds = new Set(base.claimPolicies.map((policy) => policy.id));
  const seen = new Set<string>();

  const facts = [];
  for (const fact of edit.facts) {
    if (!sourceIds.has(fact.sourceId)) {
      return {
        ok: false,
        error: `Fact cites ${fact.sourceId}, which is not a source on this kit.`,
      };
    }
    const id = resolveId(fact.id, factIds, "fact");
    if (!id.ok) return id;
    if (seen.has(id.id)) return { ok: false, error: "Each fact needs its own id." };
    seen.add(id.id);
    facts.push({ ...fact, id: id.id });
  }

  const termRules = [];
  for (const rule of edit.termRules) {
    const id = resolveId(rule.id, termIds, "term");
    if (!id.ok) return id;
    if (seen.has(id.id)) return { ok: false, error: "Each term rule needs its own id." };
    seen.add(id.id);
    const replacement = rule.preferredReplacement?.trim();
    termRules.push({
      ...rule,
      id: id.id,
      preferredReplacement: replacement ? replacement : undefined,
    });
  }

  const previousPolicy = new Map(base.claimPolicies.map((policy) => [policy.id, policy]));
  const claimPolicies = [];
  for (const policy of edit.claimPolicies) {
    const id = resolveId(policy.id, policyIds, "claim");
    if (!id.ok) return id;
    if (seen.has(id.id)) {
      return { ok: false, error: "Each claim policy needs its own id." };
    }
    seen.add(id.id);
    claimPolicies.push({
      ...policy,
      id: id.id,
      requiresEvidence: previousPolicy.get(policy.id)?.requiresEvidence ?? true,
    });
  }

  const draft = BrandKitSchema.safeParse({
    ...base,
    facts,
    termRules,
    claimPolicies,
  });
  if (!draft.success) return { ok: false, error: issueText(draft.error) };
  return { ok: true, kit: draft.data };
}
