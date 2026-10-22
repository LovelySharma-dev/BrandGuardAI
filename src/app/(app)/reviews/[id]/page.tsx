import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { ReviewWorkspace } from "@/components/review/review-workspace";
import { Skeleton } from "@/components/ui/skeleton";
import { getReview } from "@/lib/store";

export const metadata = { title: "Review" };

export default function ReviewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <AppShell title="Loading review" description="Fetching review details…">
          <Skeleton className="h-64 w-full" />
        </AppShell>
      }
    >
      <ReviewDetail params={params} />
    </Suspense>
  );
}

async function ReviewDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const review = getReview(id);
  if (!review) notFound();

  return (
    <AppShell
      title={review.title}
      description={`Kit v${review.kitVersion} · ${review.status.replaceAll("_", " ")}`}
      actions={
        <Link
          href="/reviews/new"
          className="inline-flex h-8 items-center rounded-md border border-border bg-background px-2.5 text-sm font-medium hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          New review
        </Link>
      }
    >
      <ReviewWorkspace initialReview={review} />
    </AppShell>
  );
}
