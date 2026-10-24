"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { NORTHLINE_KIT } from "@/components/marketing/northline-kit";
import { useReducedMotion } from "@/components/marketing/use-reduced-motion";

const ORIGINAL =
  "Meet the next generation of everyday care. Northline is a clinically proven miracle cure. Northline launched in 2014. Northline launched in 2021.";
const ACCEPTED = ORIGINAL.replace("miracle cure", "daily care");
const SETTLED = 7;

const MARKS = [
  { phrase: "miracle cure", label: "Terminology mismatch", detail: "Policy hit. The note says “daily care”.", tone: "amber" as const, sourceId: "src_term_guide" },
  { phrase: "clinically proven", label: "Evidence needed", detail: "Unsupported. Missing evidence is not a verdict of false.", tone: "amber" as const, sourceId: null },
  { phrase: "Northline launched in 2014.", label: "Contradicted", detail: "The fictional launch note says 2021.", tone: "coral" as const, sourceId: "src_fact_launch" },
  { phrase: "Northline launched in 2021.", label: "Supported", detail: "The fictional launch note supports this sentence. The draft is not approved.", tone: "mint" as const, sourceId: "src_fact_launch" },
];

const LABEL = {
  amber: "text-[#F3B65E]",
  coral: "text-[#F0B4AC]",
  mint: "text-[#A7F3C3]",
} as const;

const MARK = {
  amber: "bg-[#F3B65E]/45",
  coral: "bg-[#f3c7c1]",
  mint: "bg-[#A7F3C3]/80",
} as const;

export function HeroRoom({ enterHref, enterLabel }: { enterHref: string; enterLabel: string }) {
  const reduced = useReducedMotion();
  const [step, setStep] = useState(SETTLED);
  const [play, setPlay] = useState(0);
  const [draft, setDraft] = useState(ORIGINAL);
  const [decision, setDecision] = useState<"open" | "accepted" | "kept">("open");
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (play === 0 || reduced) return;
    const start = window.setTimeout(() => setStep(0), 0);
    const times = [280, 620, 980, 1340, 1700, 2060, 2420];
    const timers = times.map((delay, index) => window.setTimeout(() => setStep(index + 1), delay));
    return () => {
      window.clearTimeout(start);
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [reduced, play]);

  function replay() {
    setDraft(ORIGINAL);
    setDecision("open");
    setSelected(null);
    setPlay((value) => value + 1);
  }

  function accept() {
    setDraft(ACCEPTED);
    setDecision("accepted");
  }

  function keep() {
    setDraft(ORIGINAL);
    setDecision("kept");
  }

  return (
    <section className="bg-[#0A1018] text-[#F6F4EE]" aria-labelledby="hero-heading">
      <div className="mx-auto grid max-w-6xl items-start gap-10 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:py-12">
        <div>
          <p className="text-xs tracking-[0.16em] text-[#A7F3C3]">BRAND GOVERNANCE · WITH EVIDENCE</p>
          <h1 id="hero-heading" className="mt-4 max-w-[11em] font-serif text-[clamp(2.5rem,4.6vw,4.15rem)] leading-[0.96] tracking-[-0.03em] text-balance">
            Your brand deserves
            <br />
            more than a <span className="text-[#A7F3C3]">spellcheck.</span>
          </h1>
          <p className="mt-5 max-w-[34rem] text-lg leading-relaxed text-[#F6F4EE]/78">
            Every claim. Every phrase. Every asset. Reviewed against what your brand actually stands for.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href={enterHref} className="inline-flex min-h-11 items-center rounded-md bg-[#A7F3C3] px-5 text-sm font-medium text-[#0A1018] transition-transform duration-150 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A7F3C3]">
              {enterLabel}
            </Link>
            <button
              type="button"
              className="inline-flex min-h-11 items-center rounded-md border border-[#F6F4EE]/30 px-5 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F6F4EE]"
              onClick={replay}
            >
              Watch the review unfold
            </button>
          </div>
          <p className="mt-5 text-sm text-[#F6F4EE]/70">
            Evidence-linked findings. Human-controlled decisions.{" "}
            <a href="#review" className="text-[#73DCEB] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#73DCEB]">
              Open the full demo
            </a>
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border border-[#F6F4EE]/12 bg-[#111C29]" aria-label="Sample review, fictional Northline campaign">
          <div className="flex items-center justify-between gap-3 border-b border-[#F6F4EE]/10 px-4 py-3 text-xs text-[#8492A6]">
            <span>Fictional Northline</span>
            <span className="inline-flex items-center gap-2">
              {play > 0 && step < SETTLED ? <ProgressRing /> : null}
              <span className={step >= SETTLED ? "text-[#F3B65E]" : "text-[#8492A6]"}>
                {step >= SETTLED ? "Draft not approved" : step >= 1 ? "Scanning" : "Draft"}
              </span>
            </span>
          </div>
          <div className="grid md:grid-cols-[minmax(0,1fr)_13.5rem]">
            <div className="relative min-h-44 overflow-hidden bg-white p-4 text-[#0A1018] sm:p-5">
              {step === 1 ? <span aria-hidden className="room-scan pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-[#A7F3C3]/50 to-transparent" /> : null}
              <p className="font-serif text-xl leading-relaxed">{renderMarked(draft, step >= 2 || step >= SETTLED, step, decision)}</p>
              <p className="mt-4 border-t border-[#0A1018]/10 pt-3 text-sm leading-snug">
                <span className={decision === "accepted" ? "text-[#8492A6] line-through" : "text-[#0A1018]"}>miracle cure</span>
                <span className="px-2 text-[#5c6570]" aria-hidden>→</span>
                <span className={decision === "accepted" ? "rounded-sm bg-[#A7F3C3] px-1 text-[#0A1018]" : "text-[#0A1018]"}>daily care</span>
                <span className="mt-1 block text-[#5c6570]">Suggested change for one phrase. Accepting it does not approve the draft.</span>
              </p>
            </div>
            <div className="border-t border-[#F6F4EE]/10 p-4 md:border-t-0 md:border-l">
              <p className="text-xs text-[#8492A6]">Select a finding to read its evidence.</p>
              <ul className="mt-3 flex flex-col gap-2">
                {MARKS.map((mark, index) => {
                  const resolved = decision === "accepted" && mark.phrase === "miracle cure";
                  const visible = step >= 2 && (step >= SETTLED || step - 2 === index);
                  return (
                    <li key={mark.phrase} className={visible ? "" : "opacity-70"}>
                      <button
                        type="button"
                        aria-pressed={selected === mark.phrase}
                        className={`w-full rounded-md px-2 py-2 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A7F3C3] ${selected === mark.phrase ? "bg-[#0A1018]" : ""}`}
                        onClick={() => setSelected(mark.phrase)}
                      >
                        <span className={`text-sm font-medium ${resolved ? "text-[#A7F3C3]" : LABEL[mark.tone]}`}>
                          {resolved ? "Correction accepted" : mark.label}
                        </span>
                        <span className="mt-1 block text-xs leading-snug text-[#8492A6]">
                          {resolved ? "“daily care” replaced the banned phrase. Draft not approved." : mark.detail}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 border-t border-[#F6F4EE]/10 px-4 py-3">
            <button type="button" aria-pressed={decision === "accepted"} className="min-h-11 rounded-md bg-[#A7F3C3] px-3 text-sm font-medium text-[#0A1018] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A7F3C3]" onClick={accept}>
              Accept correction
            </button>
            <button type="button" aria-pressed={decision === "kept"} className="min-h-11 rounded-md border border-[#F6F4EE]/25 px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F6F4EE]" onClick={keep}>
              Keep original
            </button>
            <button type="button" className="min-h-11 px-2 text-sm text-[#73DCEB] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#73DCEB]" onClick={replay}>
              Replay review
            </button>
            <p className="min-h-12 w-full text-xs leading-relaxed text-[#F6F4EE]/80" aria-live="polite">
              {evidenceFor(selected)}
            </p>
            <p className="w-full text-xs text-[#8492A6]" role="status">
              {decision === "accepted"
                ? "Correction accepted in this preview. Draft not approved."
                : decision === "kept"
                  ? "Original wording kept. Draft not approved."
                  : "A person still chooses. Nothing here is saved. Draft not approved."}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function evidenceFor(phrase: string | null): string {
  const mark = MARKS.find((item) => item.phrase === phrase);
  if (!mark) return "Northline is fictional. Evidence for the selected finding appears here.";
  if (!mark.sourceId) return "No citation is attached. Missing evidence is not proof this claim is false.";
  const source = NORTHLINE_KIT.sources.find((item) => item.id === mark.sourceId);
  if (!source) return "No citation is attached. Missing evidence is not proof this claim is false.";
  return `Fictional source: ${source.title}. ${source.excerpt}`;
}

function ProgressRing() {
  return (
    <svg aria-hidden viewBox="0 0 36 36" className="size-6 text-[#8492A6]">
      <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.35" />
      <circle cx="18" cy="18" r="14" fill="none" stroke="#A7F3C3" strokeWidth="2" pathLength="1" className="room-ring is-on" />
    </svg>
  );
}

function paintDecision(text: string, decision: "open" | "accepted" | "kept") {
  if (decision !== "accepted" || !text.includes("daily care")) return text;
  const [before, after] = text.split("daily care");
  return (
    <>
      {before}
      <mark className="rounded-sm bg-[#A7F3C3]/80 px-0.5">daily care</mark>
      {after}
    </>
  );
}

function renderMarked(body: string, show: boolean, step: number, decision: "open" | "accepted" | "kept") {
  if (!show) return body;
  const parts: Array<{ text: string; mark?: (typeof MARKS)[number]; index: number }> = [];
  let cursor = 0;
  const ordered = MARKS.map((mark, index) => ({ mark, index })).sort(
    (a, b) => body.indexOf(a.mark.phrase) - body.indexOf(b.mark.phrase),
  );
  let seen = 0;
  for (const item of ordered) {
    const index = body.indexOf(item.mark.phrase, cursor);
    if (index === -1) continue;
    if (index > cursor) parts.push({ text: body.slice(cursor, index), index: seen });
    parts.push({ text: item.mark.phrase, mark: item.mark, index: item.index });
    cursor = index + item.mark.phrase.length;
    seen += 1;
  }
  if (cursor < body.length) parts.push({ text: body.slice(cursor), index: seen });
  return parts.map((part) =>
    part.mark ? (
      <mark
        key={part.mark.phrase}
        className={`rounded-sm px-0.5 ${step >= SETTLED || step - 2 === part.index ? MARK[part.mark.tone] : "bg-transparent"}`}
      >
        {part.text}
      </mark>
    ) : (
      <span key={`plain-${part.index}`}>{paintDecision(part.text, decision)}</span>
    ),
  );
}
