"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { FileSearch, Loader2, ShieldCheck } from "lucide-react";

import {
  decideSuggestionAction,
  submitReviewAction,
} from "@/app/actions/review";
import { FindingCard } from "@/components/review/finding-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ContentReview, EvidenceSource, Finding } from "@/domain/schemas";

const SAMPLE = `Inkloom is the best in the world brand platform. Founded in 2015, we offer guaranteed approval through our AI audit. Trusted by 10,000 design teams. Use our brand bible for synergy.`;

function groupFindings(findings: Finding[]) {
  const order = [
    "terminology",
    "promotional_claim",
    "factual_claim",
    "suggestion",
  ] as const;
  const map = new Map<string, Finding[]>();
  for (const finding of findings) {
    const list = map.get(finding.category) ?? [];
    list.push(finding);
    map.set(finding.category, list);
  }
  return order
    .filter((category) => map.has(category))
    .map((category) => ({ category, items: map.get(category)! }));
}

export function ReviewWorkspace({
  initialReview = null,
  sources = [],
}: {
  initialReview?: ContentReview | null;
  sources?: EvidenceSource[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState(
    initialReview?.title ?? "Launch announcement draft",
  );
  const [body, setBody] = useState(initialReview?.body ?? SAMPLE);
  const [goal, setGoal] = useState(
    initialReview?.intent.goal ?? "Announce product positioning for marketers",
  );
  const [audience, setAudience] = useState(
    initialReview?.intent.audience ?? "Brand marketers",
  );
  const [channel, setChannel] = useState(
    initialReview?.intent.channel ?? "Website",
  );
  const [mustKeep, setMustKeep] = useState(
    initialReview?.intent.mustKeep.join("\n") ?? "",
  );
  const [review, setReview] = useState<ContentReview | null>(initialReview);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function runReview() {
    setError(null);
    try {
      const result = await submitReviewAction({
        title,
        body,
        intent: {
          goal,
          audience,
          channel,
          mustKeep: mustKeep
            .split("\n")
            .map((item) => item.trim())
            .filter(Boolean),
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
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "The review could not be run.",
      );
      setReview(null);
    }
  }

  function handleRunReview() {
    startTransition(async () => {
      await runReview();
    });
  }

  function onDecide(suggestionId: string, decision: "accept" | "reject") {
    if (!review) return;
    setError(null);
    startTransition(async () => {
      try {
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
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "The suggestion decision could not be saved.",
        );
      }
    });
  }

  const groups = review ? groupFindings(review.findings) : [];
  const wordCount = body.trim() ? body.trim().split(/\s+/).length : 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-[0_1px_2px_rgba(28,25,23,0.04)] sm:px-5">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-lg bg-brand/10 text-brand">
            <ShieldCheck className="size-5" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-semibold">Review workspace</p>
            <p className="text-xs text-muted-foreground">
              Your draft stays unchanged until you accept a suggested edit.
            </p>
          </div>
        </div>
        <Badge variant="outline" className="gap-1.5 px-2.5 py-1">
          <span className="size-1.5 rounded-full bg-emerald-700" aria-hidden />
          Human-reviewed workflow
        </Badge>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <section
          aria-labelledby="submit-heading"
          className="flex flex-col gap-5 rounded-xl border border-border bg-card p-4 shadow-[0_1px_2px_rgba(28,25,23,0.04)] sm:p-5"
        >
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-foreground">
              <FileSearch className="size-4" aria-hidden />
            </span>
            <div>
              <h2 id="submit-heading" className="text-base font-semibold">
                Your content
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Add context so the review can keep your purpose and audience in
                view.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="review-title">Draft title</Label>
            <Input
              id="review-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              autoComplete="off"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="review-goal">Goal</Label>
              <Input
                id="review-goal"
                value={goal}
                onChange={(event) => setGoal(event.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="review-audience">Audience</Label>
              <Input
                id="review-audience"
                value={audience}
                onChange={(event) => setAudience(event.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="review-channel">Channel</Label>
              <Input
                id="review-channel"
                value={channel}
                onChange={(event) => setChannel(event.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="review-must-keep">
                Must keep{" "}
                <span className="font-normal text-muted-foreground">
                  (optional, one item per line)
                </span>
              </Label>
              <Textarea
                id="review-must-keep"
                value={mustKeep}
                onChange={(event) => setMustKeep(event.target.value)}
                rows={2}
                placeholder="Key phrase, product name, or idea"
                className="min-h-16 resize-y text-sm"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="review-body">Draft body</Label>
              <Button
                type="button"
                variant="link"
                size="sm"
                disabled={pending}
                className="h-auto px-0 text-xs text-brand"
                onClick={() => {
                  setBody(SAMPLE);
                  setError(null);
                }}
              >
                Load sample
              </Button>
            </div>
            <Textarea
              id="review-body"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              className="min-h-56 resize-y bg-background font-serif text-[15px] leading-relaxed sm:min-h-72"
            />
            <div className="flex justify-end text-xs text-muted-foreground">
              {wordCount} {wordCount === 1 ? "word" : "words"} · {body.length}{" "}
              characters
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
            <Button
              type="button"
              onClick={handleRunReview}
              disabled={pending || !body.trim()}
              size="lg"
            >
              {pending ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Running review…
                </>
              ) : (
                "Run review"
              )}
            </Button>
            <p className="text-xs text-muted-foreground">
              Checks use the published brand kit and its evidence sources.
            </p>
          </div>

          {error ? (
            <Alert variant="destructive" role="alert">
              <AlertTitle>Could not complete that action</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
        </section>

        <section
          aria-labelledby="findings-heading"
          className="flex flex-col gap-4"
          aria-busy={pending}
        >
          <div className="rounded-xl border border-border bg-card p-4 shadow-[0_1px_2px_rgba(28,25,23,0.04)] sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 id="findings-heading" className="text-base font-semibold">
                  Review findings
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Evidence and suggestions for a human to consider.
                </p>
              </div>
              {review ? (
                <Badge variant="outline" className="capitalize">
                  {review.status.replaceAll("_", " ")}
                </Badge>
              ) : null}
            </div>
            {review ? (
              <div
                role="status"
                className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-border pt-3 text-xs text-muted-foreground"
              >
                <span>
                  Brand kit <strong className="font-medium text-foreground">v{review.kitVersion}</strong>
                </span>
                <span>
                  <strong className="font-medium text-foreground">{review.findings.length}</strong>{" "}
                  {review.findings.length === 1 ? "finding" : "findings"}
                </span>
                <span>
                  Evidence snapshot{" "}
                  <strong className="font-medium text-foreground">
                    {review.snapshotId ? "pinned" : "unavailable"}
                  </strong>
                </span>
              </div>
            ) : null}
          </div>

          {!review && !pending ? (
            <div className="rounded-xl border border-dashed border-border bg-card/50 px-5 py-12 text-center">
              <span className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <FileSearch className="size-5" aria-hidden />
              </span>
              <p className="text-sm font-medium text-foreground">
                Your review will appear here
              </p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                Submit your draft to check terminology and claims against the
                published brand kit. Missing evidence stays visible as a gap.
              </p>
            </div>
          ) : null}

          {pending && !review ? (
            <div
              role="status"
              className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-8 text-sm text-muted-foreground"
            >
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Checking terms, claims, and approved facts…
            </div>
          ) : null}

          {review ? (
            <div className="flex flex-col gap-4">
              {review.findings.length === 0 ? (
                <Alert>
                  <AlertTitle>No policy or evidence issues found</AlertTitle>
                  <AlertDescription>
                    The deterministic checks found no terminology, absolute
                    claim, or fact mismatch in this draft.
                  </AlertDescription>
                </Alert>
              ) : null}

              {groups.map((group) => (
                <div key={group.category} className="flex flex-col gap-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {group.category.replaceAll("_", " ")}
                  </h3>
                  {group.items.map((finding) => (
                    <FindingCard
                      key={finding.id}
                      finding={finding}
                      sources={sources}
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
    </div>
  );
}
