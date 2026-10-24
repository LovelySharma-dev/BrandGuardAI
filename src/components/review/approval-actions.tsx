"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { transitionReviewAction } from "@/app/actions/review";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ReviewAction } from "@/domain/workflow";

const ACTIONS: { action: ReviewAction; label: string; variant: "default" | "outline" | "destructive" }[] = [
  { action: "approve", label: "Approve", variant: "default" },
  { action: "request_changes", label: "Request changes", variant: "outline" },
  { action: "reject", label: "Reject", variant: "destructive" },
];

export function ApprovalActions({ reviewId }: { reviewId: string }) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function decide(action: ReviewAction) {
    setError(null);
    const note = reason.trim();
    if ((action === "reject" || action === "request_changes") && note.length < 8) {
      setError("Add a short reason before requesting changes or rejecting.");
      return;
    }
    startTransition(async () => {
      const result = await transitionReviewAction(reviewId, {
        action,
        reason: note || undefined,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex w-full min-w-0 flex-col items-stretch gap-2 sm:items-end">
      <div className="flex w-full min-w-0 flex-col gap-1 sm:max-w-sm">
        <Label htmlFor={`decision-reason-${reviewId}`}>Decision note</Label>
        <Textarea
          id={`decision-reason-${reviewId}`}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Required for request changes and reject"
          className="min-h-16"
        />
      </div>
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
