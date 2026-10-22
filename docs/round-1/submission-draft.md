# BrandGuard AI — Evidence-Gated Brand Governance

- **Provisional product name:** BrandGuard AI *(final naming decision unresolved)*
- **Team name:** `[TEAM_NAME]`
- **Team size:** `[TEAM_SIZE]`
- **Prepared:** 2026-10-21

**Status:** Proposal plus a working prototype is present in the repository. The implementation date and whether this work is permitted within the official build window are unresolved; this draft makes no claim that work was completed during that window.

> No user research or measured impact is claimed. The demo kit is illustrative, not verified real-world data.

## Executive summary

BrandGuard AI is a proposed pre-publication governance system for marketing and product content. It is designed to link findings to approved evidence—or declare an evidence gap—while keeping `verified`, `contradicted`, `unsupported`, and `indeterminate` claims distinct. Authors remain in control of corrections, and approvals are intended to be role-checked on the server; models never approve content.

The current prototype demonstrates only a deterministic, seeded slice: selected terminology, promotional-phrase, and fact checks; a source-ID membership gate; correction accept/reject; and in-memory review records. It does **not** yet include retrieval, an LLM, authentication, durable storage, or permissioned approval actions. Its presence does not establish when it was built or whether it falls within an official build window.

**Round 1 thesis:** evidence-linked findings + uncertainty-aware statuses + intent-preserving, human-accepted corrections + permissioned human approvals. The combination is a proposed differentiation, not a verified uniqueness claim. Evaluation and user research remain future work.

**Working rubric alignment:** problem understanding; solution; technical feasibility; originality; and scope/feasibility. This document makes no prediction of judging scores.

## 1. Problem understanding

**Problem hypothesis; not validated through user research.** Teams may need to publish marketing, product, and support content faster than brand, legal, accessibility, and communications specialists can consistently review it. Pre-publication review can require checking drafts against approved guidelines, facts, terminology, messaging, visual assets, accessibility expectations, and promotional-claim policies—then explaining findings, suggesting corrections, enabling human approvals, retaining history, and surfacing governance patterns.

Failure modes this proposal is designed to address:

1. **Guidelines are archival, not operational** — PDF and wiki rules are interpreted differently by each reviewer.  
2. **AI critique without authority** — assistants flag “risk” without citing an approved organisational source, or invent citations.  
3. **Epistemic collapse** — missing support is treated as proof a claim is false.  
4. **Intent-destroying remediation** — auto-rewrites erase campaign angle, channel fit, or mandated phrases.  
5. **Approvals without governance** — spreadsheets and client-side “admin” flags are not permissioned, auditable decisions.

**Potential impact:** issues may extend beyond off-brand tone to unsupported promotional claims, outdated facts, banned terms, mismatched assets, accessibility gaps, or uncertainty about who approved what against which guideline version. These impacts are not measured in this submission.

### Supporting evidence and assumptions

**Sourced evidence (limited):** the Round 1 research notes record public pages for BrandGuard AI, Writer, and Acrolinx / Markup AI, accessed 2026-10-20 ([1](https://brandguardai.io/), [2](https://writer.com/solutions/technology/), [3](https://www.acrolinx.com/)). This establishes examples of products in the broad category only; it is not market-share research, a comprehensive competitor analysis, or proof of comparative performance.

**Assumptions:** the failure modes above reflect a meaningful workflow problem; a seeded single-organisation demo is useful to judges; and reviewers value traceable evidence, calibrated uncertainty, and human control.

**Planned research:** no user interviews, surveys, or demand tests are reported. Any future conversations or evaluations will be described only if actually conducted.

This proposal makes no claim that the category or its mechanisms are unique. Evidence-gated findings, uncertainty-aware statuses, human-approved corrections, and permissioned approvals are intended differentiators whose value and comparative position remain to be validated. “BrandGuard AI” is a provisional name; public use requires a team naming decision and any needed clearance.

### Hardest technical challenge

Making AI review findings **traceable to approved evidence** while managing missing sources, ambiguous policies, false positives, and unreliable model outputs — without equating absence of evidence with falsehood, and without allowing fabricated citations to appear as support.

---

## 2. Target users and organisational context

**Label:** proposed design archetypes — not completed interview research.

| User | Job to be done | Primary pain |
| --- | --- | --- |
| Content creator | Ship channel-ready drafts without late rewrites | Vague AI flags; corrections that change intent |
| Brand / communications reviewer (**primary MVP**) | Approve or request changes with a defensible rationale | Missing sources; unclear guideline version; weak audit trail |
| Brand knowledge owner | Keep facts, terms, and policies current | Drift and tribal rules |
| Compliance stakeholder (secondary) | Reduce unsupported claims reaching publication | Late absolute claims |

**Proposed demo context:** one fictional B2B organisation with a brand kit containing a style guide, approved facts, terminology, and claim policies. The in-app “Inkloom Demo Brand Kit” is synthetic seed content; its figures and statements are not verified facts about Inkloom or another real organisation.

---

## 3. Proposed solution and current implementation status

### Value proposition

The proposed product is pre-publication review that **refuses unsupported confidence**: findings reference approved evidence or explicitly identify a gap; suggestions preserve creator intent and require human acceptance; permissioned approvals are enforced on the server. The model must never approve content.

The prototype implements only a deterministic, seeded slice of this workflow. Its review screen accepts a draft and one intent field, runs fixed checks, applies or rejects corrections, and stores reviews in memory. There is no LLM, dynamic retrieval, authentication, durable database, or approval transition in the current application.

### Mechanism priorities (proposed; not a uniqueness claim)

**A. Evidence-linked findings**  
The target hybrid engine combines deterministic validators, retrieval over a version-pinned brand kit, and structured LLM outputs. A server **evidence gate** requires citation IDs to belong to that run’s retrieval snapshot. In the current prototype, deterministic checks use one seeded kit and the snapshot contains that kit’s source IDs; no retrieval query or LLM is wired. The schema supports these statuses:

| Status | Meaning |
| --- | --- |
| `verified` | Supported by an approved source |
| `contradicted` | Conflicts with an approved source |
| `unsupported` | Material claim with no supporting source found |
| `indeterminate` | Ambiguous rule or insufficient context |
| `policy_hit` | Deterministic term/claim rule fired |
| `suggestion_only` | Non-blocking style preference; defined in the schema but not currently emitted |

**Absence of evidence does not automatically mean a claim is false.**

**B. Intent-preserving corrections**  
The prototype captures a goal and provides deterministic proposed corrections with accept/reject controls; acceptance creates an in-memory revision. The full workflow—capturing goal, audience, channel, and must-keep phrases; showing a useful change comparison; and applying changes only after explicit acceptance—is planned. Current UI comparisons display complete original and proposed text, not a focused diff.

**C. Reliable governance**  
Permissioned roles (`author`, `reviewer`, `admin`), server-enforced workflow transitions, and durable append-only audit events are planned, not implemented. The prototype records review and correction events in an in-memory array under a fixed demo actor; it has no role checks or approval action. Its analytics page shows session-scoped counts only.

### Naming / originality

“BrandGuard AI” is a working name only. Final naming and any required clearance are unresolved. Do not represent the mechanisms as unique without comparative evidence.

### What remains unproven

Review accuracy beyond the implemented fixed checks; retrieval quality; whether authors complete intent fields; measured intent retention; usefulness of analytics; and permission enforcement are unproven. The current tests exercise deterministic examples and citation membership, not a labelled evaluation set, permission tests, or end-to-end approval workflow. No user research or impact measurement is reported.

---

## 4. Target workflow and current demo path

The following is the **planned end-to-end workflow**, not a claim that every stage exists in the prototype:

```text
Admin publishes Brand Kit version N
  → Author creates draft + declares intent
  → System runs hybrid review (deterministic → retrieve → structure → evidence gate)
  → Author inspects sources / evidence gaps; accepts or rejects suggestions (diff)
  → Author submits for approval
  → Reviewer approves, requests changes, or rejects (server-enforced)
  → Audit event recorded
```

**Target states:** `draft` → `in_review` → `changes_requested` | `approved` | `rejected` (with archival / supersession as needed). The prototype currently creates review records with `in_review`, `needs_revision`, or `engine_error`; it has no approval transition.

**Implemented demo path:** open the seeded demo, submit copy, inspect fixed-rule findings and evidence statuses, and accept or reject a proposed correction. Reviews and correction events exist only in process memory and reset when the server restarts. The knowledge page shows a read-only kit; the approval queue lists candidate reviews but does not permit approve/reject decisions.

### Demonstration scenario

A launch email draft claims “customers see 300% ROI in two weeks.” In the proposed workflow, a review would label an unsupported claim `unsupported`, not “false”; a deterministic policy hit may also be shown. A correction can be accepted or rejected in the prototype. Reviewer approval, actor attribution from authenticated roles, and a durable audit history are planned and are not currently demonstrable. The test suite includes a forged/out-of-snapshot citation case; it does not include an authorization test.

---

## 5. Features and implementation status

Status labels describe the code inspected on 2026-10-21, not completion of a milestone or eligibility under an event build window.

| Status | Feature | Current scope / boundary |
| --- | --- | --- |
| **Implemented** | Application shell and review surfaces | Dashboard, reviews, read-only brand knowledge, candidate approval queue, process-scoped analytics, and settings pages are present. |
| **Implemented** | Seeded demo brand kit | One in-code example with facts, sources, terminology, and claim policies; no kit CRUD or version publishing. Demo content is illustrative. |
| **Implemented** | Deterministic checks and evidence gate | Fixed terminology/claim patterns and limited fact phrases; a constructed source-ID snapshot gates citations. No dynamic retrieval or LLM. |
| **Implemented** | Uncertainty-aware statuses | Finding schema and checks distinguish `verified`, `contradicted`, `unsupported`, `indeterminate`, and `policy_hit`; unsupported is not treated as contradicted. `suggestion_only` is schema-only at present. |
| **Implemented** | Human correction decisions | Accept/reject controls update the in-memory review; accepting adds a revision. Suggestions are deterministic, and the displayed comparison is whole-text rather than a focused diff. |
| **Implemented** | Prototype event recording | Review and correction events append to an in-memory array under a fixed demo actor. This is not durable, authenticated, or a production audit ledger. |
| **In progress** | Complete review experience | Draft input and goal are present, but audience/channel/must-keep fields, detailed evidence retrieval, and focused diffing are absent. |
| **In progress** | Governance UI | Approval queue is read-only; knowledge page is read-only; analytics are counts from current-process reviews. |
| **Planned** | Authenticated, permissioned approvals | Server-side roles, organisation-scoped access, checked transitions, and non-reviewer denial. |
| **Planned** | Production data and evidence pipeline | Durable database, brand-kit administration/versioning, retrieval, and structured server-side LLM adapter. |
| **Planned** | Acceptance and evaluation evidence | Labelled fixture set, permission tests, integration/e2e coverage, and measured evaluation. |

### Explicit exclusions / deferred

Autonomous publishing; auto-approve by model confidence; full DAM; trademark watch networks; multi-tenant SSO; deep visual/logo QA; CMS/Slack integrations; regulated legal-opinion engines; training on customer content by default.

---

## 6. Technology stack

| Area | Implemented now | Proposed / planned |
| --- | --- | --- |
| Application | Next.js App Router, TypeScript, React | Continue the current app |
| UI | Tailwind CSS; UI components in the repository | shadcn/ui-compatible components; no product build claim from package presence alone |
| Validation | Zod schemas for domain inputs/findings | Extend boundary validation to services and any future model output |
| Database | None; in-memory Maps/arrays | PostgreSQL |
| Retrieval | Constructed snapshot containing source IDs from the seeded kit | Postgres full-text + metadata first; `pgvector` only if evaluation requires it |
| LLM | None | Server-side provider adapter with structured outputs |
| Auth | None; fixed demo actor | Select and integrate a managed auth solution |
| Files | None | Private object storage when uploads are in scope |
| Tests | Vitest unit tests | Add integration/e2e and labeled-fixture evaluation |
| Deploy | No deployment evidence in this submission | Vercel-compatible deployment is a proposal |

**Rationale:** brand governance is a trust problem. The current deterministic checks demonstrate a small part of the intended system. The proposed retrieval, server-side structured LLM, evidence gate, and permissioned workflow are not represented as implemented. No production secret handling or server-side role enforcement has been demonstrated.

### Planned architecture

```text
Author draft + intent
  → deterministic rules
  → retrieval snapshot from an approved, versioned kit
  → structured server-side model output (planned)
  → Zod validation + evidence gate (citation IDs ⊆ snapshot)
  → findings and evidence gaps
  → human-accepted correction
  → role-checked approval + append-only audit event
```

**Current prototype:** the deterministic checks and source-ID membership gate run against one in-code demo kit. The retrieval, model, database, authentication, role checks, and approval/audit workflow shown above are planned.

### Privacy, security, accessibility, and AI oversight

| Area | Product requirement / current boundary |
| --- | --- |
| Privacy and confidentiality | The demo uses synthetic seed content. No private customer drafts or uploaded guidelines are used. Production storage, retention, and deletion controls are not implemented. |
| Secrets | Future provider credentials must stay server-side and out of `NEXT_PUBLIC_` variables. No provider is currently configured. |
| Authorization and isolation | Future mutations must re-check user and role on the server and scope data by organisation. The prototype has no authentication or production tenant isolation. |
| Untrusted content | Drafts and guidelines must be treated as untrusted input; evidence must be bounded to approved kit sources. This is a design requirement, not a completed security control. |
| Audit | Approval decisions are intended to create append-only, durable events. Current prototype events are in-memory and use a fixed demo actor. |
| Accessibility | Accessible labels and non-colour severity cues are design goals. No formal WCAG conformance audit has been performed. |
| Human oversight | Authors decide whether to accept a correction; a human reviewer must decide approval. The prototype supports correction accept/reject only; approval authority is not implemented. |
| AI disclosure | No LLM is wired into the prototype. Any future model-generated findings or suggestions must be identified as AI-assisted; models must never approve content. Training on customer content is not planned by default. |

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

**Round 1:** proposal and planning documents are present, and a working prototype is also present in the repository as of this review. Available history does not establish when the uncommitted implementation was created; official build-window dates and permission are unresolved. Do not claim that the prototype was completed within the official window or that it is Round 2 work without dated evidence and organiser confirmation.

**Round 2 (planned, subject to official rules):** phased vertical slice — foundation → UI → DB/auth → brand kit → review/evidence engine → corrections → approval/audit → optional files/visuals → thin analytics → deploy/demo. Cut visuals and ingestion before cutting the evidence gate or server approvals.

**Round 3:** freeze scope; run labelled evaluation; report measured metrics only; polish demo; document limitations; prepare judge Q&A.

### Three specific improvements and acceptance criteria

All targets below are proposed acceptance criteria, not achieved results.

| Round | Improvement | Acceptance evidence |
| --- | --- | --- |
| 2 | Evidence integrity | Test every rendered citation ID against the review snapshot; target **100% valid IDs** and **0 forged citations accepted** in the test set. |
| 2 | Human-controlled corrections | Automated tests show acceptance creates a revision and rejection leaves the draft unchanged; add before/after comparison and preserve declared intent. |
| 3 | Permissioned approvals and measured calibration | E2E tests block **100% of unauthorized approval attempts** and record each valid transition. Report per-status precision/recall on a frozen labelled set; do not set or report a performance result before measurement. |

---

## 9. Expected impact

### Qualitative expected outcomes (proposed; not measured)

Fewer unsupported claims reaching publication; clearer reviewer decisions with cited sources; corrections that retain campaign intent; auditable approvals pinned to guideline versions; signals that guidelines themselves are unclear (`indeterminate` clusters).

### Evaluation metrics (**proposed**, not results)

| Metric | Proposed target |
| --- | --- |
| Finding precision / recall on a labelled test set | Report vs naive LLM baseline; improve critical slices |
| Evidence-reference validity | 100% of rendered citation IDs ⊆ retrieval snapshot |
| Forged-citation acceptance | 0 |
| Correction regression rate | Track; minimise blocker reintroduction after accepted suggestions |
| Approval-permission test pass rate | 100% unauthorized attempts blocked in e2e |

Human intent-retention ratings on suggestions are a planned qualitative supplement. No measured impact, user research, or evaluation result is available in this submission.

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
| Product name | BrandGuard AI *(provisional; final decision unresolved)* |
| Official challenge / track | `[OFFICIAL_CHALLENGE_OR_TRACK_TITLE]` |
| Official PDF format / page and file-size limits | `[OFFICIAL_PDF_FORMAT_PAGE_LIMIT_AND_SIZE]` |
| Official build-window dates | `[OFFICIAL_BUILD_WINDOW_DATES]` *(unresolved; no claim that the prototype was built within this window)* |

| # | Full legal name | Email | Responsibilities / contributions | Affiliation (if required) |
| --- | --- | --- | --- | --- |
| 1 | `[PARTICIPANT_FULL_LEGAL_NAME_1]` | `[EMAIL_1]` | `[ROLE_1]` / `[CONTRIBUTION_1]` | `[AFFILIATION_1]` |
| 2 | `[PARTICIPANT_FULL_LEGAL_NAME_2]` | `[EMAIL_2]` | `[ROLE_2]` / `[CONTRIBUTION_2]` | `[AFFILIATION_2]` |
| 3 | `[PARTICIPANT_FULL_LEGAL_NAME_3]` | `[EMAIL_3]` | `[ROLE_3]` / `[CONTRIBUTION_3]` | `[AFFILIATION_3]` |
| 4 | `[PARTICIPANT_FULL_LEGAL_NAME_4]` | `[EMAIL_4]` | `[ROLE_4]` / `[CONTRIBUTION_4]` | `[AFFILIATION_4]` |

Adjust rows to match `[TEAM_SIZE]`. **Do not submit with unresolved placeholders.**

---

## Appendix — Assumptions and submission readiness

| Type | Item |
| --- | --- |
| Assumption | Single-tenant seeded demo suffices for judging |
| Assumption | Judges will reward calibrated abstention if explained |
| Assumption | Lexical retrieval may suffice for small seed kits; this has not been evaluated |

### Information to supply before final export

1. **Official requirements and timeline:** the organiser packet with required challenge/track wording, fields, PDF format and limits, deadline, and build-window rules/dates; provide dated implementation evidence only if making a build-window claim.
2. **Team details:** official team name and size; every participant’s legal name, email, role/contribution, and affiliation if required. Adjust the roster to the actual team.
3. **Product name:** the team’s final naming decision, or confirmation to retain “BrandGuard AI” as provisional.

Until these are supplied, the official challenge title, PDF requirements, team roster, and final product name remain unresolved. This is a submission draft; no submission or organiser confirmation is claimed.
