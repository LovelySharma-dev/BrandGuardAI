"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { transitionReviewAction } from "@/app/actions/review";
import { Button } from "@/components/ui/button";
import type { ReviewAction } from "@/domain/workflow";

const ACTIONS: { action: ReviewAction; label: string; variant: "default" | "outline" | "destructive" }[] = [
  { action: "approve", label: "Approve", variant: "default" },
  { action: "request_changes", label: "Request changes", variant: "outline" },
  { action: "reject", label: "Reject", variant: "destructive" },
];

export function ApprovalActions({ reviewId }: { reviewId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function decide(action: ReviewAction) {
    setError(null);
    startTransition(async () => {
      const result = await transitionReviewAction(reviewId, action);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap justify-end gap-2">
        {ACTIONS.map((item) => (
          <Button
            key={item.action}
            type="button"
            variant={item.variant}
            size="sm"
            disabled={pending}
            onClick={() => decide(item.action)}
          >
            {item.label}
          </Button>
        ))}
      </div>
      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
