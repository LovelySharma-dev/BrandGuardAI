"use server";

import {
  publishBrandKitDraft,
  saveBrandKitDraft,
  saveFoundingStatementDraft,
  addPdfStatementsToDraft,
  inspectBrandPdf,
  type KitMutationResult,
} from "@/lib/brand-kit";

export async function saveFoundingStatementDraftAction(
  statement: string,
): Promise<KitMutationResult> {
  return saveFoundingStatementDraft(statement);
}

export async function saveBrandKitDraftAction(
  input: unknown,
): Promise<KitMutationResult> {
  return saveBrandKitDraft(input);
}

export async function publishBrandKitDraftAction(): Promise<KitMutationResult> {
  return publishBrandKitDraft();
}

export async function inspectPdfAction(
  formData: FormData,
): Promise<{ ok: true; statements: string[] } | { ok: false; error: string }> {
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { ok: false, error: "Choose a PDF file." };
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  return inspectBrandPdf(file.name, bytes);
}

export async function addPdfStatementsAction(
  statements: string[],
): Promise<KitMutationResult> {
  return addPdfStatementsToDraft(statements);
}
