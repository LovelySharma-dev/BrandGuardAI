"use client";

import { useEffect, useState } from "react";

const BEATS = [
  {
    title: "A draft is written.",
    body: "Meet the next generation of everyday care.",
    note: "The sentence is only a draft.",
  },
  {
    title: "A discrepancy appears.",
    body: "Northline is a clinically proven miracle cure.",
    note: "“Miracle cure” is not approved wording. “Clinically proven” has no study in the kit.",
  },
  {
    title: "Evidence is inspected.",
    body: "Northline launched in 2014.",
    note: "The fictional launch note says 2021. The claim conflicts with that note.",
  },
  {
    title: "A correction is proposed.",
    body: "Use “daily care”. Hold “clinically proven” until a study is attached.",
    note: "The suggestion is a proposal. It does not approve the draft.",
  },
  {
    title: "A human decides.",
    body: "Accept the wording, keep the original, or ask for evidence.",
    note: "This page cannot record that decision. The workspace can, for a signed-in reviewer.",
  },
] as const;

export function ScrollStory() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const nodes = document.querySelectorAll<HTMLElement>("[data-story-beat]");
      // A full-screen window can show every beat at once. A single intersection
      // threshold then stops firing, so the reading card stays on the first beat.
      const line = window.innerHeight * 0.42;
      let best = -1;
      let bestDistance = Number.POSITIVE_INFINITY;
      nodes.forEach((node, index) => {
        const rect = node.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) return;
        const distance = Math.abs(rect.top + rect.height / 2 - line);
        if (distance < bestDistance) {
          bestDistance = distance;
          best = index;
        }
      });
      if (best < 0) return;
      setActive((current) => (current === best ? current : best));
    };
    const requestUpdate = () => {
      if (frame !== 0) return;
      frame = window.requestAnimationFrame(update);
    };
    requestUpdate();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    return () => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section id="platform" className="bg-[#F6F4EE] text-[#0A1018]" aria-labelledby="story-heading">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:py-28">
        <div>
          <p className="text-sm text-[#8492A6]">Fictional Northline campaign</p>
          <h2 id="story-heading" className="mt-3 max-w-[12em] font-serif text-4xl leading-[1.05] tracking-[-0.03em] sm:text-5xl">
            From a draft to a decision.
          </h2>
          <article className="mt-8 max-lg:hidden rounded-xl border border-[#0A1018]/10 bg-white p-5 lg:sticky lg:top-28">
            <p className="text-xs tracking-[0.14em] text-[#8492A6]">NOW READING</p>
            <p className="mt-3 font-serif text-2xl leading-snug">{BEATS[active]?.body}</p>
            <p className="mt-3 text-sm leading-relaxed text-[#111C29]">{BEATS[active]?.note}</p>
          </article>
        </div>
        <ol className="flex flex-col gap-4">
          {BEATS.map((beat, index) => (
            <li
              key={beat.title}
              data-story-beat={index}
              className={`rounded-xl border p-5 transition-colors duration-300 ${active === index ? "border-[#0A1018] bg-white" : "border-[#0A1018]/10 bg-[#F6F4EE]"}`}
            >
              <p className="font-serif text-3xl text-[#0A1018]">0{index + 1}</p>
              <h3 className="mt-3 text-xl font-medium">{beat.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-[#111C29]">{beat.note}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
