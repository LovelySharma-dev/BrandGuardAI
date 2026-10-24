import path from "node:path";

import { AppShell } from "@/components/layout/app-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { summarizeReviews } from "@/engine/analytics";
import { scoreFixtureDirectory } from "@/engine/eval";
import { getPublishedBrandKit } from "@/db/brand-kits";
import { listReviewsForCurrentUser } from "@/lib/store";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Governance Analytics" };

export default async function AnalyticsPage() {
  const user = await requireUser();
  const reviews = await listReviewsForCurrentUser();
  const kit = await getPublishedBrandKit(user.orgId);
  const summary = summarizeReviews(reviews, kit);
  const byStatus = new Map<string, number>();

  for (const r of reviews) {
    for (const f of r.findings) {
      byStatus.set(f.status, (byStatus.get(f.status) ?? 0) + 1);
    }
  }
  const fixtures = scoreFixtureDirectory(
    path.join(process.cwd(), "fixtures", "reviews"),
  );

  return (
    <AppShell
      title="Governance Analytics"
      description="Counts from stored reviews. Fixture recall counts labelled expectations. Precision is included only for exhaustive fixtures."
    >
      <Alert className="mb-6">
        <AlertTitle>Measured fixture pack</AlertTitle>
        <AlertDescription>
          {fixtures.note}{" "}
          {fixtures.measured
            ? `${fixtures.passed} of ${fixtures.fixtureCount} fixtures passed, ${fixtures.expectationsMet} of ${fixtures.expectationsChecked} expectations matched, and ${fixtures.forgedCitationsAccepted} forged citations were accepted.`
            : "The fixture directory could not be scored."}
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Findings by evidence status</CardTitle>
            <CardDescription>
              Unsupported ≠ contradicted. Gaps stay visible.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {byStatus.size === 0 ? (
              <p className="text-sm text-muted-foreground">No data yet.</p>
            ) : (
              <ul className="flex flex-col gap-2 text-sm">
                {[...byStatus.entries()].map(([status, count]) => (
                  <li
                    key={status}
                    className="flex items-center justify-between border-b border-border/70 py-2 last:border-0"
                  >
                    <span className="capitalize">
                      {status.replaceAll("_", " ")}
                    </span>
                    <span className="tabular-nums font-medium">{count}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Recurring rules</CardTitle>
            <CardDescription>
              Candidates for clearer guidelines — derived from real hits.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {summary.recurring.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data yet.</p>
            ) : (
              <ul className="flex flex-col gap-2 text-sm">
                {summary.recurring.map((rule) => (
                  <li
                    key={rule.ruleId}
                    className="flex items-start justify-between gap-3 border-b border-border/70 py-2 last:border-0"
                  >
                    <span>
                      <span className="block">{rule.label}</span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {rule.ruleId} · {rule.reviewCount}{" "}
                        {rule.reviewCount === 1 ? "review" : "reviews"}
                      </span>
                    </span>
                    <span className="tabular-nums font-medium">{rule.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-none md:col-span-2">
          <CardHeader>
            <CardTitle>Guidelines too vague to judge</CardTitle>
            <CardDescription>
              Indeterminate findings. The draft was not marked false.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {summary.vague.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No indeterminate findings in the current reviews.
              </p>
            ) : (
              <ul className="flex flex-col gap-3 text-sm">
                {summary.vague.map((item) => (
                  <li key={item.key} className="border-b border-border/70 pb-3 last:border-0">
                    <p className="font-medium">
                      {item.label}{" "}
                      <span className="tabular-nums text-muted-foreground">
                        · {item.count}
                      </span>
                    </p>
                    <p className="mt-1 text-muted-foreground">{item.reason}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
