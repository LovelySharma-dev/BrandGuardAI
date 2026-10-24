import type { BrandKit } from "@/domain/schemas";

/**
 * Demo brand kit for Inkloom-style product marketing.
 * Published version is immutable for reviews; edits would bump version later.
 */
export const DEMO_BRAND_KIT: BrandKit = {
  id: "kit_demo",
  orgId: "org_demo",
  name: "Inkloom Demo Brand Kit",
  version: "1.0.0",
  sources: [
    {
      id: "src_fact_founded",
      title: "Company fact sheet — founding",
      excerpt:
        "Inkloom was founded in 2019. Do not claim earlier founding dates.",
      uri: "internal://brand-kit/facts/founding",
    },
    {
      id: "src_fact_customers",
      title: "Approved customer metrics",
      excerpt:
        "Approved phrasing: “Trusted by more than 2,000 design teams.” Exact figure must remain “more than 2,000” until the next published kit.",
      uri: "internal://brand-kit/facts/customers",
    },
    {
      id: "src_term_guide",
      title: "Terminology guide v1",
      excerpt:
        "Use “brand kit”, not “brand bible”. Prefer “review”, not “AI audit”. Never say “guaranteed approval”.",
      uri: "internal://brand-kit/terms",
    },
    {
      id: "src_claim_policy",
      title: "Promotional claim policy",
      excerpt:
        "Absolute superiority claims (“best”, “#1”, “never fails”) require approved evidence. Absence of evidence is not proof the claim is false.",
      uri: "internal://brand-kit/claims",
    },
  ],
  facts: [
    {
      id: "fact_founded_2019",
      statement: "Inkloom was founded in 2019.",
      keywords: ["founded", "founded in", "established"],
      sourceId: "src_fact_founded",
      contradictingPhrases: [
        "founded in 2015",
        "founded in 2016",
        "founded in 2017",
        "founded in 2018",
        "founded in 2020",
        "since 2015",
        "since 2016",
        "since 2017",
        "since 2018",
        "est. 2015",
      ],
    },
    {
      id: "fact_customers_2000",
      statement: "Trusted by more than 2,000 design teams.",
      keywords: ["2,000", "2000", "design teams", "trusted by"],
      sourceId: "src_fact_customers",
      contradictingPhrases: [
        "10,000 design teams",
        "10000 design teams",
        "million customers",
        "millions of customers",
        "every design team",
      ],
    },
  ],
  termRules: [
    {
      id: "term_brand_bible",
      type: "banned",
      terms: ["brand bible", "brandbible"],
      preferredReplacement: "brand kit",
      severity: "warning",
      message: "Use “brand kit” instead of “brand bible”.",
      enabled: true,
    },
    {
      id: "term_ai_audit",
      type: "banned",
      terms: ["AI audit", "ai audit"],
      preferredReplacement: "content review",
      severity: "warning",
      message: "Prefer “content review” over “AI audit”.",
      enabled: true,
    },
    {
      id: "term_guaranteed_approval",
      type: "banned",
      terms: ["guaranteed approval", "auto-approve", "auto approve"],
      preferredReplacement: "human approval required",
      severity: "blocker",
      message: "Never claim guaranteed or automatic approval.",
      enabled: true,
    },
    {
      id: "term_synergy",
      type: "banned",
      terms: ["synergy", "synergies"],
      preferredReplacement: "collaboration",
      severity: "info",
      message: "Avoid vague buzzwords; prefer concrete language.",
      enabled: true,
    },
  ],
  claimPolicies: [
    {
      id: "claim_best",
      pattern: "best in the world",
      severity: "blocker",
      message:
        "Absolute superiority claim requires approved evidence. No matching fact was found in the kit.",
      enabled: true,
      requiresEvidence: true,
    },
    {
      id: "claim_number_one",
      pattern: "#1",
      severity: "blocker",
      message:
        "Ranked “#1” claims are blocked without an approved supporting fact.",
      enabled: true,
      requiresEvidence: true,
    },
    {
      id: "claim_never_fails",
      pattern: "never fails",
      severity: "blocker",
      message: "Absolute reliability claims need approved evidence.",
      enabled: true,
      requiresEvidence: true,
    },
    {
      id: "claim_guaranteed_results",
      pattern: "guaranteed results",
      severity: "blocker",
      message: "Outcome guarantees are not permitted without approved evidence.",
      enabled: true,
      requiresEvidence: true,
    },
    {
      id: "claim_100_percent",
      pattern: "100% accurate",
      severity: "warning",
      message: "Absolute accuracy claims require approved evidence.",
      enabled: true,
      requiresEvidence: true,
    },
  ],
  colorTokens: [
    { id: "color_background", name: "Stone", hex: "#F7F5F2", role: "background" },
    { id: "color_foreground", name: "Ink", hex: "#1A1814", role: "foreground" },
    { id: "color_accent", name: "Bronze", hex: "#9A5B12", role: "accent" },
  ],
};

export const DEMO_ORG = {
  id: "org_demo",
  name: "Inkloom Demo Org",
} as const;
