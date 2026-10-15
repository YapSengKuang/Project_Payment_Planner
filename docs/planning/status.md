# Progress and decisions

Date: 15 October 2026

## Sprint 0

Scope, interview guide, synthetic scenarios, user journey and Sprint 1 tickets are prepared. Customer interviews, current alternatives research and real anonymised reference projects remain pending. Australian freelancers and small agencies remain an audience hypothesis. GST convention and other product rules remain provisional. Development was started at the owner's request while this validation remains open.

## Sprint 1 implementation

React, TypeScript, Vite, Tailwind, Vitest and ESLint are configured with a committed dependency lockfile and GitHub checks. The interface uses bundled Didact Gothic and the supplied purple/blue/yellow palette.

Implemented passwordless email sign-in, resend and callback-error handling, session restoration, sign-out, private project listing, project create/edit/reopen, field validation and exact conversion into integer cents. The pilot supports AUD and a consistent GST convention per project. Pending and failed requests have visible states; failed saves preserve input.

Supabase migration includes database constraints, owner foreign keys, row-level policies for all CRUD operations and immutable ownership. Local Supabase runs through Docker. No service-role key is used by the frontend or integration tests. Public local configuration is generated into ignored environment files.

See `docs/sprint-1-verification.md` for observed tests and limitations and `docs/development.md` for startup and deployment.

## Remaining acceptance work

Cloudflare preview deployment has not been created or tested. A hosted Supabase project, email delivery configuration, Pages project and their redirect URLs remain to be configured. Browser checks were made at the available in-app browser width; full mobile and desktop breakpoint checks remain open because the browser viewport override did not change its actual width.

Sprint 1 code and local authentication/persistence/isolation checks are implemented. The sprint's hosted preview and full layout acceptance criteria remain open. Expenses, milestones, forecast, scenarios, versions and export are subsequent sprint work.
