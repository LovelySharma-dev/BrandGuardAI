# Three-Round Roadmap

**Provisional product:** BrandGuard AI  
**Document role:** Round 1 — plan across Rounds 1–3, impact, future scope  
**Date:** 2026-10-20  
**Build-window dates:** `[BUILD_WINDOW_ROUND_2_START]` → `[BUILD_WINDOW_ROUND_2_END]`; Round 3: `[BUILD_WINDOW_ROUND_3_START]` → `[BUILD_WINDOW_ROUND_3_END]` (**Unresolved** until official packet)

**Discipline:** A phase is not complete until acceptance criteria pass. Round 1 does not implement the functional app.

---

## Round 1 — Proposal and readiness (current)

| Deliverable | Status |
| --- | --- |
| Problem, solution, workflow, MVP scope | This package |
| Technical plan + hardest-challenge framing | This package |
| Judging self-review | `judging-self-review.md` |
| PDF-ready `submission-draft.md` | This package |
| Team / participant details | Placeholders only |
| Official organiser packet attached | **Unresolved** |
| Functional product | **Not started** (by design) |

---

## Round 2 — Build a connected vertical slice

### Essential outcomes

One demo path: seed kit → review email draft → evidence-linked findings → intent-preserving suggestion → human approval → audit log — plus negative demos (forged cite, unauthorized approve).

### Implementation phases

| Phase | Scope | Acceptance (abbrev.) |
| --- | --- | --- |
| 1 Foundation | App shell, design system | Renders; CI smoke |
| 2 Main interface | Draft, findings, diff, approval screens | Click-through with mocks OK first |
| 3 DB + auth | Postgres, roles, org scoping | Login; server role checks |
| 4 Brand knowledge | Kit versions, seed data | Reviews pin kit version |
| 5 Review + evidence engine | Deterministic + retrieval + LLM + gate | Fixtures + forged cite rejected |
| 6 Corrections | Suggestions, diff, accept/reject | Accept creates revision |
| 7 Approval + audit | State machine, events | Non-reviewer cannot approve |
| 8 Files / visual (timebox) | Private upload; shallow token checks | Invalid files rejected; limits documented |
| 9 Analytics (thin) | Recurring hits / evidence-gap rates | Fixture-driven stats visible |
| 10 Deploy + demo | URL, e2e, script ≤5 min | CI green; demo reproducible |

### Three measurable improvements to deliver and evaluate

**Label: proposed metrics until measured.**

| # | Improvement | How evaluated |
| --- | --- | --- |
| 1 | Evidence integrity | Evidence-reference validity = 100%; forged-citation acceptance = 0 on probe set |
| 2 | Calibrated claim labelling | Precision/recall on labelled set vs naive LLM baseline (E2); especially low false `contradicted` |
| 3 | Governed approvals | Approval-permission e2e pass rate = 100%; audit events present for each transition |

Secondary (if time): correction regression rate after accepted suggestions; creator intent-retention ratings.

### Risks, dependencies, mitigations

| Risk / dependency | Mitigation |
| --- | --- |
| Official dates / API requirements unknown | Attach organiser packet before coding priorities freeze |
| Name collision | Rename before demo branding |
| LLM provider flaky / costly | Adapter + mocks; fixture-first development |
| Auth choice churn | Decide Day 1 of Round 2; freeze |
| PDF ingestion sink | Seed Markdown/JSON first |
| Scope creep (vision, CMS, SSO) | Cut order: visuals → ingestion → analytics → never cut gate/authz |
| Overclaiming entailment | Market citation-ID gate honestly |

---

## Round 3 — Harden, measure, present

1. Freeze features; reliability and clarity fixes only  
2. Run labelled evaluation; report **measured** numbers only  
3. Polish demo narrative around evidence gaps + human approval  
4. Document limitations (span entailment, shallow visuals, English-first)  
5. Prepare Q&A on hardest technical challenge  

---

## Expected impact (qualitative — not measured yet)

If the MVP works as designed:

- Unsupported promotional claims surface before publish  
- Reviewers spend less time hunting which source applies  
- Corrections keep campaign intent more often than blind auto-rewrite  
- Auditable answer to who approved what against which kit version  
- `indeterminate` clusters highlight unclear guidelines  

---

## Future scope (post-event / post-MVP)

- Final product rename  
- Stronger span-level support checks  
- Hybrid vector retrieval if eval requires  
- CMS/Slack publish gates  
- Deeper accessibility content checks  
- Multi-tenant SSO  
- Counsel-reviewed vertical claim packs  

**Permanent non-goals (unless strategy changes):** autonomous approval without humans; web scraping as brand truth; training on private drafts by default.

---

## Coverage check — organiser items 8–10

| Requirement | Covered? |
| --- | --- |
| Plan across rounds | Yes |
| Expected impact | Yes (qualitative + proposed metrics) |
| Future scope | Yes |
