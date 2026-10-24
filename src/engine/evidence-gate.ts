import type { Finding, RetrievalSnapshot, SnapshotPassage } from "@/domain/schemas";
import { FindingSchema } from "@/domain/schemas";
import { deniesAt } from "@/engine/local-negation";

/**
 * Fail closed.
 * Citation ids must belong to this review's retrieval snapshot.
 * Unknown ids are ignored. A verified or contradicted finding with none
 * left becomes indeterminate.
 * A model verified or contradicted verdict also needs a verbatim claim
 * in the cited excerpt, with the same or opposite local polarity.
 * A shared word, a bare number, or a paraphrase is not enough.
 * That uncertainty becomes indeterminate. It is not a contradiction.
 */
export function applyEvidenceGate(
  findings: Finding[],
  snapshot: RetrievalSnapshot,
): Finding[] {
  const allowed = new Set(snapshot.sourceIds);
  const passages = new Map(
    (snapshot.passages ?? []).map((passage) => [passage.id, passage]),
  );

  return findings.map((raw) => {
    const finding = FindingSchema.parse(raw);
    const illegal = finding.citationIds.filter((id) => !allowed.has(id));
    let citationIds = finding.citationIds.filter((id) => allowed.has(id));
    let status = finding.status;
    let rationale = finding.rationale;
    let evidenceGapReason = finding.evidenceGapReason;

    if (illegal.length > 0) {
      rationale = `${rationale} Ignored citation ids that are not in this review's retrieval snapshot: ${illegal.join(", ")}.`;
    }

    if (
      finding.ruleId === "model_pass" &&
      (status === "verified" || status === "contradicted") &&
      snapshot.passages
    ) {
      const unsupported = citationIds.filter(
        (id) => !passageSupportsClaim(passages.get(id), finding),
      );
      if (unsupported.length > 0) {
        citationIds = citationIds.filter((id) => !unsupported.includes(id));
        rationale = `${rationale} Ignored retrieved sources whose excerpt does not establish the claim: ${unsupported.join(", ")}.`;
      }
    }

    if (
      (status === "verified" || status === "contradicted") &&
      citationIds.length === 0
    ) {
      status = "indeterminate";
      evidenceGapReason = illegal.length
        ? `Dropped citations that were not retrieved for this review: ${illegal.join(", ")}.`
        : (evidenceGapReason ??
          "No cited excerpt from this review's retrieval snapshot establishes that status.");
    }

    if (
      (status === "unsupported" ||
        status === "indeterminate" ||
        status === "suggestion_only") &&
      citationIds.length > 0
    ) {
      citationIds = [];
      evidenceGapReason =
        evidenceGapReason ??
        "Citations cleared: this status does not assert supporting proof.";
    }

    if (
      status === finding.status &&
      citationIds.join("|") === finding.citationIds.join("|") &&
      rationale === finding.rationale &&
      evidenceGapReason === finding.evidenceGapReason
    ) {
      return finding;
    }

    return FindingSchema.parse({
      ...finding,
      status,
      severity:
        status === "indeterminate" && finding.severity === "info"
          ? "warning"
          : finding.severity,
      citationIds,
      rationale,
      evidenceGapReason,
    });
  });
}

function claimText(finding: Finding): string {
  return (finding.matchedText ?? "").trim();
}

const VERBATIM_MIN = 12;

/**
 * Lexical containment is not proof the claim is true.
 * Verified needs the verbatim claim, matching numbers, and matching polarity.
 * Contradicted needs that same verbatim claim and a local negation in the excerpt.
 * Anything else, including a relevant paraphrase, returns false so the gate can abstain.
 */
export function passageSupportsClaim(
  passage: SnapshotPassage | undefined,
  finding: Finding,
): boolean {
  if (!passage) return false;
  if (finding.status !== "verified" && finding.status !== "contradicted") return false;
  const claim = claimText(finding);
  if (claim.length < VERBATIM_MIN) return false;
  if (/(?:\b(?:not|never|no|without)\b|n't)/i.test(claim)) return false;
  const excerpt = passage.excerpt;
  const index = excerpt.toLowerCase().indexOf(claim.toLowerCase());
  if (index < 0) return false;
  const numbers = claim.match(/\d[\d,]*/g) ?? [];
  if (numbers.some((value) => !excerpt.includes(value))) return false;
  const excerptDenies = deniesAt(excerpt, index);
  if (finding.status === "verified") return !excerptDenies;
  return excerptDenies;
}
