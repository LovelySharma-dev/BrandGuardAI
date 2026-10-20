# Problem Definition and Evidence Plan

## Problem statement

Organisations publish marketing, product, and support content faster than brand, legal, and accessibility specialists can reliably review it. Review today often mixes:

- static PDF brand guides that reviewers interpret inconsistently
- chatbots that critique copy without citing approved sources
- ticket queues that lose decision rationale
- last-minute legal flags that force rewrites and miss release windows

The failure mode is not only “off-brand tone.” It includes unsupported promotional claims, outdated product facts, prohibited terminology, mismatched visual assets, accessibility gaps, and approvals that cannot be audited later.

**Core product problem (proposed):** content teams need a pre-publication review system that grounds every consequential finding in approved organisational knowledge, preserves creator intent when suggesting changes, and records human decisions with enforceable permissions.

## Why this is hard (not just a UI wrapper around an LLM)

1. Brand rules are often ambiguous, conflicting, or incomplete.
2. Absence of a supporting fact is not proof a claim is false.
3. LLMs can invent citations or cite the wrong passage.
4. “Fix this” suggestions often destroy campaign intent or channel constraints.
5. Client-side role checks do not constitute governance.

## Problem understanding scored for judges

Judges should see that we understand:

| Dimension | Our framing |
| --- | --- |
| Who hurts | Creators blocked by late reviews; reviewers buried in ambiguous tickets; brand/legal owners accountable for published risk |
| What breaks | Evidence-free AI flags, inconsistent rule interpretation, no audit trail, silent auto-approvals |
| What “good” looks like | Evidence-linked findings, explicit evidence gaps, intent-preserving suggestions with human acceptance, server-enforced workflow |
| What we refuse to fake | Invented demand surveys, fabricated accuracy %, fake logos of customers |

## Supporting evidence plan

### Verified evidence already collected (2026-10-20)

| Finding | Source | Implication |
| --- | --- | --- |
| Commercial BrandGuard AI exists for guideline/legal copy review | https://brandguardai.io/ | Name and surface pitch are not unique |
| Writer markets automated brand & compliance reviews | https://writer.com/solutions/technology/ | “Load guidelines + flag issues” is table stakes |
| Acrolinx / Markup AI sell brand, quality, and citability checks with human-in-the-loop positioning | https://www.acrolinx.com/ | Enterprise governance category is mature |
| RAG systems fail when citations are not validated against retrieved IDs | DEV: “Check AI Citations Against Retrieved Source IDs” (see research refs) | Citation ID membership checks are mandatory |
| Evidence gating / fail-closed abstention beats “answer anyway” for high-stakes review | DEV RAG evaluator / evidence-gating articles (see research refs) | `unsupported` / `indeterminate` must be first-class statuses |

### Assumptions (not verified)

- A1: Mid-size B2B marketing/product orgs with shared brand PDFs are reachable demo users for a hackathon.
- A2: Reviewers will accept a tool that abstains more often if it reduces false confidence.
- A3: A single-tenant demo with seeded brand kit is enough for Round 2/3 judging.
- A4: Text-first reviews cover most of the scoring value; visual checks can be shallow for MVP.

### Planned experiments (no fabricated results)

| ID | Experiment | Method | Success signal (proposed) |
| --- | --- | --- | --- |
| E1 | Guideline ambiguity audit | Manually annotate 20 rules from a public brand guide into `deterministic` vs `interpretive` | ≥40% of high-severity rules are interpretive → justifies hybrid engine |
| E2 | False-positive baseline | Run naive LLM review on labelled fixture pack; measure precision of “violation” labels | Establish baseline before claiming improvement |
| E3 | Citation integrity probe | Inject model outputs with forged source IDs; verify server rejects them | 100% rejection of unknown IDs |
| E4 | Intent preservation check | Creators rate suggested rewrites for intent retention on 10 samples | Qualitative feedback; no numeric claim until measured |
| E5 | Name originality check | Trademark/domain/search for final product name | No exact commercial collision in core category |

### What we will not invent

- User interview quotes
- Survey percentages
- “X% reduction in review time” as a current result
- Named enterprise customers
- Team member identities not provided by the team
