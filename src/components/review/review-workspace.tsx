"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";

import {
  decideSuggestionAction,
  submitReviewAction,
} from "@/app/actions/review";
import { FindingCard } from "@/components/review/finding-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ContentReview, Finding } from "@/domain/schemas";

const SAMPLE = `Inkloom is the best in the world brand platform. Founded in 2015, we offer guaranteed approval through our AI audit. Trusted by 10,000 design teams. Use our brand bible for synergy.`;

function groupFindings(findings: Finding[]) {
  const order = [
    "terminology",
    "promotional_claim",
    "factual_claim",
    "suggestion",
  ] as const;
  const map = new Map<string, Finding[]>();
  for (const f of findings) {
    const list = map.get(f.category) ?? [];
    list.push(f);
    map.set(f.category, list);
  }
  return order
    .filter((c) => map.has(c))
    .map((c) => ({ category: c, items: map.get(c)! }));
}

export function ReviewWorkspace({
  initialReview = null,
}: {
  initialReview?: ContentReview | null;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(
    initialReview?.title ?? "Launch announcement draft",
  );
  const [body, setBody] = useState(initialReview?.body ?? SAMPLE);
  const [goal, setGoal] = useState(
    initialReview?.intent.goal ?? "Announce product positioning for marketers",
  );
  const [review, setReview] = useState<ContentReview | null>(
    initialReview ?? null,
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function runReview() {
    setError(null);
    const result = await submitReviewAction({
      title,
      body,
      intent: {
        goal,
        audience: "Brand marketers",
        channel: "Website",
        mustKeep: [],
      },
      orgId: "org_demo",
    });
    if (!result.ok) {
      setError(result.error);
      setReview(null);
      return;
    }
    setReview(result.data);
    setBody(result.data.body);
    router.replace(`/reviews/${result.data.id}`);
    router.refresh();
  }

  function handleRunReview() {
    startTransition(() => {
      void runReview();
    });
  }

  function onDecide(suggestionId: string, decision: "accept" | "reject") {
    if (!review) return;
    setError(null);
    startTransition(async () => {
      const result = await decideSuggestionAction(
        review.id,
        suggestionId,
        decision,
      );
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setReview(result.data);
      setBody(result.data.body);
      router.refresh();
    });
  }

  const groups = review ? groupFindings(review.findings) : [];

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <section
        aria-labelledby="submit-heading"
        className="flex flex-col gap-4 rounded-md border border-border bg-card p-4 shadow-[0_1px_2px_rgba(28,25,23,0.04)]"
      >
        <div>
          <h2 id="submit-heading" className="text-lg font-semibold">
            Content submission
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Paste draft copy. Review runs deterministic validators against the
            pinned brand kit — not an unsupervised LLM pass.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="review-title">Title</Label>
          <Input
            id="review-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoComplete="off"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="review-goal">Creator intent</Label>
          <Input
            id="review-goal"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            autoComplete="off"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="review-body">Draft body</Label>
          <Textarea
            id="review-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="min-h-48 font-serif text-[15px] leading-relaxed"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleRunReview}
            disabled={pending}
            className="inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-transparent bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
          >
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Working…
              </>
            ) : (
              "Run review"
            )}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setBody(SAMPLE);
              setError(null);
            }}
            className="inline-flex h-9 cursor-pointer items-center justify-center rounded-md border border-border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
          >
            Load sample draft
          </button>
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Review failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
      </section>

      <section
        aria-labelledby="findings-heading"
        className="flex flex-col gap-4"
        aria-live="polite"
      >
        <div>
          <h2 id="findings-heading" className="text-lg font-semibold">
            Findings
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Grouped by category. Evidence status is explicit on every item.
          </p>
        </div>

        {!review && !pending ? (
          <div className="rounded-md border border-dashed border-border bg-card/50 px-4 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              No findings yet. Submit a draft to run the deterministic engine.
            </p>
          </div>
        ) : null}

        {pending && !review ? (
          <div className="flex items-center gap-2 rounded-md border border-border bg-card px-4 py-8 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Analysing terminology, promotional claims, and approved facts…
          </div>
        ) : null}

        {review ? (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>
                Status:{" "}
                <strong className="font-medium text-foreground">
                  {review.status.replaceAll("_", " ")}
                </strong>
              </span>
              <span aria-hidden>·</span>
              <span>Kit v{review.kitVersion}</span>
              <span aria-hidden>·</span>
              <span>{review.findings.length} findings</span>
            </div>

            {review.findings.length === 0 ? (
              <Alert>
                <AlertTitle>No policy or evidence issues</AlertTitle>
                <AlertDescription>
                  Deterministic validators found no terminology, absolute-claim,
                  or fact mismatches for this draft.
                </AlertDescription>
              </Alert>
            ) : null}

            {groups.map((group) => (
              <div key={group.category} className="flex flex-col gap-3">
                <h3 className="text-sm font-semibold tracking-tight capitalize text-foreground">
                  {group.category.replaceAll("_", " ")}
                </h3>
                {group.items.map((finding) => (
                  <FindingCard
                    key={finding.id}
                    finding={finding}
                    originalBody={review.revisions[0]?.body ?? review.body}
                    busy={pending}
                    onAccept={(id) => onDecide(id, "accept")}
                    onReject={(id) => onDecide(id, "reject")}
                  />
                ))}
              </div>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
