import type { Metadata } from "next";

import { LandingPage } from "@/components/marketing/landing-page";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: {
    absolute: "Evidence-gated brand review · BrandGuard AI",
  },
  description:
    "BrandGuard reviews a draft against a published brand kit. Findings cite approved sources or name the evidence gap. A person approves the draft.",
};

export default async function HomePage() {
  const user = await getCurrentUser();
  return <LandingPage signedIn={Boolean(user)} />;
}
