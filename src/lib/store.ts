import {
  getReview,
  getSnapshot,
  listReviews,
  saveReview,
} from "@/db/repository";
import { requireUser } from "@/lib/session";

export { getReview, getSnapshot, listReviews, saveReview };

export async function listReviewsForCurrentUser() {
  const user = await requireUser();
  return listReviews(user.orgId);
}

export async function getReviewForCurrentUser(id: string) {
  const user = await requireUser();
  return getReview(id, user.orgId);
}
