"use server";

import {
  publishBrandKitDraft,
  saveFoundingStatementDraft,
  type KitMutationResult,
} from "@/lib/brand-kit";

export async function saveFoundingStatementDraftAction(
  statement: string,
): Promise<KitMutationResult> {
  return saveFoundingStatementDraft(statement);
}

export async function publishBrandKitDraftAction(): Promise<KitMutationResult> {
  return publishBrandKitDraft();
}
