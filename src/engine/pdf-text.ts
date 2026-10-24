const MAX_PDF_BYTES = 2_000_000;

export type PdfCheck =
  | { ok: true }
  | { ok: false; error: string };

export function validatePdfUpload(bytes: Uint8Array, fileName: string): PdfCheck {
  if (bytes.byteLength === 0) {
    return { ok: false, error: "The file is empty." };
  }
  if (bytes.byteLength > MAX_PDF_BYTES) {
    return { ok: false, error: "The file is larger than 2 MB." };
  }
  if (!fileName.toLowerCase().endsWith(".pdf")) {
    return { ok: false, error: "Only a .pdf file can be read." };
  }
  const header = String.fromCharCode(bytes[0] ?? 0, bytes[1] ?? 0, bytes[2] ?? 0, bytes[3] ?? 0, bytes[4] ?? 0);
  if (!header.startsWith("%PDF")) {
    return { ok: false, error: "The file is not a PDF." };
  }
  return { ok: true };
}

/** Candidate statements an admin can add to a draft. Nothing here is approved. */
export function statementsFromText(text: string): string[] {
  const seen = new Set<string>();
  const statements: string[] = [];
  for (const part of text.split(/(?<=[.!?])\s+/)) {
    const sentence = part.replace(/\s+/g, " ").trim();
    if (sentence.length < 20 || sentence.length > 280) continue;
    const key = sentence.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    statements.push(sentence);
    if (statements.length === 8) break;
  }
  return statements;
}

const MAX_PDF_PAGES = 30;
const PDF_PARSE_MS = 8_000;

/**
 * Reads text with PDF.js warnings limited to errors.
 * The "Indexing all PDF objects" line is a recovery warning, not a thrown failure.
 * verbosity 0 keeps that warning quiet and still surfaces real parse errors.
 * A size cap, a page cap, and a deadline bound the work. They are not a sandbox.
 */
export async function readPdfText(
  bytes: Uint8Array,
): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  const { extractText, getDocumentProxy } = await import("unpdf");
  let pdf: Awaited<ReturnType<typeof getDocumentProxy>> | undefined;
  try {
    pdf = await withDeadline(
      getDocumentProxy(bytes, { verbosity: 0 }),
      PDF_PARSE_MS,
    );
    if (pdf.numPages > MAX_PDF_PAGES) {
      return { ok: false, error: `The PDF has more than ${MAX_PDF_PAGES} pages.` };
    }
    const extracted = await withDeadline(
      extractText(pdf, { mergePages: true }),
      PDF_PARSE_MS,
    );
    const text = typeof extracted.text === "string" ? extracted.text : "";
    return { ok: true, text };
  } catch {
    return { ok: false, error: "The PDF could not be read." };
  } finally {
    await pdf?.loadingTask.destroy().catch(() => undefined);
  }
}

function withDeadline<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error instanceof Error ? error : new Error("PDF parse failed"));
      },
    );
  });
}
