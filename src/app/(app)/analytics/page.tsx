import { AppShell } from "@/components/layout/app-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { listReviewsForCurrentUser } from "@/lib/store";

export const metadata = { title: "Governance Analytics" };

export default async function AnalyticsPage() {
  const reviews = await listReviewsForCurrentUser();
  const byRule = new Map<string, number>();
  const byStatus = new Map<string, number>();

  for (const r of reviews) {
    for (const f of r.findings) {
      byStatus.set(f.status, (byStatus.get(f.status) ?? 0) + 1);
      if (f.ruleId) {
        byRule.set(f.ruleId, (byRule.get(f.ruleId) ?? 0) + 1);
      }
    }
  }

  const topRules = [...byRule.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  return (
    <AppShell
      title="Governance Analytics"
      description="Session-scoped counts from completed deterministic reviews — not fabricated benchmarks."
    >
      <Alert className="mb-6">
        <AlertTitle>Honest metrics only</AlertTitle>
        <AlertDescription>
          Figures below reflect in-memory reviews from this server process.
          Labelled fixture evaluation arrives with the review engine phase.
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
            {topRules.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data yet.</p>
            ) : (
              <ul className="flex flex-col gap-2 text-sm">
                {topRules.map(([ruleId, count]) => (
                  <li
                    key={ruleId}
                    className="flex items-center justify-between border-b border-border/70 py-2 last:border-0"
                  >
                    <span className="font-mono text-xs">{ruleId}</span>
                    <span className="tabular-nums font-medium">{count}</span>
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
