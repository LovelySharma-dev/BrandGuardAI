# Development Milestones — Rounds 1, 2, and 3

**Discipline:** A phase is not complete until acceptance criteria pass. Planning ≠ implementation.

## Round 1 — Proposal and readiness (current)

| Deliverable | Status target |
| --- | --- |
| Problem, solution, workflow, scope docs | This package |
| Architecture + security approach | This package |
| Submission PDF content (`submission-draft.md`) | This package |
| Agent instruction files | This package |
| Team details filled | **Unresolved** — placeholders only |
| Official organiser packet attached | **Unresolved** |

**No functional product code in Round 1 unless organisers explicitly allow earlier build.**

## Round 2 — Build core vertical slice

### Implementation phases (future)

#### Phase 1 — Foundation and design system

| | |
| --- | --- |
| **Prerequisites** | Repo init, lint/format, CI skeleton |
| **Scope** | App shell, tokens, typography, base components |
| **Acceptance** | Story/page renders; a11y smoke on shell |
| **Tests** | Component smoke |
| **Evidence** | Screenshots + passing CI |

#### Phase 2 — Main interface

| | |
| --- | --- |
| **Prerequisites** | Phase 1 |
| **Scope** | Draft, findings, diff, approval views (mocked data OK initially) |
| **Acceptance** | Judge can click through primary screens |
| **Tests** | Playwright happy-path with mocks |
| **Evidence** | Demo recording draft |

#### Phase 3 — Database and authentication

| | |
| --- | --- |
| **Prerequisites** | Phase 1 |
| **Scope** | Postgres schema, migrations, auth, roles |
| **Acceptance** | Login; role stored server-side; org scoping |
| **Tests** | Authz unit tests; forbidden route tests |
| **Evidence** | Migration files + test log |

#### Phase 4 — Brand knowledge management

| | |
| --- | --- |
| **Prerequisites** | Phase 3 |
| **Scope** | Brand kit versions, facts, terms, policies, seed data |
| **Acceptance** | Admin can publish kit v1; reviews pin version |
| **Tests** | CRUD + immutability of published version |
| **Evidence** | Seed kit in repo |

#### Phase 5 — Review and evidence engine

| | |
| --- | --- |
| **Prerequisites** | Phases 3–4 |
| **Scope** | Deterministic validators, retrieval, LLM adapter, evidence gate |
| **Acceptance** | Fixture pack produces expected statuses; forged cites rejected |
| **Tests** | Unit + integration on gate; eval script on labelled set |
| **Evidence** | Eval report committed (honest numbers) |

#### Phase 6 — Correction and version comparison

| | |
| --- | --- |
| **Prerequisites** | Phase 5 |
| **Scope** | Suggestions, diff UI, accept/reject → revisions |
| **Acceptance** | Accept creates revision; reject leaves body unchanged |
| **Tests** | E2E accept/reject |
| **Evidence** | Demo clip |

#### Phase 7 — Approval and audit workflow

| | |
| --- | --- |
| **Prerequisites** | Phases 3, 5–6 |
| **Scope** | State machine, reviewer actions, audit events |
| **Acceptance** | Non-reviewer cannot approve; events immutable |
| **Tests** | Transition matrix tests |
| **Evidence** | Audit screenshot |

#### Phase 8 — File and visual checks

| | |
| --- | --- |
| **Prerequisites** | Phases 4–5 |
| **Scope** | Private uploads; shallow visual/token checks |
| **Acceptance** | Invalid file rejected; contrast/token mismatch flagged or skipped with reason |
| **Tests** | Upload validation tests |
| **Evidence** | Notes on limitations |

#### Phase 9 — Analytics and reliability

| | |
| --- | --- |
| **Prerequisites** | Phase 7 |
| **Scope** | Recurring mistakes, evidence-gap rates, unclear rules candidates |
| **Acceptance** | Dashboard shows fixtures-driven stats |
| **Tests** | Aggregation unit tests |
| **Evidence** | Dashboard screenshot |

#### Phase 10 — Deployment, testing, and final demonstration

| | |
| --- | --- |
| **Prerequisites** | P0 features complete |
| **Scope** | Prod deploy, e2e suite, demo script, README |
| **Acceptance** | Public demo URL stable; script ≤5 minutes; tests green |
| **Tests** | Full CI |
| **Evidence** | Demo video + URL |

## Round 3 — Harden, evaluate, present

- Freeze scope; fix reliability bugs only
- Run labelled evaluation; report **measured** metrics (no invention)
- Polish demo narrative around evidence gaps and human approval
- Document limitations honestly
- Prepare judge Q&A on hardest technical challenge

## Parallel track (all rounds)

- Keep `AGENTS.md` / `SKILLS.md` updated when workflows change
- Never mark a phase complete without acceptance evidence
