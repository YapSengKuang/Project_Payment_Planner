# Sprint 1 verification

Verified locally on 15 October 2026, on branch `sprint-1`.

## Automated checks

- ESLint and TypeScript checks.
- Vitest: 19 passing tests covering exact cent conversion, invalid money and dates, required inputs, failed-save retention and retry, email-link request failure/retry, restored sessions, account switching, stale-request isolation, sign-out and list retry.
- Production build with Vite.
- Four independent discovery reference calculations, including the $1,000 gap.
- Dedicated local Supabase migrations applied successfully on first start.
- Direct API integration test using two real local Supabase Auth accounts: owner create/read/update/delete, reload-equivalent reads, rejection of invalid database values, denial of cross-owner read/update/delete/insert, rejection of owner reassignment and denial of anonymous access.
- Local Vite server returned HTTP 200.

## Browser observations

Using the in-app browser and local Supabase Mailpit email viewer:

1. Requested a sign-in link for disposable `pilot@example.com` and used the locally captured email to authenticate. No external email was sent.
2. Created Website redesign for Example Studio at $10,000.29 with $500 starting cash and dates 1–30 November 2026.
3. Reloaded, restored the authenticated session and reopened the saved project. Price, cash and dates were retained.
4. Changed its name to Website redesign · revised, saved, and reloaded to confirm the revision persisted.
5. Signed out and confirmed private records disappeared and the email sign-in form returned.

The disposable project remains available when signing into that local pilot account again. Test integration projects are removed by the script; test Auth accounts remain in the local database until reset.

## Limits and remaining checks

The in-app browser displayed a 615px viewport with no horizontal overflow in the observed list. A requested 390px viewport override did not change the actual width, so phone-size and wide desktop visual verification remain pending. Responsive styles are implemented, but this is not evidence that those breakpoints passed review. Native date entry worked with the browser's native controls; the automation locator's date-fill method did not update the controlled inputs, so the check used native date entry instead.

Expired-link messaging is implemented; live token expiry was not waited out. Hosted email delivery, Supabase configuration, Cloudflare preview deployment and hosted redirects have not been verified. No cloud credentials or cloud resources have been created.

## Local test handoff

- Application: http://127.0.0.1:5173/
- Local email viewer: http://127.0.0.1:54324/
- Local Supabase Studio: http://127.0.0.1:54323/

Request a link with any test email in the app, then open its sign-in link from the local email viewer. Use `pilot@example.com` to reopen the saved browser test project. These addresses and accounts are local development only.


## Hosted deployment follow-up

On 15 October 2026, Cloudflare deployed application revision `b431419` successfully from `sprint-1`. Its existing project is a Worker with static assets, not a Pages project. Original failures came from building `main` (planning files only) with no build step or static asset configuration. Build variables, branch and Wrangler configuration are now set. The live root returned HTTP 200 and displayed the configured sign-in form.

The Supabase migration was applied transactionally in the hosted SQL editor. Site URL and exact allowed redirects were set to the hosted origin plus the two localhost origins. A read-only anonymous REST request to `projects` returned HTTP 401 / permission denied; no anonymous table grants were added. The SQL editor does not record CLI migration history automatically; reconcile that history before a future CLI migration push.

Chrome responsive checks supersede the earlier in-app browser limit: inspected phone sign-in/list/form at 390px, form at 768px and form at 1440px. Measured widths were respectively 390/390, 768/768 and 1440/1440 for viewport/document, with no horizontal overflow. Phone/tablet forms stack; desktop uses two columns. Existing local project values were used read-only, with edits cancelled. The local hosted environment configuration was restored after these checks.

The 19 tests, lint, TypeScript and Wrangler dry-run build passed after the responsive changes. Hosted sign-in/save/reopen was not exercised with a real email inbox. Custom SMTP is not configured, so real email testing should use a Supabase project team address until a sender is set up.
