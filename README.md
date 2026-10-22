# BrandGuard AI

Evidence-gated pre-publication brand governance. Findings cite approved sources or explicitly declare evidence gaps. Models never approve content.

**Provisional name** — Round 1 research notes cite a public commercial page using this name; confirm naming and clearance before public use. No category-uniqueness claim is made.

## Current status (prototype; phase completion and build-window timing unverified)

The working tree contains a navigable prototype. Its presence does not establish when it was built or whether that work falls within an official build window.

- **Implemented:** Next.js App Router, TypeScript, Tailwind CSS, and the review/application screens.
- **Implemented:** deterministic checks against a seeded demo kit for selected terminology, promotional-claim patterns, and factual phrases.
- **Implemented:** a source-ID snapshot and evidence gate that removes citations outside that snapshot; this is not a retrieval system.
- **Implemented:** correction accept/reject decisions and revisions in process memory.
- **In progress:** review, knowledge, approval-queue, analytics, and settings surfaces. The brand kit and approval queue are read-only; analytics show only current-process counts.
- **Planned:** live retrieval and an LLM adapter, durable database storage, authentication and organisation-scoped authorization, server-enforced approval transitions, and persistent audit history.

The demo kit is illustrative seed data, not verified information about a real organisation. The approval queue does not approve or reject content, and the prototype does not authenticate users.

## Local run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (redirects to `/dashboard`).

### Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run test` | Vitest unit tests |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |

## Architecture notes

See `AGENTS.md`, `docs/round-1/06-architecture.md`, and `SKILLS.md`.

Current prototype behavior and boundaries:

1. **Deterministic validators only** — no LLM adapter or retrieval query is wired.
2. **Evidence gate** — citation IDs must be ⊆ the source IDs in the constructed snapshot.
3. Statuses include `verified`, `contradicted`, `unsupported`, `indeterminate`, and `policy_hit`.
4. Promotional-pattern hits are not labelled `verified`; missing evidence is not treated as contradiction.
5. Reviews and audit events are held in process memory; authentication, durable storage, and permissioned approvals are not implemented.

## Design system

Tokens live in `src/app/globals.css`. Persisted design research is under `design-system/brandguard-ai/` with intentional overrides away from liquid-glass defaults toward a warm-neutral enterprise shell.
