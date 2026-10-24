import Link from "next/link";

const FEATURES = [
  {
    title: "Brand terminology checks",
    state: "Implemented",
    body: "Banned and preferred terms are checked against the published kit.",
    href: "/knowledge",
  },
  {
    title: "Promotional claim review",
    state: "Implemented",
    body: "Absolute claims stay unsupported until an approved source can verify them.",
    href: "/reviews/new",
  },
  {
    title: "Evidence integrity",
    state: "Implemented",
    body: "Citations outside the retrieval snapshot are dropped. The finding is not upgraded.",
    href: "/reviews",
  },
  {
    title: "Correction review",
    state: "Implemented",
    body: "Accept writes a revision. Reject leaves the sentence. Neither action approves the draft.",
    href: "/reviews",
  },
  {
    title: "Accessibility checks",
    state: "Partial",
    body: "Contrast is checked only when a kit has color tokens and a pair is below 4.5:1. A full document audit is planned.",
    href: null,
  },
  {
    title: "Visual consistency checks",
    state: "Partial",
    body: "An unknown hex can be flagged when the kit lists tokens. Logo and layout review are planned.",
    href: null,
  },
] as const;

export function FeatureStrip({ signedIn }: { signedIn: boolean }) {
  return (
    <section className="bg-[#F7F5EF] text-[#101820]" aria-labelledby="features-heading">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
        <h2 id="features-heading" className="max-w-[12em] font-serif text-4xl leading-[1.05] tracking-[-0.03em] sm:text-5xl">
          What the product does today.
        </h2>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <li key={feature.title} className="group rounded-xl border border-[#101820]/10 bg-[#FFFDF8] p-5 transition-colors duration-200 hover:border-[#0A1018]/30">
              <FeatureMark title={feature.title} />
              <p className="text-xs font-medium text-[#5c6570]">{feature.state}</p>
              <h3 className="mt-3 text-lg font-medium">{feature.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-[#3d4650]">{feature.body}</p>
              {feature.href ? (
                <Link href={signedIn ? feature.href : "/login"} className="mt-4 inline-flex min-h-11 items-center text-sm font-medium underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#101820]">
                  {signedIn ? "Open in workspace" : "Sign in to open"}
                </Link>
              ) : (
                <p className="mt-4 text-sm text-[#5c6570]">No separate page yet.</p>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function FeatureMark({ title }: { title: string }) {
  return (
    <svg aria-hidden viewBox="0 0 72 16" className="mb-4 h-4 w-16 text-[#0A1018]">
      {title.startsWith("Brand") ? <path d="M2 8 H28 M36 8 H70" fill="none" stroke="currentColor" strokeWidth="1.4" /> : null}
      {title.startsWith("Promotional") ? <path d="M4 12 C20 2 40 2 68 12" fill="none" stroke="currentColor" strokeWidth="1.4" /> : null}
      {title.startsWith("Evidence") ? <path d="M4 8 H68" fill="none" stroke="currentColor" strokeWidth="1.4" /> : null}
      {title.startsWith("Correction") ? <path d="M4 4 H40 M4 12 H58" fill="none" stroke="currentColor" strokeWidth="1.4" /> : null}
      {title.startsWith("Accessibility") ? <circle cx="12" cy="8" r="5" fill="none" stroke="currentColor" strokeWidth="1.4" /> : null}
      {title.startsWith("Visual") ? <rect x="4" y="2" width="18" height="12" fill="none" stroke="currentColor" strokeWidth="1.4" /> : null}
    </svg>
  );
}
