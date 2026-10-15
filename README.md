# Project Payment Planner

Help owners of fixed-price projects identify cash shortages before agreeing to deposits and milestone payments.

## Current status

Sprint 0 preparation is complete. Customer validation is pending. No application or hosted services have been created yet.

Start with [MVP scope](docs/planning/mvp-scope.md), then use the [validation guide](docs/discovery/validation-guide.md). Record evidence before treating the proposed audience or scope as confirmed.

- [User journey and design](docs/planning/user-journey.md)
- [Reference projects](fixtures/reference-projects.json)
- [Sprint 1 tickets](docs/planning/sprint-1.md)
- [Progress and decisions](docs/planning/status.md)
- Original documents: `Project Plan/` (retained unchanged; v2 plan and MVP timeline take precedence over v1).

## Check reference calculations

Run `python3 scripts/check_reference_projects.py`. This uses the Python standard library and checks the discovery examples independently of any future application engine.

## Planned application stack

React, TypeScript, Vite, Tailwind CSS, Supabase Auth/PostgreSQL with row-level security, Cloudflare Pages, and Vitest. Implementation begins in Sprint 1 after discovery decisions are reviewed.

## Save changes

This folder is a local Git repository. Use `git status`, `git add <files>`, and `git commit -m "Describe the change"`. A remote backup is not configured; a local commit does not protect against loss of this computer. Do not commit secrets or identifiable interview data.
