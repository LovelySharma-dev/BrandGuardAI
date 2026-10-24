import { getSnapshot } from "@/db/repository";
import { renderReviewReport } from "@/engine/report";
import { getReviewForCurrentUser } from "@/lib/store";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const review = await getReviewForCurrentUser(id);
  if (!review) {
    return new Response("Review not found", { status: 404 });
  }
  const snapshot = review.snapshotId
    ? await getSnapshot(review.snapshotId, review.orgId)
    : null;
  const body = renderReviewReport(review, snapshot);
  const filename = `${review.id.replace(/[^a-zA-Z0-9_-]/g, "") || "review"}-report.md`;
  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
