# Sprint 4 adjustments, scenarios, revisions and printable plans

Updated: 16 October 2026. Branch: `sprint-4`, created from `origin/main` at `529765a` after the Sprint 3 merge.

## Implemented scope

- Plan & compare section alongside the existing project editor and forecast.
- Receipt-delay scenarios of 0–365 whole calendar days, applied to every expected receipt including deposits and explained overrides.
- Expense-increase scenarios of 0–100 whole percent, using exact integer arithmetic and half-up rounding per expense.
- Manual client-payment amount and expected-receipt-date proposals, with a reason for each change. Proposed payment totals must equal original totals. Original invoice and completion dates remain visible and unchanged.
- Configurable maximum total deposits, between zero and the project price. This is an owner-entered planning constraint; the app does not assume a statutory deposit limit.
- Explainable deposit suggestion: move funds from later milestones to an existing deposit expected by the first shortage, preserving total price and positive milestone amounts. The comparison always displays any residual gap. No suitable early deposit, no available later funds or a binding deposit cap produces an explanation rather than a promise to solve the gap. Existing payment-change reasons are preserved; suggestions that would exceed the reason limit fail without changing the proposal.
- Original-versus-proposal first shortage, maximum funding gap, closing cash and interactive proposal chart. Unapplied form edits are explicitly labelled and block saving/export until applied.
- Named immutable plan revisions: preserve the original project, expenses, payments and proposal settings. Reopen revisions after working-project edits, or derive a new revision without overwriting its source. The latest 100 revisions are listed.
- Printable payment plan for browser print / Save as PDF, including original/proposed schedules, invoice terms, adjustment reasons, expense comparison, dated cash balances, assumptions, project/client details and residual funding needs. Incomplete or unapplied plans cannot be exported as a complete payment plan.

## Data and conventions

The working project is a saved draft. Plan & compare explores a separate proposal; saving a named revision does not replace the working project's rows. Leaving the section or changing the selected revision discards unsaved proposal inputs, as explained in the interface.

The additive `202610150004_plan_revisions.sql` migration creates the revision table, owner-only read policy and validated write function. Authenticated clients have no direct insert, update or delete privilege on revisions. The function checks project ownership, captures originals from the database, verifies those inputs match what the owner reviewed, validates settings and inserts a new immutable record. Derived revisions retain their source baseline even if the working schedule later changes. Deleting the parent project through an authorised database operation also deletes its revisions.

Snapshots carry schema version 1, whose calculation rules are the existing AUD, project GST convention, date-only calendar values and daily closing balances. Starting cash is allocated before the earliest date. Same-day movements are netted; intraday shortages are not modelled. All saved dates, including outside-project payments, remain included. Scenario delays apply after manual proposed receipt dates. Expected receipts are not confirmed payments, and a proposal does not confirm client agreement or amend an invoice.

Revisions require both original and proposed client payments to match the project price. Draft comparisons remain available, with an incomplete-schedule warning. An empty expense schedule remains visibly qualified. No additional taxes, fees or unentered expenses are inferred.

## Verification

58 unit/component tests pass, along with lint, TypeScript, the production build and all four independent synthetic fixture checks. Tests cover exact rounding, date rollover/ranges, non-mutating scenarios, constrained suggestions and residual gaps, retained explanations, total validation, revision load/save guards, failed-save retry, reopening preserved originals and print-action safeguards.

Real local Supabase integration checks pass for project/expense/payment ownership and validation, plus revision server snapshots, save/reopen/derive, unchanged snapshots after working-schedule edits, stale-input rejection, direct-write denial, settings validation, anonymous denial and two-account isolation. Test accounts and data are confined to the local backend.

Browser verification against a disposable local account saved “Original terms” and “Materials covered”. The original retained its $2,000 deposit and $1,000 gap; the revised plan retained a $3,000 deposit, $7,000 final payment and no daily closing gap. Both reopened after reload. The example includes $7,000 total expenses and closes with $3,000 cash. Phone (390px), tablet (768px) and desktop (1440px) layouts were visually reviewed with document width equal to viewport width.

The browser print action opens Chrome's print workflow, but that dialog blocks automated control in this environment. Export content and safeguards are tested; a saved PDF's pagination and final visual layout still need a manual check. No claim of full print-layout verification is made.

## Hosted rollout and remaining acceptance

The revision migration was applied transactionally through the hosted Supabase SQL editor on 16 October. A post-commit query confirmed the table exists. Like earlier SQL-editor migrations, this does not update CLI migration history; reconcile that history before any future CLI migration push.

The Sprint 4 branch preview needs its own public Supabase build variables and exact allowed authentication redirect. Its frontend uses the existing hosted backend, so preview data is not isolated. Full hosted authenticated revision save/reopen and PDF export acceptance remain pending. Customer discovery, real reference projects, general-user email delivery and Sprint 5 pilot observation remain open.


## Preview deployment evidence

Pushed `sprint-4` with separate feature commits. GitHub application CI and the initial Cloudflare build passed for `6ea371c`. Configured the Sprint 4 preview's own public Supabase URL/key, verified the subsequent build received both variables, and added its exact origin to Supabase's authentication redirect allowlist. The configured rebuild `2dde6632-7eae-42fa-aead-fabfa4dd1816` succeeded for `6ea371c` and generated the same application asset as the local build. The preview opens at https://sprint-4-project-payment-planner.skorsengkuang.workers.dev and was visually checked to show Google and email sign-in rather than workspace setup instructions. A read-only anonymous request to the hosted revision table returned HTTP 401. Full hosted authenticated revision save/reopen and a visual check of a saved PDF remain user acceptance items.


## Feature showcase data

Added an owner-only Load demo projects action with two editable sample projects and four immutable plan revisions. The dataset exercises expenses, deposit/milestone terms, receipt overrides, starting cash, draft allocation warnings, funding gaps, proposed payment changes, deposit caps, receipt-delay/cost scenarios, revision reopening/derivation and print-ready complete plans. Repeat calls preserve edits and reuse IDs; concurrent calls serialize per account. All sample rows and versions are created in one database transaction.

Validation: 61 unit/component tests, lint, production build and real local Supabase integration checks pass. The integration check verifies scenario gaps ($2,500 / $0 / $1,000 / $3,300), closing balances, incomplete allocation, concurrent calls, retries, preserved edits, anonymous denial and account isolation. The new migration follows the existing SQL-editor hosted rollout workflow; CLI migration history still needs reconciliation before a future CLI push.
