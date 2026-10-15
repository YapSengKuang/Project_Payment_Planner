# Sprint 3 cash forecast and funding gaps

## Goal and scope

An owner can review the cash consequences of their saved project schedule: dated receipts and expenses, daily closing balances, first shortage and maximum funding gap. This follows Sprint 3 in the MVP timeline and the cash-gap requirements in project plan v2. Changes are on `sprint-3`, based on the completed Sprint 2 branch. No database migration or additional service is required.

## Implemented features

- Pure TypeScript forecast engine using checked integer cents and date-only calendar values.
- Forecast navigation alongside Setup, Expenses and Milestones; pending schedule saves block navigation.
- Starting cash, expected receipts, expected expenses and closing cash summary, with first shortage date and maximum funding gap.
- Interactive cash balance chart with a zero line, red deficits and a keyboard-accessible date slider exposing exact amounts.
- Chronological timeline with named movements and balances, project boundaries and shortage labels. Small screens use stacked rows. The first 50 dates are shown with a control to reveal further dates; all entries always contribute to calculations.
- Draft, missing-expense and outside-project-date explanations, plus visible calculation assumptions. Invalid or unsafe amounts/dates fail visibly instead of producing a partial forecast.
- Recalculation after saved setup or schedule edits, and reconstruction from saved records on reopening a project.

## Calculation conventions

Starting cash is allocated only to this project and available immediately before the earliest displayed date. All saved expenses and receipts are included, even before project start or after project end. Receipt dates come from the database's generated `expected_receipt_date`, incorporating invoice terms or an explained override. Completion and invoice dates do not themselves create cash movements.

Movements on the same date are netted before evaluating the daily closing balance. No intraday ordering or intraday shortfall is modelled. The first shortage is the earliest negative closing balance; zero is not a shortage. Maximum gap is the absolute value of the lowest negative closing balance after using starting cash, not a sum of deficits. Closing cash follows the final event or project boundary, whichever is later.

Only payment dates and project boundary dates need rows: cash carries forward unchanged on intervening days. The chart uses calendar spacing and step changes. Values follow the project's GST convention without adding unentered taxes, fees or costs. Expected receipts remain forecasts rather than confirmed payments. A complete payment total does not imply a funded project.

## Acceptance and verification

46 unit/component tests pass, including the application's forecast against all four synthetic reference projects. Their fixed expectations are separately checked by `python3 scripts/check_reference_projects.py`:

| Example | First shortage | Maximum gap | Closing cash |
| --- | --- | --- | --- |
| No gap | None | $0 | $3,000 |
| Plan's $2,000 deposit / $3,000 early expense | 5 Nov 2026 | $1,000 | $3,000 |
| Seven-day late receipt | 20 Nov 2026 | $3,000 | $3,000 |
| Same-day movements with starting cash | None | $0 | $4,000 |

Additional tests cover cent precision, earliest versus deepest shortage, unrecovered deficits, empty schedules, reversed input ordering, payments outside project dates, long date ranges, invalid data, unsafe totals, draft warnings, table expansion, recalculation after changed props, keyboard chart interaction and navigation during a pending expense save.

Local browser verification used a disposable account and project against the local Supabase backend, with the real app components and API. A $10,000 project with $2,000 deposit, $3,000 Materials expense on 5 November and $8,000 receipt on 15 November showed a $1,000 maximum gap on 5 November. Saving $1,000 starting cash removed the gap and increased closing cash from $7,000 to $8,000. Reloading and reopening retained that result. Keyboard movement on the chart exposed the exact negative balance. Layouts were inspected at 390px, 768px and 1440px with document width matching viewport width. Lint, TypeScript and production build pass.

The browser example has only $3,000 of costs; the reference examples additionally include a later $4,000 expense. Their different closing totals are intentional. Synthetic examples do not fulfil the pending requirement for independently checked real customer projects. Hosted authenticated acceptance and Cloudflare deployment of Sprint 3 are not yet verified.

## Later work

Sprint 4 retains explainable schedule suggestions, receipt-delay/expense-increase scenario controls, preserved schedule versions and printable export. Sprint 0 customer validation, full hosted Google consent/session/sign-out verification and general-user email delivery configuration remain open.
