# Project Payment Planner

Plan fixed-price projects before agreeing to client payment terms. The app currently supports email sign-in and private project setup; upcoming sprints add expenses, payment milestones and cash forecasting.

**Live app:** [Project Payment Planner](https://project-payment-planner.skorsengkuang.workers.dev/)

## Current progress

Sprint 1 has been merged into `main` and includes:

- Passwordless email sign-in, session restoration and sign-out.
- A private project list with create, edit, save and reopen.
- Project price, available starting cash, client, dates and GST convention.
- AUD amounts stored as integer cents, with browser and database validation.
- Supabase ownership policies for reading and changing records.
- Responsive phone, tablet and desktop layouts.
- Cloudflare Workers hosting, automated checks and local ownership integration tests.

Customer validation is still pending. Expenses, payment milestones, cash gap detection, scenarios, schedule versions and printable exports are not implemented yet.

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

The last recorded verification passed 19 unit/component tests, local two-account ownership checks and the production build. Responsive layouts were reviewed at 390px, 768px and 1440px. See [verification evidence and limits](docs/sprint-1-verification.md).

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

The initial successful deployment used `sprint-1`. If Cloudflare is still tracking that branch, change its production branch to `main` so future main-branch commits deploy. This is a dashboard setting, separate from the Git merge.

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
- [Progress and decisions](docs/planning/status.md)
- [Synthetic reference projects](fixtures/reference-projects.json)

Original documents in `Project Plan/` remain unchanged.

## Version control

Sprint 1 is merged. Current work continues on `main`.

```sh
git switch main
git pull --ff-only origin main
# Make and review your changes.
git add <files>
git commit -m "Describe the change"
git push origin main
```

Secrets, local configuration and build outputs are ignored. Keep identifiable interview data out of the repository.
