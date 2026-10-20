# SKILLS.md — Reusable Engineering Workflows

These workflows are **manual references**. They are **not** automatically loaded by every agent.

## How to use

1. **Humans:** Link the workflow section in a task brief (“Follow SKILLS.md → Integrating an LLM provider”).
2. **Cursor / Copilot:** Instruct the agent: “Read `AGENTS.md` and `SKILLS.md` section *&lt;name&gt;* before coding.”
3. **Native Agent Skills later:** Adapt each section into a `SKILL.md` bundle (`name`, `description`, steps) under an agent skills directory; keep this file as the canonical checklist until then.

Related truth sources: `AGENTS.md`, `docs/round-1/`.

---

## 1. Adding a brand-policy rule

**Prerequisites:** Brand kit schema exists; admin auth working; rule types defined (`term`, `claim_pattern`, `required_phrase`, etc.).

**Steps:**

1. Define rule fields: `id`, `kit_version`, `type`, `pattern`/`terms`, `severity`, `message`, `enabled`.
2. Add Zod schema validation for create/update.
3. Persist under the **draft** kit version; publishing creates immutable version bump.
4. Wire into deterministic validator pass (before LLM).
5. Add fixture texts: one hit, one near-miss, one clean.

**Expected outputs:** Rule row; validator emits `policy_hit` with `ruleId`; audit/admin UI lists rule.

**Tests:** Unit tests for match/non-match; e2e creating rule → review → finding.

**Common failures:** Overly broad regex; publishing without version bump; client-only enforcement.

---

## 2. Adding an approved fact and evidence source

**Prerequisites:** Kit versioning; source document storage or inline excerpt table.

**Steps:**

1. Create `EvidenceSource` (title, uri/file id, retrieved text, checksum).
2. Create `ApprovedFact` linked to source + kit version.
3. Index chunk(s) for retrieval with metadata (`doc_type=fact`, `kit_version`).
4. Add review fixture that should yield `verified` or `contradicted`.

**Expected outputs:** Fact retrievable; findings may cite source id; pinned kit version on reviews.

**Tests:** Retrieval returns fact for paraphrase query (as able); citation ID membership check.

**Common failures:** Fact without source; editing published kit in place; citing sources not in snapshot.

---

## 3. Integrating an LLM provider

**Prerequisites:** Server env secrets; adapter interface; Zod finding schema version.

**Steps:**

1. Implement `LlmAdapter.completeStructured(schema, payload)` on the server only.
2. Store `provider`, `model`, `schemaVersion` on findings batch metadata.
3. Add timeout, size limits, and single repair retry on schema failure.
4. Feature-flag provider in env; never hardcode keys.
5. Document model choice as assumption until eval runs.

**Expected outputs:** Structured JSON parseable by Zod; failures surface as review error state.

**Tests:** Mock adapter contract tests; refusal path when API errors.

**Common failures:** Keys in client bundle; free-form prose instead of schema; unbounded retries.

---

## 4. Validating structured AI outputs

**Prerequisites:** Versioned Zod schema; retrieval snapshot available.

**Steps:**

1. Parse model JSON with Zod (`strict`).
2. Run evidence gate: `citationIds ⊆ snapshot.ids`.
3. Enforce status invariants (e.g. `verified` requires citations).
4. On failure: repair once **or** mark review `engine_error` — do not silently drop invariants.
5. Persist raw + normalised payloads for debugging (redact secrets).

**Expected outputs:** Normalised `Finding[]` or explicit error; no forged citations rendered.

**Tests:** Fixtures for valid, unknown citation, missing required cite, wrong status combo.

**Common failures:** Scraping “citations” from prose; treating parse warnings as success.

---

## 5. Testing claim detection and false positives

**Prerequisites:** Labelled fixture pack; eval script.

**Steps:**

1. Build fixtures across slices: banned terms, contradictions, novel unsupported claims, ambiguous rules, clean copy.
2. Run deterministic-only, then full pipeline.
3. Score precision/recall **per status** — especially false `contradicted`.
4. Log failure classes: retrieval miss vs gate vs generation.
5. Commit honest metrics; no embellishment.

**Expected outputs:** Eval report artifact; list of failing fixture IDs.

**Tests:** CI job on fixture pack for regressions on golden cases.

**Common failures:** Only testing obvious positives; collapsing unsupported into contradicted.

---

## 6. Building secure role-based approval transitions

**Prerequisites:** Auth sessions; roles on membership; review status column.

**Steps:**

1. Encode allow-list: `(fromStatus, action, role) → toStatus`.
2. Implement single `transitionReview()` server function used by UI.
3. Re-load actor role from DB inside the function.
4. Write `AuditEvent` in the same transaction.
5. Deny author self-approval unless role includes reviewer (default: deny).

**Expected outputs:** Legal transitions succeed; illegal return 403; audit row present.

**Tests:** Matrix unit tests; e2e non-reviewer approve attempt.

**Common failures:** Trusting body-provided `role`; UI-only disable; approving via direct SQL-less status patch endpoint.

---

## 7. Adding file ingestion and validation

**Prerequisites:** Private storage; size/MIME limits; virus scanning strategy (document limitation if none).

**Steps:**

1. Accept uploads via server route; validate MIME, extension, max bytes.
2. Store in private bucket; save metadata only in DB.
3. Extract text for allowed types (Markdown/plain first; PDF later).
4. Quarantine failed extractions with visible error.
5. Never execute file content; treat as data.

**Expected outputs:** Stored object + metadata; rejected invalid files; extraction linked to kit draft.

**Tests:** Oversized file, wrong MIME, path traversal filenames, successful markdown ingest.

**Common failures:** Public buckets; trusting client Content-Type alone; blocking UI on huge sync extracts without limits.

---

## 8. Testing privacy, tenant isolation, and access control

**Prerequisites:** At least two org fixtures; role fixtures.

**Steps:**

1. Create org A/B data: kits, reviews, files.
2. Attempt cross-org read/write with org A session → expect deny/empty.
3. Verify signed URLs cannot list bucket peers.
4. Ensure logs exclude secrets and minimise draft content where possible.
5. Add lint/guardrails against queries missing `org_id` (where feasible).

**Expected outputs:** Isolation test suite green; documented residual risks.

**Tests:** Automated isolation suite in CI.

**Common failures:** Global admin queries without org filter; leaking other org ids in error messages.

---

## 9. Evaluating the product against a labelled test dataset

**Prerequisites:** Frozen kit version; fixture pack; eval runner.

**Steps:**

1. Pin model + schema + kit versions in the eval config.
2. Run batch reviews offline/server-side.
3. Compare expected vs actual statuses and critical rule/source IDs.
4. Separate metrics: citation validity, status agreement, unauthorized transition (N/A here).
5. Publish results as **measured**; annotate disagreements.

**Expected outputs:** Versioned eval report; regression deltas vs previous run.

**Tests:** Smoke that eval runner fails CI on hard-gate regressions (forged cites).

**Common failures:** Changing prompts mid-eval without version bump; reporting demo anecdotes as accuracy.

---

## 10. Preparing a reproducible release

**Prerequisites:** P0 complete; CI green; demo script written.

**Steps:**

1. Tag release with commit SHA, kit seed hash, model/schema versions.
2. Document env vars (without values) in README.
3. Run Playwright smoke against deployed URL.
4. Record ≤5 minute demo path matching Round 1 workflow story.
5. Attach known limitations from `docs/round-1/12-limitations-and-roadmap.md`.

**Expected outputs:** Deployed URL; tag; demo recording; release notes with honest limits.

**Tests:** CI release workflow; smoke e2e on staging/prod.

**Common failures:** Undocumented seed steps; demo depends on one-off manual DB edits; secrets in repo.

---

## Adapting to native Agent Skill format (later)

For each workflow above, create `skills/<id>/SKILL.md` with:

```yaml
---
name: <id>
description: <when to use — trigger phrases>
---
```

Copy Prerequisites → Steps → Expected outputs → Tests → Common failures.  
Keep `SKILLS.md` as the index linking to those bundles.
