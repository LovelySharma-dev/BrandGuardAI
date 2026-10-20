# Judging Self-Review (Critical)

**Purpose:** Validate the Round 1 package against the five scoring criteria and the 11 organiser requirements.  
**Date:** 2026-10-20  
**Rule:** Do **not** treat any score below as an authoritative prediction of judges’ marks. This is an internal stress test with concrete fixes.

---

## A. Coverage — 11 organiser requirements

| # | Requirement | Where addressed | Gap / risk |
| --- | --- | --- | --- |
| 1 | Problem understanding | `submission-draft.md` §1; `problem-analysis.md` | Official Inkloom packet not attached |
| 2 | Affected users | §2; `problem-analysis.md` | Personas are proposed, not interviewed — correctly labelled |
| 3 | Proposed solution | §3; `solution-and-workflow.md` | Must not overclaim uniqueness |
| 4 | Complete workflow | §4 | Clear; keep demo script tight |
| 5 | Main features | §5 | Exclusions help feasibility |
| 6 | Technology stack | §6; `technical-plan.md` | Auth provider still TBD |
| 7 | Team responsibilities | §7 | **Placeholders — blocking for final PDF** |
| 8 | Plan across rounds | §8; `three-round-roadmap.md` | Build dates **Unresolved** |
| 9 | Expected impact | §9 | Metrics correctly labelled proposed |
| 10 | Future scope | §10 | OK — not bloated into MVP |
| 11 | Complete team details | §11 | **Placeholders — blocking** |

**Verdict:** Structurally complete. Submission is **not form-ready** until placeholders and organiser packet are filled.

---

## B. Five judging criteria — critical assessment

### 1. Problem understanding (25)

| | |
| --- | --- |
| **Strengths** | Names concrete failure modes (ungrounded AI, epistemic collapse, fake governance); separates tone issues from claim/fact/audit risk; competitor-honest |
| **Weaknesses** | No primary user research attached; prior public Inkloom hacks skewed to brand *creation* — confirm this brief matches the official track |
| **Unsupported if we claim…** | “Teams lose X hours/week” or “customers demand Y” without sources |
| **Concrete improvements** | Attach organiser brief; optional 3–5 real conversations with notes; one annotated public brand-guide ambiguity example |

### 2. Proposed solution (25)

| | |
| --- | --- |
| **Strengths** | Clear one-liner; A+B+C mapped to mechanisms; status taxonomy; model cannot approve |
| **Weaknesses** | Surface pitch still easy to misread as generic checker; name collision undercuts originality optics |
| **Unsupported if we claim…** | “Unique in market” or “first evidence-linked brand tool” |
| **Concrete improvements** | Lead every summary with evidence gate + statuses; announce rename shortlist in PDF; show demo story in §4 prominently |

### 3. Technical plan (20)

| | |
| --- | --- |
| **Strengths** | Hybrid pipeline; evidence gate; Zod; optional vectors; validation matrix; hardest-challenge framed correctly |
| **Weaknesses** | Auth provider undecided; span entailment residual risk must stay visible; no sequence diagram in PDF yet |
| **Unsupported if we claim…** | Production multi-tenant isolation, SOC2, or NLI-level proof |
| **Concrete improvements** | Pick auth before Round 2 Day 1; add one architecture figure to PDF; keep “citation ID ≠ entailment” sentence |

### 4. Originality (15)

| | |
| --- | --- |
| **Strengths** | Differentiation via fail-closed gate + epistemic statuses + permissioned ledger + eval plan |
| **Weaknesses** | Provisional name collides; category crowded; prior hackathon “Brand Guardian” language exists in the wild |
| **Unsupported if we claim…** | Category invention |
| **Concrete improvements** | Rename before branding; originality paragraph must say “implementation + evaluation,” not “new category” |

### 5. Feasibility and scope (15)

| | |
| --- | --- |
| **Strengths** | Explicit exclusions; cut order; single demo scenario; three measurable improvements; phase acceptance discipline |
| **Weaknesses** | Temptation to add vision/CMS/SSO; team capacity unknown (`[TEAM_SIZE]`) |
| **Unsupported if we claim…** | Enterprise platform completeness in Round 2 |
| **Concrete improvements** | Freeze P0 list in submission; state “Markdown seed first”; timebox Phase 8 |

---

## C. Flagged issues (must fix or soften)

| Issue | Severity | Action |
| --- | --- | --- |
| Empty team / participant placeholders | Blocking | Fill before PDF export |
| Missing official packet / dates | High | Attach under `docs/round-1/official/` |
| Name “BrandGuard AI” | High | Declare provisional + rename plan in PDF (done); execute rename |
| Possible overclaim of uniqueness | Medium | Use “mechanism differentiation” wording only |
| Metrics look like promises | Medium | Keep “proposed until measured” (done) — never convert to past tense early |
| Visual/a11y content checks | Medium | Keep deferred/timeboxed so judges don’t expect full vision QA |
| Unclear architecture for non-engineers | Low–Medium | One diagram in PDF |

---

## D. Requirements validation checklist (Task 1)

- [x] Problem understanding and affected users  
- [x] Proposed solution and value proposition  
- [x] Complete end-to-end workflow  
- [x] Main features and explicit exclusions  
- [x] Technology stack and architectural rationale  
- [x] Responsibilities of every team member (**placeholders**)  
- [x] Development plan across rounds  
- [x] Expected impact and evaluation metrics (**proposed**)  
- [x] Future scope  
- [x] Complete participant and team details (**placeholders**)  
- [x] No invented roster, interviews, or measured scores  

---

## E. MVP feasibility snapshot (Task 3)

| Item | Definition |
| --- | --- |
| Primary user | Brand reviewer (+ creator) |
| Primary use case | Pre-publish marketing email / landing snippet vs seeded kit |
| Demo scenario | Unsupported ROI claim → evidence gap → intent-preserving fix → human approve |
| Round 2 essentials | Kit, review+gate, suggestions+diff, server approvals, audit, fixtures/tests |
| Three measurable improvements | Evidence-reference validity; calibrated status labelling vs baseline; approval-permission pass rate |
| Deferred | CMS, SSO, deep vision, regulated packs, autonomous publish |
| Top risks | Name collision, scope creep, LLM flakiness, missing organiser constraints |

---

## F. Recommended score posture (non-authoritative)

Internal readiness judgment only:

| Criterion | Internal posture | Why |
| --- | --- | --- |
| Problem understanding | Competitive if honesty stays | Competitor-aware framing helps |
| Proposed solution | Competitive if rename + mechanism lead | Easy to sound generic otherwise |
| Technical plan | Competitive with diagram + auth decision | Residual entailment honesty required |
| Originality | At risk until rename + mechanism emphasis | Name and category are crowded |
| Feasibility | Strong if P0 frozen | Exclusions are the advantage |

**No predicted total score is assigned.** Improving originality optics and filling placeholders will matter more than adding features.

---

## G. Next recommended action

1. Fill `[TEAM_*]` and participant fields.  
2. Attach official organiser instructions and reconcile any mismatches.  
3. Export `submission-draft.md` → PDF using `16-pdf-submission-checklist.md`.  
4. Submit via organiser form.  
5. Do **not** start functional implementation until the permitted build window.
