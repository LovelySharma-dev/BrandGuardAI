import Link from "next/link";
import { ArrowRight, FileWarning, LayoutList, Shield } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { listReviewsForCurrentUser } from "@/lib/store";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const reviews = await listReviewsForCurrentUser();
  const blockers = reviews.reduce(
    (count, review) =>
      count + review.findings.filter((finding) => finding.severity === "blocker").length,
    0,
  );
  const gaps = reviews.reduce(
    (count, review) =>
      count +
      review.findings.filter(
        (finding) =>
          finding.status === "unsupported" || finding.status === "indeterminate",
      ).length,
    0,
  );

  return (
    <AppShell
      title="Dashboard"
      description="A clear view of brand checks and the drafts that need attention."
      actions={
        <Link
          href="/reviews/new"
          className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          New content review
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card className="shadow-none transition-shadow hover:shadow-sm">
          <CardHeader className="gap-3">
            <CardDescription className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                <LayoutList className="size-4" aria-hidden />
              </span>
              Saved reviews
            </CardDescription>
            <CardTitle className="text-3xl tabular-nums">
              {reviews.length}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Saved to this workspace&apos;s local database.
          </CardContent>
        </Card>

        <Card className="shadow-none transition-shadow hover:shadow-sm">
          <CardHeader className="gap-3">
            <CardDescription className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-md bg-destructive/10 text-destructive">
                <FileWarning className="size-4" aria-hidden />
              </span>
              Blocker findings
            </CardDescription>
            <CardTitle className="text-3xl tabular-nums">{blockers}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            High-priority policy hits and evidence-backed contradictions.
          </CardContent>
        </Card>

        <Card className="shadow-none transition-shadow hover:shadow-sm sm:col-span-2 xl:col-span-1">
          <CardHeader className="gap-3">
            <CardDescription className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-md bg-brand/10 text-brand">
                <Shield className="size-4" aria-hidden />
              </span>
              Evidence gaps
            </CardDescription>
            <CardTitle className="text-3xl tabular-nums">{gaps}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Unsupported or unclear claims stay visible for human review.
          </CardContent>
        </Card>
      </div>

      <section className="mt-9">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold tracking-tight">
              Recent reviews
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Your latest drafts and their review state.
            </p>
          </div>
          {reviews.length > 0 ? (
            <Link
              href="/reviews"
              className="text-sm font-medium text-brand underline-offset-4 hover:underline focus-visible:underline"
            >
              View all reviews
            </Link>
          ) : null}
        </div>

        {reviews.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card/50 px-4 py-10 text-center">
            <p className="text-sm font-medium text-foreground">No reviews yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Start a content review to see evidence and suggestions here.
            </p>
            <Link
              href="/reviews/new"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand underline-offset-2 hover:underline"
            >
              Create a review
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card shadow-[0_1px_2px_rgba(28,25,23,0.04)]">
            {reviews.slice(0, 8).map((review) => (
              <li key={review.id}>
                <Link
                  href={`/reviews/${review.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 text-sm transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none sm:px-5"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-foreground">
                      {review.title}
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {review.findings.length}{" "}
                      {review.findings.length === 1 ? "finding" : "findings"}
                      {" · "}Kit v{review.kitVersion}
                    </span>
                  </span>
                  <Badge
                    variant={review.status === "approved" ? "secondary" : "outline"}
                    className="capitalize"
                  >
                    {review.status.replaceAll("_", " ")}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  );
}
