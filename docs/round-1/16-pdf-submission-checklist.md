# PDF Generation and Organiser Form Checklist

## Before exporting the PDF

- [ ] Read official organiser instructions (attach packet to `docs/round-1/official/` when available)
- [ ] Replace all placeholders: `[TEAM_NAME]`, `[TEAM_SIZE]`, participant legal names, emails, roles
- [ ] Confirm track/challenge title matches organiser wording
- [ ] Include rename note for provisional “BrandGuard AI”
- [ ] Remove any fabricated metrics, interviews, or customer logos
- [ ] Verify all 11 organiser sections are present (see below)
- [ ] Add architecture diagram (export Mermaid from `06-architecture.md` or redraw)
- [ ] Spell-check; keep within any page/size limits (**Unresolved** until official packet)

## Map: 11 organiser requirements → draft sections

| # | Requirement | Primary location in `submission-draft.md` |
| --- | --- | --- |
| 1 | Problem understanding | §1 |
| 2 | Affected users | §2 |
| 3 | Proposed solution | §3 |
| 4 | Complete workflow | §4 |
| 5 | Main features | §5 |
| 6 | Technology stack | §6 |
| 7 | Team-member responsibilities | §7 |
| 8 | Plan across all three rounds | §8 |
| 9 | Expected impact | §9 |
| 10 | Future scope | §10 |
| 11 | Complete team and participant details | §11 |

## Export steps (suggested)

1. Copy `submission-draft.md` into your doc tool (Google Docs / Word / Typst / Pandoc)
2. Apply organiser formatting if specified
3. Export PDF
4. Open PDF and spot-check placeholders (`[` should not remain except intentional examples)
5. Upload via organiser form
6. Save confirmation email/screenshot in `docs/round-1/official/`

## After submit

- [ ] Record submission timestamp and confirmation ID: `[SUBMISSION_CONFIRMATION_ID]`
- [ ] Share PDF + confirmation with all teammates
- [ ] Freeze Round 1 docs; only correct factual errors
- [ ] Do **not** start functional product build until permitted window

## Judging criteria quick pass (self review)

- [ ] Problem cites real competitor risk without fake surveys
- [ ] Solution emphasises evidence gate + human approvals
- [ ] Tech plan names trade-offs (esp. vectors optional)
- [ ] Originality called out as mechanism, not name
- [ ] Scope lists exclusions
