"use client";

import { useState } from "react";

const NODES = [
  {
    id: "draft",
    label: "Draft",
    body: "“Clinically proven” appears in the fictional Northline draft.",
  },
  {
    id: "finding",
    label: "Finding",
    body: "The status is unsupported. The phrase needs a source before anyone can call it true.",
  },
  {
    id: "evidence",
    label: "Evidence",
    body: "Fictional demo note: an approved study is required. This kit does not contain one. No citation is invented.",
  },
  {
    id: "decision",
    label: "Human decision",
    body: "Request supporting evidence, revise the wording, or send it to a reviewer. This page cannot approve the draft.",
  },
] as const;

const STATES = [
  { label: "Supported", copy: "Available evidence supports the statement.", swatch: "bg-[#A7F3C3] text-[#0A1018]" },
  { label: "Contradicted", copy: "Available evidence conflicts with the statement.", swatch: "bg-[#f3c7c1] text-[#0A1018]" },
  { label: "Unsupported", copy: "Evidence is insufficient or absent. That is a gap, not a false claim.", swatch: "bg-[#F3B65E] text-[#0A1018]" },
  { label: "Indeterminate", copy: "The available material cannot resolve the claim.", swatch: "bg-[#d9d3c7] text-[#0A1018]" },
] as const;

export function EvidenceBand() {
  const [selected, setSelected] = useState<(typeof NODES)[number]["id"]>("finding");
  const node = NODES.find((item) => item.id === selected) ?? NODES[1];

  return (
    <section id="evidence" className="bg-[#0A1018] text-[#F6F4EE]" aria-labelledby="evidence-heading">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
        <h2 id="evidence-heading" className="max-w-[14em] font-serif text-4xl leading-[1.05] tracking-[-0.03em] sm:text-5xl">
          Every finding has a story.
        </h2>
        <p className="mt-6 max-w-xl text-sm leading-relaxed text-[#8492A6]">Draft, then finding, then evidence, then a human decision.</p>
        <div className="mt-6">
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {NODES.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  aria-pressed={selected === item.id}
                  className={`min-h-20 w-full rounded-xl border px-4 py-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A7F3C3] ${selected === item.id ? "border-[#A7F3C3] bg-[#111C29]" : "border-[#F6F4EE]/12"}`}
                  onClick={() => setSelected(item.id)}
                >
                  <span className="text-xs tracking-[0.14em] text-[#73DCEB]">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-4 rounded-xl border border-[#F6F4EE]/12 bg-[#111C29] p-5" aria-live="polite">
            <h3 className="text-lg font-medium">{node.label}</h3>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#F6F4EE]/80">{node.body}</p>
          </div>
        </div>
        <ul className="mt-10 grid gap-3 sm:grid-cols-2">
          {STATES.map((state) => (
            <li key={state.label} className="flex items-start gap-3 rounded-lg border border-[#F6F4EE]/10 p-4">
              <span className={`mt-0.5 inline-flex rounded-md px-2 py-1 text-xs font-medium ${state.swatch}`}>{state.label}</span>
              <span className="text-sm leading-relaxed text-[#F6F4EE]/80">{state.copy}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
