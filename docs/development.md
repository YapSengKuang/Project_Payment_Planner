# Development and deployment

## Local app

Use Node.js 22.12 or later and npm. Run `npm ci`, copy `.env.example` to `.env.local`, configure the public Supabase URL/key, then run `npm run dev`. Vite serves on http://127.0.0.1:5173 (or the next free port). Restart Vite after environment changes. Without valid configuration the app shows setup instructions and makes no database requests.

Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`. `npm run preview` serves the production build. The font is bundled from `@fontsource/didact-gothic`, including its upstream open font licence in that package; no external font request is needed.

## Local Supabase

Docker must be running. From this checkout run `npx supabase start`. The tracked `supabase/config.toml` isolates the local project and applies `supabase/migrations/` on first start. Use `npx supabase status` for API URL, public key, Studio and local email viewer addresses. Run `node scripts/configure-local.mjs` to copy only the public API URL/key into ignored `.env.local` and `.env.test` (it refuses to overwrite existing files). For manual configuration, put only the API URL and public anon/publishable key into `.env.local`. Never put service-role or secret keys into a VITE variable.

Sign in with an email address; open its magic link in the local email viewer. Local emails are not sent externally. The browser link must open on the same origin used to start sign-in. For a database reset use `npx supabase db reset` only for this disposable local backend; it destroys local records. Stop local services with `npx supabase stop` when finished.

For isolation checks, create an ignored `.env.test` containing `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` for this local or dedicated test backend, then run `npm run test:integration`. Tests create two disposable Auth accounts, exercise direct database operations and remove the test project. Auth accounts remain until local reset. Never point these tests at production. Email confirmation must be disabled on the dedicated test backend; the production app uses email links independently of that test setting.

## Hosted Supabase

1. Create a Supabase project. Copy its public URL and publishable key into local environment configuration.
2. Link using `npx supabase login` and `npx supabase link --project-ref YOUR_PROJECT_REF`. Review migrations, then run `npx supabase db push` against the intended project. Alternatively run the included migration in its SQL editor once.
3. Enable the email authentication provider and signups. Configure the site URL and allowed redirect URLs for the exact local and deployed origins. Keep email confirmation enabled for hosted users. Configure a production email delivery provider before relying on real email delivery.
4. Test the magic link, resend/expired link flow, session restore, sign-out, and two-account record isolation on a dedicated test project.

The app uses passwordless email links; there is no password reset flow. Requesting a fresh link recovers access. Email link failures show a retry path. Records are cleared from the rendered workspace when accounts change or sign out. A database migration enforces ownership on select/insert/update/delete, blocks owner reassignment, and validates money and dates independently of the browser.

## Connected Cloudflare Worker

The connected Cloudflare project is a Worker named `project-payment-planner`. Its first failed build used `main` before application code was merged. Sprint 1 is now merged, and Cloudflare tracks `main` for production.

Build command: `npm run build`. Deploy command: `npx wrangler deploy`. Root directory: `/`. Set the two public `VITE_SUPABASE_*` values in **Builds → Variables and secrets**, not runtime variables. `.node-version` selects Node 22. Wrangler also runs the production build so direct CLI deployments work; the dashboard build may run it twice harmlessly.

Branch previews run `npx wrangler preview`; the required `previews: {}` configuration enables this for the static app. It does not replace the production command `npx wrangler deploy`. Configure preview build variables separately, preferably against a test Supabase backend, and allow exact preview callback URLs there. Frontend Vite variables are compiled into the assets; Worker runtime bindings do not configure them.

Each newly created Worker Preview needs its own build variables. The Sprint 3 preview was initially deployed without them and displayed “Connect your workspace” despite a successful build and HTTP 200 response. For every new sprint preview, select that preview in Cloudflare, open Settings → Builds → Variables and secrets, and set both `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Save, verify the settings persist after refresh, and retry its build. Add that exact preview origin to Supabase Authentication → URL Configuration → Redirect URLs. Keep the existing production site URL. Verify the deployed page renders the sign-in methods rather than setup instructions; a successful build or HTTP response alone is insufficient acceptance evidence.

The committed `wrangler.jsonc` serves `dist` as static assets with SPA routing. Verify the package without publishing using `npx wrangler deploy --dry-run`. The hosted project schema was applied using the Supabase SQL editor as a single transaction; retain the versioned SQL migration as the source of truth. CLI migration history is not automatically populated by a SQL editor execution: do not reapply this migration blindly when first linking the CLI.

Hosted environment is stored in ignored `.env.local`. The previous local public configuration is preserved in ignored `.env.local-backend`; `.env.test` still targets only the local test backend. Do not point the integration test at the hosted project.

Production address: `https://project-payment-planner.skorsengkuang.workers.dev`. Add this exact origin to Supabase Auth URL configuration before testing hosted sign-in. Hosted email needs team-member addresses with Supabase's default mail provider, or a custom SMTP provider for other users.

## Alternative Cloudflare Pages setup

Create a Pages project connected to this GitHub repository. Use `npm run build`, output directory `dist`, and Node.js 22. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in preview and production build environments. These are public browser configuration. Use `main` for production and `sprint-1` for branch previews. No separate application server or Cloudflare secret is required by this frontend.

Add each preview origin and the production origin to Supabase Auth's allowed redirects. Cloudflare Pages serves the SPA fallback when no top-level 404 page exists; verify a direct reload as well as sign-in callback handling. `public/_headers` provides baseline response headers.

Record the preview URL and deployed Git revision after a successful build. Verify sign-in, create, edit, reload, reopen, sign-out, narrow layouts, keyboard focus and record isolation. Check current Supabase/Cloudflare quotas before pilot release.

To roll back the frontend, use the prior successful Pages deployment. Database changes require a separately reviewed forward migration; rolling back frontend code does not undo the database. The initial migration adds only the project table, policies and metadata trigger.

## Scope

Sprint 1 implements project setup only. Expenses, payment milestones, forecast, scenarios and export remain later sprint work. AUD is the only enabled currency. GST-inclusive is the default and can be changed explicitly per project. Discovery evidence remains pending; these are provisional product conventions, not customer validation results.
