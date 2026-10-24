import { z } from "zod";

export const ClaimStatusSchema = z.enum([
  "verified",
  "contradicted",
  "unsupported",
  "indeterminate",
  "policy_hit",
  "suggestion_only",
]);

export const SeveritySchema = z.enum(["blocker", "warning", "info"]);

export const FindingCategorySchema = z.enum([
  "terminology",
  "promotional_claim",
  "factual_claim",
  "suggestion",
]);

export const TextSpanSchema = z.object({
  start: z.number().int().nonnegative(),
  end: z.number().int().nonnegative(),
});

export const SuggestionSchema = z.object({
  id: z.string().min(1),
  findingId: z.string().min(1),
  proposedText: z.string().min(1),
  rationale: z.string().min(1),
  accepted: z.boolean().nullable().default(null),
});

export const FindingSchema = z.object({
  id: z.string().min(1),
  reviewId: z.string().min(1),
  category: FindingCategorySchema,
  span: TextSpanSchema.nullable(),
  status: ClaimStatusSchema,
  severity: SeveritySchema,
  summary: z.string().min(1),
  rationale: z.string().min(1),
  citationIds: z.array(z.string()),
  evidenceGapReason: z.string().optional(),
  ruleId: z.string().optional(),
  matchedText: z.string().optional(),
  suggestion: SuggestionSchema.optional(),
});

export const EvidenceSourceSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  excerpt: z.string().min(1),
  uri: z.string().optional(),
});

export const SourceTypeSchema = z.enum([
  "fact",
  "terminology",
  "policy",
  "upload",
  "other",
]);

export const SnapshotPassageSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  excerpt: z.string().min(1),
  sourceType: SourceTypeSchema,
  /** Published kit version this excerpt was copied from. */
  kitVersion: z.string().min(1),
});

export const ApprovedFactSchema = z.object({
  id: z.string().min(1),
  statement: z.string().min(1),
  keywords: z.array(z.string().min(1)).min(1),
  sourceId: z.string().min(1),
  /** Phrases that contradict this fact when asserted in copy. */
  contradictingPhrases: z.array(z.string().min(1)).default([]),
});

export const TermRuleSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["banned", "preferred"]),
  terms: z.array(z.string().min(1)).min(1),
  preferredReplacement: z.string().optional(),
  severity: SeveritySchema,
  message: z.string().min(1),
  enabled: z.boolean().default(true),
});

export const ClaimPolicySchema = z.object({
  id: z.string().min(1),
  /** Case-insensitive phrase or simple pattern (literal substring). */
  pattern: z.string().min(1),
  severity: SeveritySchema,
  message: z.string().min(1),
  enabled: z.boolean().default(true),
  /**
   * Absolute promotional claims are flagged as unsupported unless an approved
   * fact can verify them. Keyword hits alone never become `verified`.
   */
  requiresEvidence: z.boolean().default(true),
});

export const ColorTokenSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  role: z.enum(["background", "foreground", "accent"]),
});

export const BrandKitSchema = z.object({
  id: z.string().min(1),
  orgId: z.string().min(1),
  name: z.string().min(1),
  version: z.string().min(1),
  sources: z.array(EvidenceSourceSchema),
  facts: z.array(ApprovedFactSchema),
  termRules: z.array(TermRuleSchema),
  claimPolicies: z.array(ClaimPolicySchema),
  colorTokens: z.array(ColorTokenSchema).default([]),
});

export const ReviewIntentSchema = z.object({
  goal: z.string().default(""),
  audience: z.string().default(""),
  channel: z.string().default(""),
  mustKeep: z.array(z.string()).default([]),
});

export const ReviewInputSchema = z.object({
  body: z.string().trim().min(1, "Content is required"),
  title: z.string().trim().default("Untitled draft"),
  intent: ReviewIntentSchema.default({
    goal: "",
    audience: "",
    channel: "",
    mustKeep: [],
  }),
  orgId: z.string().min(1).default("org_demo"),
  kitVersion: z.string().min(1).optional(),
});

export const RetrievalSnapshotSchema = z.object({
  id: z.string().min(1),
  kitVersion: z.string().min(1),
  sourceIds: z.array(z.string()),
  createdAt: z.string(),
  /**
   * Excerpts copied at retrieval time. Older snapshots omit this;
   * the evidence gate then checks ids only.
   */
  passages: z.array(SnapshotPassageSchema).optional(),
});

export const ReviewDecisionSchema = z.object({
  action: z.enum(["submit", "approve", "reject", "request_changes"]),
  reason: z.string().max(500).optional(),
  actorId: z.string().min(1),
  at: z.string(),
});

export const ReviewStatusSchema = z.enum([
  "draft",
  "in_review",
  "needs_revision",
  "pending_approval",
  "approved",
  "rejected",
  "engine_error",
]);

export const FINDING_SCHEMA_VERSION = "finding_schema_v1" as const;

export const ModelMetaSchema = z.object({
  provider: z.string().min(1),
  model: z.string().min(1),
  schemaVersion: z.literal(FINDING_SCHEMA_VERSION),
  outcome: z.enum(["completed", "skipped", "failed"]),
  reason: z.string().optional(),
  retrievedSourceCount: z.number().int().nonnegative(),
});

export const ContentReviewSchema = z.object({
  id: z.string().min(1),
  orgId: z.string().min(1),
  title: z.string(),
  body: z.string(),
  intent: ReviewIntentSchema,
  status: ReviewStatusSchema,
  kitVersion: z.string(),
  snapshotId: z.string().nullable(),
  findings: z.array(FindingSchema),
  revisions: z.array(
    z.object({
      id: z.string(),
      body: z.string(),
      createdAt: z.string(),
      note: z.string().optional(),
    }),
  ),
  createdAt: z.string(),
  updatedAt: z.string(),
  errorMessage: z.string().optional(),
  modelMeta: ModelMetaSchema.optional(),
  /** User who submitted the review. Absent on rows created before this field. */
  createdBy: z.string().min(1).optional(),
  decision: ReviewDecisionSchema.optional(),
});

export const AuditEventSchema = z.object({
  id: z.string().min(1),
  orgId: z.string().min(1),
  actorId: z.string().min(1),
  action: z.string().min(1),
  entityType: z.string().min(1),
  entityId: z.string().min(1),
  before: z.unknown().optional(),
  after: z.unknown().optional(),
  at: z.string(),
});

export type ClaimStatus = z.infer<typeof ClaimStatusSchema>;
export type Severity = z.infer<typeof SeveritySchema>;
export type FindingCategory = z.infer<typeof FindingCategorySchema>;
export type Finding = z.infer<typeof FindingSchema>;
export type Suggestion = z.infer<typeof SuggestionSchema>;
export type EvidenceSource = z.infer<typeof EvidenceSourceSchema>;
export type ApprovedFact = z.infer<typeof ApprovedFactSchema>;
export type TermRule = z.infer<typeof TermRuleSchema>;
export type ClaimPolicy = z.infer<typeof ClaimPolicySchema>;
export type BrandKit = z.infer<typeof BrandKitSchema>;
export type ReviewInput = z.infer<typeof ReviewInputSchema>;
export type SourceType = z.infer<typeof SourceTypeSchema>;
export type SnapshotPassage = z.infer<typeof SnapshotPassageSchema>;
export type RetrievalSnapshot = z.infer<typeof RetrievalSnapshotSchema>;
export type ReviewDecision = z.infer<typeof ReviewDecisionSchema>;
export type ModelMeta = z.infer<typeof ModelMetaSchema>;
export type ContentReview = z.infer<typeof ContentReviewSchema>;
export type ReviewStatus = z.infer<typeof ReviewStatusSchema>;
export type AuditEvent = z.infer<typeof AuditEventSchema>;
