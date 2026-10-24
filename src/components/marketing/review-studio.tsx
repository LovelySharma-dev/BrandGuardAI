"use client";

import { useMemo, useRef, useState } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DEMO_LABEL, NORTHLINE_DRAFT, NORTHLINE_KIT } from "@/components/marketing/northline-kit";
import type { Finding } from "@/domain/schemas";
import { runDeterministicReview } from "@/engine/review";

type Phase = "idle" | "running" | "done" | "error" | "empty";

const TONE: Record<string, string> = {
  verified: "bg-[#B9F5D0]/70",
  contradicted: "bg-[#f3c7c1]",
  unsupported: "bg-[#E9A23B]/35",
  policy_hit: "bg-[#E9A23B]/25",
  indeterminate: "bg-[#d9d3c7]",
};

function plainStatus(status: string): string {
  if (status === "verified") return "Supported";
  if (status === "contradicted") return "Contradicted";
  if (status === "unsupported") return "Unsupported";
  if (status === "policy_hit") return "Terminology mismatch";
  if (status === "indeterminate") return "Indeterminate";
  return status;
}

function sourceTitle(id: string): string {
  return NORTHLINE_KIT.sources.find((source) => source.id === id)?.title ?? id;
}

export function ReviewStudio() {
  const [body, setBody] = useState(NORTHLINE_DRAFT);
  const [reviewedBody, setReviewedBody] = useState<string | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [kept, setKept] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState("Demo ready. Run the review when you want findings.");
  const marks = useRef<Record<string, HTMLElement | null>>({});

  const active = findings.filter((finding) => !kept.includes(keyOf(finding)));
  const counts = useMemo(() => countFindings(active), [active]);
  const stale = reviewedBody !== null && reviewedBody !== body;

  function run() {
    const trimmed = body.trim();
    if (!trimmed) {
      setPhase("empty");
      setFindings([]);
      setNotice("Add a draft before running a review.");
      return;
    }
    setPhase("running");
    setError(null);
    setNotice("Reviewing the draft against the fictional Northline kit.");
    window.setTimeout(() => {
      const result = runDeterministicReview(
        { title: "Northline launch", body: trimmed, orgId: NORTHLINE_KIT.orgId },
        NORTHLINE_KIT,
      );
      if (!result.ok) {
        setPhase("error");
        setError(result.error);
        setNotice("The review did not finish.");
        return;
      }
      setFindings(result.review.findings);
      setReviewedBody(trimmed);
      const visible = result.review.findings.filter((finding) => !kept.includes(keyOf(finding)));
      setSelected(visible[0]?.id ?? null);
      setPhase("done");
      setNotice(
        `${visible.length} findings. Status ${result.review.status.replaceAll("_", " ")}. The draft is not approved.`,
      );
    }, 650);
  }

  function finish(next: string, message: string) {
    const result = runDeterministicReview(
      { title: "Northline launch", body: next, orgId: NORTHLINE_KIT.orgId },
      NORTHLINE_KIT,
    );
    if (!result.ok) {
      setPhase("error");
      setError(result.error);
      setNotice("The review did not finish.");
      return;
    }
    const visible = result.review.findings.filter((finding) => !kept.includes(keyOf(finding)));
    setFindings(result.review.findings);
    setReviewedBody(next);
    setSelected(visible[0]?.id ?? null);
    setPhase("done");
    setError(null);
    setNotice(
      `${message} ${visible.length} findings remain. Status ${result.review.status.replaceAll("_", " ")}. Draft not approved.`,
    );
  }

  function accept(finding: Finding) {
    if (!finding.suggestion) return;
    const next = finding.suggestion.proposedText;
    setBody(next);
    finish(next, "Correction accepted. The draft now uses the suggested wording. Nothing was saved or approved.");
  }

  function reject(finding: Finding) {
    setKept((current) => [...current, keyOf(finding)]);
    setNotice("Suggestion rejected. The original wording stays. Draft not approved.");
  }

  function choose(id: string) {
    setSelected(id);
    const node = marks.current[id];
    node?.focus();
    node?.scrollIntoView({ block: "nearest" });
  }

  function reset() {
    setBody(NORTHLINE_DRAFT);
    setReviewedBody(null);
    setFindings([]);
    setKept([]);
    setSelected(null);
    setPhase("idle");
    setError(null);
    setNotice("Demo reset. The original draft is back. Draft not approved.");
  }

  return (
    <section id="review" className="border-y border-[#101820]/10 bg-[#FFFDF8] text-[#101820]" aria-labelledby="studio-heading">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
        <h2 id="studio-heading" className="max-w-[14em] font-serif text-4xl leading-[1.05] tracking-[-0.03em] sm:text-5xl">
          Review the draft. Keep the decision.
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#3d4650]">{DEMO_LABEL}</p>
        <p className="mt-3 text-sm text-[#3d4650]" role="status">{notice}</p>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <Tabs defaultValue="copy">
            <TabsList className="h-auto w-full flex-wrap justify-start gap-1 bg-transparent p-0 sm:w-fit">
              <TabsTrigger value="copy" className="min-h-10 rounded-md px-3 data-active:bg-[#101820] data-active:text-[#F7F5EF]">Copy Review</TabsTrigger>
              <TabsTrigger value="evidence" className="min-h-10 rounded-md px-3 data-active:bg-[#101820] data-active:text-[#F7F5EF]">Claim Evidence</TabsTrigger>
              <TabsTrigger value="terms" className="min-h-10 rounded-md px-3 data-active:bg-[#101820] data-active:text-[#F7F5EF]">Brand Terminology</TabsTrigger>
              <TabsTrigger value="access" className="min-h-10 rounded-md px-3 data-active:bg-[#101820] data-active:text-[#F7F5EF]">Accessibility</TabsTrigger>
            </TabsList>
            <TabsContent value="copy" className="mt-4">
              <label htmlFor="demo-draft" className="text-sm font-medium">Marketing draft</label>
              <textarea
                id="demo-draft"
                value={body}
                onChange={(event) => setBody(event.target.value)}
                rows={8}
                className="mt-2 w-full resize-y rounded-lg border border-[#101820]/15 bg-[#F7F5EF] p-4 font-serif text-lg leading-relaxed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#101820]"
              />
              <HighlightedDraft
                body={body}
                findings={reviewedBody === body ? active : []}
                selected={selected}
                marks={marks}
              />
            </TabsContent>
            <TabsContent value="evidence" className="mt-4">
              <KitNotes
                heading="Fictional claim notes"
                items={NORTHLINE_KIT.sources
                  .filter((source) => source.id !== "src_term_guide")
                  .map((source) => ({ title: source.title, body: source.excerpt }))}
              />
            </TabsContent>
            <TabsContent value="terms" className="mt-4">
              <KitNotes
                heading="Fictional terminology"
                items={NORTHLINE_KIT.termRules.map((rule) => ({
                  title: rule.terms.join(", "),
                  body: `${rule.message} Preferred wording: ${rule.preferredReplacement ?? "none listed"}.`,
                }))}
              />
            </TabsContent>
            <TabsContent value="access" className="mt-4 rounded-lg border border-[#101820]/10 p-4 text-sm leading-relaxed text-[#3d4650]">
              This draft has no color tokens to compare. A full accessibility audit is not implemented. In the workspace, a published kit with color tokens can flag an unknown hex or a contrast pair below 4.5:1. That check is shallow, and it is skipped here.
            </TabsContent>
          </Tabs>

          <aside className="flex flex-col gap-4 rounded-xl border border-[#101820]/10 bg-[#F7F5EF] p-4 sm:p-5" aria-label="Review findings">
            <p className="text-sm font-medium">Draft not approved.</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="min-h-12 rounded-md bg-[#101820] px-5 text-sm font-medium text-[#F7F5EF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#101820] disabled:opacity-60" disabled={phase === "running"} onClick={run}>
                {phase === "running" ? "Running one pass…" : "Run review"}
              </button>
              <button type="button" className="min-h-12 rounded-md border border-[#101820]/15 bg-[#FFFDF8] px-4 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#101820]" onClick={reset}>
                Reset demo
              </button>
            </div>
            {phase === "running" ? (
              <p className="text-sm text-[#3d4650]">One deterministic pass checks terminology, claim evidence, and factual statements together.</p>
            ) : null}
            {stale ? <p className="text-sm text-[#3d4650]">The draft changed. Run review to refresh the findings.</p> : null}
            {phase === "empty" ? <p className="text-sm">Add a draft before running a review.</p> : null}
            {phase === "error" && error ? <p role="alert" className="text-sm text-[#9f3a32]">{error}</p> : null}
            {phase === "done" ? (
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <Count label="Supported" value={counts.verified} />
                <Count label="Contradicted" value={counts.contradicted} />
                <Count label="Unsupported" value={counts.unsupported} />
                <Count label="Terminology" value={counts.policy_hit} />
              </dl>
            ) : (
              <p className="text-sm leading-relaxed text-[#3d4650]">
                Run review to see four honest results on this draft: a terminology mismatch, an unsupported claim, a contradicted launch year, and a sentence the fictional note supports. Counts appear only after that pass.
              </p>
            )}
            {phase === "done" || active.length > 0 ? (
              <FindingList
                findings={active}
                selected={selected}
                onSelect={choose}
                onAccept={accept}
                onReject={reject}
                empty={phase === "done" ? "No findings on this draft." : "Run review to list findings."}
              />
            ) : null}
          </aside>
        </div>
      </div>
    </section>
  );
}

function keyOf(finding: Finding): string {
  return `${finding.ruleId ?? finding.summary}|${finding.matchedText ?? ""}`;
}

function countFindings(findings: Finding[]) {
  return {
    verified: findings.filter((finding) => finding.status === "verified").length,
    contradicted: findings.filter((finding) => finding.status === "contradicted").length,
    unsupported: findings.filter((finding) => finding.status === "unsupported").length,
    policy_hit: findings.filter((finding) => finding.status === "policy_hit").length,
  };
}

function Count({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-[#101820]/10 px-3 py-2">
      <dt className="text-[#5c6570]">{label}</dt>
      <dd className="font-serif text-2xl">{value}</dd>
    </div>
  );
}

function HighlightedDraft({
  body,
  findings,
  selected,
  marks,
}: {
  body: string;
  findings: Finding[];
  selected: string | null;
  marks: { current: Record<string, HTMLElement | null> };
}) {
  if (findings.length === 0) return null;
  const pieces = sliceBody(body, findings);
  return (
    <div className="mt-4">
      <p className="text-xs text-[#5c6570]">Marked passages from this review</p>
      <p className="mt-2 font-serif text-lg leading-relaxed">
        {pieces.map((piece, index) =>
          piece.finding ? (
            <mark
              key={`${piece.finding.id}-${index}`}
              ref={(node) => {
                marks.current[piece.finding!.id] = node;
              }}
              tabIndex={-1}
              className={`rounded-sm px-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#101820] ${TONE[piece.finding.status] ?? "bg-[#d9d3c7]"} ${selected === piece.finding.id ? "outline outline-2 outline-[#101820]" : ""}`}
            >
              {piece.text}
            </mark>
          ) : (
            <span key={`text-${index}`}>{piece.text}</span>
          ),
        )}
      </p>
    </div>
  );
}

function KitNotes({ heading, items }: { heading: string; items: Array<{ title: string; body: string }> }) {
  return (
    <div className="rounded-lg border border-[#101820]/10 p-4">
      <p className="text-sm font-medium">{heading}</p>
      <p className="mt-1 text-sm text-[#5c6570]">Fictional demo content. These notes are not Inkloom guidelines.</p>
      <ul className="mt-4 flex flex-col gap-4">
        {items.map((item) => (
          <li key={item.title}>
            <p className="text-sm font-medium">{item.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-[#3d4650]">{item.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function sliceBody(body: string, findings: Finding[]) {
  const spans = findings
    .filter((finding) => finding.span && finding.span.end <= body.length)
    .sort((a, b) => (a.span?.start ?? 0) - (b.span?.start ?? 0));
  const pieces: Array<{ text: string; finding?: Finding }> = [];
  let cursor = 0;
  for (const finding of spans) {
    const start = finding.span?.start ?? 0;
    const end = finding.span?.end ?? start;
    if (start < cursor) continue;
    if (start > cursor) pieces.push({ text: body.slice(cursor, start) });
    pieces.push({ text: body.slice(start, end), finding });
    cursor = end;
  }
  if (cursor < body.length) pieces.push({ text: body.slice(cursor) });
  return pieces;
}

function FindingList({
  findings,
  selected,
  onSelect,
  onAccept,
  onReject,
  empty,
}: {
  findings: Finding[];
  selected: string | null;
  onSelect: (id: string) => void;
  onAccept: (finding: Finding) => void;
  onReject: (finding: Finding) => void;
  empty: string;
}) {
  if (findings.length === 0) {
    return <p className="text-sm leading-relaxed text-[#3d4650]">{empty}</p>;
  }
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-[#5c6570]">Select a finding to inspect its evidence.</p>
      <ul className="flex flex-col gap-3">
      {findings.map((finding) => (
        <li key={finding.id}>
          <button
            type="button"
            className={`w-full rounded-lg border px-3 py-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#101820] ${selected === finding.id ? "border-[#101820]" : "border-[#101820]/10"}`}
            aria-expanded={selected === finding.id}
            onClick={() => onSelect(finding.id)}
          >
            <span className="text-xs text-[#5c6570]">{plainStatus(finding.status)} · {finding.severity}</span>
            <span className="mt-1 block text-sm font-medium">{finding.summary}</span>
          </button>
          {selected === finding.id ? (
            <div className="px-3 py-3 text-sm leading-relaxed text-[#3d4650]">
              <p>{finding.rationale}</p>
              {finding.evidenceGapReason ? <p className="mt-2">Evidence gap: {finding.evidenceGapReason}</p> : null}
              {finding.citationIds.length > 0 ? (
                <p className="mt-2">
                  Fictional demo source: {finding.citationIds.map(sourceTitle).join(", ")}.{" "}
                  {NORTHLINE_KIT.sources.find((source) => source.id === finding.citationIds[0])?.excerpt}
                </p>
              ) : (
                <p className="mt-2">No citation is attached to this finding. Missing evidence is not proof the claim is false.</p>
              )}
              {finding.suggestion ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" className="min-h-11 rounded-md bg-[#101820] px-3 text-[#F7F5EF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#101820]" onClick={() => onAccept(finding)}>
                    Accept correction
                  </button>
                  <button type="button" className="min-h-11 rounded-md border border-[#101820]/15 px-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#101820]" onClick={() => onReject(finding)}>
                    Reject suggestion
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </li>
      ))}
      </ul>
    </div>
  );
}
