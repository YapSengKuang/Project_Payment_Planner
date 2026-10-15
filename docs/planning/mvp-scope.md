# MVP scope

## Outcome and audience

Enable an owner to create a project, enter expenses and expected client receipts, discover a funding gap, revise the payment schedule, and print a plan for discussion. Starting hypothesis: Australian freelancers and small agencies delivering fixed-price projects. This segment and the repeated need require customer validation.

## Included in the pilot

- Accounts and private saved projects with client name, project name, price, start/end dates, currency and available starting cash.
- One currency per project; money stored as integer minor units. Initial reference examples use AUD cents.
- Manual expense entry with amount, description and expected payment date.
- Deposit and milestone entry with completion date, invoice date, payment terms and expected receipt date. Scheduled receipts must total the contract price.
- Running cash balance, first shortage date and maximum funding gap, with visible assumptions.
- Manual deposit/milestone adjustments with explainable effects and configured deposit constraints; display any residual gap.
- Delayed-receipt and increased-expense scenarios, saved schedule versions, and browser print to PDF.
- Ownership enforced in database policies, independently of UI filtering.

## Excluded

Bank connections, payment processing, automated reminders, AI explanations, client portals, industry templates, actual-payment tracking, combined forecasts across projects and automated legal or tax advice.

## Proposed conventions requiring review

Starting cash means money available for this project. Examples use consistently GST-inclusive amounts; do not mix tax bases. Use date-only calendar dates; payment terms are calendar days from invoice date. A manual expected receipt override must retain its reason. Invoice date defaults to completion date but remains a separate field.

Examples group same-day transactions into a daily closing balance: receipts and expenses on that date offset one another. Intraday liquidity is outside this convention and must be made visible to users. Negative opening cash is disallowed for the initial scope. Never imply an expected receipt is confirmed.

Save edits to a working draft. Creating a named revision snapshots the schedule and assumptions without overwriting earlier versions. Revisit this rule in interviews. Currency and tax basis become fixed once schedule entries exist unless an explicit migration is implemented.

## Release evidence

An owner independently enters a schedule, identifies the correct gap and compares a revision, then exports a readable plan. Reference calculations must match independently checked examples. Cross-account access must fail at database level. Numerical usability targets will be set after initial research.
