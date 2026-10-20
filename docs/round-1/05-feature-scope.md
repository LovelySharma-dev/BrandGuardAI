# Prioritised Feature Scope and Exclusions

Optimise for a convincing end-to-end workflow, not feature count.

## P0 — Must ship for a credible demo

| ID | Feature | Why |
| --- | --- | --- |
| P0-1 | Brand kit CRUD (guidelines, facts, terms, claim policies) with versions | Source of truth |
| P0-2 | Create text review with declared intent | Intent preservation needs input |
| P0-3 | Hybrid review: deterministic + retrieval + structured LLM | Core differentiator |
| P0-4 | Evidence gate + claim statuses | Reliability / originality |
| P0-5 | Finding UI with source excerpts and evidence gaps | Explainability |
| P0-6 | Suggestion proposals + side-by-side version compare + accept/reject | Intent-preserving corrections |
| P0-7 | Roles: author / reviewer / admin; server-enforced transitions | Governance |
| P0-8 | Immutable audit events for review actions | Trust |
| P0-9 | Seeded demo org + labelled fixture pack | Eval + demo |
| P0-10 | Automated tests for schema, citations, permissions | Feasibility proof |

## P1 — Strong if time allows

| ID | Feature | Why |
| --- | --- | --- |
| P1-1 | Recurring-violation analytics + unclear-guideline candidates | Governance analytics |
| P1-2 | File upload for brand PDFs with extraction + validation | Realistic ingestion |
| P1-3 | Basic visual checks (palette contrast vs tokens; forbidden asset misuse heuristics) | Challenge asks for visual assets |
| P1-4 | Export review PDF/report | Judge convenience |
| P1-5 | Multi-revision history timeline | Revision history requirement |

## P2 — Post-MVP / post-event

| ID | Feature |
| --- | --- |
| P2-1 | CMS / Slack / Docs integrations |
| P2-2 | Multi-tenant SSO and SCIM |
| P2-3 | Full WCAG document auditing |
| P2-4 | Regulated-industry claim packs (healthcare/finance) with legal review |
| P2-5 | Online learning from reviewer overrides (careful; bias risk) |
| P2-6 | Real-time collaborative editing |

## Explicit exclusions (Round 2/3 build window)

- Autonomous publishing to production channels
- Client-side-only authorization
- “Auto-approve if model confidence > X”
- Claiming trademark watch / anti-counterfeit monitoring
- Training on customer content by default
- Building a full DAM (digital asset management) suite
- Mobile-native apps
- Marketplace of third-party brand kits

## Scope control rule

If behind schedule, cut in this order: P1-3 visuals → P1-2 PDF ingestion (use Markdown seed) → P1-1 analytics (keep raw audit query) → never cut P0 evidence gate or server approvals.
