# Project Payment Planner

A project can look profitable on paper and still leave you wondering how to pay for the work before the client pays you.

That’s the problem this project explores. Project Payment Planner helps owners lay out their costs and expected client payments, spot a cash shortage, and try a different payment schedule before agreeing to the work.

[Try the app](https://project-payment-planner.skorsengkuang.workers.dev/) · [Explore the Sprint 4 demo](https://sprint-4-project-payment-planner.skorsengkuang.workers.dev/) · [Current sprint](docs/planning/sprint-5.md)

## Where the idea started

The starting point was a broader question: where could a small financial tool help a small business owner?

We explored five directions: cash-flow scenarios, invoice follow-ups, income allocation, seasonal planning, and project deposits and milestones. The last one gave us a specific moment to design around: an owner preparing a quote and deciding when to ask the client to pay.

A simple example made the problem concrete. Imagine a $10,000 project with $3,000 of materials to buy before the next client payment. A $2,000 deposit leaves a $1,000 hole. Seeing that early gives the owner something useful to discuss with the client.

The early planning drew on EY research about small-business financial needs. That helped frame the problem, but customer interviews and a review of current alternatives are still needed. Australian freelancers and small agencies doing fixed-price work are our starting audience hypothesis.

## Designing the journey

Before building the screens, we mapped the path an owner would take:

**Projects → Setup → Expenses → Milestones → Forecast → Plan & compare → Export**

Each step answers a question. What’s the project worth? What needs paying, and when? When do we expect the client’s money? Where does cash run short? What could we change?

That shaped both the forms and the calculations. Milestone completion, invoicing and receiving money are separate dates. Starting cash means money available for this particular project. The forecast uses expected receipts and shows its assumptions alongside the result.

We also chose a visual direction early: **Didact Gothic**, purple for primary actions, blue for supporting emphasis, small yellow accents, and a light grey background. The aim was a calm workspace with readable forms and clear next steps. On smaller screens, the layout stacks so the same journey works on a phone. Shortages and errors have written explanations as well as colour.

The [design and journey notes](docs/planning/user-journey.md) capture those choices.

## How we built it up

We built the app in small sprints, following the planning journey.

**First, somewhere to keep the work.** Sprint 1 established sign-in, private projects, setup forms and saved data. We chose React and TypeScript for the interface, Supabase for accounts and PostgreSQL, and Cloudflare for hosting. The plan originally named Cloudflare Pages; the connected deployment became a Worker serving static assets.

**Then, the actual schedule.** Sprint 2 added expenses, deposits, milestones and payment terms, plus Google sign-in. Owners could enter a complete schedule and see whether client payments matched the project price. Money is stored in integer cents, with validation in both the interface and database.

**Then, the useful question: when do we run short?** Sprint 3 turned those saved entries into a cash timeline, balance chart, first shortage date and maximum funding gap. We checked the calculations against independently worked examples, including the original $1,000 shortfall.

**Then, room to try another plan.** Sprint 4 added payment adjustments, deposit suggestions, late-receipt and higher-cost scenarios, and original-versus-proposal comparisons. Named revisions preserve the inputs and assumptions, so trying something new doesn’t overwrite an earlier version. Browser print provides a plan for client discussion.

We also added editable demo projects. They make it easier to explore a complete example and an unfinished draft without entering everything from scratch.

**Now, seeing how it holds up.** Sprint 5 focuses on pilot and release readiness. We’ve added deployment configuration checks and safeguards that keep disposable integration data on local databases. The next evidence needs to come from people using the app: can they find the gap, improve a schedule, and produce a readable plan independently?

## What we learned along the way

A few details turned out to matter a lot:

- **Payment timing needs its own model.** Finishing a milestone doesn’t mean the money has arrived. Invoice terms and explained receipt-date overrides belong in the schedule.
- **A suggestion needs an explanation.** Moving money into an earlier deposit can help, but a deposit cap may leave a remaining shortage. The app shows that residual gap.
- **Versions need to preserve context.** A saved proposal keeps its original costs, payment schedule and scenario settings, even when the working project changes later.
- **A successful deployment needs a working configuration.** An earlier preview built successfully without Supabase settings and displayed a setup screen. Release builds now stop when those settings are missing or unsuitable for the browser.
- **Tests and demo data answer only part of the question.** They help verify behaviour. Observing real owners will tell us whether the workflow makes sense to them.

## Have a look around

Sign in and choose **Load demo projects** from the project list. You’ll get two private, editable fictional projects:

- **Website redesign:** expenses, a deposit, two milestones and a receipt override. Its original forecast has a $2,500 maximum gap. Four saved revisions show the original terms, a larger deposit, a capped deposit, and late payments with higher costs.
- **Incomplete draft:** starting cash and a partially allocated payment schedule show the draft warnings and what still needs entering.

Dates start from your local calendar day when first created. Loading the examples again reopens them and preserves your edits.

## Where things stand

Sprints 1–4 are merged into `main`. Current development is on **`sprint-5`**. The app supports AUD, a consistent GST convention per project, manual schedule entry, forecasts, proposals, saved revisions and browser print.

The current checks include 65 unit/component tests, independent reference forecasts, release configuration checks and local database tests for ownership and revisions. Forecasts use daily closing balances; they don’t track confirmed payments or shortages within a day.

The pilot is still ahead: 3–5 real-user sessions, a visual check of saved PDFs, candidate mobile and authentication checks, and a review of actual service usage. General-user email sign-in also needs a configured email provider. The [release checklist](docs/pilot/release-checklist.md) keeps those open items visible.

Bank connections, payment processing, reminders, client portals and combined forecasts across projects remain outside this MVP.

## Run it locally

You’ll need Node.js 22.12+, npm and Docker for local Supabase.

```sh
npm ci
npx supabase start
node scripts/configure-local.mjs
npm run dev
```

The configuration script creates ignored `.env.local` and `.env.test` files with public local settings and refuses to overwrite existing files. Open the address Vite prints, usually [127.0.0.1:5173](http://127.0.0.1:5173). Local sign-in emails appear in the [email viewer](http://127.0.0.1:54324/).

For hosted Supabase, migrations, Google sign-in and Cloudflare configuration, follow the [development guide](docs/development.md) and [Google sign-in guide](docs/google-sign-in.md). Frontend configuration must use a public publishable or legacy anon key.

```sh
# Frontend checks; no containers needed
npm run lint
npm test
npm run build

# Configured release checks
npm run check:release

# Database checks; local Supabase and .env.test required
npm run test:integration
```

Integration tests create disposable local accounts and records, remove their test projects, and refuse hosted database URLs. Auth accounts remain until the local database is reset.

## Follow the decisions

The original planning files live in [Project Plan](Project%20Plan/). The working notes show how those ideas became the app:

- [MVP scope and boundaries](docs/planning/mvp-scope.md)
- [Customer discovery guide](docs/discovery/validation-guide.md)
- [User journey and visual direction](docs/planning/user-journey.md)
- [Progress and decisions across the sprints](docs/planning/status.md)
- [Sprint 5 plan](docs/planning/sprint-5.md) and [pilot session guide](docs/pilot/session-guide.md)
- [Reference calculation examples](fixtures/reference-projects.json)

This is still a project in progress. The next chapter is finding out what real owners understand, struggle with, and would change before using it for a quote.
