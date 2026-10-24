"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  addPdfStatementsAction,
  inspectPdfAction,
} from "@/app/actions/brand-kit";
import { Button } from "@/components/ui/button";

export function PdfFactImport() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [statements, setStatements] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [pending, setPending] = useState(false);

  async function onInspect(formData: FormData) {
    setPending(true);
    setError(null);
    setMessage(null);
    const result = await inspectPdfAction(formData);
    setPending(false);
    if (!result.ok) {
      setStatements([]);
      setSelected([]);
      setError(result.error);
      return;
    }
    setStatements(result.statements);
    setSelected(result.statements);
  }

  async function onSave() {
    setPending(true);
    setError(null);
    setMessage(null);
    const result = await addPdfStatementsAction(selected);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessage(
      `Added ${selected.length} ${selected.length === 1 ? "sentence" : "sentences"} to draft v${result.kit.version}. Publish the draft before reviews use them. The PDF file is not stored.`,
    );
    setStatements([]);
    setSelected([]);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      <form action={onInspect} className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <label className="text-sm font-medium" htmlFor="brand-pdf">
          Brand PDF
        </label>
        <input
          id="brand-pdf"
          name="file"
          type="file"
          accept="application/pdf,.pdf"
          required
          className="min-h-11 w-full min-w-0 cursor-pointer text-sm text-foreground file:mr-3 file:inline-flex file:h-11 file:cursor-pointer file:items-center file:rounded-lg file:border-0 file:bg-primary file:px-4 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/80 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none sm:w-auto"
        />
        <Button type="submit" disabled={pending} className="min-h-11">
          {pending ? "Reading PDF…" : "Read PDF"}
        </Button>
      </form>
      <p className="text-xs text-muted-foreground">
        Empty files, files over 2 MB, and files that are not PDFs are rejected.
        Extracted sentences stay in the draft until you publish them.
      </p>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {message ? <p className="text-sm">{message}</p> : null}
      {statements.length > 0 ? (
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium">Sentences from the PDF</legend>
          {statements.map((statement) => (
            <label key={statement} className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={selected.includes(statement)}
                onChange={(event) => {
                  setSelected((current) =>
                    event.target.checked
                      ? [...current, statement]
                      : current.filter((item) => item !== statement),
                  );
                }}
              />
              <span>{statement}</span>
            </label>
          ))}
          <Button type="button" disabled={pending || selected.length === 0} onClick={onSave}>
            Add selected sentences to the draft
          </Button>
        </fieldset>
      ) : null}
    </div>
  );
}
