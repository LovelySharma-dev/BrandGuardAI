/** @vitest-environment jsdom */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { EvidenceTrustPanel } from "@/components/review/evidence-trust-panel";
import { DEMO_BRAND_KIT } from "@/data/seed-kit";
import { ContentReviewSchema } from "@/domain/schemas";
import { runDeterministicReview } from "@/engine/review";
import { buildTrustGraph } from "@/engine/trust-graph";

function reviewed(body: string) {
  const result = runDeterministicReview(
    { title: "Trust graph", body, orgId: "org_demo" },
    DEMO_BRAND_KIT,
  );
  if (!result.ok) throw new Error(result.error);
  return result;
}

function markup(body: string) {
  const { review, snapshot } = reviewed(body);
  return {
    review,
    snapshot,
    html: renderToStaticMarkup(
      <EvidenceTrustPanel review={review} snapshot={snapshot} />,
    ),
  };
}

describe("evidence trust panel", () => {
  it("renders a verified claim from the pinned excerpt, with a text version", () => {
    const { review, snapshot, html } = markup("Inkloom was founded in 2019.");
    const finding = review.findings.find((item) => item.status === "verified");
    const passage = snapshot.passages?.find((item) => item.id === finding?.citationIds[0]);

    expect(finding?.rationale).toBeTruthy();
    expect(passage?.excerpt).toBeTruthy();
    expect(html).toContain("Relationship diagram");
    expect(html).toContain("Text version");
    expect(html).toContain(passage?.excerpt ?? "");
    const textVersion = html.slice(html.indexOf("Text version"));
    expect(textVersion).toContain(passage?.excerpt ?? "");
    expect(textVersion).toContain("pinned excerpt as support");
    expect(html).toContain(`published kit v${review.kitVersion}`);
    expect(html).toContain(finding?.rationale ?? "");
    expect(html).toContain("pinned excerpt as support");
    expect(html).toContain("overflow-x-hidden");
    expect(html).toContain("min-w-0");
    expect(html).toContain("min-h-11");
    expect(html).toContain("motion-reduce:transition-none");
    expect(html).not.toContain("overflow-x-auto");
    expect(html).toContain('aria-pressed="true"');
  });

  it("renders a contradicted claim against the stored conflict", () => {
    const { html } = markup("Inkloom was founded in 2015.");
    expect(html).toContain("pinned excerpt as a conflict");
    expect(html).toContain("published kit v1.0.0");
    expect(html).toContain("Do not claim earlier founding dates.");
  });

  it("renders an unsupported claim as a gap and does not show a source", () => {
    const { review, html } = markup("Inkloom is the best in the world.");
    expect(review.findings.some((finding) => finding.status === "unsupported")).toBe(true);
    expect(html).toContain("Evidence gap");
    expect(html).toContain(
      "No approved fact in the pinned brand kit supports this absolute claim.",
    );
    expect(html).not.toContain("Do not claim earlier founding dates.");
    expect(html).not.toContain("Company fact sheet");
  });

  it("renders a policy hit with the pinned rule text", () => {
    const { review, html } = markup("Use our brand bible for synergy.");
    const finding = review.findings.find((item) => item.status === "policy_hit");
    expect(finding?.ruleId).toBeTruthy();
    expect(html).toContain("Terminology guide v1");
    expect(html).toContain(`published kit v${review.kitVersion}`);
    expect(html).toContain(finding?.rationale ?? "");
    expect(html).toContain("records policy");
  });

  it("keeps a human decision separate from the automated finding", () => {
    const { review, snapshot } = reviewed("Inkloom was founded in 2019.");
    const decided = ContentReviewSchema.parse({
      ...review,
      status: "approved",
      decision: {
        action: "approve",
        actorId: "user_demo_reviewer",
        at: "2026-10-24T17:39:12.331Z",
        reason: "The founding line matches the pinned kit.",
      },
    });
    const html = renderToStaticMarkup(
      <EvidenceTrustPanel review={decided} snapshot={snapshot} />,
    );

    expect(html).toContain("Human decision");
    expect(html).toContain("user_demo_reviewer");
    expect(html).toContain("not an automated finding");
    expect(html).toContain("The founding line matches the pinned kit.");
    expect(html).toContain("Automated finding: verified");
  });

  it("renders an empty review without a human decision", () => {
    const { review, snapshot } = reviewed("Inkloom was founded in 2019.");
    const empty = ContentReviewSchema.parse({ ...review, findings: [] });
    const html = renderToStaticMarkup(
      <EvidenceTrustPanel review={empty} snapshot={snapshot} />,
    );

    expect(html).toContain("no findings");
    expect(html).toContain("No relationships are stored for this review.");
    expect(html).toContain("No human decision has been recorded");
    expect(html).not.toContain("Human decision: approve");
  });
});

describe("evidence trust keyboard", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    (
      globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it("moves from the focused node when that node is not the selected one", async () => {
    const { review, snapshot } = reviewed("Inkloom was founded in 2019.");
    await act(async () => {
      root.render(<EvidenceTrustPanel review={review} snapshot={snapshot} />);
    });
    const claim = [...container.querySelectorAll("button")].find((button) =>
      button.textContent?.startsWith("Claim:"),
    );
    expect(claim).toBeTruthy();
    claim?.focus();
    await act(async () => {
      claim?.dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true }),
      );
    });
    const pressed = container.querySelector("[aria-pressed='true']");
    expect(pressed?.textContent).toContain("Automated finding");
    expect(pressed?.textContent).toContain("Selected");
    expect(document.activeElement).toBe(pressed);
  });

  it("moves across findings with the arrow keys and announces the selected finding", async () => {
    const { review, snapshot } = reviewed(
      "Inkloom was founded in 2019. Later copy says founded in 2015. We are the best in the world.",
    );
    expect(review.findings.length).toBeGreaterThan(1);
    await act(async () => {
      root.render(<EvidenceTrustPanel review={review} snapshot={snapshot} />);
    });
    const radios = [...container.querySelectorAll<HTMLButtonElement>("[role='radio']")];
    expect(radios[0]?.getAttribute("aria-checked")).toBe("true");
    radios[0]?.focus();
    await act(async () => {
      radios[0]?.dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true }),
      );
    });
    expect(radios[1]?.getAttribute("aria-checked")).toBe("true");
    expect(radios[0]?.getAttribute("aria-checked")).toBe("false");
    expect(document.activeElement).toBe(radios[1]);
  });
});

const LONG_EXCERPT = `Pinned founding excerpt. ${"established ".repeat(40)}`;
const LONG_RATIONALE = `Stored rationale for the judge. ${"because ".repeat(40)}`;

function largeReview(count: number) {
  const now = "2026-10-25T00:00:00.000Z";
  const findings = Array.from({ length: count }, (_, index) => {
    const id = `find_large_${index}`;
    const mode = index % 5;
    const base = {
      id,
      reviewId: "rev_large",
      span: { start: index, end: index + 1 },
      summary: `Finding ${index}`,
      rationale: index === 2 ? LONG_RATIONALE : `Rationale ${index}`,
      citationIds: [] as string[],
    };
    if (mode === 0) {
      return {
        ...base,
        category: "factual_claim" as const,
        status: "verified" as const,
        severity: "info" as const,
        matchedText: `Claim ${index}`,
        citationIds: ["src_repeat", "src_repeat"],
        suggestion: {
          id: `sug_large_${index}`,
          findingId: id,
          proposedText: `Corrected claim ${index} with a longer replacement that stays a suggestion.`,
          rationale: "Align the sentence with the pinned fact.",
          accepted: null,
        },
      };
    }
    if (mode === 1) {
      return {
        ...base,
        category: "factual_claim" as const,
        status: "contradicted" as const,
        severity: "blocker" as const,
        matchedText: `Conflict ${index}`,
        citationIds: ["src_repeat"],
        suggestion: {
          id: `sug_large_${index}`,
          findingId: id,
          proposedText: `Corrected claim ${index} with a longer replacement that stays a suggestion.`,
          rationale: "Align the sentence with the pinned fact.",
          accepted: null,
        },
      };
    }
    if (mode === 2) {
      return {
        ...base,
        category: "promotional_claim" as const,
        status: "unsupported" as const,
        severity: "blocker" as const,
        matchedText: `Gap ${index}`,
        citationIds: [],
        evidenceGapReason: "No pinned source supports this synthetic claim.",
      };
    }
    if (mode === 3) {
      return {
        ...base,
        category: "terminology" as const,
        status: "policy_hit" as const,
        severity: "warning" as const,
        matchedText: `Policy ${index}`,
        ruleId: `rule_${index}`,
        citationIds: index % 10 === 3 ? ["src_policy"] : ["src_missing_policy"],
      };
    }
    return {
      ...base,
      category: "factual_claim" as const,
      status: "verified" as const,
      severity: "info" as const,
      matchedText: `Repeated source ${index}`,
      citationIds: ["src_not_in_snapshot"],
    };
  });
  const review = ContentReviewSchema.parse({
    id: "rev_large",
    orgId: "org_demo",
    title: "Large review",
    body: "Synthetic draft used only to measure the trust panel.",
    intent: { goal: "", audience: "", channel: "", mustKeep: [] },
    status: "needs_revision",
    kitVersion: "1.0.0",
    snapshotId: "snap_large",
    findings,
    revisions: [],
    createdAt: now,
    updatedAt: now,
  });
  const snapshot = {
    id: "snap_large",
    kitVersion: "1.0.0",
    sourceIds: ["src_repeat", "src_policy"],
    passages: [
      {
        id: "src_repeat",
        title: "Repeated source",
        excerpt: LONG_EXCERPT,
        sourceType: "fact" as const,
        kitVersion: "1.0.0",
      },
      {
        id: "src_policy",
        title: "Policy source",
        excerpt: "Use the published term.",
        sourceType: "terminology" as const,
        kitVersion: "1.0.0",
      },
    ],
    createdAt: now,
  };
  return { review, snapshot };
}

function graphFrom(
  review: ReturnType<typeof largeReview>["review"],
  snapshot: ReturnType<typeof largeReview>["snapshot"],
) {
  return buildTrustGraph(review, snapshot);
}

describe("evidence trust at review scale", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    (
      globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it("renders 25 and 50 findings with gaps, repeats, and long text", () => {
    for (const count of [25, 50]) {
      const { review, snapshot } = largeReview(count);
      const started = performance.now();
      const html = renderToStaticMarkup(
        <EvidenceTrustPanel review={review} snapshot={snapshot} />,
      );
      const elapsed = performance.now() - started;
      console.info(`trust-panel render ${count} findings: ${elapsed.toFixed(1)}ms`);
      expect(elapsed).toBeLessThan(2000);
      expect(html).toContain("overflow-x-hidden");
      expect(html).toContain("break-words");
      expect(html).toContain(LONG_EXCERPT);
      expect(html).toContain("Suggestion pending. Accepting it does not approve the draft.");
      expect(html).toContain("No human decision has been recorded");
      expect(
        graphFrom(review, snapshot).nodes.some(
          (node) =>
            node.kind === "gap" &&
            node.reason === "No pinned source supports this synthetic claim.",
        ),
      ).toBe(true);
      expect(
        graphFrom(review, snapshot).nodes.some(
          (node) => node.kind === "finding" && node.rationale === LONG_RATIONALE,
        ),
      ).toBe(true);
      expect((html.match(/Evidence: Repeated source/g) ?? []).length).toBe(1);
      expect(
        graphFrom(review, snapshot).nodes.filter((node) => node.kind === "policy").length,
      ).toBeGreaterThan(1);
      const first = review.findings[0]!;
      const graph = graphFrom(review, snapshot);
      expect(
        graph.nodes.filter(
          (node) => node.kind === "evidence" && node.findingId === first.id,
        ),
      ).toHaveLength(1);
      const missing = review.findings.find((finding) =>
        finding.citationIds.includes("src_not_in_snapshot"),
      )!;
      expect(
        graph.nodes.some(
          (node) =>
            node.kind === "evidence" && node.findingId === missing.id,
        ),
      ).toBe(false);
      expect(
        graph.nodes.some(
          (node) =>
            node.kind === "gap" &&
            node.findingId === missing.id &&
            node.reason.includes("src_not_in_snapshot"),
        ),
      ).toBe(true);
      expect(html).not.toContain("src_kit_only_excerpt_should_not_appear");
    }
  });

  it("keeps keyboard selection working across a 25-finding list", async () => {
    const { review, snapshot } = largeReview(25);
    await act(async () => {
      root.render(<EvidenceTrustPanel review={review} snapshot={snapshot} />);
    });
    const radios = [...container.querySelectorAll<HTMLButtonElement>("[role='radio']")];
    expect(radios).toHaveLength(25);
    radios[0]?.focus();
    for (let step = 0; step < 10; step += 1) {
      const current = radios[step];
      await act(async () => {
        current?.dispatchEvent(
          new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true }),
        );
      });
    }
    expect(radios[10]?.getAttribute("aria-checked")).toBe("true");
    expect(document.activeElement).toBe(radios[10]);
    const claim = [...container.querySelectorAll("button")].find((button) =>
      button.textContent?.startsWith("Claim:"),
    );
    claim?.focus();
    await act(async () => {
      claim?.dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true }),
      );
    });
    const pressed = container.querySelector("[aria-pressed='true']");
    expect(pressed?.textContent).toContain("Selected");
    expect(document.activeElement).toBe(pressed);
    expect(container.textContent).toContain(LONG_EXCERPT.trim().slice(0, 40));
  });
});
