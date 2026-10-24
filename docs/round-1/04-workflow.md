# End-to-End User Workflow

## Happy path (MVP)

```text
[Admin] Seed brand kit
   → guidelines, facts, terms, claim policies, assets (versioned)
[Author] Create review draft
   → paste/upload text (+ optional image later)
   → declare intent (goal, audience, channel, must-keep phrases)
[System] Run hybrid review
   → deterministic validators
   → retrieval over approved knowledge
   → structured LLM findings (Zod-validated)
   → evidence gate (cite only retrieved IDs; else downgrade/reject)
[Author] Inspect findings
   → open source excerpts
   → see evidence gaps explicitly
   → apply/reject intent-preserving suggestions (version compare)
[Author] Submit for approval
[Reviewer] Approve / request changes / reject
   → server checks role + allowed transition
   → audit event written
[System] Analytics updated
   → recurring rule hits, override rates, evidence-gap rates
```

## State machine (content review)

| State | Who can enter | Allowed next states |
| --- | --- | --- |
| `draft` | author | `in_review`, `archived` |
| `in_review` | author (submit) | `changes_requested`, `approved`, `rejected` |
| `changes_requested` | reviewer | `draft` (author revises) |
| `approved` | reviewer only | `superseded` (new revision) |
| `rejected` | reviewer only | `archived` |
| `archived` | admin/author | terminal for MVP |

**Hard rule:** LLM recommendation never sets `approved`.

### Allow-list (implemented)

`transitionReview(reviewId, action)` reads the signed-in user from the session cookie, then reloads that user's role from Postgres. The request body cannot supply a role or an organisation. `approved` is written only when the reloaded role is `reviewer` or `admin`. Review reads include `org_id` from that user row.

`request_changes` stores `needs_revision`, the status name already used by the review engine. `changes_requested`, `archived`, and `superseded` are not separate stored statuses in this slice.

Published brand kits are immutable. An admin edit writes the next patch version as a draft (`1.0.0` → `1.0.1`). A review stores the published version it ran against, so a later draft edit still leaves that review on `1.0.0`.

## Review engine internal workflow

1. **Normalise input** — charset, truncated length limits, content type.
2. **Extract candidate claims / segments** — sentences or structured blocks.
3. **Deterministic pass** — banned terms, required trademark tokens, regex claim patterns, basic a11y text checks (e.g. missing alt text metadata when image present).
4. **Retrieve evidence** — query approved knowledge with metadata filters (org, kit version, doc type).
5. **Model structured findings** — only against retrieved candidates + deterministic hits.
6. **Validate model output** — Zod schema; citation IDs ⊆ retrieval snapshot; statuses constrained.
7. **Render report** — grouped by severity and status; gaps called out.
8. **Suggestion stage (optional)** — generate alternative text constrained by declared intent; store as proposal, not applied text.
9. **Human decisions** — accept suggestion → new revision; submit → approval workflow.

## Claim / finding status semantics

| Status | Meaning | Must include |
| --- | --- | --- |
| `verified` | Supported by approved source | source ID + excerpt pointer |
| `contradicted` | Conflicts with approved source | source ID + conflicting excerpt |
| `unsupported` | Material claim with no supporting source found | evidence gap reason |
| `indeterminate` | Ambiguous rule or insufficient context | why indeterminate |
| `policy_hit` | Deterministic policy/term rule fired | rule ID |
| `suggestion_only` | Style preference, non-blocking | optional source |

**Absence of evidence ≠ false.** `unsupported` and `indeterminate` are distinct from `contradicted`.

## Demo script (for later rounds)

1. Show unclear guideline producing `indeterminate` (not a fake violation).
2. Show forged citation rejected by server.
3. Show suggestion accepted with diff.
4. Show non-reviewer cannot approve.
5. Show audit log of transitions.
