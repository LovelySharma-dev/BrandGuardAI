"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  publishBrandKitDraftAction,
  saveFoundingStatementDraftAction,
} from "@/app/actions/brand-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function KitDraftEditor({
  publishedVersion,
  draftVersion,
  initialStatement,
}: {
  publishedVersion: string;
  draftVersion: string | null;
  initialStatement: string;
}) {
  const router = useRouter();
  const [statement, setStatement] = useState(initialStatement);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSave() {
    setPending(true);
    setError(null);
    setMessage(null);
    const result = await saveFoundingStatementDraftAction(statement);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessage(
      `Draft v${result.kit.version} saved. Published v${publishedVersion} is unchanged, and reviews pinned to it stay on that version.`,
    );
    router.refresh();
  }

  async function onPublish() {
    setPending(true);
    setError(null);
    setMessage(null);
    const result = await publishBrandKitDraftAction();
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessage(`Published v${result.kit.version}. Earlier versions stay readable.`);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor="founding-statement">Draft founding statement</Label>
        <Input
          id="founding-statement"
          name="statement"
          value={statement}
          onChange={(event) => setStatement(event.target.value)}
        />
      </div>
      <p className="text-sm text-muted-foreground">
        {draftVersion
          ? `Draft v${draftVersion} is not used for reviews until you publish it.`
          : `Saving creates the next patch version as a draft. Published v${publishedVersion} stays immutable.`}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" disabled={pending} onClick={() => void onSave()}>
          Save draft
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={pending || !draftVersion}
          onClick={() => void onPublish()}
        >
          Publish draft
        </Button>
      </div>
      {message ? <p role="status">{message}</p> : null}
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
