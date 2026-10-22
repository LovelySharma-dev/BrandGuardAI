import { z } from "zod";

import {
  ClaimStatusSchema,
  FindingCategorySchema,
  ReviewIntentSchema,
} from "@/domain/schemas";

/**
 * Contract for files under fixtures/reviews/*.json.
 * citationIds, when present, must match the finding exactly.
 * An omitted citationIds field does not constrain citations.
 */
export const ExpectedFindingSchema = z.object({
  status: ClaimStatusSchema,
  category: FindingCategorySchema.optional(),
  ruleId: z.string().min(1).optional(),
  matchedText: z.string().min(1).optional(),
  citationIds: z.array(z.string().min(1)).optional(),
});

export const ForgedCitationProbeSchema = z.object({
  citationIds: z.array(z.string().min(1)).min(1),
  claimedStatus: z.enum(["verified", "contradicted"]),
});

export const LabelledReviewFixtureSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).default("Untitled draft"),
  body: z.string().trim().min(1),
  intent: ReviewIntentSchema.optional(),
  kitVersion: z.string().min(1),
  notes: z.string().optional(),
  expected: z.array(ExpectedFindingSchema).default([]),
  expectNoBlockers: z.boolean().optional(),
  forgedCitationProbe: ForgedCitationProbeSchema.optional(),
});

export type ExpectedFinding = z.infer<typeof ExpectedFindingSchema>;
export type ForgedCitationProbe = z.infer<typeof ForgedCitationProbeSchema>;
export type LabelledReviewFixture = z.infer<typeof LabelledReviewFixtureSchema>;
