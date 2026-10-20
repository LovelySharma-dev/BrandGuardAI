# Data Model and Integration Plan

## Core entities (logical)

```text
Organisation
  └── BrandKit (versioned)
        ├── GuidelineDocument / GuidelineChunk
        ├── ApprovedFact (+ EvidenceSource)
        ├── TermRule (preferred | banned | conditional)
        ├── ClaimPolicy (pattern, severity, required_disclaimer?)
        └── Asset (file meta, usage rules)

User (role: author | reviewer | admin)
ContentReview
  ├── intent (goal, audience, channel, must_keep[])
  ├── revisions[] (body, created_by, created_at)
  ├── retrieval_snapshots[] (sources[], created_at)
  ├── findings[] (status, severity, rule_or_source refs, rationale)
  ├── suggestions[] (base_revision_id, proposed_text, accepted?)
  └── status (state machine)

AuditEvent (append-only)
  actor_id, action, entity_type, entity_id, before, after, at
```

## Finding record (conceptual schema)

```ts
// Conceptual — implement later with Zod
type ClaimStatus =
  | "verified"
  | "contradicted"
  | "unsupported"
  | "indeterminate"
  | "policy_hit"
  | "suggestion_only";

type Finding = {
  id: string;
  reviewId: string;
  span: { start: number; end: number } | null;
  status: ClaimStatus;
  severity: "blocker" | "warning" | "info";
  summary: string;
  rationale: string;
  citationIds: string[]; // must be ⊆ snapshot
  evidenceGapReason?: string;
  ruleId?: string;
  modelMeta?: { provider: string; model: string; schemaVersion: string };
};
```

## Integrity rules

1. `citationIds` must exist in the linked `retrieval_snapshot`.
2. `verified` / `contradicted` require ≥1 citation.
3. `unsupported` / `indeterminate` forbid pretending citations exist; may include *candidate* non-supporting docs separately if useful, but not as proof.
4. `AuditEvent` rows are insert-only (no update/delete in app API).
5. Approvals require `role ∈ {reviewer, admin}` checked server-side.

## Integration plan

### MVP (in-app only)

- Manual paste of content
- Seed Markdown/JSON brand kit in repo or admin UI
- LLM provider via server adapter

### Near-term integrations (post-MVP)

| Integration | Purpose | Priority |
| --- | --- | --- |
| Markdown/PDF upload | Ingest guidelines | P1 |
| Private file storage | Assets | P1 |
| Webhook out | Notify on approval | P2 |
| CMS draft sync | Real publish gates | P2 |
| Slack | Reviewer notifications | P2 |

### Non-integrations (excluded)

- Training pipelines on customer data
- Scraping live websites as “approved facts” without human promotion into the kit
- Browser extensions in Round 2

## Migration / versioning approach

- Brand kit versions are immutable once published; edits create `kit_version+1`.
- Reviews pin `kit_version_id` so audits remain reproducible.
- Model output schema versioned (`finding_schema_v1`); adapter normalises provider quirks at the boundary.
