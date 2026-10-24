import { describe, expect, it } from "vitest";

import { DEMO_BRAND_KIT } from "@/data/seed-kit";
import { summarizeReviews } from "@/engine/analytics";
import { statementsFromText, validatePdfUpload } from "@/engine/pdf-text";
import { renderReviewReport } from "@/engine/report";
import { runDeterministicReview } from "@/engine/review";
import { contrastRatio, detectVisualMismatches } from "@/engine/visual";
import { directConnectionString } from "@/db/client";
import { ContentReviewSchema } from "@/domain/schemas";

describe("visual checks", () => {
  it("flags an unknown hex and a low-contrast published token", () => {
    const unknown = detectVisualMismatches(
      "rev_color",
      "Paint the headline #FF00AA.",
      DEMO_BRAND_KIT,
    );
    expect(unknown).toHaveLength(1);
    expect(unknown[0]?.ruleId).toBe("color_token");
    expect(unknown[0]?.status).toBe("policy_hit");
    expect(unknown[0]?.citationIds).toEqual([]);

    const paleKit = {
      ...DEMO_BRAND_KIT,
      colorTokens: [
        { id: "bg", name: "Stone", hex: "#F7F5F2", role: "background" as const },
        { id: "pale", name: "Pale", hex: "#E8E4DC", role: "accent" as const },
      ],
    };
    const contrast = detectVisualMismatches("rev_color", "Use #E8E4DC here.", paleKit);
    expect(contrast[0]?.ruleId).toBe("color_contrast");
    expect(contrastRatio("#E8E4DC", "#F7F5F2")).toBeLessThan(4.5);
    expect(contrastRatio("#1A1814", "#F7F5F2")).toBeGreaterThan(4.5);
  });

  it("skips drafts when the kit has no tokens", () => {
    expect(
      detectVisualMismatches("rev_color", "Paint it #FF00AA.", {
        ...DEMO_BRAND_KIT,
        colorTokens: [],
      }),
    ).toEqual([]);
  });
});

describe("pdf text", () => {
  it("rejects empty, oversized, and non-pdf files", () => {
    expect(validatePdfUpload(new Uint8Array(), "kit.pdf")).toEqual({
      ok: false,
      error: "The file is empty.",
    });
    expect(validatePdfUpload(new Uint8Array([1, 2, 3, 4]), "notes.txt")).toEqual({
      ok: false,
      error: "Only a .pdf file can be read.",
    });
    const fake = new TextEncoder().encode("not a pdf");
    expect(validatePdfUpload(fake, "kit.pdf")).toEqual({
      ok: false,
      error: "The file is not a PDF.",
    });
    const huge = new Uint8Array(2_000_001);
    huge.set(new TextEncoder().encode("%PDF"), 0);
    expect(validatePdfUpload(huge, "kit.pdf").ok).toBe(false);
  });

  it("keeps unique sentences and does not approve them", () => {
    const statements = statementsFromText(
      "Inkloom was founded in 2019 and sells to design teams. Inkloom was founded in 2019 and sells to design teams. Too short. " +
        "The brand kit is the only approved source for public claims about the company.",
    );
    expect(statements).toHaveLength(2);
    expect(statements[0]).toContain("founded in 2019");
  });
});

describe("review report", () => {
  it("includes the status and refuses to approve the draft", () => {
    const result = runDeterministicReview(
      {
        title: "Sample",
        body: "Inkloom is the best in the world brand platform.",
        orgId: "org_demo",
      },
      DEMO_BRAND_KIT,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const report = renderReviewReport(result.review);
    expect(report).toContain(`Status: ${result.review.status.replaceAll("_", " ")}`);
    expect(report).toContain("Accepting a suggestion does not approve the draft.");
    expect(report).toContain("## Human decision");
    expect(report).toContain("## Suggested edits");
    expect(result.review.status).not.toBe("approved");
  });
});

describe("analytics summary", () => {
  it("separates recurring rules from guidelines that stay indeterminate", () => {
    const result = runDeterministicReview(
      {
        title: "Sample",
        body: "Use our brand bible for synergy.",
        orgId: "org_demo",
      },
      DEMO_BRAND_KIT,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const vague = ContentReviewSchema.parse({
      ...result.review,
      id: "rev_vague",
      title: "Vague draft",
      findings: [
        {
          ...result.review.findings[0],
          id: "find_vague",
          status: "indeterminate",
          citationIds: [],
          evidenceGapReason: "The guideline has no measurable threshold.",
        },
      ],
    });
    const summary = summarizeReviews([result.review, vague], DEMO_BRAND_KIT);
    expect(summary.recurring.some((rule) => rule.count >= 1)).toBe(true);
    expect(summary.vague).toEqual([
      expect.objectContaining({
        count: 1,
        reason: "The guideline has no measurable threshold.",
      }),
    ]);
  });
});

describe("pdf extraction", () => {
  it("reads a sentence from a real PDF and rejects a renamed text file", async () => {
    const sentence = "Inkloom was founded in 2019 and sells design kits to teams.";
    const stream = `BT /F1 12 Tf 72 720 Td (${sentence}) Tj ET`;
    const objects = [
      "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
      "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
      "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n",
      `4 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj\n`,
      "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
    ];
    let body = "%PDF-1.4\n";
    const offsets = [0];
    for (const object of objects) {
      offsets.push(body.length);
      body += object;
    }
    const xrefAt = body.length;
    let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    for (let index = 1; index <= objects.length; index += 1) {
      xref += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
    }
    body += `${xref}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefAt}\n%%EOF`;
    const bytes = new TextEncoder().encode(body);
    expect(validatePdfUpload(bytes, "kit.pdf").ok).toBe(true);
    const { extractText } = await import("unpdf");
    const extracted = await extractText(bytes, { mergePages: true });
    expect(statementsFromText(extracted.text)).toContain(sentence);

    const renamed = new TextEncoder().encode("this is not a pdf document");
    expect(validatePdfUpload(renamed, "kit.pdf")).toEqual({
      ok: false,
      error: "The file is not a PDF.",
    });
  });
});

describe("direct connection string", () => {
  it("ignores a pooled or doubled host and derives a direct host", () => {
    const pooled =
      "postgresql://user:secret@ep-example-pooler.c-7.us-east-2.aws.neon.tech/neondb";
    const doubled =
      "postgresql://user:secret@ep-example-pooler.c-7.us-east-2.aws.neon.neon.tech/neondb";
    const direct = directConnectionString(pooled, doubled);
    const host = new URL(direct).hostname;
    expect(host).toBe("ep-example.c-7.us-east-2.aws.neon.tech");
    expect(direct).not.toContain("secret-shown");
  });
});
