import Link from "next/link";

import { EvidenceBand } from "@/components/marketing/evidence-band";
import { FeatureStrip } from "@/components/marketing/feature-strip";
import { Governance } from "@/components/marketing/governance";
import { HeroRoom } from "@/components/marketing/hero-room";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { ProblemSplit } from "@/components/marketing/problem-split";
import { ReviewStudio } from "@/components/marketing/review-studio";
import { ScrollStory } from "@/components/marketing/scroll-story";
import { SiteNav } from "@/components/marketing/site-nav";

export function LandingPage({ signedIn }: { signedIn: boolean }) {
  const workspaceHref = signedIn ? "/dashboard" : "/login";
  const reviewHref = signedIn ? "/reviews/new" : "/login";

  return (
    <div className="room overflow-x-clip bg-[#F6F4EE] text-[#0A1018]">
      <div className="bg-[#0A1018]">
        <SiteNav workspaceHref={workspaceHref} workspaceLabel="Open Workspace" />
        <HeroRoom enterHref={reviewHref} enterLabel="Review your first draft" />
      </div>
      <main id="content">
        <ScrollStory />
        <ProblemSplit />
        <ReviewStudio />
        <EvidenceBand />
        <HowItWorks />
        <Governance />
        <FeatureStrip signedIn={signedIn} />
        <section className="relative bg-[#0A1018] text-[#F6F4EE]" aria-labelledby="close-heading">
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(246,244,238,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(246,244,238,0.05)_1px,transparent_1px)] bg-[size:48px_48px]" />
          <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
            <h2 id="close-heading" className="max-w-[12em] font-serif text-4xl leading-[1.05] tracking-[-0.03em] sm:text-5xl">
              Make every publication a considered decision.
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-[#F6F4EE]/78">
              Put evidence, consistency, and human judgment between the first draft and the outside world.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={workspaceHref} className="inline-flex min-h-11 items-center rounded-md bg-[#A7F3C3] px-5 text-sm font-medium text-[#0A1018] shadow-[0_0_0_1px_rgba(167,243,195,0.4)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A7F3C3]">
                Open BrandGuard AI
              </Link>
              <a href="#review" className="inline-flex min-h-11 items-center rounded-md border border-[#F6F4EE]/25 px-5 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F6F4EE]">
                Explore the interactive demo
              </a>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t border-[#F6F4EE]/10 bg-[#0A1018] text-[#F6F4EE]">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="font-medium">BrandGuard AI</p>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2">
            <a href="#platform" className="inline-flex min-h-11 items-center">Platform</a>
            <Link href={workspaceHref} className="inline-flex min-h-11 items-center">Workspace</Link>
            <a href="#trust" className="inline-flex min-h-11 items-center">Trust & Evidence</a>
            <a href="#trust" className="inline-flex min-h-11 items-center">Privacy</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
