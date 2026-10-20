# Limitations and Post-Event Roadmap

## Known limitations (honest)

1. **Ambiguous guidelines remain hard.** The system can label `indeterminate`; it cannot invent organisational policy.
2. **Excerpt entailment is imperfect.** Citation ID checks prevent forged sources but do not fully prove the cited span supports the claim.
3. **Visual governance will be shallow in MVP.** Full logo misuse / layout QA needs specialised vision evals.
4. **Single-locale demo bias.** English-first fixtures understate multilingual failure modes.
5. **Not a substitute for legal advice.** Claim policies are configurable rules, not jurisdiction-specific counsel.
6. **Name collision.** Provisional “BrandGuard AI” conflicts with an existing commercial product.
7. **Hackathon infra.** Background job queues, SSO, and multi-region residency are out of scope.

## Post-event roadmap

### Near term

- Rename after originality/legal check
- Expand labelled eval set; publish honest metrics
- Hybrid retrieval with pgvector if eval demands it
- Stronger span-level entailment checks
- PDF ingestion quality improvements

### Medium term

- CMS publish gates
- Override learning with human review (bias-aware)
- Deeper accessibility auditing
- Multi-tenant hardening and SSO

### Long term

- Regulated vertical packs with counsel-reviewed policies
- Cross-channel asset governance
- Guideline authoring assistant that proposes clearer rules from `indeterminate` clusters

## Non-goals permanently (unless strategy changes)

- Autonomous approval without humans
- Scraping the public web as authoritative brand truth
- Training foundation models on private customer drafts by default
