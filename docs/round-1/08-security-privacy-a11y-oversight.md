# Security, Privacy, Accessibility, and Human Oversight

## Security requirements

| Rule | Enforcement |
| --- | --- |
| No API secrets in frontend | Server-only env; CI secret scan |
| No client-side role checks as authority | Every mutation re-loads session + role from DB |
| Tenant isolation (even in single-tenant demo code paths) | All queries scoped by `org_id` |
| Workflow integrity | State machine allow-list; reject illegal transitions |
| Prompt/content injection awareness | Treat uploaded guidelines and drafts as untrusted text; never execute them; bound tool/retrieval to approved kit IDs |
| Least privilege storage | Private buckets; signed short-lived URLs |
| Audit integrity | Append-only events |

## Privacy

- Minimise stored personal data (demo users only).
- Do not log raw secrets or full auth tokens.
- Retention: demo data deletable by admin; document retention in README later.
- Default: **do not** use customer content for model training.
- Redact obvious secrets in pasted content where patterns match (best-effort).

## Accessibility

- Prefer shadcn/Radix primitives with keyboard support.
- Review UI: colour is not the only severity signal (icons + text).
- Target WCAG 2.2 AA for primary flows (**proposed target**, not yet audited).
- Product feature: optional checks for missing alt text / contrast vs brand tokens (P1), distinct from auditing our own UI.

## Human oversight (non-negotiable)

1. Model outputs are **advisory**.
2. Only reviewers/admins can approve.
3. Authors must explicitly accept suggestions before text changes.
4. Evidence gaps and indeterminate findings route to humans, not silent pass/fail.
5. Override reasons are encouraged on approve-with-warnings (P1).

## Threat notes (lightweight)

| Threat | Mitigation |
| --- | --- |
| Forged citations | Evidence gate vs snapshot |
| Author self-approval | Role check |
| Stale guidelines | Pin kit version on review |
| Model overconfidence | Status taxonomy + fail closed |
| Cross-org data leak | Forced `org_id` predicates + tests |

## What Round 1 will not claim

- SOC2 / ISO certification
- Formal penetration test results
- Production threat model completeness
