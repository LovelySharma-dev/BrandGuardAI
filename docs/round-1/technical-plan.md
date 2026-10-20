# Technical Plan

**Provisional product:** BrandGuard AI  
**Document role:** Round 1 — architecture, stack, data model, security, evaluation  
**Date:** 2026-10-20  
**Constraint:** Planning only — no functional implementation in this task.

---

## 1. Architectural principles

1. Hybrid review: deterministic rules + retrieval + structured LLM — not LLM-only  
2. Fail closed on evidence: unknown citation IDs never render as supported  
3. Server authority for authz, transitions, and secrets  
4. Zod at trust boundaries (inputs, model outputs, workflow commands)  
5. Measure before storytelling (labelled fixtures)

---

## 2. Technology stack and rationale

| Layer | Choice | Why | Mandatory? |
| --- | --- | --- | --- |
| App | Next.js + TypeScript | Fast full-stack, Vercel-compatible | Recommended |
| UI | Tailwind + shadcn/ui | Speed + accessible primitives | Recommended |
| Validation | Zod | Shared schemas for API + AI | Yes |
| DB | PostgreSQL | Relational audit/workflow fit | Yes |
| Auth | One managed provider (decide at build start) | Do not DIY crypto | One required |
| LLM | Server-side adapter (OpenAI-compatible / OpenRouter / etc.) | Swappable | Adapter yes; vendor no |
| Retrieval | Postgres full-text + metadata filters | Brand kits are small | Start here |
| Vectors | `pgvector` only if eval shows need | Avoid unjustified infra | Conditional |
| Files | Private object storage | Uploads/assets | When needed |
| Tests | Vitest + Playwright | Unit + e2e for gates/permissions | Yes |
| Deploy | Vercel-compatible | Hackathon velocity | Recommended |

### Trade-offs

| Choice | Upside | Downside |
| --- | --- | --- |
| Next.js monolith | One deploy | Heavy AI jobs may need queue later |
| Fail-closed gate | Trust | More abstentions — must explain to judges |
| Skip vectors first | Less complexity | Weaker paraphrase recall |
| Minimal roles | Shipable | Not enterprise IAM |

---

## 3. System shape

```text
UI (author / reviewer / admin)
        │ Server Actions / Route Handlers
        ▼
Application services
  BrandKit · Review · Workflow · Audit · Analytics
        │
   ┌────┼────────────────┐
   ▼    ▼                ▼
Deterministic   Retrieval      LLM adapter
validators      (FTS ± vec)    (structured)
   └────┬────────────────┘
        ▼
 Evidence gate + Zod
        ▼
 PostgreSQL (kits, reviews, snapshots, events)
```

### Review pipeline (server)

```text
authorize → validate(ReviewInput)
  → deterministicValidators
  → retrievalSnapshot
  → llm.structured(FindingBatchSchema)
  → evidenceGate(findings, snapshot)
  → persist(review, findings, snapshot, modelMeta)
```

---

## 4. Data model (logical)

- **Organisation** → **BrandKit** (immutable published versions)  
  - guideline chunks, approved facts + evidence sources, term rules, claim policies, assets  
- **User** membership role: `author` | `reviewer` | `admin`  
- **ContentReview**: intent, revisions[], retrieval_snapshots[], findings[], suggestions[], status  
- **AuditEvent**: append-only (actor, action, before/after, timestamp)

### Finding integrity rules

1. `citationIds` ⊆ linked retrieval snapshot  
2. `verified` / `contradicted` require ≥1 citation  
3. `unsupported` / `indeterminate` must not fake support  
4. Approvals require reviewer/admin via server check  

---

## 5. Hardest technical challenge

**Making AI review findings traceable to approved evidence** while managing:

| Hazard | Mitigation |
| --- | --- |
| Missing sources | `unsupported` / evidence gap — not auto-`contradicted` |
| Ambiguous policies | `indeterminate` + human review |
| False positives | Deterministic rules for clear hits; fixtures; precision tracking |
| Unreliable model output | Zod schema; citation ID gate; single repair retry then fail visible |
| Forged citations | Reject IDs absent from snapshot before UI render |

**Residual risk we accept in MVP:** citation ID validity ≠ full span entailment. We will not overclaim NLI-level proof.

---

## 6. Security, privacy, accessibility, oversight

| Requirement | Approach |
| --- | --- |
| Secrets | Server env only; never `NEXT_PUBLIC_` provider keys |
| Authz | Re-load session + role on every mutation |
| Isolation | All queries scoped by `org_id` (even single-tenant demo paths) |
| Untrusted text | Treat drafts/guidelines as data; bound retrieval to kit IDs |
| Privacy | Minimise PII; no training on customer content by default |
| A11y | Accessible UI primitives; severity not colour-only (**proposed** AA target, not yet audited) |
| Oversight | Model advisory only; human accept suggestions; human approve |

---

## 7. Evaluation metrics (**proposed** until measured)

| Metric | Definition | Proposed target | Hard gate? |
| --- | --- | --- | --- |
| Finding precision (per status) | Correct status labels / predicted labels on labelled set | Establish baseline via E2; improve vs naive LLM | No (report honestly) |
| Finding recall (critical slices) | Caught expected `policy_hit` / `contradicted` cases | Track per slice | No |
| Evidence-reference validity | Rendered citation IDs ⊆ snapshot | **100%** | Yes |
| Forged-citation acceptance | Unknown IDs accepted as supported | **0** | Yes |
| Correction regression rate | Accepted suggestion reintroduces blocker findings on re-review | Track; minimise | No |
| Approval-permission test pass rate | Unauthorized approve attempts blocked in e2e | **100%** | Yes |
| Intent retention (human) | Creator 1–5 rating on suggestions | Collect ≥10 samples | No |

Do not publish these as achieved results until measured on a frozen kit + model + schema version.

### Fixture slices (planned)

Banned terms; fact contradiction; novel unsupported claim; ambiguous tone rule; forged citation output; benign on-brand copy.

---

## 8. Team responsibilities (placeholders only)

| Role | Focus | Assignee |
| --- | --- | --- |
| Product / submission | Narrative, scope, PDF | `[PARTICIPANT_FULL_LEGAL_NAME_1]` |
| Full-stack | UI, workflow, deploy | `[PARTICIPANT_FULL_LEGAL_NAME_2]` |
| AI / review engine | Retrieval, LLM, evidence gate, eval | `[PARTICIPANT_FULL_LEGAL_NAME_3]` |
| Security / data | Schema, org scoping, audit, files | `[PARTICIPANT_FULL_LEGAL_NAME_4]` |

Combine roles if `[TEAM_SIZE]` &lt; 4. Do not invent names.

---

## 9. Coverage check — organiser items 6–7

| Requirement | Covered? |
| --- | --- |
| Technology stack | Yes |
| Team-member responsibilities | Placeholders only — honest |
