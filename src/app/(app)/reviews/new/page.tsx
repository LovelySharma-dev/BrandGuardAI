import { AppShell } from "@/components/layout/app-shell";
import { ReviewWorkspace } from "@/components/review/review-workspace";

export const metadata = { title: "New review" };

export default function NewReviewPage() {
  return (
    <AppShell
      title="Review workspace"
      description="Submit copy, inspect evidence-backed findings, and accept or reject corrections."
    >
      <ReviewWorkspace />
    </AppShell>
  );
}
