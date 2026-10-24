import type { BrandKit } from "@/domain/schemas";

/** Fictional kit for the public demo. It is not the Inkloom workspace kit. */
export const NORTHLINE_KIT: BrandKit = {
  id: "kit_northline_demo",
  orgId: "org_page_demo",
  name: "Northline Daily Care",
  version: "1.0.0",
  sources: [
    {
      id: "src_term_guide",
      title: "Northline terminology note",
      excerpt:
        "Use “daily care”. Do not use “miracle cure”. This note is fictional demo content.",
    },
    {
      id: "src_fact_launch",
      title: "Northline launch note",
      excerpt:
        "Northline launched in 2021. Do not claim an earlier launch. This note is fictional demo content.",
    },
    {
      id: "src_claim_policy",
      title: "Northline claim note",
      excerpt:
        "“Clinically proven” needs an approved study before it can be verified. Missing that study is a gap, not proof the sentence is false. This note is fictional demo content.",
    },
  ],
  facts: [
    {
      id: "fact_launch_2021",
      statement: "Northline launched in 2021.",
      keywords: ["Northline", "launched", "2021"],
      sourceId: "src_fact_launch",
      contradictingPhrases: ["Northline launched in 2014."],
    },
  ],
  termRules: [
    {
      id: "term_miracle",
      type: "banned",
      terms: ["miracle cure"],
      preferredReplacement: "daily care",
      severity: "warning",
      message: "Use “daily care” instead of “miracle cure”.",
      enabled: true,
    },
  ],
  claimPolicies: [
    {
      id: "claim_clinically",
      pattern: "clinically proven",
      severity: "blocker",
      message: "“Clinically proven” needs an approved study. None is in this kit.",
      enabled: true,
      requiresEvidence: true,
    },
  ],
  colorTokens: [],
};

export const NORTHLINE_DRAFT = [
  "Meet the next generation of everyday care.",
  "Northline is a clinically proven miracle cure.",
  "Northline launched in 2014.",
  "Northline launched in 2021.",
].join(" ");

export const DEMO_LABEL =
  "Interactive demo. Northline is a fictional brand. This pass uses the deterministic review engine. It does not call a model, save a review, or approve the draft.";
