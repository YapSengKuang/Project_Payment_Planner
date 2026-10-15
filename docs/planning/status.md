# Progress and decisions

Date: 16 October 2026

## Sprint 0

Scope, interview guide, synthetic scenarios, user journey and Sprint 1 tickets are prepared. Customer interviews, current alternatives research and real anonymised reference projects remain pending. Australian freelancers and small agencies remain an audience hypothesis. GST convention and other product rules remain provisional. Development was started at the owner's request while this validation remains open.

## Sprint 1 implementation

React, TypeScript, Vite, Tailwind, Vitest and ESLint are configured with a committed dependency lockfile and GitHub checks. The interface uses bundled Didact Gothic and the supplied purple/blue/yellow palette.

Implemented passwordless email sign-in, resend and callback-error handling, session restoration, sign-out, private project listing, project create/edit/reopen, field validation and exact conversion into integer cents. The pilot supports AUD and a consistent GST convention per project. Pending and failed requests have visible states; failed saves preserve input.

Supabase migration includes database constraints, owner foreign keys, row-level policies for all CRUD operations and immutable ownership. Local Supabase runs through Docker. No service-role key is used by the frontend or integration tests. Public local configuration is generated into ignored environment files.

See `docs/sprint-1-verification.md` for observed tests and limitations and `docs/development.md` for startup and deployment.

## Deployment and responsive review

The existing Cloudflare project is a Worker rather than Pages. It now deploys static Vite output from `sprint-1` using `wrangler.jsonc`. Deployment of application revision `b431419` succeeded at https://project-payment-planner.skorsengkuang.workers.dev and the site returned HTTP 200.

The hosted Supabase schema and ownership policies were applied transactionally through its SQL editor. Exact production and local callback URLs were configured. An anonymous request to the hosted project table returned HTTP 401 with database permission denied, as intended. The two-account integration test remains confined to the local backend.

Phone, tablet and desktop form layouts were reviewed in Chrome at 390px, 768px and 1440px, with measured document width matching viewport width. Phone sign-in and project list were also inspected. Small screens now use a top brand header, stacked fields and action buttons. Desktop retains the sidebar and two-column form.

## Remaining acceptance work

Hosted email delivery and the complete hosted sign-in/save/reopen journey still require a real test using an allowed email address. Supabase custom SMTP is not configured; the default sender is limited to project team addresses. A custom email provider is needed before general-user pilot access. Discovery validation remains pending.

Expenses and milestones were subsequently implemented in Sprint 2, cash forecasting in Sprint 3, and scenarios, versions and export in Sprint 4.


## Sprint 2

Expense CRUD, deposit/milestone CRUD, database-generated receipt dates, explained overrides, draft/complete totals and Google OAuth integration are implemented on `sprint-2`, each in a separate feature commit. See `sprint-2.md` for requirements, observed browser checks and local database checks. The hosted expense/milestone schema is applied. After the Google redirect correction, the preview reached Google's account chooser; a complete consent/session/sign-out round trip remains unverified.

## Sprint 3

Implemented on `sprint-3`: checked integer-cent cash forecast engine, Forecast screen, dated cash timeline, first shortage, maximum funding gap, cash totals, assumptions and provisional-data warnings, and an interactive balance chart. Feature commits are separate. See `sprint-3.md` for conventions, acceptance examples, browser evidence and limitations. No schema changes are needed. 46 automated tests, the four independently calculated synthetic fixtures, lint, TypeScript and production build pass. Local browser checks cover saved changes, reload/reopen, keyboard interaction and phone/tablet/desktop layouts. Suggestions, scenarios, schedule versions and export remain Sprint 4. Hosted preview deployment now succeeds with separately configured Supabase build variables and an exact allowed redirect; its sign-in screen is verified. Full hosted authenticated acceptance remains pending.


## Sprint 4

Branch `sprint-4` starts from merged main (`529765a`). Implemented separate feature commits for scenarios, explained payment/deposit adjustments, immutable named revisions and printable payment plans. See `sprint-4.md` for the final conventions and acceptance evidence. Follow-up review retained existing change explanations and added revision-load guard coverage. 58 unit/component tests, local database ownership/revision integration tests, reference fixtures, lint, TypeScript and build pass. Responsive layouts are checked at 390/768/1440px. The additive revision migration is applied locally and transactionally to hosted Supabase. Full hosted workflow and saved-PDF visual acceptance remain pending; the automated browser cannot inspect Chrome's print dialog.


## Sprint 5

Started on `sprint-5` from `origin/main` (`3659801`, Sprint 4 merged). Implemented public configuration validation for release builds and local-only integration-test safeguards, each committed separately. Added `check:release`, CI checks for rejected deployment configurations and the pilot protocol/release matrix. 65 unit/component tests, lint, configured production build, negative build checks, independent fixtures and real local integration checks pass. `npm audit --omit=dev` reported zero known production dependency vulnerabilities on 16 October 2026; this is an advisory database snapshot, not a complete security assessment.

Sprint 4's demo loader is also merged, with successful hosted sample loading and reopening of the larger-deposit revision recorded in that work. No Sprint 5 UI redesign or schema migration is introduced. Real pilot sessions (0 of 3 to 5), candidate mobile/authentication checks, actual usage review and manual PDF pagination remain open. No release claim is made. See `sprint-5.md` and `../pilot/release-checklist.md`.
