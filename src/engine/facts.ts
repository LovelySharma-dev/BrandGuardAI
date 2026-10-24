import type { BrandKit, Finding } from "@/domain/schemas";
import { createId } from "@/engine/ids";
import { deniesAt } from "@/engine/local-negation";

/**
 * Checks factual-looking assertions against approved facts.
 * - Contradicting phrases → `contradicted` with source citation
 * - Affirming approved statement (keyword co-occurrence near founding/customers) → `verified`
 * - Known claim shapes without kit support → `unsupported`
 *
 * Keyword co-occurrence alone never upgrades a promotional pattern to verified.
 */
export function checkFactualClaims(
  reviewId: string,
  body: string,
  kit: BrandKit,
): Finding[] {
  const findings: Finding[] = [];
  const lower = body.toLowerCase();

  for (const fact of kit.facts) {
    for (const phrase of fact.contradictingPhrases) {
      const idx = lower.indexOf(phrase.toLowerCase());
      if (idx === -1) continue;
      if (deniesAt(body, idx)) continue;
      const end = idx + phrase.length;
      const findingId = createId("find");
      const suggestionId = createId("sug");
      const matchedText = body.slice(idx, end);
      const replacement = replacementForContradiction(fact.id, matchedText, fact.statement);
      const corrected = body.slice(0, idx) + replacement + body.slice(end);

      findings.push({
        id: findingId,
        reviewId,
        category: "factual_claim",
        span: { start: idx, end },
        status: "contradicted",
        severity: "blocker",
        summary: `Contradicts approved fact: ${fact.statement}`,
        rationale: `The draft asserts “${matchedText}”, which conflicts with approved fact “${fact.id}”.`,
        citationIds: [fact.sourceId],
        ruleId: fact.id,
        matchedText,
        suggestion: {
          id: suggestionId,
          findingId,
          proposedText: corrected,
          rationale: `Align the sentence with the approved fact: “${fact.statement}”`,
          accepted: null,
        },
      });
    }
  }

  // Verify when the draft restates an approved fact (statement substring or keyword cluster).
  for (const fact of kit.facts) {
    const statementIdx = lower.indexOf(fact.statement.toLowerCase());
    if (statementIdx !== -1) {
      const end = statementIdx + fact.statement.length;
      const denied = deniesAt(body, statementIdx);
      findings.push({
        id: createId("find"),
        reviewId,
        category: "factual_claim",
        span: { start: statementIdx, end },
        status: denied ? "contradicted" : "verified",
        severity: denied ? "blocker" : "info",
        summary: denied
          ? `Denies approved fact: ${fact.statement}`
          : `Matches approved fact: ${fact.statement}`,
        rationale: denied
          ? `The draft negates approved fact “${fact.id}”. The source still states it.`
          : `Draft language aligns with approved fact “${fact.id}” and cites its source.`,
        citationIds: [fact.sourceId],
        ruleId: fact.id,
        matchedText: body.slice(statementIdx, end),
      });
      continue;
    }

    if (fact.id === "fact_founded_2019") {
      const yearMatch = /\b(?:was\s+|were\s+)?(?:founded|established)\s+in\s+2019\b/i.exec(body);
      if (yearMatch) {
        const denied = deniesAt(body, yearMatch.index);
        findings.push({
          id: createId("find"),
          reviewId,
          category: "factual_claim",
          span: {
            start: yearMatch.index,
            end: yearMatch.index + yearMatch[0].length,
          },
          status: denied ? "contradicted" : "verified",
          severity: denied ? "blocker" : "info",
          summary: denied
            ? `Denies approved fact: ${fact.statement}`
            : `Matches approved fact: ${fact.statement}`,
          rationale: denied
            ? `The draft negates the approved founding year in “${fact.id}”.`
            : `The draft says the organisation was founded or established in 2019, matching “${fact.id}”.`,
          citationIds: [fact.sourceId],
          ruleId: fact.id,
          matchedText: yearMatch[0],
        });
      }
    }

    if (fact.id === "fact_customers_2000") {
      const cust =
        /\b(?:trusted by|serving)\b[^.]{0,40}?\b(?:more than\s+)?2,?000\b[^.]{0,24}\bdesign teams\b/i.exec(
          body,
        );
      if (cust) {
        const denied = deniesAt(body, cust.index);
        findings.push({
          id: createId("find"),
          reviewId,
          category: "factual_claim",
          span: { start: cust.index, end: cust.index + cust[0].length },
          status: denied ? "contradicted" : "verified",
          severity: denied ? "blocker" : "info",
          summary: denied
            ? `Denies approved fact: ${fact.statement}`
            : `Matches approved fact: ${fact.statement}`,
          rationale: denied
            ? `The draft negates the approved customer figure in “${fact.id}”.`
            : `The draft uses the approved “design teams” figure from “${fact.id}”.`,
          citationIds: [fact.sourceId],
          ruleId: fact.id,
          matchedText: cust[0],
        });
      }
    }
  }

  // Unsupported numeric “founded in YYYY” when not already covered
  const foundedYear = /\bfounded in (20\d{2})\b/gi;
  let m: RegExpExecArray | null;
  while ((m = foundedYear.exec(body)) !== null) {
    const year = m[1];
    if (year === "2019") continue;
    if (deniesAt(body, m.index)) continue;
    const already = findings.some(
      (f) =>
        f.span &&
        f.span.start === m!.index &&
        (f.status === "contradicted" || f.status === "verified"),
    );
    if (already) continue;

    const findingId = createId("find");
    findings.push({
      id: findingId,
      reviewId,
      category: "factual_claim",
      span: { start: m.index, end: m.index + m[0].length },
      status: "unsupported",
      severity: "warning",
      summary: `Founding year “${year}” is not supported by the approved kit.`,
      rationale:
        "A founding-year assertion was detected, but no approving fact covers this year. Absence of evidence is not treated as contradiction.",
      citationIds: [],
      evidenceGapReason: "No approved fact matches this founding year.",
      matchedText: m[0],
      suggestion: {
        id: createId("sug"),
        findingId,
        proposedText:
          body.slice(0, m.index) +
          "founded in 2019" +
          body.slice(m.index + m[0].length),
        rationale: "Use the approved founding year from the brand kit.",
        accepted: null,
      },
    });
  }

  return findings;
}

/** Prefer a local phrase swap so surrounding grammar stays intact. */
function replacementForContradiction(
  factId: string,
  matched: string,
  statement: string,
): string {
  if (factId === "fact_founded_2019") {
    return matched.replace(/\b20\d{2}\b/, "2019");
  }
  if (factId === "fact_customers_2000") {
    if (/10,?000/i.test(matched)) {
      return matched.replace(/10,?000/i, "more than 2,000");
    }
    if (/million/i.test(matched)) {
      return "more than 2,000 design teams";
    }
  }
  return statement;
}
