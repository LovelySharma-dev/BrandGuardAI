# Problem Analysis

**Provisional product:** BrandGuard AI  
**Document role:** Round 1 — problem understanding and affected users  
**Date:** 2026-10-20  
**Evidence discipline:** Assumptions and proposed personas are labelled. No invented interviews, surveys, or demand metrics.

---

## 1. Problem statement

Organisations need to review content **before publication** against approved brand guidelines, facts, terminology, messaging rules, visual assets, accessibility requirements, and promotional-claim policies.

Today that work often fails as a system:

| Failure mode | What happens | Why it hurts |
| --- | --- | --- |
| Archival guidelines | PDF/Notion guides are interpreted inconsistently | Same draft gets different rulings |
| Ungrounded AI critique | Chat tools flag “risk” without approved sources | False confidence; hard to challenge |
| Epistemic collapse | “Not in the fact sheet” treated as “false” | Wrong remediation; distrust |
| Intent-destroying rewrites | Auto-fixes push generic safe copy | Campaign purpose lost |
| Fake governance | Spreadsheet sign-off or client-only “admin” | No auditability; unclear accountability |

The product problem is not “generate nicer brand copy.” It is **operational brand governance**: explainable findings, evidence links or explicit gaps, human-owned corrections and approvals, and retained decision history.

---

## 2. Why this is hard (not a thin UI over an LLM)

1. Policies are often ambiguous, conflicting, or incomplete.
2. Missing support ≠ contradiction.
3. Models can invent citations or cite the wrong passage.
4. Creators need remediation that keeps goal, audience, and must-keep phrases.
5. Governance requires server-enforced permissions and immutable audit events.

**Hardest technical challenge (summary):** make review findings traceable to approved evidence while handling missing sources, ambiguous policies, false positives, and unreliable model outputs — without equating absence of evidence with falsehood.

---

## 3. Affected users

**Label:** Proposed archetypes for design — **not** verified interview findings.

### Primary target user (MVP)

**Brand / communications reviewer** working with **content creators**, inside a single organisation that already has (or can seed) a brand kit.

| User | Job to be done | Pain if unsolved |
| --- | --- | --- |
| Content creator | Ship channel-ready drafts without late rewrites | Vague flags; corrections that change intent |
| Brand reviewer | Approve/reject with consistent, defensible rationale | Missing sources; unclear guideline version |
| Brand knowledge owner | Keep approved facts/terms/policies current | Drift and tribal rules |
| Compliance stakeholder (secondary) | Reduce unsupported promotional claims | Late absolute claims / missing disclaimers |

### Organisational context (proposed demo)

A fictional B2B product company with a versioned brand kit:

- style / messaging guide
- approved product facts
- terminology (preferred / banned)
- promotional-claim policy
- optional colour/logo tokens (shallow visual checks only if time)

**Assumption A1:** A seeded single-tenant demo is sufficient for hackathon judging.

---

## 4. Existing approaches (category honesty)

**Verified evidence of competitor *existence* (public pages, accessed 2026-10-20) — not market-share research:**

| Approach | Example | Implication for us |
| --- | --- | --- |
| Commercial “brand governance” copy review | [brandguardai.io](https://brandguardai.io/) | Exact provisional name collision; surface pitch is crowded |
| Enterprise brand/compliance writing platforms | Writer; Acrolinx / Markup AI | “Load guidelines + flag issues” is table stakes |
| Generic LLM chat over a PDF | Ad-hoc ChatGPT/Claude use | Fast but uncitable and non-auditable |
| Manual review queues | Email/tickets/spreadsheets | Human oversight exists; scale and consistency suffer |

**Conclusion:** Claiming uniqueness for “AI reviews brand guidelines” would be weak. Differentiation must come from **implementation and evaluation** of evidence gating, intent-preserving human acceptance, and server-enforced workflow — not from category slogans.

---

## 5. Supporting evidence plan (no fabricated results)

### What we will not invent

User interview quotes, survey percentages, customer logos, “X% faster review” as a current result.

### Planned experiments (build window)

| ID | Experiment | Purpose |
| --- | --- | --- |
| E1 | Annotate ~20 rules as deterministic vs interpretive | Justify hybrid engine |
| E2 | Naive LLM baseline on labelled fixtures | Measure false-positive starting point |
| E3 | Inject forged citation IDs | Prove evidence gate rejects them |
| E4 | Creator ratings of suggestion intent retention | Qualitative signal only until scored |
| E5 | Product name originality / collision check | Resolve rename before demo branding |

### Research checklist (if further research is needed)

- [ ] Attach official Inkloom Round 1 organiser packet (deadlines, PDF limits, eligibility)
- [ ] Confirm whether Inkloom APIs/credits are required
- [ ] Short secondary research on WCAG expectations for *product UI* vs *content checks*
- [ ] Trademark/domain check for final product name
- [ ] Optional: 3–5 informal conversations with marketers/reviewers (**only if conducted**; store notes, do not invent)

---

## 6. Coverage check — organiser items 1–2

| Requirement | Covered here? |
| --- | --- |
| Problem understanding | Yes |
| Affected users | Yes (labelled as proposed) |
