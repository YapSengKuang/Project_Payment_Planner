# Progress and decisions

Date: 15 October 2026

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

Expenses, milestones, forecast, scenarios, versions and export are subsequent sprint work.


## Sprint 2

Expense CRUD, deposit/milestone CRUD, database-generated receipt dates, explained overrides, draft/complete totals and Google OAuth integration are implemented on `sprint-2`, each in a separate feature commit. See `sprint-2.md` for requirements, observed browser checks, local database checks and the outstanding Google redirect configuration. The hosted expense/milestone schema is applied; the production frontend remains on `main` until merge.
