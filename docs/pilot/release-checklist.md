# Release candidate checks

Status on 16 October 2026: local automated checks pass; pilot and manual release gates remain open. Record results against a specific commit and URL. Pending means not verified, never a pass.

## Automated checks

Run `npm run check:release` with public Supabase configuration. It runs lint, tests, a configured release build, negative build-configuration checks and independent reference fixtures. Start local Supabase, apply local migrations, then run `npm run test:integration` using the local `.env.test`. That suite refuses hosted backends. CI runs the same underlying checks against disposable local services; a green CI build alone does not authorize release.

## Manual acceptance matrix

| Check | Required evidence | Current Sprint 5 result |
| --- | --- | --- |
| Google authentication | Complete sign-in, restore after reload, sign-out, sign back in on candidate origin | Pending |
| Email authentication | Real allowed recipient receives link; resend/error recovery; custom SMTP for general-user access | Pending |
| Full journey | Create, enter expenses/payments, identify gap, compare, save/reopen, export without assistance | Pending: 0 of 3 to 5 participants observed |
| Mobile / keyboard | 390px phone, 768px tablet, 1440px desktop; keyboard focus visible, labels usable, no page overflow; tables scroll as needed | Pending candidate recheck; Sprint 4 evidence retained |
| PDF export | Actual saved PDF inspected on every page: headings, repeated headers, wrapped long names/reasons, totals, timelines and assumptions; no clipping/blank pages/private account chrome | Pending manual export; native print dialog blocks automated inspection |
| Draft protections | Incomplete totals and unapplied proposals block complete export/version save; failure retains form inputs | Automated coverage passes; manual candidate check pending |
| Access isolation | Anonymous reads/writes denied; another account cannot read/edit/delete project, schedule or revision by ID; account switch clears UI | Local direct API checks pass; hosted dedicated QA evidence pending |
| Concurrency / recovery | Double click sample loader, repeat load, reload, retry failed save; edits survive retry and versions remain immutable | Local integration/component checks pass; candidate check pending |
| Deployment | Exact branch build variables and auth redirect; configured sign-in screen; refresh/callback works; deployed commit matches candidate | Pending Sprint 5 preview configuration |
| Quotas / operations | Dated actual dashboard usage versus plan limits, project active, billing plan understood, recovery/rollback procedure checked | Pending dashboard usage review |

## Deployment and recovery

1. Prefer a dedicated test Supabase project for pilots. Current earlier sprint previews share the hosted backend; frontend branch isolation does not isolate records. Use fictional data until the owner approves a suitable environment.
2. For the new Cloudflare preview, set both public build variables separately and allow its exact origin in Supabase Auth redirects. Keep the production site URL. Wrangler's release build deliberately fails until configuration exists.
3. Verify migrations 001 through 005 are installed. Earlier hosted changes were executed through SQL Editor, so CLI migration history must be reconciled before any CLI push. No Sprint 5 schema migration is required.
4. Record the successful deployment ID, commit and URL. Test sign-in, callback, reload and the complete workflow there. Never use runtime bindings as a substitute for Vite build variables.
5. For frontend rollback, restore the prior successful Cloudflare Worker deployment/version. Re-test auth and reopen. Schema changes need a reviewed forward migration; frontend rollback does not roll back data. Confirm backup/recovery arrangements before accepting real business records.

## Service limits reviewed 16 October 2026

These are published allowances, not observed account usage. Check the actual organization's plan, all projects sharing allowances and current usage in the dashboards before inviting participants.

- Supabase lists Free allowances including 500 MB database per project, 5 GB egress, 50,000 monthly active users and 1 GB file storage. See [official billing and quota documentation](https://supabase.com/docs/guides/platform/billing-on-supabase). This app does not currently use file storage. Verify pausing/activity status and recovery needs separately.
- Default Supabase email delivery is restricted to team addresses and is intended for limited use. Configure and verify [custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp) before promising general-user email access. Do not disable confirmation to make pilot login easier.
- Cloudflare lists free, unlimited static-asset requests, with separate rules for Worker execution and asset limits. See [static asset billing and limitations](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/). Verify actual build usage, asset count, plan and any dynamic execution in the dashboard.

| Review date / owner | Supabase DB / egress / MAU and remaining headroom | Cloudflare build / asset / dynamic usage | Email delivery verified | Action |
| --- | --- | --- | --- | --- |
| Pending | Not measured | Not measured | Pending | Review before pilot |

## Decision record

Release is held until participants complete the journey independently, saved PDFs are readable and no known critical calculation or access issues remain. Record unresolved issues, retest evidence and the owner’s release/refine decision here. Synthetic data and automated tests do not close the pilot gate.
