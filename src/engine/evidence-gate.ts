import type { Finding, RetrievalSnapshot } from "@/domain/schemas";
import { FindingSchema } from "@/domain/schemas";

/**
 * Fail closed: citation IDs must be ⊆ retrieval snapshot source IDs.
 * Status invariants: verified/contradicted require ≥1 citation;
 * unsupported/indeterminate must not present citations as proof.
 */
export function applyEvidenceGate(
  findings: Finding[],
  snapshot: RetrievalSnapshot,
): Finding[] {
  const allowed = new Set(snapshot.sourceIds);

  return findings.map((raw) => {
    const finding = FindingSchema.parse(raw);
    const illegal = finding.citationIds.filter((id) => !allowed.has(id));

    if (illegal.length > 0) {
      return FindingSchema.parse({
        ...finding,
        status: "indeterminate",
        severity: finding.severity === "info" ? "warning" : finding.severity,
        citationIds: [],
        evidenceGapReason: `Dropped forged or out-of-snapshot citations: ${illegal.join(", ")}`,
        rationale: `${finding.rationale} Evidence gate removed citations that were not in the retrieval snapshot.`,
      });
    }

    if (
      (finding.status === "verified" || finding.status === "contradicted") &&
      finding.citationIds.length === 0
    ) {
      return FindingSchema.parse({
        ...finding,
        status: "indeterminate",
        evidenceGapReason:
          "Status required citations but none remained after validation.",
      });
    }

    if (
      (finding.status === "unsupported" ||
        finding.status === "indeterminate") &&
      finding.citationIds.length > 0
    ) {
      // Keep candidate sources out of the proof channel — clear citations.
      return FindingSchema.parse({
        ...finding,
        citationIds: [],
        evidenceGapReason:
          finding.evidenceGapReason ??
          "Citations cleared: this status does not assert supporting proof.",
      });
    }

    return finding;
  });
}
