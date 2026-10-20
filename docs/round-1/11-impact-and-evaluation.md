# Expected Impact and Measurable Evaluation Plan

## Expected impact (qualitative — not measured yet)

If the product works as designed, organisations should:

1. Catch unsupported promotional claims before publication
2. Reduce reviewer time spent hunting which guideline applies
3. Preserve campaign intent while remediating risk
4. Produce an audit trail for who approved what against which kit version
5. Improve guidelines by spotting recurring ambiguity (`indeterminate` clusters)

These are **expected** outcomes, not claims of achieved ROI.

## Evaluation philosophy

Measure the review engine like a safety system:

- Prefer calibrated abstention over confident error
- Separate retrieval failures, gate failures, and generation failures
- Never use demo anecdotes as accuracy proofs

## Labelled test dataset (planned)

Create `fixtures/reviews/` (during build window) with items containing:

- input text + declared intent
- kit version id
- expected findings (status, rule/source ids)
- notes on acceptable alternate judgements

Suggested slices:

| Slice | Purpose |
| --- | --- |
| Banned terminology | Deterministic precision |
| Fact contradiction | `contradicted` vs approved fact |
| Novel claim | `unsupported` (not `contradicted`) |
| Ambiguous tone rule | `indeterminate` |
| Forged citation output | Gate rejects |
| Benign on-brand copy | Low false positives |

**Proposed targets (not results):**

| Metric | Proposed target | Notes |
| --- | --- | --- |
| Citation ID validity | 100% of rendered citations ⊆ snapshot | Hard gate |
| Forged citation acceptance | 0 | Hard gate |
| Precision on `policy_hit` | ≥0.90 on fixture set | After E2 baseline |
| False `contradicted` on unsupported claims | ≤0.05 | Critical semantic |
| Unauthorized approval attempts blocked | 100% in e2e | Security |

Do not publish these numbers as achievements until measured.

## Human evaluation (planned)

- Creators rate suggestion intent retention (1–5) on ≥10 samples
- Reviewers rate finding usefulness / trust (1–5)
- Record disagreement cases for guideline improvement

## Demo impact story (for judges)

Show one narrative: a launch email with a glowing metric claim → `unsupported` → intent-preserving rewrite accepted → reviewer approval → audit event. Contrast with a chatbot that calls the claim “false” without sources.
