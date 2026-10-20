# Architecture and Technology Stack

## Architectural principles

1. **Hybrid review:** deterministic rules + retrieval + LLM structuring — not LLM-only.
2. **Fail closed on evidence:** unknown citation IDs never reach the UI as “supported.”
3. **Server authority:** authz, workflow transitions, and secrets stay server-side.
4. **Schema boundaries:** Zod validates inputs, model outputs, and workflow commands.
5. **Measurable core:** labelled fixtures before model tuning.

## Proposed initial stack

| Layer | Choice | Rationale | Mandatory? |
| --- | --- | --- | --- |
| App | Next.js + TypeScript | Fast full-stack demo, Vercel-compatible | Recommended |
| UI | Tailwind CSS + shadcn/ui | Speed + accessible primitives | Recommended |
| Validation | Zod | Shared schemas for API + AI outputs | Yes for MVP |
| DB | PostgreSQL | Relational audit/workflow fit | Yes |
| Auth | Auth.js / Clerk / Supabase Auth (decide in Round 2 kickoff) | Pick one; do not DIY crypto | One required |
| LLM | Server-side adapter (OpenAI-compatible or OpenRouter) | Swappable provider | Adapter yes; vendor no |
| Retrieval | Postgres full-text + structured metadata first | Brand kits are small/medium | Start here |
| Vectors | `pgvector` **only if** eval shows lexical retrieval insufficient | Avoid unneeded infra | Conditional |
| Files | Private object storage (S3-compatible / Vercel Blob private) | Brand assets + uploads | When P1-2/P1-3 |
| Tests | Vitest + Playwright | Unit + e2e for gates/permissions | Yes |
| Deploy | Vercel-compatible | Hackathon velocity | Recommended |

## High-level component diagram

```text
┌─────────────────────────────────────────────────────────────┐
│ Next.js UI (author / reviewer / admin)                      │
└───────────────────────────┬─────────────────────────────────┘
                            │ Server Actions / Route Handlers
┌───────────────────────────▼─────────────────────────────────┐
│ Application services                                        │
│  - BrandKitService  - ReviewService  - WorkflowService      │
│  - AuditService     - AnalyticsService                      │
└───────┬─────────────────┬───────────────────┬───────────────┘
        │                 │                   │
┌───────▼──────┐  ┌───────▼────────┐  ┌───────▼──────────────┐
│ Deterministic│  │ Retrieval      │  │ LLM Adapter          │
│ Validators   │  │ (FTS ± vector) │  │ structured outputs   │
└───────┬──────┘  └───────┬────────┘  └───────┬──────────────┘
        │                 │                   │
        └────────────┬────┴───────────────────┘
                     │ Evidence Gate + Zod
                     ▼
              Finding Report (statuses)
                     │
                     ▼
              PostgreSQL (kits, reviews, events)
```

## Review pipeline (server)

```text
Input
  → authorize(actor, action, resource)
  → validate(ReviewInputSchema)
  → deterministicValidators(rules)
  → retrievalSnapshot = retrieve(query, kitVersion)
  → rawModel = llm.structured(FindingBatchSchema, {input, snapshot})
  → findings = evidenceGate(rawModel, snapshot)  // drop/repair illegal cites
  → persist(review, findings, snapshotId, modelMeta)
  → return DTO
```

## Vector database decision

| Condition | Decision |
| --- | --- |
| Seed kit < ~200 chunks and rules are mostly keyword/term based | **No pgvector** initially; use Postgres `tsvector` + metadata filters |
| Eval E2 shows missed paraphrases with high false negatives | Add `pgvector`, embed chunks, hybrid rank |
| Need multi-lingual semantic match in demo | Prefer hybrid earlier |

**Assumption A7:** For hackathon demo size, lexical + metadata is enough for Round 2; revisit after fixture eval.

## Trade-offs

| Choice | Upside | Downside |
| --- | --- | --- |
| Next.js monolith | Speed, one deploy | Heavy AI jobs may need background queue later |
| Structured LLM outputs | Testable | Schema drift across providers |
| Fail-closed gate | Trust | More `unsupported`/`indeterminate` — must educate judges this is intentional |
| Minimal roles | Shipable | Not enterprise IAM |
| Skip vectors first | Less moving parts | Weaker paraphrase recall |

## Hardest technical challenge (summary)

Producing **reliable, evidence-grounded findings** despite ambiguous rules, missing sources, and noisy inputs — without equating “not found” to “false.” Full treatment: [14-hardest-technical-challenge.md](./14-hardest-technical-challenge.md).

## Validation matrix

| Concern | Validation method |
| --- | --- |
| Evidence references | Citation IDs ⊆ retrieval snapshot; excerpt hash/offset checks where possible |
| Model outputs | Zod parse; reject on failure; retry once with repair prompt; else error state |
| Permissions | Server checks on every transition; e2e tests for forbidden approve |
| Approval transitions | Explicit allow-list state machine in code + DB constraint on status |
| Secrets | Env only on server; no `NEXT_PUBLIC_` for API keys |

## Alternatives considered

- **Python FastAPI + separate React:** clean AI services, slower for one team to demo cohesively.
- **Pure LLM agent with tools:** higher demo wow, weaker determinism and harder tests.
- **External vector DB (Pinecone, etc.):** fine later; unjustified for small kits at day 1.
