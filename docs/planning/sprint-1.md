# Sprint 1 development tickets

Entry condition: review discovery evidence and agree the unresolved scope conventions. Implementation and verification status is recorded below. Discovery evidence remains pending; development proceeded at the owner's request.

## S1-01 Scaffold and checks

Set up React, TypeScript, Vite, Tailwind and Vitest. Apply the documented font and palette. Add lint, typecheck, test and build commands and continuous integration.

Acceptance: a fresh checkout installs from a committed lockfile, all commands pass, and the shell works on mobile and keyboard. No credentials are committed.

## S1-02 Supabase configuration and schema

Create versioned migrations for project setup records: id, owner_id, name, client_name, price_cents, starting_cash_cents, currency, start_date, end_date, tax_basis, created_at and updated_at. Use integer money, nonnegative checks, date-order checks, required fields and an ownership foreign key. Configure environment examples and setup instructions. Frontend uses only the public project URL and publishable key; privileged keys stay out of browser code.

Acceptance: migrations run on a clean database; invalid values fail; configuration errors are explained without exposing secrets. Confirm supported currency precision before enabling currencies beyond the initial AUD pilot.

## S1-03 Authentication

Implement email sign-in, sign-out, session restoration, loading and error states using Supabase Auth. Configure supported redirect URLs and a recovery flow appropriate to the selected sign-in method.

Acceptance: a real test user signs in and out; reload restores the session; signed-out users cannot load private records. Test failed/expired authentication and avoid showing previous-user data during account changes.

## S1-04 Ownership policies

Enable row-level security. Restrict select, insert, update and delete to the authenticated owner, including WITH CHECK rules preventing owner reassignment. Deny unauthenticated access.

Acceptance: integration checks using two real test accounts prove each operation fails against the other user's records, including crafted direct API requests and owner reassignment. Run checks against a local or dedicated test backend.

## S1-05 Project create edit and reopen

Build the owned project list and setup form. Validate required fields, dates and exact decimal-to-cents conversion. Persist to Supabase; handle errors without losing input.

Acceptance: create and edit a project, reload, and reopen the persisted values. Reject invalid amounts and date ranges. Starting cash has a visible definition; empty and network-error states are usable.

## S1-06 Cloudflare preview and review

Configure the production build and preview deployment, Supabase public environment values and authentication redirect URLs. Document migrations, local development, deployment and rollback. Hosting account access is required to perform deployment.

Acceptance: a preview URL loads over HTTPS and supports the sign-in/save/reopen journey; record isolation checks pass. Review responsive layouts and accessible labels. Record the deployed revision and test evidence.

Sprint completion requires a real authenticated user saving and reopening a project and verified isolation. A scaffold or local-storage demo alone does not meet it.


## Implementation status

S1-01 through S1-05 are implemented and locally tested, including real local Supabase Auth and direct API ownership checks. Phone, tablet and desktop layouts have been reviewed in Chrome. S1-06 now has a successful Cloudflare Worker static deployment at https://project-payment-planner.skorsengkuang.workers.dev, hosted schema and redirect configuration. The full hosted email sign-in/save/reopen check remains pending; custom SMTP is required for general-user email delivery. See `../sprint-1-verification.md` for evidence and limits.
