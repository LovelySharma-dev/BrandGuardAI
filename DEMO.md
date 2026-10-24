# Demo script

Seeded accounts are **demo-only**. The sign-in page lists each role so a judge can enter quickly. Rotate the shared password before a lasting public deployment.

## Setup

```bash
npm install
npm run dev
```

Open http://localhost:3000.

For a judging demo, use embedded Postgres. If `.env.local` sets `DATABASE_URL`, move that file aside for the session and restore it afterwards. Starting the app with that variable set writes reviews to the hosted development database, which already contains demo accounts and is not a production database.

Optional model pass, in `.env.local` (do not commit it):

```bash
OPENROUTER_API_KEY=your-key
LLM_MODEL=openrouter/free
```

If the key is missing, the provider times out, or the response is not valid JSON, deterministic findings still return. The draft is not approved.

`npm run dev` seeds the accounts below when the user table is empty. A production process does not seed them. The sign-in page still lists the roles for judging convenience, and those buttons work only when the accounts are already stored.

Every seeded account uses the password `brandguard-demo`.

| Role | Email |
| --- | --- |
| Author | `author@demo.brandguard.test` |
| Reviewer | `reviewer@demo.brandguard.test` |
| Admin | `admin@demo.brandguard.test` |
| Other organisation | `author@other.brandguard.test` |

Sign-in, review submission, and PDF inspection are counted in the application database. A normal demo stays inside the limits (30 sign-ins, 20 reviews, and 8 PDF reads per 10 minutes). Those counters are shared only by instances that use the same database. If the counter cannot be written, the attempt is rejected.

A model citation is kept for `verified` or `contradicted` only when the excerpt contains the claim verbatim and the local polarity agrees. A paraphrase or a short overlap becomes `indeterminate`. That is an evidence gap, not a contradiction.

## Sequence

1. Open `/`. The page is a fictional Northline illustration. It says the draft is not saved and not approved. It is not a stored review. The workspace reviews use the Inkloom kit.
2. On the sign-in page, choose **Demo author**. The note above the buttons says this is for judging convenience. Open **New review**. Replace the sample copy with: `Inkloom was founded in 2019. Later copy says founded in 2015. We are the best in the world.` Run the review.
3. Expect the deterministic checks to return three findings:
   - `verified` for “founded in 2019”, with the founding excerpt and kit `1.0.0`
   - `contradicted` for “founded in 2015”, with the same source
   - `unsupported` for “best in the world”, with an evidence gap and no citation
   If the optional model pass completes, it can add an extra `indeterminate` finding on the founding sentence. That row stays an evidence gap. It does not replace the `verified` finding and it does not approve the draft. Select **Matches approved fact** to see the pinned excerpt. If the pass times out, the page says the deterministic findings are the ones on screen.
4. Open **Evidence trust** on that review. Select each finding. Tab to the claim, then press Arrow Down: focus moves to the automated finding, which shows the word Selected. The verified and contradicted claims show the pinned kit `1.0.0` excerpt and the finding’s stored explanation. The unsupported claim shows an evidence gap and no source. The text version under the diagram repeats those relationships and includes the pinned excerpt, or the gap sentence when no source is eligible. The human-decision section says none has been recorded.
5. Accept the suggested replacement for 2015. The draft changes. The status does not become `approved`. The trust panel may show the suggestion as accepted. It still does not show a human decision.
6. Open **Approvals**. This review is `needs_revision` because of the unsupported claim, so Approve is not offered. That is a workflow rule, not the creator check.
7. Run a second review whose body is only `Inkloom was founded in 2019.` It has no blocker, so it stays `in_review`. As the author, choose **Approve**. The server responds “Authors cannot approve reviews”. The status stays `in_review` and no human decision is recorded. A reviewer or admin who created a review is rejected separately, with “You cannot approve a review you created”.
8. Sign out, return to the sign-in page, and choose **Demo reviewer**. Approve that second review. The decision is stored, an audit row is written, and the review still names kit `1.0.0`. Evidence trust shows that approval as a human decision, separate from the verified finding. The text version names the person. The finding status stays `verified`.
9. Download the markdown report. It separates findings, suggested edits, the human decision, and the evidence-trust lines from the pinned snapshot.
10. In another terminal, run `npm run eval`. The command prints fixture recall, exhaustive-fixture precision, and the integrity cases from this run. It does not print a hardcoded score. Fixture scores are the deterministic reviewer. Integrity cases cover the evidence gate, model overrides, and authorization.

## When the model pass fails

The free model sometimes returns JSON the schema rejects. The page then says the optional model pass did not return a usable result, and the findings on screen are the deterministic ones. A timeout says the pass timed out. A missing key says the pass was skipped. None of those outcomes approve the draft. The repair attempt runs once.

Use two persisted reviews. The mixed draft becomes `needs_revision` after the unsupported claim, so it cannot also be the review you approve. The second draft has no blocker and stays `in_review` for the creator rejection and the reviewer decision.

## What this demo does not show

Seeded Inkloom facts are fictional. The landing page is not a persisted review. Analytics counts are from stored reviews and the labelled fixture pack, not a production accuracy certificate. A paraphrase of an approved fact stays `indeterminate`. The trust graph repeats the stored status and the pinned snapshot. It does not prove a claim the evidence gate abstained on, and it does not replace a historical excerpt with a newer kit. The rate limits are per database. The sign-in role list is a judging convenience. An empty production database has no accounts until it is seeded from a development run. The hosted development database is not a production database.
