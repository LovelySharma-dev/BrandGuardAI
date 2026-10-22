import type { ContentReview, RetrievalSnapshot } from "@/domain/schemas";

/**
 * In-memory persistence for Phase 1.
 * Postgres + auth arrive in later milestone phases — not required for the
 * deterministic vertical slice.
 */
const reviews = new Map<string, ContentReview>();
const snapshots = new Map<string, RetrievalSnapshot>();

export function saveReview(
  review: ContentReview,
  snapshot?: RetrievalSnapshot,
): void {
  reviews.set(review.id, review);
  if (snapshot) {
    snapshots.set(snapshot.id, snapshot);
  }
}

export function getReview(id: string): ContentReview | undefined {
  return reviews.get(id);
}

export function listReviews(orgId: string): ContentReview[] {
  return [...reviews.values()]
    .filter((r) => r.orgId === orgId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getSnapshot(id: string): RetrievalSnapshot | undefined {
  return snapshots.get(id);
}

export function __resetStoreForTests(): void {
  reviews.clear();
  snapshots.clear();
}
