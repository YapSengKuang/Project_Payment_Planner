# Project Payment Planner

A React and TypeScript application for setting up privately saved fixed-price projects. Sprint 1 includes passwordless email sign-in, an owned project list, and project create/edit/reopen with Supabase persistence. Later sprints add expenses, payment milestones and cash forecasting.

## Run locally

Requires Node.js 22.12+ and npm. For a local backend, Docker must be running.

```sh
npm ci
npx supabase start
node scripts/configure-local.mjs
# Creates ignored .env.local and .env.test with public local configuration.
npm run dev
```

Open the URL printed by Vite. Sign-in links appear in the local Supabase email viewer. Without backend configuration the app displays setup instructions. No demo account or browser-only persistence is substituted.

See [development instructions](docs/development.md) for local email sign-in, migration management, integration checks and Cloudflare Pages deployment.

## Checks

```sh
npm run lint
npm run typecheck
npm test
npm run build
python3 scripts/check_reference_projects.py
# With a dedicated test backend configured in ignored .env.test:
npm run test:integration
```

Continuous integration runs application checks and local Supabase ownership checks. Authentication and database tests need the local containers; unit tests do not.

## Planning

- [MVP scope](docs/planning/mvp-scope.md)
- [Validation guide](docs/discovery/validation-guide.md)
- [User journey and design](docs/planning/user-journey.md)
- [Sprint 1 tickets](docs/planning/sprint-1.md)
- [Progress and decisions](docs/planning/status.md)
- [Synthetic reference projects](fixtures/reference-projects.json)

Original documents in `Project Plan/` remain unchanged. Customer validation remains pending.

## Version control

Work is on `sprint-1`. Use `git status`, `git add <files>`, `git commit -m "Describe the change"` and `git push`. Secrets, local configuration and build outputs are ignored. Do not commit identifiable interview data.
