# Round 1 Submission Draft — Brand Governance Product

**Provisional product name:** BrandGuard AI *(rename planned before public demo — see originality note)*  
**Team name:** `[TEAM_NAME]`  
**Team size:** `[TEAM_SIZE]`  
**Document date:** 2026-10-20  
**Phase:** Round 1 proposal only — no functional product claimed as built

> **Evidence discipline:** This document separates **verified evidence**, **assumptions**, **planned experiments**, and **proposed targets**. It does not invent user interviews, survey results, customer logos, or measured performance metrics.

---

## 1. Problem understanding

Modern organisations produce marketing, product, and support content faster than brand, legal, accessibility, and communications specialists can consistently review it. Pre-publication review often fails in predictable ways:

1. **Guidelines are archival, not operational.** PDF brand books and scattered Notion pages are interpreted differently by each reviewer.
2. **AI assistants critique without authority.** Chat tools flag tone issues or “risky” claims without pointing to an approved organisational source — or invent citations.
3. **Absence of evidence is misread as falsehood.** If a fact sheet does not mention a metric, that does not prove a claim is false; it proves support is missing.
4. **Corrections destroy intent.** Auto-rewrites push safe corporate language and erase campaign angle, channel fit, or mandated phrases.
5. **Approvals are not governance.** Spreadsheet sign-offs and client-side “admin” toggles do not produce an auditable, permissioned decision history.

### Why this matters

The cost of failure is not only off-brand tone. It includes unsupported promotional claims, outdated product facts, banned terminology, mismatched visual assets, accessibility gaps, and the inability to answer: *who approved this, against which guideline version, and why?*

### Category honesty (verified competitor existence)

“AI checks your brand guidelines” is **not** an original category claim:

- A commercial product already markets itself as **BrandGuard AI** for brand/legal marketing review ([brandguardai.io](https://brandguardai.io/), accessed 2026-10-20).
- Enterprise vendors such as **Writer** and **Acrolinx / Markup AI** already sell brand, terminology, and compliance review workflows.

Therefore our Round 1 thesis is **not** “we will build an AI brand checker.” It is: **evidence-gated brand governance** — findings that must cite approved sources or explicitly declare an evidence gap; intent-preserving corrections under human acceptance; and server-enforced approvals with an audit ledger.

### Hardest technical challenge (preview)

Reliable, evidence-grounded findings under ambiguous rules, missing sources, and noisy inputs — without equating “not found” with “false,” and without allowing fabricated citations. (Detailed in Section 3 and architecture notes.)

---

## 2. Affected users

**Label:** Personas are **proposed** design archetypes for the product, not results from completed interviews.

| User | Job to be done | Primary pain |
| --- | --- | --- |
| Content creator / marketer | Ship channel-ready content without late rewrites | Vague AI flags; corrections that change campaign intent |
| Brand / communications reviewer | Approve or request changes consistently | Missing context; unclear guideline version; weak audit trail |
| Brand knowledge owner | Keep facts, terms, claims policies, and assets current | Guideline drift; tribal “rules” not in the source of truth |
| Compliance / legal stakeholder (secondary in MVP) | Reduce unsupported claims reaching publication | Absolute claims and missing disclaimers arrive too late |

**Organisational context (proposed demo):** a product company with a versioned brand kit — style guide, approved facts, terminology list, promotional-claim policy, and optional visual tokens/assets.

---

## 3. Proposed solution

### Product one-liner

**Evidence-gated pre-publication brand governance:** every consequential finding references an approved source or explicitly identifies an evidence gap; suggestions preserve creator intent and require human acceptance; approvals are server-enforced and auditable. The model never marks content approved.

### Mechanism differentiators (A + B + C)

**A. Evidence-linked findings**  
Retrieval runs over a **version-pinned** brand kit. Model outputs are structured and validated. Citation IDs must belong to that run’s retrieval snapshot. Findings use an epistemic status model:

| Status | Meaning |
| --- | --- |
| `verified` | Supported by approved source |
| `contradicted` | Conflicts with approved source |
| `unsupported` | Material claim with no supporting source found |
| `indeterminate` | Ambiguous rule or insufficient context |
| `policy_hit` | Deterministic term/claim rule fired |
| `suggestion_only` | Non-blocking style preference |

**Absence of evidence does not automatically mean a claim is false.**

**B. Intent-preserving corrections**  
Authors declare intent (goal, audience, channel, must-keep phrases). The system proposes alternatives, shows a version comparison, and applies changes only on explicit acceptance — creating a new revision.

**C. Reliable governance**  
Roles (`author`, `reviewer`, `admin`) and workflow transitions are enforced on the server. Audit events are append-only. Analytics (Round 2/3) surface recurring mistakes and clusters of `indeterminate` findings that suggest unclear guidelines.

### Naming / originality note

“BrandGuard AI” is **provisional**. Given the commercial collision at brandguardai.io and crowded “brand guardian” naming in prior hackathon work, we will select a mechanism-led name (examples under consideration: CitePolicy, GuidelineLedger, ClaimStatus, EvidenceGate) after a short originality check. Originality for judging should be assessed on the **evidence-gate + status taxonomy + human approval ledger**, not the provisional label.

### Solution boundaries

We optimise for a credible end-to-end workflow on text-first reviews with a seeded kit. We do not claim to replace enterprise suites, provide legal advice, or auto-publish to production CMS without humans.

---

## 4. Complete workflow

```text
Admin seeds / publishes Brand Kit (version N)
    ↓
Author creates draft + declares intent
    ↓
Hybrid review:
  deterministic validators → retrieval snapshot → structured LLM findings → evidence gate
    ↓
Author inspects findings (sources + evidence gaps), accepts/rejects suggestions (diff)
    ↓
Author submits for approval
    ↓
Reviewer approves / requests changes / rejects  (server role + state machine)
    ↓
Audit event recorded; analytics updated
```

### Review states

`draft` → `in_review` → `changes_requested` | `approved` | `rejected` → (`archived` / new revision supersedes)

**Hard rule:** LLM recommendation cannot set `approved`.

### Demo story (later rounds)

1. Glowing metric claim → `unsupported` (not “false”)  
2. Forged citation rejected by server  
3. Suggestion accepted with visible diff  
4. Non-reviewer cannot approve  
5. Audit log shows transitions against kit version N  

---

## 5. Main features

### P0 (must ship in build window)

1. Versioned brand kit: guidelines, approved facts, terminology, claim policies  
2. Draft review with declared intent  
3. Hybrid review engine (deterministic + retrieval + structured LLM)  
4. Evidence gate + claim status taxonomy  
5. Findings UI with source excerpts and explicit evidence gaps  
6. Suggestion proposals + side-by-side comparison + accept/reject → revisions  
7. Server-enforced roles and approval transitions  
8. Append-only audit events  
9. Seeded demo org + labelled fixture pack  
10. Automated tests for schema validation, citation integrity, and forbidden approvals  

### P1 (time allowing)

- Recurring-violation / unclear-guideline analytics  
- File ingestion for guidelines  
- Shallow visual/token checks  
- Exportable review report  
- Rich revision timeline  

### Explicit exclusions

Autonomous publishing; client-only authz; auto-approve by model confidence; trademark watch networks; training on customer content by default; full DAM; regulated legal opinion engines.

---

## 6. Technology stack

| Area | Proposal | Notes |
| --- | --- | --- |
| Application | Next.js + TypeScript | Vercel-compatible full-stack demo |
| UI | Tailwind CSS + shadcn/ui | Accessible primitives, speed |
| Validation | Zod | Inputs, workflow commands, model outputs |
| Database | PostgreSQL | Workflow, audit, kits |
| Retrieval | Postgres full-text + metadata filters first | `pgvector` **only if** eval shows need |
| LLM | Server-side provider adapter + structured outputs | Vendor-swappable; secrets never in client |
| Auth | One managed auth solution (decision at build start) | Server session re-check every mutation |
| Files | Private object storage | When uploads/visuals land |
| Tests | Vitest + Playwright | Gates, permissions, e2e demo path |
| Deploy | Vercel-compatible | |

### Architecture rationale

Brand governance is a **trust** problem. A pure chatbot is insufficient. Deterministic validators catch machine-checkable policy hits cheaply; retrieval grounds factual/policy findings; the LLM structures explanations; the **evidence gate** prevents unsupported confidence from reaching users; the **workflow service** owns approval authority.

### Validation of critical outputs

- **Evidence references:** citation IDs ⊆ retrieval snapshot; verified/contradicted require citations  
- **Model outputs:** Zod parse; fail closed on schema errors  
- **Permissions:** server loads role from session/DB — UI hiding is not security  
- **Transitions:** allow-listed state machine + tests for illegal paths  

### Trade-off we accept

More `unsupported` / `indeterminate` results than a flashy always-answer bot. We will teach judges that calibrated abstention is the reliability feature.

---

## 7. Team-member responsibilities

| Role | Responsibilities | Assignee |
| --- | --- | --- |
| Product / submission lead | Problem framing, PDF, scope control, demo narrative | `[PARTICIPANT_FULL_LEGAL_NAME_1]` — `[ROLE_1]` |
| Full-stack engineer | UI, workflow UX, auth integration, deploy | `[PARTICIPANT_FULL_LEGAL_NAME_2]` — `[ROLE_2]` |
| AI / review-engine engineer | Retrieval, LLM adapter, evidence gate, fixtures/eval | `[PARTICIPANT_FULL_LEGAL_NAME_3]` — `[ROLE_3]` |
| Security / data engineer | Schema, org scoping, audit integrity, file safety | `[PARTICIPANT_FULL_LEGAL_NAME_4]` — `[ROLE_4]` |

If `[TEAM_SIZE]` is smaller than four, roles are combined explicitly — we will not invent participants.

---

## 8. Plan across all three rounds

### Round 1 (current) — Proposal and readiness

- Problem, solution, workflow, scope, architecture, security approach  
- Submission PDF and team details  
- Agent/engineering instruction files for disciplined later build  
- **No functional product implementation until permitted development window**

### Round 2 — Vertical slice build (phased)

1. Foundation and design system  
2. Main interface  
3. Database and authentication  
4. Brand knowledge management  
5. Review and evidence engine  
6. Correction and version comparison  
7. Approval and audit workflow  
8. File and visual checks (as time allows)  
9. Analytics and reliability  
10. Deployment, testing, demonstration  

A phase is complete only when acceptance criteria and tests pass.

### Round 3 — Harden, measure, present

- Freeze scope; reliability fixes only  
- Run labelled evaluation; report **measured** metrics only  
- Polish demo around evidence gaps + human approval  
- Honest limitations + Q&A on the hardest technical challenge  

---

## 9. Expected impact

### Qualitative expected outcomes (not yet measured)

- Fewer unsupported claims reaching publication  
- Faster, more consistent reviewer decisions with cited sources  
- Corrections that keep campaign intent  
- Auditable approval history pinned to guideline versions  
- Guideline improvement signals from recurring `indeterminate` clusters  

### Evaluation plan (build window)

- Labelled fixture pack with expected statuses  
- Hard gates: 100% citation ID validity; 0 forged citations accepted; 100% blocked unauthorized approvals in e2e  
- Proposed quality targets for deterministic `policy_hit` precision and false `contradicted` rate — **published only after measurement**  
- Small human rating study on intent preservation of suggestions  

We will not submit invented accuracy percentages.

---

## 10. Future scope

Post-event / post-MVP:

- Final product rename and brand identity  
- Stronger span-level entailment checks  
- Hybrid vector retrieval if eval requires it  
- CMS/Slack publish gates  
- Deeper accessibility auditing  
- Multi-tenant SSO hardening  
- Counsel-reviewed vertical claim packs  

Permanent non-goals unless strategy changes: autonomous approval without humans; scraping the web as brand truth; training on private drafts by default.

---

## 11. Complete team and participant details

| Field | Value |
| --- | --- |
| Team name | `[TEAM_NAME]` |
| Team size | `[TEAM_SIZE]` |
| Provisional product name | BrandGuard AI (rename planned) |
| Challenge | Inkloom AI — brand governance *(confirm official track title)* |

| # | Full legal name | Email | Responsibilities | Affiliation (if required) |
| --- | --- | --- | --- | --- |
| 1 | `[PARTICIPANT_FULL_LEGAL_NAME_1]` | `[EMAIL_1]` | `[ROLE_1]` | `[AFFILIATION_1]` |
| 2 | `[PARTICIPANT_FULL_LEGAL_NAME_2]` | `[EMAIL_2]` | `[ROLE_2]` | `[AFFILIATION_2]` |
| 3 | `[PARTICIPANT_FULL_LEGAL_NAME_3]` | `[EMAIL_3]` | `[ROLE_3]` | `[AFFILIATION_3]` |
| 4 | `[PARTICIPANT_FULL_LEGAL_NAME_4]` | `[EMAIL_4]` | `[ROLE_4]` | `[AFFILIATION_4]` |

Adjust rows to match `[TEAM_SIZE]`. **Do not submit with unresolved placeholders.**

---

## Appendix A — Assumptions, experiments, targets

| Type | ID | Statement |
| --- | --- | --- |
| Assumption | A1 | Mid-size B2B content teams are a viable demo audience |
| Assumption | A2 | Judges will reward calibrated abstention if explained |
| Assumption | A7 | Lexical retrieval suffices for small seed kits |
| Planned experiment | E2 | Baseline naive LLM false-positive rate on fixtures |
| Planned experiment | E3 | Forged citation rejection probe |
| Proposed target | T-cite | 100% citation IDs ⊆ snapshot |
| Proposed target | T-authz | 100% unauthorized approvals blocked in e2e |

## Appendix B — Selected references (accessed 2026-10-20)

- https://brandguardai.io/  
- https://writer.com/solutions/technology/  
- https://www.acrolinx.com/  
- https://inkloom.art/  
- https://dev.to/ranknod/check-ai-citations-against-retrieved-source-ids-3hi8  
- https://dev.to/monongahelahellbender/a-rag-evaluator-that-admits-what-it-cant-judge-ad2  
- https://dev.to/brockfletcher1438/rag-hallucination-diagnosis-evidence-gating-beats-embeddings-for-ask-your-docs-chatbot-answers-18a7  

Full annotated list: `docs/round-1/13-research-references.md`
