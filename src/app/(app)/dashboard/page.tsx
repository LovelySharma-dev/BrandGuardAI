import Link from "next/link";
import { ArrowRight, FileWarning, Shield } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
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
    (n, r) => n + r.findings.filter((f) => f.severity === "blocker").length,
    0,
  );
  const gaps = reviews.reduce(
    (n, r) =>
      n +
      r.findings.filter(
        (f) => f.status === "unsupported" || f.status === "indeterminate",
      ).length,
    0,
  );

  return (
    <AppShell
      title="Dashboard"
      description="Evidence-gated brand governance for the demo organisation."
      actions={
        <Link
          href="/reviews/new"
          className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          New content review
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      }
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="shadow-none">
          <CardHeader>
            <CardDescription>Reviews in session</CardDescription>
            <CardTitle className="text-3xl tabular-nums">
              {reviews.length}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Stored in-memory for this Phase 1 slice (resets on server restart).
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardHeader>
            <CardDescription className="flex items-center gap-1.5">
              <FileWarning className="size-3.5" aria-hidden />
              Blocker findings
            </CardDescription>
            <CardTitle className="text-3xl tabular-nums text-severity-blocker">
              {blockers}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Absolute claims, contradictions, and hard terminology bans.
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardHeader>
            <CardDescription className="flex items-center gap-1.5">
              <Shield className="size-3.5" aria-hidden />
              Evidence gaps
            </CardDescription>
            <CardTitle className="text-3xl tabular-nums">{gaps}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Unsupported or indeterminate — not treated as falsehood.
          </CardContent>
        </Card>
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold tracking-tight">
          Recent reviews
        </h2>
        {reviews.length === 0 ? (
          <p className="rounded-md border border-dashed border-border px-4 py-8 text-sm text-muted-foreground">
            No reviews yet.{" "}
            <Link href="/reviews/new" className="text-brand underline-offset-2 hover:underline">
              Start a content review
            </Link>{" "}
            to exercise the deterministic engine.
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-md border border-border bg-card">
            {reviews.slice(0, 8).map((r) => (
              <li key={r.id}>
                <Link
                  href={`/reviews/${r.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none"
                >
                  <span className="font-medium">{r.title}</span>
                  <span className="text-muted-foreground">
                    {r.findings.length} findings · {r.status.replaceAll("_", " ")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  );
}
