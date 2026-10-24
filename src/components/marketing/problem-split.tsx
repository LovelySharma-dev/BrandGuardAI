"use client";

import { useState } from "react";

export function ProblemSplit() {
  const [side, setSide] = useState<"before" | "after">("before");
  const messy = side === "before";

  return (
    <section className="bg-[#F6F4EE] text-[#0A1018]" aria-labelledby="problem-heading">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
        <p className="text-sm text-[#5c6570]">Illustrative. Not a customer incident.</p>
        <h2 id="problem-heading" className="mt-3 max-w-[12em] font-serif text-4xl leading-[1.05] tracking-[-0.03em] sm:text-5xl">
          Small inconsistencies. Big consequences.
        </h2>
        <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Campaign comparison">
          <button type="button" aria-pressed={messy} className={toggleClass(messy)} onClick={() => setSide("before")}>
            Before review
          </button>
          <button type="button" aria-pressed={!messy} className={toggleClass(!messy)} onClick={() => setSide("after")}>
            After a human correction
          </button>
        </div>
        <div className="mt-8 grid overflow-hidden rounded-xl border border-[#101820]/10 bg-[#FFFDF8] md:grid-cols-2">
          <article className={`p-6 ${messy ? "bg-[#FFFDF8]" : "bg-[#F7F5EF] text-[#5c6570]"}`}>
            <p className="text-xs">Fragmented draft</p>
            <div className="mt-5 flex gap-2" aria-hidden>
              <span className="size-8 rounded-sm bg-[#1f6b45]" />
              <span className="size-8 rounded-sm bg-[#9ccc65]" />
              <span className="mt-3 size-8 rounded-sm bg-[#c8e6c9]" />
            </div>
            <p className="mt-5 font-serif text-2xl leading-snug">
              <span className="underline decoration-[#E9A23B] decoration-2 underline-offset-4">Miracle cure</span>
              , clinically proven.
            </p>
            <p className="mt-3 max-w-[16rem] font-serif text-2xl leading-snug">Launched in 2014. Or was it 2021?</p>
          </article>
          <article className={`border-t border-[#101820]/10 p-6 md:border-t-0 md:border-l ${messy ? "bg-[#F7F5EF] text-[#5c6570]" : "bg-[#FFFDF8] text-[#101820]"}`}>
            <p className="text-xs">Corrected draft · still not approved</p>
            <div className="mt-5" aria-hidden>
              <span className="block size-8 rounded-sm bg-[#1f6b45]" />
            </div>
            <p className="mt-5 max-w-[18rem] font-serif text-2xl leading-snug">Daily care. The claim waits for a study.</p>
            <p className="mt-3 font-serif text-2xl leading-snug">Northline launched in 2021.</p>
          </article>
        </div>
        <ul className="mt-8 grid gap-4 text-sm leading-relaxed text-[#3d4650] sm:grid-cols-2">
          <li>Approved wording drifts across channels.</li>
          <li>Promotional claims lose their supporting evidence.</li>
          <li>Visual assets no longer match the approved identity.</li>
          <li>Teams cannot explain why content passed review.</li>
        </ul>
      </div>
    </section>
  );
}

function toggleClass(active: boolean) {
  return `min-h-11 rounded-md px-4 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#101820] ${active ? "bg-[#101820] text-[#F7F5EF]" : "border border-[#101820]/15 bg-[#FFFDF8]"}`;
}
