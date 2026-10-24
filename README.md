# BrandGuard AI

Evidence-gated pre-publication brand governance. Findings cite approved sources or explicitly declare evidence gaps. Suggestions require a human decision; review results never approve content.

**Provisional name:** Round 1 research notes identify a public commercial page using this name. Confirm naming and clearance before public use.

## Current prototype

The local app includes:

- Sign-in with demo author, reviewer, and admin roles.
- Organisation-scoped reviews, saved to a local PGlite database in `.data/pglite`.
- Deterministic terminology and claim checks, approved fact matching, and an evidence gate against each review's pinned brand-kit snapshot.
- Finding cards with the pinned source excerpt or an explicit evidence gap.
- Suggested text changes that authors must accept or reject.
- A reviewer approval queue with server-side role checks and audit events.
- Admin editing of the founding statement as a draft, followed by publishing an immutable kit version.
- A labelled fixture evaluation runner. Its results are not a general accuracy or precision claim.

The review engine is deterministic: there is no LLM adapter or live search/retrieval query. The snapshot currently includes the approved source IDs in the selected kit. PGlite runs locally and is not a hosted production database. Seeded company facts are illustrative demo data, not verified information about a real organisation.

## Local run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app redirects signed-out visitors to `/login`.

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

Tokens live in `src/app/globals.css`. Persisted design research is under `design-system/brandguard-ai/`; the app uses a warm-neutral, information-dense review workspace.

## Further reading

- `AGENTS.md` — architecture and security constraints
- `docs/round-1/06-architecture.md` — planned architecture and boundaries
- `docs/round-1/07-data-model-and-integrations.md` — data model and integration plan
- `docs/round-1/09-milestones.md` — milestone acceptance criteria
- `SKILLS.md` — reusable engineering workflows
