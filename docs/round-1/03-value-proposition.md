# Value Proposition and Differentiators

## Provisional name

**BrandGuard AI** — provisional only.

### Naming critique (critical)

| Issue | Evidence | Recommendation |
| --- | --- | --- |
| Exact commercial collision | https://brandguardai.io/ markets brand governance / legal-risk copy review (accessed 2026-10-20) | Change name before Round 2 demo branding |
| Generic “Guard” pattern | Prior Inkloom hackathon posts used “Brand Guardian” style features | Prefer a mechanism-led name |
| Category sameness | Writer, Acrolinx/Markup AI already claim brand+compliance checking | Do not lead with “AI reviews your brand guidelines” |

**Proposed rename shortlist (Assumption — team must pick):**

- **CitePolicy** — emphasises evidence references
- **IntentReview** — emphasises intent-preserving corrections
- **GuidelineLedger** — emphasises audit + guideline versions
- **ClaimStatus** — emphasises verified/contradicted/unsupported/indeterminate
- **PolicyCite** / **EvidenceGate** — technical but distinctive

For Round 1 PDF: keep provisional name, state rename is planned after originality check.

## Value proposition (one sentence)

Pre-publication brand governance that **refuses unsupported confidence**: every finding is evidence-linked or explicitly an evidence gap, corrections preserve creator intent under human acceptance, and approvals are server-enforced with an auditable ledger.

## Differentiator evaluation: A + B + C

### A. Evidence-linked findings

| | |
| --- | --- |
| **Claim** | Findings cite approved sources or declare an evidence gap |
| **Why non-generic** | Many tools “flag issues”; fewer fail-closed on missing/forged citations |
| **Feasibility** | High if structured outputs + retrieval snapshot ID checks are mandatory |
| **Risk** | Still may cite wrong span inside a valid document |

**Verdict:** Keep. Make citation ID validation + claim status taxonomy non-negotiable.

### B. Intent-preserving corrections

| | |
| --- | --- |
| **Claim** | Suggestions preserve purpose, show version comparison, require human acceptance |
| **Why non-generic** | Auto-rewrite tools often optimise for “safer corporate voice” and kill campaign intent |
| **Feasibility** | Medium — needs structured intent capture + side-by-side UI + accept/reject events |
| **Risk** | Hard to measure “intent preserved” without human ratings |

**Verdict:** Keep as MVP UX, but do not claim measured intent scores until E4 runs.

### C. Reliable governance

| | |
| --- | --- |
| **Claim** | Server permissions, explicit transitions, audit events, analytics on recurring mistakes / unclear guidelines |
| **Why non-generic** | Chat UIs rarely implement real state machines or immutable audit events |
| **Feasibility** | High for single-tenant demo; medium for multi-tenant isolation |
| **Risk** | Overbuilding RBAC instead of the review engine |

**Verdict:** Keep a minimal role set (`author`, `reviewer`, `admin`) with server-side transitions only.

## Recommended positioning change

Do **not** pitch: “an AI brand checker.”  
Do pitch: **“evidence-gated brand governance with human-owned approvals.”**

Differentiation stack for judges:

1. Claim status model: `verified` | `contradicted` | `unsupported` | `indeterminate` | `policy_hit` (deterministic)
2. Evidence gap is a successful outcome, not a failure
3. Model cannot approve content
4. Analytics that blame guideline ambiguity as often as author error

## What would make us look generic

- Paste text → colourful severity chips → rewrite button
- “Powered by GPT” as the innovation
- Claiming “enterprise-ready” without tenant isolation tests
- Visual AI claims without a real vision eval set
