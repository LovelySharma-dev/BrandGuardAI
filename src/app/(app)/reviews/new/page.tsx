import { AppShell } from "@/components/layout/app-shell";
import { ReviewWorkspace } from "@/components/review/review-workspace";
import { getPublishedBrandKit } from "@/db/brand-kits";
import { requireUser } from "@/lib/session";

export const metadata = { title: "New review" };

export default async function NewReviewPage() {
  const user = await requireUser();
  const kit = await getPublishedBrandKit(user.orgId);
  return (
    <AppShell
      title="Review workspace"
      description="Submit copy, inspect evidence-backed findings, and accept or reject corrections."
    >
      <ReviewWorkspace sources={kit?.sources ?? []} />
    </AppShell>
  );
}
