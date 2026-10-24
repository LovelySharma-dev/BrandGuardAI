const STEPS = [
  { index: "01", title: "Explain the finding.", body: "Name the status, the severity, and the reason. Unsupported, contradicted, and indeterminate stay distinct." },
  { index: "02", title: "Inspect the evidence.", body: "A citation stays only when its id was in that review’s retrieval snapshot. A missing source stays a gap." },
  { index: "03", title: "Decide what happens next.", body: "Accept a correction, keep the original, request evidence, or send the draft to a reviewer. None of those actions publish it." },
] as const;

const POINTS = [
  { title: "Human-controlled corrections", body: "A suggestion stays a proposal until someone accepts it. Accepting it revises the draft. It does not approve the draft." },
  { title: "Review history", body: "Workspace reviews keep an append-only audit of transitions. This public page does not write that history." },
  { title: "Permission-aware approvals", body: "The server checks the signed-in role before a reviewer can approve, request changes, or reject." },
  { title: "Confidential drafts", body: "Workspace drafts are scoped to the organization. A PDF import is read for candidate sentences and is not stored as a file. There is no public privacy-policy page yet." },
] as const;

export function Governance() {
  return (
    <section id="trust" className="bg-[#111C29] text-[#F6F4EE]" aria-labelledby="governance-heading">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
        <h2 id="governance-heading" className="max-w-[14em] font-serif text-4xl leading-[1.05] tracking-[-0.03em] sm:text-5xl">
          AI can flag the problem. People own the decision.
        </h2>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[#F6F4EE]/80">
          Missing evidence is a reason to investigate—not proof that a claim is false.
        </p>
        <ol className="mt-10 grid gap-4 md:grid-cols-3">
          {STEPS.map((step) => (
            <li key={step.index} className="rounded-xl border border-[#F6F4EE]/12 p-5">
              <p className="font-serif text-3xl text-[#A7F3C3]">{step.index}</p>
              <h3 className="mt-4 text-lg font-medium">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-[#F6F4EE]/75">{step.body}</p>
            </li>
          ))}
        </ol>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {POINTS.map((point) => (
            <li key={point.title} className="border-t border-[#F6F4EE]/10 pt-4">
              <h3 className="text-base font-medium">{point.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#8492A6]">{point.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
