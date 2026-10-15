# User journey and design

Projects → Setup → Expenses → Milestones → Forecast → Export

Sign in before loading private projects. Projects lists owned records and supports create, reopen and edit. Setup captures client, price, dates, currency and starting cash. Explain that starting cash is allocated to this project.

Expenses captures dated project costs. Milestones captures deposit and other receipts, separating completion, invoice and receipt dates. Show the sum of scheduled receipts and the difference from project price. Explain invalid input next to its field and retain entered values.

Forecast shows assumptions, dated cash movements, daily balances, the first shortage and the maximum funding gap. A user adjusts the deposit or milestone schedule, sees the effect and saves a revision. Scenarios compare delayed receipts or increased costs with the baseline. Show any remaining gap and avoid implying that a proposed schedule guarantees receipt.

Export prints the selected schedule version with project details, amounts, dates and assumptions for client discussion.

## Visual direction from the design document

- Font: Didact Gothic, with a sans-serif fallback. Obtain an appropriately licensed font asset during interface implementation.
- Primary purple: `#7E3075`.
- Secondary blue: `#003E83`.
- Accent yellow: `#F2FF26`.
- Background: `#F6F6F6`.

Use readable text contrast and visible focus states. Reserve the yellow for emphasis with dark text. Errors and shortages need text labels as well as colour. Forms should work on narrow screens with explicit labels and keyboard navigation.
