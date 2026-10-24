import type { ContentReview, RetrievalSnapshot } from "@/domain/schemas";
import { buildTrustGraph, trustLines } from "@/engine/trust-graph";

export function renderReviewReport(
  review: ContentReview,
  snapshot: RetrievalSnapshot | null = null,
): string {
  const lines = [
    `# ${review.title}`,
    "",
    `Status: ${review.status.replaceAll("_", " ")}`,
    `Brand kit: v${review.kitVersion}`,
    `Model pass: ${review.modelMeta?.outcome ?? "not recorded"}`,
    "",
    "## Draft",
    "",
    review.body,
    "",
    "## Findings",
    "",
  ];

  if (review.findings.length === 0) {
    lines.push("No findings.");
  }

  for (const finding of review.findings) {
    lines.push(`### ${finding.summary}`);
    lines.push("");
    lines.push(`- Status: ${finding.status}`);
    lines.push(`- Severity: ${finding.severity}`);
    if (finding.ruleId) lines.push(`- Rule: ${finding.ruleId}`);
    if (finding.matchedText) lines.push(`- Matched text: ${finding.matchedText}`);
    lines.push("");
    lines.push(finding.rationale);
    if (finding.citationIds.length > 0) {
      lines.push("");
      lines.push(`Citations: ${finding.citationIds.join(", ")}`);
    } else if (finding.evidenceGapReason) {
      lines.push("");
      lines.push(`Evidence gap: ${finding.evidenceGapReason}`);
    }
    lines.push("");
  }

  lines.push("## Suggested edits");
  lines.push("");
  const suggestions = review.findings.filter((finding) => finding.suggestion);
  if (suggestions.length === 0) {
    lines.push("No suggested edits.");
    lines.push("");
  }
  for (const finding of suggestions) {
    const suggestion = finding.suggestion;
    if (!suggestion) continue;
    const state =
      suggestion.accepted === null
        ? "pending"
        : suggestion.accepted
          ? "accepted"
          : "rejected";
    lines.push(`- ${state}: ${suggestion.rationale}`);
  }
  lines.push("");
  lines.push("## Human decision");
  lines.push("");
  if (review.decision) {
    lines.push(`- Action: ${review.decision.action}`);
    lines.push(`- Actor: ${review.decision.actorId}`);
    lines.push(`- At: ${review.decision.at}`);
    if (review.decision.reason) lines.push(`- Reason: ${review.decision.reason}`);
  } else {
    lines.push("No human approval decision has been recorded.");
  }
  lines.push("");
  lines.push(
    "Findings and suggested edits are recommendations. Accepting a suggestion does not approve the draft.",
  );
  lines.push("");
  lines.push("## Evidence trust");
  lines.push("");
  lines.push(
    "These lines repeat stored findings and the snapshot pinned to this review. They do not create citations or change the review status.",
  );
  for (const line of trustLines(buildTrustGraph(review, snapshot))) {
    lines.push(`- ${line}`);
  }
  lines.push("");
  return lines.join("\n");
}
