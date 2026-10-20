# Feasibility Critique and Questions the Team Must Resolve

## Feasibility verdict

**Buildable in a hackathon** if scope stays at a single-tenant, text-first vertical slice with a seeded brand kit and a hard evidence gate.  
**Not feasible** if the team tries to out-feature Writer/Acrolinx, ships vision-heavy governance, or keeps the colliding BrandGuard AI name as a uniqueness story.

## What is strong

- Clear problem framing tied to governance failures, not “AI magic”
- Differentiator trio maps to concrete engineering (gate, statuses, state machine)
- Stack is conventional and demo-friendly
- Phased plan has kill switches

## What is weak / high risk

| Risk | Severity | Mitigation |
| --- | --- | --- |
| Name collision with brandguardai.io | High | Rename before Round 2 branding |
| Looks like another guideline chatbot | High | Lead with evidence statuses + audit demo |
| Official brief not attached | High | Obtain organiser PDF; reconcile requirements |
| Span entailment overclaimed | Medium | Claim ID-check authenticity, not full NLI |
| Auth provider churn | Medium | Decide Day 1 of build; freeze |
| PDF ingestion time sink | Medium | Seed Markdown first |
| Team placeholders empty | High for submission | Fill before PDF export |
| Prior Inkloom hacks were brand creation | Medium | Explicitly contrast governance vs generation |

## Challenging our own assumptions

1. **“Reviewers want more AI flags.”** They may want fewer, better-calibrated ones. Our abstention bias must be sold as a feature.
2. **“Intent fields will be filled.”** Authors may skip them. Consider lightweight defaults from channel templates.
3. **“Postgres FTS is enough.”** Probably for demo size; validate with paraphrases before promising semantic understanding.
4. **“Analytics differentiate us.”** Only if wired to guideline clarity, not vanity charts.

## Scoring self-check (Round 1 criteria)

| Criterion | Points | Plan coverage | Gap |
| --- | --- | --- | --- |
| Problem understanding | 25 | Strong if we keep competitor honesty | Need official brief confirmation |
| Proposed solution | 25 | Strong mechanism story | Rename + sharper one-liner |
| Technical plan | 20 | Solid architecture | Auth choice TBD |
| Originality | 15 | Mechanism yes; name no | Mandatory rename plan in PDF |
| Feasibility and scope | 15 | Explicit exclusions help | Resist P2 creep |

## Questions the team must resolve

1. What is the **official organiser packet** URL/file, deadline, and PDF page/size limit?
2. Exact **team name**, **legal names**, **size**, and **emails**?
3. Final **product name** shortlist winner after collision check?
4. Which **auth** provider for Round 2?
5. Which **LLM** provider/credits are allowed (Inkloom-related or otherwise)?
6. Do organisers require **Inkloom API / credits** integration?
7. What **demo industry** for the seed kit (B2B SaaS, consumer, regulated)?
8. Who owns **submission form** upload and final PDF export?
9. Are **build windows** for Rounds 2/3 dated yet?
10. Any **eligibility** constraints (student status, region, prior IP)?

## Recommendation

Submit Round 1 with provisional name + explicit rename note; lock P0 scope; attach this package’s `submission-draft.md` content to the PDF after filling placeholders.
