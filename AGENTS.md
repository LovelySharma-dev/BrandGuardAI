# AGENTS.md — BrandGuard AI (provisional name)

Shared source of truth for humans and coding agents (Cursor, Copilot, and others).  
**Phase rule:** Round 1 is planning only. Do not implement the functional product until the permitted development window opens, unless a human explicitly authorises a specific scaffolding exception.

## 1. Project goals and scope

### Goal

Build an evidence-gated pre-publication brand governance system:

- Findings cite approved sources or explicitly declare evidence gaps
- Suggestions preserve creator intent and require human acceptance
- Approvals are server-enforced with audit history
- Claim statuses distinguish `verified`, `contradicted`, `unsupported`, and `indeterminate` (absence of evidence ≠ false)

### In scope (P0 when build opens)

See `docs/round-1/05-feature-scope.md`. Prefer the vertical slice over feature count.

### Out of scope

- Autonomous publish without humans
- Client-side authorization as authority
- Auto-approve because an LLM recommends it
- Fabricated benchmarks, interviews, or customers
- Training on customer content by default
- Full enterprise DAM / trademark watch networks

### Naming

“BrandGuard AI” is provisional (commercial collision exists). Prefer mechanism-led naming in UI copy once the team decides.

## 2. Architecture boundaries

Documented in `docs/round-1/06-architecture.md` and `07-data-model-and-integrations.md`.

Hard boundaries:

1. **Hybrid engine:** deterministic validators + retrieval + structured LLM — not LLM-only.
2. **Evidence gate on server:** citation IDs must be ⊆ retrieval snapshot for that run.
3. **Workflow authority on server:** state machine transitions checked with real roles.
4. **Secrets on server only:** never `NEXT_PUBLIC_` for provider keys.
5. **Vectors optional:** start with Postgres FTS + metadata; add `pgvector` only if eval justifies it.
6. **Schema versions:** Zod at boundaries; version model wire schemas.

Do not introduce new infrastructure (queues, extra DBs, agent frameworks) unless a phase’s acceptance criteria require it.

## 3. Coding conventions

- TypeScript strictness preferred; no `any` for authz or finding payloads
- Colocate schemas (`zod`) with the module that owns the boundary
- Prefer small, reviewable PRs / commits by phase
- Name findings’ statuses exactly as in the data model docs
- UI: accessible labels; do not rely on colour alone for severity
- Comments only for non-obvious invariants (e.g. why a status downgrade happens)

## 4. Security and privacy requirements

- Re-check session + role on every mutation
- Scope all queries by `org_id`
- Treat drafts and uploaded guidelines as untrusted text (prompt injection)
- Append-only audit events; no silent edits to history
- Private file storage; short-lived signed URLs
- Minimise PII in logs
- Never mark content `approved` from model output

## 5. Testing expectations

- Unit: deterministic validators, evidence gate, state machine
- Integration: review pipeline with fixture snapshots
- E2E: author flow + forbidden approval attempt
- Eval: labelled fixture pack; commit honest metrics only
- A phase is **not complete** until its acceptance tests pass

## 6. Git and contribution practices

- Do not commit secrets (`.env`, key files)
- Do not invent `--no-verify` bypasses
- Prefer clear commits aligned to phases
- Update docs when behaviour of evidence gate or workflow changes
- Ask before large refactors unrelated to the current phase

## 7. Rules against fabricated evidence and unverified claims

Agents must **not**:

- Invent user research, survey %, customer names, or accuracy metrics
- Cite sources that were not retrieved in the current review snapshot
- Present `unsupported` findings as `contradicted`
- Claim a phase/feature is done without acceptance evidence
- Pretend competitor analysis was primary research when it was public webpage inspection

Label statements as assumption / planned / proposed / verified when writing docs.

## 8. Phase-by-phase implementation discipline

Follow `docs/round-1/09-milestones.md` phases 1–10.

Rules:

1. Implement one phase at a time unless dependencies require a thin spike
2. Do not “build the entire app” in one operation
3. After each phase: tests + short completion summary (what changed, what’s blocked)
4. If asked for both a secure fix and an exploit/PoC, provide the fix only
5. Reference `SKILLS.md` workflows explicitly when performing those tasks — `SKILLS.md` is not auto-loaded

## 9. Required reading before code changes

1. This file (`AGENTS.md`)
2. Relevant `docs/round-1/*` design doc
3. Matching workflow in `SKILLS.md` (when applicable)

## 10. Completion summary template (agents)

When finishing a task, report:

- Files changed
- Phase / invariant affected (evidence gate, authz, etc.)
- Tests run and results
- Open risks / questions
- Exact next action
