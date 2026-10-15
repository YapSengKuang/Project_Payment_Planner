# Project Payment Planner

Plan fixed-price projects before agreeing to client payment terms. The app supports email/Google sign-in, private project setup, expenses and expected deposit/milestone schedules. The Forecast screen shows daily cash balances, first shortages and maximum funding gaps.

**Live app (main):** [Project Payment Planner](https://project-payment-planner.skorsengkuang.workers.dev/)

**Sprint 2 preview:** [Try expenses and payment milestones](https://sprint-2-project-payment-planner.skorsengkuang.workers.dev/)

**Sprint 3 preview:** [Try cash forecasts and funding gaps](https://sprint-3-project-payment-planner.skorsengkuang.workers.dev/)

**Sprint 4 preview:** [Try proposals, scenarios and saved revisions](https://sprint-4-project-payment-planner.skorsengkuang.workers.dev/)

## Try every feature with demo data

After signing in, click **Load demo projects** on the project list. It creates two private, editable fictional projects:

- **Website redesign:** three expenses, a deposit, two milestones, invoice terms and an explained receipt override. Its original forecast has a $2,500 maximum funding gap.
- **Plan & compare:** open the four saved revisions to compare original terms, a larger deposit (no gap), a capped deposit ($1,000 gap), and seven-day receipt delays with 10% higher costs ($3,300 gap). Edit a proposal, save another revision and try Print / Save as PDF.
- **Incomplete draft:** starting cash and a partially allocated payment schedule demonstrate draft warnings and $6,800 still to allocate.

Dates start from your local calendar day on first creation. Repeated clicks reopen the same projects and preserve your edits. Existing projects are untouched. These are synthetic examples, not customer validation. The additive `202610160005_demo_projects.sql` migration is required; creation is atomic and restricted to the signed-in owner.

## Sprint 5 release readiness

Development continues on `sprint-5` from merged main. Release deployments now validate public Supabase settings before bundling; missing configuration and secret/service-role keys stop the build. Run `npm run check:release` for the frontend release checks, then `npm run test:integration` against local Supabase for ownership and revision checks. Disposable integration data is now restricted to localhost.

See the [Sprint 5 scope and evidence](docs/planning/sprint-5.md), [pilot session guide](docs/pilot/session-guide.md) and [release checklist](docs/pilot/release-checklist.md). Real participant sessions, manual PDF inspection, candidate mobile/authentication checks and actual dashboard quota review remain open. Sprint 5 is not complete or cleared for general release.

## Current progress

Sprint 1 is merged into `main`. Sprint 2 adds expenses, deposits, milestones, receipt-date calculations and payment-total checks. Sprint 3 adds cash forecasting, funding-gap detection and an interactive balance chart. Sprint 4 is implemented on `sprint-4` from merged `main`, adding payment proposals, constrained deposit suggestions, scenarios, immutable named revisions and printable plans. Google sign-in requires the provider setup described below.

The foundation includes:

- Passwordless email sign-in, session restoration and sign-out.
- A private project list with create, edit, save and reopen.
- Project price, available starting cash, client, dates and GST convention.
- AUD amounts stored as integer cents, with browser and database validation.
- Supabase ownership policies for reading and changing records.
- Responsive phone, tablet and desktop layouts.
- Cloudflare Workers hosting, automated checks and local ownership integration tests.

Customer validation is still pending. Sprint 4 includes scenarios, saved revisions and browser print export; final hosted and PDF layout acceptance remain pending. See [Sprint 3 requirements and verification](docs/planning/sprint-3.md). Forecasts use saved expected receipt dates and daily closing balances; they do not confirm payment or detect intraday shortages.

For Google login, configure the [Google OAuth provider](docs/google-sign-in.md). The hosted provider is enabled, but its Google Cloud redirect URI must pass a real sign-in test before this is considered verified.

## Run locally

Requires Node.js 22.12+ and npm. Docker must be running for the local Supabase backend.

### With a local database

From a fresh checkout:

```sh
npm ci
npx supabase start
node scripts/configure-local.mjs
npm run dev
```

The configuration script creates ignored `.env.local` and `.env.test` files containing only public local configuration. It refuses to overwrite existing files; if you already have configuration, preserve it and update the files manually for the backend you want to use.

Open the URL printed by Vite, usually [http://127.0.0.1:5173](http://127.0.0.1:5173). Request a sign-in link in the app, then open it from the [local email viewer](http://127.0.0.1:54324/). Local emails are captured rather than sent externally.

### With a hosted Supabase project

Copy `.env.example` to `.env.local` if the latter does not already exist. Set:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLIC_PUBLISHABLE_KEY
```

Apply the database migration to a new project and configure its authentication redirects before using it. The existing hosted project already has the initial schema; do not reapply that migration blindly. Run `npm run dev` and restart the server after changing environment variables. Never use a secret or service-role key in frontend configuration.

Keep `.env.test` pointed at a local or dedicated test backend. Without valid app configuration, the interface displays setup instructions.

## Checks

```sh
npm run lint
npm run typecheck
npm test
npm run build
python3 scripts/check_reference_projects.py
# Requires a dedicated test backend configured in ignored .env.test:
npm run test:integration
```

Sprint 4 verification passed 58 unit/component tests, local two-account ownership/revision checks, all four reference forecasts, lint, TypeScript and the production build. Local browser checks confirmed forecast recalculation after saving, reload/reopen and layouts at 390px, 768px and 1440px. Sprint 2 previously passed local two-account project/schedule ownership checks. See [Sprint 4 evidence and limits](docs/planning/sprint-4.md).

GitHub Actions runs the application checks and local Supabase ownership tests. Unit tests do not require containers; ownership integration tests do. Integration checks create disposable test accounts and must not target production.

## Deployment

The live app uses **Cloudflare Workers with static assets** and Supabase Auth/PostgreSQL. `wrangler.jsonc` builds the app and serves `dist` with single-page application routing.

Cloudflare build settings:

| Setting | Value |
| --- | --- |
| Repository | `YapSengKuang/Project_Payment_Planner` |
| Production branch | `main` after the Sprint 1 merge |
| Root directory | `/` |
| Build command | `npm run build` |
| Production deploy command | `npx wrangler deploy` |
| Branch preview command | `npx wrangler preview` |
| Build variables | `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` |

`wrangler.jsonc` includes the required empty `previews` block for Cloudflare branch previews. Static assets and build settings remain at the top level. Preview builds need their own public Supabase build variables; use a test backend for preview data and allow its exact callback URL before testing sign-in.

The initial successful deployment used `sprint-1`. Cloudflare now tracks `main` as its production branch; other branches use preview deployments. This dashboard setting is separate from Git merges.

For a local deployment-package check without publishing:

```sh
npx wrangler deploy --dry-run
```

Supabase's site URL and allowed redirects must include the deployed origin. Custom SMTP is not configured on the hosted project: use a Supabase project team email for initial sign-in testing; general-user email delivery needs a custom email provider. The full hosted sign-in/save/reopen journey remains to be verified.

See [development and deployment instructions](docs/development.md) for migrations, local services, environment configuration and rollback.

## Project documents

- [MVP scope](docs/planning/mvp-scope.md)
- [Validation guide](docs/discovery/validation-guide.md)
- [User journey and design](docs/planning/user-journey.md)
- [Sprint 1 tickets](docs/planning/sprint-1.md)
- [Sprint 2 requirements and verification](docs/planning/sprint-2.md)
- [Sprint 3 requirements and verification](docs/planning/sprint-3.md)
- [Sprint 4 requirements and verification](docs/planning/sprint-4.md)
- [Progress and decisions](docs/planning/status.md)
- [Synthetic reference projects](fixtures/reference-projects.json)

Original documents in `Project Plan/` remain unchanged.

## Version control

Sprint 1 is merged. Current development is on `sprint-4`, based on merged `main`; production continues to deploy from `main`. Sprint 3 has a separate Cloudflare preview; its full hosted authenticated acceptance remains pending.

```sh
git switch sprint-4
git pull --ff-only origin sprint-4
# Make and review your changes.
git add <files>
git commit -m "Describe the change"
git push origin sprint-4
```

Secrets, local configuration and build outputs are ignored. Keep identifiable interview data out of the repository.
