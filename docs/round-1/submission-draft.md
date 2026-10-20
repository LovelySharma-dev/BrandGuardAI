# BrandGuard AI — Round 1 Proposal

**Provisional product name:** BrandGuard AI *(rename planned before public demo)*  
**Team name:** `[TEAM_NAME]`  
**Team size:** `[TEAM_SIZE]`  
**Date:** 2026-10-20  
**Status:** Round 1 planning proposal only — no functional product is claimed as built

> **Evidence discipline.** This document uses labelled **assumptions**, **planned experiments**, and **proposed metrics**. It does not invent participant identities, build-window dates, customer interviews, survey results, or measured performance numbers.

---

## 1. Problem understanding

Organisations publish marketing, product, and support content faster than brand, legal, accessibility, and communications specialists can consistently review it. Pre-publication review must check drafts against approved guidelines, facts, terminology, messaging, visual assets, accessibility expectations, and promotional-claim policies — then explain findings, suggest corrections, enable human approvals, retain history, and surface governance patterns.

Common system failures:

1. **Guidelines are archival, not operational** — PDF and wiki rules are interpreted differently by each reviewer.  
2. **AI critique without authority** — assistants flag “risk” without citing an approved organisational source, or invent citations.  
3. **Epistemic collapse** — missing support is treated as proof a claim is false.  
4. **Intent-destroying remediation** — auto-rewrites erase campaign angle, channel fit, or mandated phrases.  
5. **Approvals without governance** — spreadsheets and client-side “admin” flags are not permissioned, auditable decisions.

**Why this matters:** failures are not only off-brand tone. They include unsupported promotional claims, outdated facts, banned terms, mismatched assets, accessibility gaps, and the inability to answer who approved what against which guideline version.

### Category honesty

“AI checks your brand guidelines” is **not** an original category claim. Public commercial offerings already market brand/compliance content review (including a product named BrandGuard AI at brandguardai.io, and enterprise platforms such as Writer and Acrolinx / Markup AI — existence verified via public pages on 2026-10-20). Our thesis is therefore narrower and more technical: **evidence-gated brand governance** with human-owned corrections and approvals.

### Hardest technical challenge

Making AI review findings **traceable to approved evidence** while managing missing sources, ambiguous policies, false positives, and unreliable model outputs — without equating absence of evidence with falsehood, and without allowing fabricated citations to appear as support.

---

## 2. Affected users

**Label:** proposed design archetypes — not completed interview research.

| User | Job to be done | Primary pain |
| --- | --- | --- |
| Content creator | Ship channel-ready drafts without late rewrites | Vague AI flags; corrections that change intent |
| Brand / communications reviewer (**primary MVP**) | Approve or request changes with a defensible rationale | Missing sources; unclear guideline version; weak audit trail |
| Brand knowledge owner | Keep facts, terms, and policies current | Drift and tribal rules |
| Compliance stakeholder (secondary) | Reduce unsupported claims reaching publication | Late absolute claims |

**Proposed demo context:** a single fictional B2B organisation with a versioned brand kit (style guide, approved facts, terminology, claim policy, optional visual tokens).

---

## 3. Proposed solution

### Value proposition

Pre-publication review that **refuses unsupported confidence**: every consequential finding references an approved source or explicitly identifies an evidence gap; suggestions preserve creator intent and require human acceptance; approvals are server-enforced and auditable. **The model never marks content approved.**

### Mechanism priorities (not claimed unique as slogans)

**A. Evidence-linked findings**  
Hybrid engine: deterministic validators + retrieval over a version-pinned brand kit + structured LLM outputs. A server **evidence gate** requires citation IDs to belong to that run’s retrieval snapshot. Findings use statuses:

| Status | Meaning |
| --- | --- |
| `verified` | Supported by an approved source |
| `contradicted` | Conflicts with an approved source |
| `unsupported` | Material claim with no supporting source found |
| `indeterminate` | Ambiguous rule or insufficient context |
| `policy_hit` | Deterministic term/claim rule fired |
| `suggestion_only` | Non-blocking style preference |

**Absence of evidence does not automatically mean a claim is false.**

**B. Intent-preserving corrections**  
Authors declare goal, audience, channel, and must-keep phrases. The system proposes alternatives, shows a version comparison, and applies changes only on explicit acceptance (new revision).

**C. Reliable governance**  
Roles (`author`, `reviewer`, `admin`), allow-listed workflow transitions, append-only audit events, and (as time allows) analytics on recurring mistakes and `indeterminate` clusters that suggest unclear guidelines.

### Naming / originality

“BrandGuard AI” is provisional due to commercial name collision. We will select a mechanism-led name before demo branding. Originality for judging should rest on fail-closed evidence gating, epistemic statuses, and a permissioned approval ledger — plus honest evaluation — not on the temporary name.

### What remains unproven

Span-level entailment quality; whether authors complete intent fields; measured intent retention; usefulness of analytics on tiny demo data. Strengthening evidence: labelled fixtures, citation validity gates, permission e2e tests, and (if conducted) real reviewer feedback notes.

---

## 4. Complete workflow

```text
Admin publishes Brand Kit version N
  → Author creates draft + declares intent
  → System runs hybrid review (deterministic → retrieve → structure → evidence gate)
  → Author inspects sources / evidence gaps; accepts or rejects suggestions (diff)
  → Author submits for approval
  → Reviewer approves, requests changes, or rejects (server-enforced)
  → Audit event recorded
```

**States:** `draft` → `in_review` → `changes_requested` | `approved` | `rejected` (with archival / supersession as needed).

### Demonstration scenario

A launch email draft claims “customers see 300% ROI in two weeks.” The system labels the metric `unsupported` (not “false”), may add a `policy_hit` for absolute promotional language, and proposes an intent-preserving rewrite. The author accepts via diff; a reviewer approves; the audit log shows kit version and actors. Negative checks: forged citation rejected; non-reviewer cannot approve.

---

## 5. Main features

### Essential for Round 2 (MVP)

1. Versioned brand kit (seeded Markdown/JSON acceptable)  
2. Draft review with declared intent  
3. Hybrid review engine + evidence gate + status taxonomy  
4. Findings UI with excerpts and explicit evidence gaps  
5. Suggestions with side-by-side comparison and human accept/reject  
6. Server-enforced approval workflow  
7. Append-only audit events  
8. Labelled fixture pack and automated tests for citations and permissions  

### Explicit exclusions / deferred

Autonomous publishing; client-only authorization; auto-approve by model confidence; full DAM; trademark watch networks; multi-tenant SSO; deep visual/logo QA; CMS/Slack integrations; regulated legal-opinion engines; training on customer content by default.

---

## 6. Technology stack

| Area | Proposal |
| --- | --- |
| Application | Next.js + TypeScript |
| UI | Tailwind CSS + shadcn/ui |
| Validation | Zod |
| Database | PostgreSQL |
| Retrieval | Postgres full-text + metadata first; `pgvector` only if evaluation requires it |
| LLM | Server-side provider adapter with structured outputs |
| Auth | One managed auth solution (decision at build start) |
| Files | Private object storage when uploads land |
| Tests | Vitest + Playwright |
| Deploy | Vercel-compatible |

**Rationale:** brand governance is a trust problem. Deterministic checks catch machine-checkable policy hits; retrieval grounds factual/policy findings; the LLM structures explanations; the evidence gate blocks unsupported confidence; the workflow service owns approval authority. Secrets never ship in frontend code; roles are re-checked on the server for every mutation.

---

## 7. Team-member responsibilities

Placeholders only — **do not invent a roster**.

| Role | Responsibilities | Assignee |
| --- | --- | --- |
| Product / submission lead | Problem framing, PDF, scope control, demo narrative | `[PARTICIPANT_FULL_LEGAL_NAME_1]` — `[ROLE_1]` |
| Full-stack engineer | UI, workflow UX, auth integration, deployment | `[PARTICIPANT_FULL_LEGAL_NAME_2]` — `[ROLE_2]` |
| AI / review-engine engineer | Retrieval, LLM adapter, evidence gate, fixtures/eval | `[PARTICIPANT_FULL_LEGAL_NAME_3]` — `[ROLE_3]` |
| Security / data engineer | Schema, org scoping, audit integrity, file safety | `[PARTICIPANT_FULL_LEGAL_NAME_4]` — `[ROLE_4]` |

If `[TEAM_SIZE]` is smaller than four, combine roles explicitly.

---

## 8. Plan across all three rounds

**Round 1 (now):** problem/solution docs, architecture, MVP scope, submission PDF content, agent instruction files. No functional product build until the permitted window (`[BUILD_WINDOW_ROUND_2_START]` — **Unresolved**).

**Round 2:** phased vertical slice — foundation → UI → DB/auth → brand kit → review/evidence engine → corrections → approval/audit → optional files/visuals → thin analytics → deploy/demo. Cut visuals and ingestion before cutting the evidence gate or server approvals.

**Round 3:** freeze scope; run labelled evaluation; report measured metrics only; polish demo; document limitations; prepare judge Q&A.

---

## 9. Expected impact

### Qualitative expected outcomes (not yet measured)

Fewer unsupported claims reaching publication; clearer reviewer decisions with cited sources; corrections that retain campaign intent; auditable approvals pinned to guideline versions; signals that guidelines themselves are unclear (`indeterminate` clusters).

### Evaluation metrics (**proposed** until measured)

| Metric | Proposed target |
| --- | --- |
| Finding precision / recall on a labelled test set | Report vs naive LLM baseline; improve critical slices |
| Evidence-reference validity | 100% of rendered citation IDs ⊆ retrieval snapshot |
| Forged-citation acceptance | 0 |
| Correction regression rate | Track; minimise blocker reintroduction after accepted suggestions |
| Approval-permission test pass rate | 100% unauthorized attempts blocked in e2e |

Human intent-retention ratings on suggestions are a planned qualitative supplement.

---

## 10. Future scope

Post-MVP / post-event: final rename; stronger span-level support checks; hybrid vector retrieval if needed; CMS/Slack gates; deeper accessibility content checks; multi-tenant SSO; counsel-reviewed vertical claim packs.

**Non-goals unless strategy changes:** autonomous approval without humans; scraping the public web as brand truth; training foundation models on private drafts by default.

---

## 11. Complete team and participant details

| Field | Value |
| --- | --- |
| Official team name | `[TEAM_NAME]` |
| Team size | `[TEAM_SIZE]` |
| Provisional product name | BrandGuard AI (rename planned) |
| Challenge / track | Inkloom AI — brand governance *(confirm official title)* |

| # | Full legal name | Email | Responsibilities / contributions | Affiliation (if required) |
| --- | --- | --- | --- | --- |
| 1 | `[PARTICIPANT_FULL_LEGAL_NAME_1]` | `[EMAIL_1]` | `[ROLE_1]` / `[CONTRIBUTION_1]` | `[AFFILIATION_1]` |
| 2 | `[PARTICIPANT_FULL_LEGAL_NAME_2]` | `[EMAIL_2]` | `[ROLE_2]` / `[CONTRIBUTION_2]` | `[AFFILIATION_2]` |
| 3 | `[PARTICIPANT_FULL_LEGAL_NAME_3]` | `[EMAIL_3]` | `[ROLE_3]` / `[CONTRIBUTION_3]` | `[AFFILIATION_3]` |
| 4 | `[PARTICIPANT_FULL_LEGAL_NAME_4]` | `[EMAIL_4]` | `[ROLE_4]` / `[CONTRIBUTION_4]` | `[AFFILIATION_4]` |

Adjust rows to match `[TEAM_SIZE]`. **Do not submit with unresolved placeholders.**

---

## Appendix — Assumptions and research checklist

| Type | Item |
| --- | --- |
| Assumption | Single-tenant seeded demo suffices for judging |
| Assumption | Judges will reward calibrated abstention if explained |
| Assumption | Lexical retrieval suffices for small seed kits |
| Planned | Fixture baseline (E2), forged-cite probe (E3), rename check (E5) |
| Checklist | Attach official organiser packet; confirm API/credit requirements; fill team legal details; set build-window dates |

Supporting analyses: `problem-analysis.md`, `solution-and-workflow.md`, `technical-plan.md`, `three-round-roadmap.md`, `judging-self-review.md`.
