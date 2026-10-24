import { DEMO_BRAND_KIT } from "@/data/seed-kit";
import {
  ContentReviewSchema,
  type BrandKit,
  type Finding,
  type ModelMeta,
} from "@/domain/schemas";
import { applyEvidenceGate } from "@/engine/evidence-gate";
import {
  openRouterComplete,
  runModelPass,
  type ChatMessage,
} from "@/engine/llm-adapter";
import { configuredFreeModel, isFreeModelId } from "@/engine/model-policy";
import { retrieveForReview } from "@/engine/retrieval";
import {
  runDeterministicReview,
  type ReviewEngineResult,
} from "@/engine/review";

export type HybridDeps = {
  /** Override the env model id. Tests use this to prove a paid id is refused. */
  model?: string;
  complete?: (messages: ChatMessage[]) => Promise<string>;
};

function sortFindings(findings: Finding[]): Finding[] {
  const severityRank = { blocker: 0, warning: 1, info: 2 } as const;
  return [...findings].sort((a, b) => {
    const severity = severityRank[a.severity] - severityRank[b.severity];
    if (severity !== 0) return severity;
    return (a.span?.start ?? 0) - (b.span?.start ?? 0);
  });
}

function overlaps(left: Finding, right: Finding): boolean {
  if (left.matchedText && right.matchedText) {
    const a = left.matchedText.toLowerCase();
    const b = right.matchedText.toLowerCase();
    if (a.includes(b) || b.includes(a)) return true;
  }
  if (left.span && right.span) {
    return left.span.start < right.span.end && right.span.start < left.span.end;
  }
  return false;
}

/**
 * Server findings win when a model verdict disagrees on the same span.
 * A model verified or contradicted verdict is dropped against any
 * overlapping deterministic disagreement, including a policy hit.
 * An abstained model finding is dropped only when it overlaps a
 * deterministic verified or contradicted fact, so it cannot sit beside
 * that fact as if the fact were still uncertain.
 */
function dropModelOverrides(
  deterministic: Finding[],
  modelFindings: Finding[],
): Finding[] {
  return modelFindings.filter((item) => {
    if (item.ruleId !== "model_pass") return true;
    return !deterministic.some((existing) => {
      if (existing.ruleId === "model_pass") return false;
      if (existing.status === item.status || !overlaps(existing, item)) return false;
      if (item.status === "verified" || item.status === "contradicted") return true;
      const factual =
        existing.status === "verified" || existing.status === "contradicted";
      return factual && (item.status === "indeterminate" || item.status === "unsupported");
    });
  });
}

function dedupe(findings: Finding[]): Finding[] {
  const seen = new Set<string>();
  const kept: Finding[] = [];
  for (const finding of findings) {
    const key = [
      finding.category,
      (finding.matchedText ?? finding.summary).toLowerCase(),
      finding.status,
    ].join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    kept.push(finding);
  }
  return kept;
}

/**
 * Deterministic checks, then lexical retrieval, then one free-model pass.
 * The model cannot set the review to approved. Citations outside the
 * retrieval snapshot are removed by the evidence gate.
 */
export async function runHybridReview(
  input: unknown,
  kit: BrandKit = DEMO_BRAND_KIT,
  deps: HybridDeps = {},
): Promise<ReviewEngineResult> {
  const base = runDeterministicReview(input, kit);
  if (!base.ok) return base;

  const citedIds = base.review.findings.flatMap(
    (finding) => finding.citationIds,
  );
  const retrieved = retrieveForReview(base.review.body, kit, citedIds);
  const deterministic = applyEvidenceGate(
    base.review.findings,
    retrieved.snapshot,
  );

  const configured = deps.model
    ? configuredFromOverride(deps.model)
    : configuredFreeModel();

  let modelFindings: Finding[] = [];
  let modelMeta: ModelMeta;

  if (!configured.ok) {
    modelMeta = {
      provider: "openrouter",
      model: "refused",
      schemaVersion: "finding_schema_v1",
      outcome: "failed",
      reason: configured.reason,
      retrievedSourceCount: retrieved.snapshot.sourceIds.length,
    };
  } else {
    const pass = await runModelPass({
      reviewId: base.review.id,
      body: base.review.body,
      intent: base.review.intent,
      passages: retrieved.passages,
      snapshot: retrieved.snapshot,
      complete: deps.complete ?? openRouterComplete,
    });
    modelFindings = dropModelOverrides(deterministic, pass.findings);
    modelMeta = {
      provider: "openrouter",
      model: configured.model,
      schemaVersion: "finding_schema_v1",
      outcome: pass.outcome,
      reason: pass.reason,
      retrievedSourceCount: retrieved.snapshot.sourceIds.length,
    };
  }

  const findings = sortFindings(dedupe([...deterministic, ...modelFindings]));
  const hasBlocker = findings.some((finding) => finding.severity === "blocker");
  const review = ContentReviewSchema.parse({
    ...base.review,
    snapshotId: retrieved.snapshot.id,
    findings,
    modelMeta,
    status: hasBlocker ? "needs_revision" : base.review.status,
  });

  return { ok: true, review, snapshot: retrieved.snapshot };
}

function configuredFromOverride(
  model: string,
): { ok: true; model: string } | { ok: false; reason: string } {
  const trimmed = model.trim();
  if (!isFreeModelId(trimmed)) {
    return {
      ok: false,
      reason:
        "LLM_MODEL must be openrouter/free or an id ending in :free. The model pass was not called.",
    };
  }
  return { ok: true, model: trimmed };
}
