import Link from "next/link";
import { Plus } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { listReviewsForCurrentUser } from "@/lib/store";

export const metadata = { title: "Content Reviews" };

export default async function ReviewsPage() {
  const reviews = await listReviewsForCurrentUser();

  return (
    <AppShell
      title="Content Reviews"
      description="Author drafts, run evidence-aware checks, and manage corrections."
      actions={
        <Link
          href="/reviews/new"
          className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <Plus className="size-4" aria-hidden />
          New review
        </Link>
      }
    >
      {reviews.length === 0 ? (
        <div className="rounded-md border border-dashed border-border bg-card/40 px-4 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            No reviews in this session yet.
          </p>
          <Link
            href="/reviews/new"
            className="mt-4 inline-flex h-8 items-center rounded-md bg-primary px-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/80"
          >
            Open review workspace
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Findings</th>
                <th className="px-4 py-3 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <Link
                      href={`/reviews/${r.id}`}
                      className="font-medium text-foreground underline-offset-2 hover:underline focus-visible:underline"
                    >
                      {r.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="capitalize">
                      {r.status.replaceAll("_", " ")}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 tabular-nums">{r.findings.length}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(r.updatedAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
