import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";
import { ApprovalActions } from "@/components/review/approval-actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { listReviewsForCurrentUser } from "@/lib/store";

export const metadata = { title: "Approval Queue" };

export default async function ApprovalsPage() {
  const queue = (await listReviewsForCurrentUser()).filter((r) =>
    ["in_review", "pending_approval", "needs_revision"].includes(r.status),
  );

  return (
    <AppShell
      title="Approval Queue"
      description="Human reviewers decide publication readiness. Models never set approved."
    >
      <Alert className="mb-6">
        <AlertTitle>Decisions use the signed-in role</AlertTitle>
        <AlertDescription>
          Approve, request changes, and reject reload the role from the
          session. An author cannot approve. A user only sees reviews from
          their own organisation.
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
              <div className="flex flex-wrap items-center justify-end gap-3">
                <Badge variant="secondary" className="capitalize">
                  {r.status.replaceAll("_", " ")}
                </Badge>
                {r.status === "in_review" || r.status === "pending_approval" ? (
                  <ApprovalActions reviewId={r.id} />
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Waiting for the author to resubmit.
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
