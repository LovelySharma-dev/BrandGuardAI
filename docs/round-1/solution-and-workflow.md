# Solution and Workflow

**Provisional product:** BrandGuard AI  
**Document role:** Round 1 — proposed solution, value proposition, end-to-end workflow, MVP features  
**Date:** 2026-10-20

---

## 1. Value proposition

**One sentence:** Pre-publication brand governance that refuses unsupported confidence — every consequential finding is evidence-linked or an explicit evidence gap; corrections preserve creator intent under human acceptance; approvals are server-enforced and auditable. The model never marks content approved.

**Do not pitch:** “an AI brand checker.”  
**Do pitch:** “evidence-gated brand governance with human-owned approvals.”

### Naming note

“BrandGuard AI” is provisional. A commercial product already uses that name for similar positioning ([brandguardai.io](https://brandguardai.io/), accessed 2026-10-20). Rename before public demo branding. Originality should be judged on mechanism, not the provisional label.

---

## 2. Differentiator evaluation (A + B + C)

These are **not assumed unique** to the market. Differentiation depends on **how** they are implemented and **how** they are evaluated.

### A. Evidence-linked findings

| | |
| --- | --- |
| **Mechanism** | Version-pinned brand kit → retrieval snapshot → structured findings → server evidence gate |
| **Epistemic statuses** | `verified` \| `contradicted` \| `unsupported` \| `indeterminate` \| `policy_hit` \| `suggestion_only` |
| **Key rule** | Absence of evidence ≠ false (`unsupported` / `indeterminate` ≠ `contradicted`) |
| **What remains unproven** | Span-level entailment quality; paraphrase recall without vectors |
| **Evidence that would strengthen** | Labelled fixture precision/recall; 100% citation-ID validity; forged-cite rejection |

### B. Intent-preserving corrections

| | |
| --- | --- |
| **Mechanism** | Author declares intent (goal, audience, channel, must-keep) → proposal → side-by-side diff → accept/reject → new revision |
| **What remains unproven** | Whether authors fill intent fields; measured intent retention |
| **Evidence that would strengthen** | Human ratings on ≥10 samples; correction regression rate on fixtures |

### C. Reliable governance

| | |
| --- | --- |
| **Mechanism** | Roles `author` / `reviewer` / `admin`; allow-listed state machine; append-only audit; analytics on recurring hits and `indeterminate` clusters |
| **What remains unproven** | Usefulness of analytics under tiny demo data |
| **Evidence that would strengthen** | 100% e2e block of unauthorized approvals; audit reproducibility against kit version |

**Verdict:** Keep A+B+C as the product thesis. Compete on fail-closed evidence gates + status taxonomy + permissioned ledger — not on feature count.

---

## 3. End-to-end workflow

```text
[Admin] Publish Brand Kit version N
        (guidelines, facts, terms, claim policies [, assets])
           ↓
[Author] Create draft + declare intent
           ↓
[System] Hybrid review
           deterministic validators
           → retrieval snapshot
           → structured LLM findings (Zod)
           → evidence gate (citations ⊆ snapshot)
           ↓
[Author] Inspect findings (sources + evidence gaps)
         Accept/reject suggestions (version compare)
           ↓
[Author] Submit for approval
           ↓
[Reviewer] Approve / request changes / reject
           (server role + legal transition only)
           ↓
[System] Audit event + (optional) analytics update
```

### Review state machine

| State | Allowed next | Who |
| --- | --- | --- |
| `draft` | `in_review`, `archived` | author |
| `in_review` | `changes_requested`, `approved`, `rejected` | reviewer (approve/reject/request); author cannot approve |
| `changes_requested` | `draft` (after revise) | author revises |
| `approved` | `superseded` by new revision | — |
| `rejected` | `archived` | — |

**Hard rule:** LLM output never sets `approved`.

### Demonstration scenario (one realistic path)

**Scenario:** Launch email for a B2B product update.

1. Author pastes email draft claiming “customers see 300% ROI in two weeks,” declares intent: convert trial users, keep playful tone, must-keep product name.
2. System returns: `unsupported` on the ROI claim (no approved fact), `policy_hit` on absolute promotional pattern, optional `suggestion_only` on tone.
3. Author accepts a suggestion that softens the claim while keeping the CTA and product name (diff shown).
4. Reviewer opens sources / evidence gap, approves.
5. Audit log shows kit version, actors, and transitions.
6. **Negative demos:** forged citation rejected; author cannot self-approve without reviewer role.

---

## 4. Feasible MVP (Round 2 essentials)

### Primary target user and use case

- **User:** Brand reviewer + creator pair  
- **Use case:** Pre-publication review of a **marketing email / landing snippet** against a seeded brand kit

### Essential features (Round 2)

1. Versioned brand kit (seeded Markdown/JSON acceptable)
2. Draft + intent fields
3. Hybrid review + evidence gate + status taxonomy
4. Findings UI with excerpts / evidence gaps
5. Suggestion accept/reject with diff → revision
6. Server-enforced approve / request changes / reject
7. Append-only audit events
8. Labelled fixture pack + automated tests for gate and permissions

### Explicitly deferred

CMS/Slack integrations; multi-tenant SSO; full WCAG document audit; deep visual/logo QA; PDF ingestion quality; regulated vertical legal packs; autonomous publish; marketplace billing.

---

## 5. Coverage check — organiser items 3–5

| Requirement | Covered? |
| --- | --- |
| Proposed solution / value proposition | Yes |
| Complete workflow | Yes |
| Main features + exclusions | Yes |
