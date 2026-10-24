const STAGES = [
  {
    index: "01",
    title: "Connect the guidelines",
    body: "Start with approved terminology, brand rules, claims, and assets.",
    now: "Implemented. An admin edits a draft kit, then publishes it. A review stays pinned to the published version it used.",
  },
  {
    index: "02",
    title: "Review the content",
    body: "Check wording, claims, brand consistency, accessibility, and visual requirements where supported.",
    now: "Implemented for terminology, promotional claims, and factual claims. Color checks run only when the published kit has tokens. A full accessibility audit and logo review are not built.",
  },
  {
    index: "03",
    title: "Inspect the evidence",
    body: "Read the finding, its explanation, the available source, and any uncertainty.",
    now: "Implemented. A citation is kept only when its id was in that review’s retrieval snapshot. A missing source stays unsupported.",
  },
  {
    index: "04",
    title: "Decide with confidence",
    body: "Accept a correction, reject it, request evidence, or send the content to a human reviewer.",
    now: "Accept and reject are implemented and write a revision. Approval is a separate action for a reviewer. The product does not publish on its own.",
  },
] as const;

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-[#F7F5EF] text-[#101820]" aria-labelledby="how-heading">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
        <h2 id="how-heading" className="max-w-[14em] font-serif text-4xl leading-[1.05] tracking-[-0.03em] sm:text-5xl">
          Four steps. A person still decides.
        </h2>
        <ol className="mt-12 grid gap-px overflow-hidden rounded-xl border border-[#101820]/10 bg-[#101820]/10 md:grid-cols-4">
          {STAGES.map((stage) => (
            <li key={stage.index} className="bg-[#FFFDF8] p-5">
              <p className="font-serif text-3xl">{stage.index}</p>
              <h3 className="mt-4 text-lg font-medium">{stage.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-[#3d4650]">{stage.body}</p>
              <p className="mt-4 border-t border-[#101820]/10 pt-4 text-sm leading-relaxed text-[#3d4650]">{stage.now}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
