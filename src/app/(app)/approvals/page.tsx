import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { listReviews } from "@/lib/store";

export const metadata = { title: "Approval Queue" };

export default function ApprovalsPage() {
  const queue = listReviews("org_demo").filter((r) =>
    ["in_review", "pending_approval", "needs_revision"].includes(r.status),
  );

  return (
    <AppShell
      title="Approval Queue"
      description="Human reviewers decide publication readiness. Models never set approved."
    >
      <Alert className="mb-6">
        <AlertTitle>Server-enforced roles come next</AlertTitle>
        <AlertDescription>
          Phase 1 lists candidate reviews only. Role-checked transitions and
          immutable audit on approve/reject land in the approval workflow phase
          (see milestones Phase 7).
        </AlertDescription>
      </Alert>

      {queue.length === 0 ? (
        <p className="rounded-md border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
          No reviews awaiting attention.{" "}
          <Link
            href="/reviews/new"
            className="text-brand underline-offset-2 hover:underline"
          >
            Run a review
          </Link>
          .
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-md border border-border bg-card">
          {queue.map((r) => (
            <li
              key={r.id}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
            >
              <div>
                <Link
                  href={`/reviews/${r.id}`}
                  className="font-medium underline-offset-2 hover:underline"
                >
                  {r.title}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {r.findings.filter((f) => f.severity === "blocker").length}{" "}
                  blockers
                </p>
              </div>
              <Badge variant="secondary" className="capitalize">
                {r.status.replaceAll("_", " ")}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
