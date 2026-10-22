"use client";

import {
  AlertTriangle,
  CheckCircle2,
  CircleHelp,
  Info,
  ShieldAlert,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Finding } from "@/domain/schemas";
import { DEMO_BRAND_KIT } from "@/data/seed-kit";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<Finding["status"], string> = {
  verified: "Verified",
  contradicted: "Contradicted",
  unsupported: "Unsupported",
  indeterminate: "Indeterminate",
  policy_hit: "Policy hit",
  suggestion_only: "Suggestion",
};

function StatusIcon({ status }: { status: Finding["status"] }) {
  const common = "size-4 shrink-0";
  switch (status) {
    case "verified":
      return <CheckCircle2 className={cn(common, "text-emerald-700")} aria-hidden />;
    case "contradicted":
      return <XCircle className={cn(common, "text-severity-blocker")} aria-hidden />;
    case "unsupported":
      return <CircleHelp className={cn(common, "text-severity-warning")} aria-hidden />;
    case "policy_hit":
      return <ShieldAlert className={cn(common, "text-severity-warning")} aria-hidden />;
    case "indeterminate":
      return <AlertTriangle className={cn(common, "text-muted-foreground")} aria-hidden />;
    default:
      return <Info className={cn(common, "text-severity-info")} aria-hidden />;
  }
}

function sourceTitle(id: string): string {
  return DEMO_BRAND_KIT.sources.find((s) => s.id === id)?.title ?? id;
}

export function FindingCard({
  finding,
  originalBody,
  busy,
  onAccept,
  onReject,
}: {
  finding: Finding;
  originalBody: string;
  busy?: boolean;
  onAccept?: (suggestionId: string) => void;
  onReject?: (suggestionId: string) => void;
}) {
  const suggestion = finding.suggestion;
  const decided = suggestion?.accepted !== null && suggestion?.accepted !== undefined;

  return (
    <Card className="border-border/80 shadow-none">
      <CardHeader className="gap-3 border-b border-border/70 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex items-start gap-2">
            <StatusIcon status={finding.status} />
            <div>
              <CardTitle className="text-base">{finding.summary}</CardTitle>
              <CardDescription className="mt-1">
                {finding.category.replaceAll("_", " ")}
                {finding.ruleId ? ` · rule ${finding.ruleId}` : null}
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline" className="capitalize">
              {STATUS_LABEL[finding.status]}
            </Badge>
            <Badge
              variant="secondary"
              className={cn(
                "capitalize",
                finding.severity === "blocker" && "text-severity-blocker",
                finding.severity === "warning" && "text-severity-warning",
              )}
            >
              {finding.severity}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 pt-4">
        <p className="text-sm leading-relaxed text-foreground/90">
          {finding.rationale}
        </p>

        {finding.matchedText ? (
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">
              Matched text
            </p>
            <p className="rounded-md border border-border bg-muted/40 px-3 py-2 font-serif text-sm">
              “{finding.matchedText}”
            </p>
          </div>
        ) : null}

        <div>
          <p className="mb-1 text-xs font-medium text-muted-foreground">
            Evidence status
          </p>
          {finding.citationIds.length > 0 ? (
            <ul className="flex flex-col gap-1 text-sm">
              {finding.citationIds.map((id) => (
                <li key={id} className="font-serif text-sm">
                  <span className="text-brand">Source:</span> {sourceTitle(id)}{" "}
                  <span className="text-muted-foreground">({id})</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              {finding.evidenceGapReason ??
                "No supporting citations — evidence gap declared."}
            </p>
          )}
        </div>

        {suggestion ? (
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-md border border-border p-3">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Original
              </p>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {originalBody}
              </p>
            </div>
            <div className="rounded-md border border-brand/30 bg-brand/5 p-3">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-brand">
                Suggested
              </p>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {suggestion.proposedText}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {suggestion.rationale}
              </p>
            </div>
          </div>
        ) : null}
      </CardContent>
      {suggestion && !decided ? (
        <CardFooter className="flex flex-wrap gap-2 border-t border-border/70">
          <Button
            type="button"
            disabled={busy}
            onClick={() => onAccept?.(suggestion.id)}
          >
            Accept correction
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => onReject?.(suggestion.id)}
          >
            Reject correction
          </Button>
        </CardFooter>
      ) : null}
      {suggestion && decided ? (
        <CardFooter className="border-t border-border/70 text-sm text-muted-foreground">
          Correction {suggestion.accepted ? "accepted" : "rejected"}.
        </CardFooter>
      ) : null}
    </Card>
  );
}
