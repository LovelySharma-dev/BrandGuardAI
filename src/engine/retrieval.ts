import type {
  BrandKit,
  EvidenceSource,
  RetrievalSnapshot,
  SnapshotPassage,
  SourceType,
} from "@/domain/schemas";
import { createId } from "@/engine/ids";

export function sourceTypeFor(id: string): SourceType {
  if (id.startsWith("src_fact")) return "fact";
  if (id.startsWith("src_term")) return "terminology";
  if (id.startsWith("src_claim") || id.includes("policy")) return "policy";
  if (id.startsWith("src_pdf")) return "upload";
  return "other";
}

export function passagesFor(
  kit: BrandKit,
  sourceIds: string[],
): SnapshotPassage[] {
  return sourceIds.flatMap((id) => {
    const source = kit.sources.find((item) => item.id === id);
    if (!source) return [];
    return [
      {
        id: source.id,
        title: source.title,
        excerpt: source.excerpt,
        sourceType: sourceTypeFor(source.id),
        kitVersion: kit.version,
      },
    ];
  });
}

export type RetrievalResult = {
  snapshot: RetrievalSnapshot;
  passages: EvidenceSource[];
};

function tokens(text: string): string[] {
  return text.toLowerCase().match(/[a-z0-9]{3,}/g) ?? [];
}

/**
 * Lexical retrieval over the published kit. No vector index.
 * Sources already cited by deterministic findings stay in the snapshot
 * so the evidence gate does not drop those citations.
 */
export function retrieveForReview(
  body: string,
  kit: BrandKit,
  citedIds: string[] = [],
): RetrievalResult {
  const bodyTokens = new Set(tokens(body));
  const lower = body.toLowerCase();
  const scores = new Map<string, number>();

  function add(id: string, amount: number) {
    if (!kit.sources.some((source) => source.id === id)) return;
    scores.set(id, (scores.get(id) ?? 0) + amount);
  }

  for (const source of kit.sources) {
    let overlap = 0;
    for (const token of tokens(`${source.title} ${source.excerpt}`)) {
      if (bodyTokens.has(token)) overlap += 1;
    }
    if (overlap >= 2) add(source.id, overlap);
  }

  for (const fact of kit.facts) {
    const hit =
      lower.includes(fact.statement.toLowerCase()) ||
      fact.keywords.some((keyword) => lower.includes(keyword.toLowerCase())) ||
      fact.contradictingPhrases.some((phrase) =>
        lower.includes(phrase.toLowerCase()),
      );
    if (hit) add(fact.sourceId, 5);
  }

  for (const rule of kit.termRules) {
    if (!rule.enabled) continue;
    if (rule.terms.some((term) => lower.includes(term.toLowerCase()))) {
      add("src_term_guide", 5);
    }
  }

  for (const policy of kit.claimPolicies) {
    if (!policy.enabled) continue;
    if (lower.includes(policy.pattern.toLowerCase())) {
      add("src_claim_policy", 5);
    }
  }

  for (const id of citedIds) add(id, 1);

  const sourceIds = [...scores.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([id]) => id);

  return {
    snapshot: {
      id: createId("snap"),
      kitVersion: kit.version,
      sourceIds,
      passages: passagesFor(kit, sourceIds),
      createdAt: new Date().toISOString(),
    },
    passages: sourceIds.map(
      (id) => kit.sources.find((source) => source.id === id)!,
    ),
  };
}
