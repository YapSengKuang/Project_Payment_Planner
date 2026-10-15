# Sprint 5 Pilot and release readiness

Started 16 October 2026 on `sprint-5` from `origin/main` at `3659801`, after the Sprint 4 merge. Status: in progress; not cleared for general release.

## Alignment with the source documents

The MVP timeline calls for observing 3 to 5 users, fixing calculation/usability issues, and checking record isolation, mobile layouts, exports, quotas and deployment. The project plan adds assessment of feedback and free-tier usage before deciding the next direction. The design document retains Didact Gothic and purple `#7E3075`, blue `#003E83`, yellow `#F2FF26`, background `#F6F6F6`.

Source files: `Project Plan/project_payment_planner_mvp_timeline.docx`, `Project Plan/project_payment_planner_project_plan_v2.pdf` (pages 5 to 7), and `Project Plan/Design Document.pdf`. Their descriptions are planning requirements and reference material; historical statements that development has not started are superseded by the repository's implementation history.

## Implemented work

- Release builds validate the Supabase project origin and public key before bundling. Missing configuration stops release deployments, preventing another successful deployment of an unconnected workspace. Secret/service-role keys and insecure remote HTTP origins are rejected. Validation errors never echo keys. Legacy anon keys remain supported. This checks configuration shape, not whether a project/key is live or its schema is installed.
- Wrangler runs `npm run build:release`. Ordinary `npm run build` continues to support an unconfigured local/CI setup screen; supplied invalid configuration is rejected. CI runs negative build checks against missing configuration, secret keys, service-role JWTs and insecure origins.
- Disposable integration tests refuse hosted database URLs before creating clients, accounts or rows. Local tests cover CRUD, record isolation, immutable snapshots and concurrent/idempotent demo creation.
- Pilot task script, observation template, release matrix and operational checklist are recorded in `docs/pilot/`.

## Verification recorded this sprint

65 unit/component tests pass. Lint, TypeScript/release build, four independent forecast fixtures and four negative deployment-build checks pass. Real local Supabase checks pass for projects, expenses, milestones, revisions, sample scenarios, anonymous denial and two-account isolation. Test records are removed; disposable local auth accounts remain until local database reset.

These checks do not prove real-user independence, email delivery, hosted configuration, current usage headroom or PDF pagination. Sprint 4 recorded responsive checks at 390/768/1440px and successful hosted sample loading and revision reopening. Re-run the manual matrix against the chosen Sprint 5 release candidate and record its commit and URL.

## Completion gate

Observe 3 to 5 real participants completing the planning journey. Record completion without assistance, elapsed time, their explanation of the gap and intended payment-term changes. Fix and retest observed critical issues. Confirm owner isolation, mobile use, readable saved PDF, live authentication, current service usage and deployment/rollback settings. Review any remaining issues and decide whether to release, refine or defer. Do not mark this sprint complete based only on synthetic examples or automated checks.

No participants have been recruited or observed by this sprint. No new paid services, email provider, outreach, customer records or telemetry have been created.
