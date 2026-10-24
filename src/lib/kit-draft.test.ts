import { describe, expect, it } from "vitest";

import { DEMO_BRAND_KIT } from "@/data/seed-kit";
import { FOUNDING_FACT_ID } from "@/db/brand-kits";
import { applyKitDraftEdit, type KitDraftEdit } from "@/lib/kit-draft";

function editFrom(kit = DEMO_BRAND_KIT): KitDraftEdit {
  return {
    facts: kit.facts.map((fact) => ({
      id: fact.id,
      statement: fact.statement,
      keywords: fact.keywords,
      sourceId: fact.sourceId,
      contradictingPhrases: fact.contradictingPhrases,
    })),
    termRules: kit.termRules.map((rule) => ({
      id: rule.id,
      type: rule.type,
      terms: rule.terms,
      preferredReplacement: rule.preferredReplacement,
      severity: rule.severity,
      message: rule.message,
      enabled: rule.enabled,
    })),
    claimPolicies: kit.claimPolicies.map((policy) => ({
      id: policy.id,
      pattern: policy.pattern,
      severity: policy.severity,
      message: policy.message,
      enabled: policy.enabled,
    })),
  };
}

describe("applyKitDraftEdit", () => {
  it("keeps sources and color tokens while updating a term on the draft", () => {
    const edit = editFrom();
    const rule = edit.termRules.find((item) => item.id === "term_synergy");
    expect(rule).toBeTruthy();
    if (!rule) return;
    rule.message = "Prefer a concrete word.";
    rule.enabled = false;

    const result = applyKitDraftEdit(DEMO_BRAND_KIT, edit);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.kit.version).toBe(DEMO_BRAND_KIT.version);
    expect(result.kit.sources).toEqual(DEMO_BRAND_KIT.sources);
    expect(result.kit.colorTokens).toEqual(DEMO_BRAND_KIT.colorTokens);
    expect(result.kit.termRules.find((item) => item.id === "term_synergy")).toMatchObject({
      message: "Prefer a concrete word.",
      enabled: false,
    });
  });

  it("rejects a missing founding fact and a source the kit does not have", () => {
    const edit = editFrom();
    const missing = applyKitDraftEdit(DEMO_BRAND_KIT, {
      ...edit,
      facts: edit.facts.filter((fact) => fact.id !== FOUNDING_FACT_ID),
    });
    expect(missing).toEqual({
      ok: false,
      error: "The founding fact has to stay in the draft.",
    });

    const forged = applyKitDraftEdit(DEMO_BRAND_KIT, {
      ...edit,
      facts: edit.facts.map((fact) =>
        fact.id === FOUNDING_FACT_ID ? { ...fact, sourceId: "src_missing" } : fact,
      ),
    });
    expect(forged.ok).toBe(false);
    if (forged.ok) return;
    expect(forged.error).toMatch(/src_missing/);
  });

  it("assigns an id to a new claim policy and keeps evidence required", () => {
    const edit = editFrom();
    const result = applyKitDraftEdit(DEMO_BRAND_KIT, {
      ...edit,
      claimPolicies: [
        ...edit.claimPolicies,
        {
          id: "new-claim-launch",
          pattern: "risk free",
          severity: "warning" as const,
          message: "Risk-free claims need an approved source.",
          enabled: true,
        },
      ],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const added = result.kit.claimPolicies.find((policy) => policy.pattern === "risk free");
    expect(added?.id.startsWith("claim_")).toBe(true);
    expect(added?.requiresEvidence).toBe(true);
    expect(added?.id).not.toBe("new-claim-launch");
  });
});
