# BrandGuard AI

Evidence-gated pre-publication brand governance. A review holds a draft against a published brand kit. Findings cite approved sources from that retrieval, or they name the evidence gap. A person accepts suggestions and approves the draft. Review output never sets a draft to `approved`.

**Provisional name:** Round 1 research notes identify a public commercial page using this name. Confirm naming and clearance before public use.

## What the local app includes

**Public home.** `/` is a landing page. It walks through the Inkloom demo kit: a verified fact, a contradicted date, an unsupported claim, a terminology policy hit, and a citation id that was never retrieved. That screen is an illustration. It is not a stored review. Signed-in visitors can start a review or open the workspace. Signed-out visitors sign in from the same page. Workspace routes still require a session and redirect to `/login`.

**Reviews.** An author sets a title, goal, audience, channel, and phrases that must stay, then runs a review. Findings show the pinned source excerpt or an explicit evidence gap. Suggested edits are accepted or rejected; accepting writes a revision and does not approve the draft. A markdown report downloads from the review.

**Evidence trust.** On a saved review, Evidence trust draws the selected finding as a vertical relationship diagram: the draft claim, the automated finding, and either a pinned source, a policy, or an evidence gap. The same relationships are listed under the diagram as a text version. Arrow keys move between the nodes. A source appears only when its id is in that review’s retrieval snapshot and the stored excerpt’s kit version is the review’s pinned version. The explanation on a support or conflict edge is that finding’s stored rationale. A source from another review, another organisation, or a later kit is not shown as evidence. An `unsupported` or `indeterminate` finding shows a gap, even if a citation id is present. A human approve, reject, or request-changes decision is a separate control. The diagram does not create citations, change a finding status, or approve the draft. There is no separate graph store. The same lines are appended to the markdown report.

**Brand knowledge.** An admin edits facts, term rules, and claim policies on a draft kit, then publishes the next version. Published versions stay pinned to the reviews that used them. A brand PDF can be read into candidate statements on the draft (a real `.pdf`, at most 2 MB). Those sentences are not approved until the kit is published.

**Approvals.** The queue lists reviews waiting on a person. Approve, request changes, and reject are checked on the server against the session role and the review’s current status. An author cannot approve. The person who created a review cannot approve it. Request changes and reject require a short reason. A second concurrent decision does not write a second audit row. Audit events are append-only.

**Analytics and settings.** Governance analytics counts findings on stored reviews and scores the labelled fixture pack. Recall there is the share of labelled expectations that matched. Precision is calculated only for fixtures marked exhaustive. Settings shows the organisation, role, whether a free model id is configured, whether an OpenRouter key is present, and whether persistence is hosted Postgres or local Postgres. Seeded accounts are demo-only.

Finding statuses are `verified`, `contradicted`, `unsupported`, `indeterminate`, `policy_hit`, and `suggestion_only`. A missing source is `unsupported` or `indeterminate`. It is not treated as a contradiction.

## How a review runs

1. Deterministic checks: terminology, approved facts, and claim policies. A hex color in the draft that is not a published token is a policy hit. A published token below 4.5:1 against the kit background is also a policy hit.
2. Lexical retrieval over the published kit. There is no vector index.
3. One model pass through OpenRouter, only when `OPENROUTER_API_KEY` is set and `LLM_MODEL` is `openrouter/free` or a single id ending in `:free`.
4. An evidence gate on the server. Citation ids outside that review’s retrieval snapshot are dropped. A model `verified` or `contradicted` verdict stays only when the cited excerpt contains that claim verbatim (at least 12 characters), the numbers match, and the local polarity matches the verdict. A short shared word, a bare year, or a paraphrase becomes `indeterminate`. The model cannot override a deterministic finding on the same span, and it cannot mark the draft approved.

Login, review submission, and PDF inspection are limited per database: 30 sign-in attempts, 20 review submissions, and 8 PDF reads per 10 minutes. Instances that share `DATABASE_URL` share those counters. A separate embedded database does not limit other machines. If the counter cannot be written, the attempt is rejected. The limits are there to slow repeated attempts. They are not a global edge limiter.

A paid model id, or a fallback list that includes one, is refused and the model pass is not called. A missing key, a timeout, or malformed model JSON skips or fails that pass. Deterministic findings still return. The model cannot mark the draft approved.

Accepting a suggestion updates the draft and leaves the review status unchanged. It does not approve the draft. A demo script with accounts and expected results is in `DEMO.md`. Seeded accounts are demo-only.

Seeded Inkloom facts are demo data, not verified information about a real organisation.

## Local run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Copy `.env.example` to `.env.local`. Do not commit `.env.local`.

**Local development.** Leave `DATABASE_URL` and `DIRECT_URL` unset. Reviews are stored in embedded Postgres under `.data/pglite`. `npm run dev` seeds demo accounts when the user table is empty. The sign-in page lists each demo role and signs that account in. That list is there for judging convenience.

**Hosted database.** Set `DATABASE_URL` to the pooled connection and `DIRECT_URL` to a direct, non-pooler host. Migrations run on startup through the direct connection. If `DIRECT_URL` is missing or points at a pooler, the direct host is derived by removing `-pooler` from `DATABASE_URL`. The current hosted database already contains seeded demo accounts. Treat it as a development database. A public deployment needs a separate empty database. Production startup does not seed an empty database. The role buttons on the sign-in page work after those accounts exist. Hiding a password does not remove accounts that are already stored.

**Optional model.** Set `OPENROUTER_API_KEY` and `LLM_MODEL=openrouter/free` (or one id ending in `:free`). A missing key skips the model pass. Malformed JSON is repaired once. A timeout, an empty response, or a second bad response fails that pass. Deterministic findings still return, and the review page says so without the provider error. The model cannot approve a draft.

**Production.** Use a new database, do not seed demo accounts, and do not reuse the development password. Rate limits are shared only by instances that use that same database, and a failed counter write rejects the attempt.

The users table has no deactivation column. Do not delete the seeded users: `sessions.user_id` references `users.id`, and reviews and audit rows should stay. An administrator who has verified these ids can rotate credentials and clear sessions inside a transaction, after copying the current `password_hash` values to a private rollback note:

- `user_demo_author` — `author@demo.brandguard.test` — `org_demo`
- `user_demo_reviewer` — `reviewer@demo.brandguard.test` — `org_demo`
- `user_demo_admin` — `admin@demo.brandguard.test` — `org_demo`
- `user_other_author` — `author@other.brandguard.test` — `org_other`

Verify with `SELECT id, org_id, email, role FROM users WHERE id IN (...)`. Do not select `password_hash` into logs. Then update only those rows’ `password_hash` to a new hash and delete matching `sessions` rows. Rollback restores the saved hashes and does not touch reviews. This repository does not run that update. A separate production database is the safer release path.

All seeded accounts use the password `brandguard-demo`:

| Role | Email |
| --- | --- |
| Author | `author@demo.brandguard.test` |
| Reviewer | `reviewer@demo.brandguard.test` |
| Admin | `admin@demo.brandguard.test` |

An additional author account belongs to a separate seeded organisation for isolation checks: `author@other.brandguard.test`.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run test` | Unit and integration tests |
| `npm run eval` | Labelled fixture evaluation checks |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |

## Design system

Tokens live in `src/app/globals.css`: warm stone canvas, ink type, and a bronze accent. Persisted design research is under `design-system/brandguard-ai/`. The workspace is an information-dense review surface. The home page uses the same tokens.

## Further reading

- `AGENTS.md` — architecture and security constraints
- `docs/round-1/06-architecture.md` — architecture and boundaries
- `docs/round-1/07-data-model-and-integrations.md` — data model and integration plan
- `docs/round-1/09-milestones.md` — milestone acceptance criteria
- `SKILLS.md` — reusable engineering workflows
