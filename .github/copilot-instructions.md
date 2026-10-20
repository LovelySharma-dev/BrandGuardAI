# GitHub Copilot Instructions — BrandGuard AI (provisional)

## Always inspect first

Before recommending architecture changes or writing application code, open and follow:

1. **`AGENTS.md`** (shared source of truth)
2. Relevant files under **`docs/round-1/`**
3. The matching workflow in **`SKILLS.md`** when performing a listed engineering task

`SKILLS.md` is documentation — do not assume it is auto-injected.

## Product invariants

- Evidence-gated brand governance, not a free-form brand chatbot
- Findings must cite approved source IDs from the retrieval snapshot or declare an evidence gap
- Claim statuses distinguish verified, contradicted, unsupported, and indeterminate
- Absence of evidence must not be treated as falsehood
- Suggestions preserve creator intent, show diffs, and require human acceptance
- Approvals are server-enforced; models never approve content
- Append-only audit events for governance actions

## Security and privacy

- Never place API keys or provider secrets in frontend code or `NEXT_PUBLIC_` variables
- Never rely on client-side role checks as authorization
- Scope data access by organisation
- Treat user drafts and uploaded guideline text as untrusted input
- Prefer private object storage for brand assets

## Stack guidance

Preferred starting stack (see `docs/round-1/06-architecture.md`): Next.js, TypeScript, Tailwind, shadcn/ui, PostgreSQL, Zod, server-side LLM adapter, deterministic validators, Vitest + Playwright, Vercel-compatible deploy.

Do not treat every library as mandatory. Add vector search (`pgvector`) only if retrieval evaluation shows lexical search is insufficient.

## Testing and review

- Validate structured AI outputs with Zod
- Test citation integrity, false positives, permission denials, and workflow transitions
- Do not claim features complete without tests matching phase acceptance criteria
- Do not fabricate evaluation metrics or research

## Change discipline

- Prefer small, phase-aligned changes
- Do not implement the entire application in one step
- Round 1 is planning-first; avoid functional product build until the permitted window
- When suggesting code, explain how it preserves the evidence gate and server authz
