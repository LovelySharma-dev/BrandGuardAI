# Hardest Technical Challenge (Judge-Oriented)

## The challenge

**Producing reliable, evidence-grounded findings despite ambiguous rules, missing sources, and noisy inputs** — without treating “we couldn’t find support” as “the claim is false,” and without letting the model invent authorities.

This is harder than building a review UI. The model will often sound certain. Brand PDFs will contradict themselves. Drafts will mix marketing flourish with factual assertions. Retrieval will return near-miss chunks. Judges should evaluate whether we engineered for these failure modes.

## Why generic approaches fail

| Naive approach | Failure |
| --- | --- |
| “Ask an LLM if this is on-brand” | Unstable, uncitable, overconfident |
| RAG without citation ID checks | Fabricated or out-of-snapshot sources |
| Binary pass/fail | Collapses unsupported and contradicted |
| Auto-rewrite | Destroys creator intent |
| Client-side “admin” flags | Fake governance |

## Our approach

### 1. Hybrid engine

- **Deterministic validators** for terms, patterns, and machine-checkable policies
- **Retrieval** over a version-pinned brand kit
- **LLM** only to structure findings against supplied evidence candidates — not as a free-floating oracle

### 2. Explicit epistemic statuses

`verified` | `contradicted` | `unsupported` | `indeterminate` | `policy_hit` | `suggestion_only`

Absence of evidence → `unsupported` or `indeterminate`, **never** auto-`contradicted`.

### 3. Evidence gate (server)

After structured generation:

1. Parse with Zod; reject malformed batches
2. Ensure every citation ID appears in the retrieval snapshot for that run
3. Downgrade or reject findings that claim support without citations
4. Persist snapshot + findings together for audit/repro

### 4. Human-owned outcomes

Suggestions are proposals. Approvals are role-gated state transitions. The model cannot mark content approved.

### 5. Evaluation before storytelling

A labelled fixture pack separates:

- retrieval miss
- gate failure
- generation contradiction
- acceptable abstention

We will report measured fixture metrics in later rounds — not invented percentages in Round 1.

## What judges should look for in later demos

1. Forged citation blocked
2. Novel claim labelled `unsupported` (not “false”)
3. Ambiguous rule → `indeterminate` with explanation
4. Suggestion accept creates a diffed revision
5. Non-reviewer approval attempt fails
6. Audit log shows the path

## Residual risk we accept

Span-level entailment will remain imperfect in MVP. We mitigate with statuses, human review, and honest analytics — not with false precision.
