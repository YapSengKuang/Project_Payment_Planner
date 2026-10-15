import { money } from '../lib/project'
import type { Project } from '../lib/project'
import { paymentSummary, totalCents } from '../lib/schedule'
import type { Expense, Milestone } from '../lib/schedule'
export default function ScheduleSummary({ project, expenses, milestones }: { project: Project; expenses: Expense[]; milestones: Milestone[] }) {
  const summary = paymentSummary(project.price_cents, milestones)
  return <section className="schedule-summary" aria-label="Saved schedule totals"><div className="summary-heading"><p className="eyebrow">SAVED SCHEDULE</p><span className={`schedule-badge ${summary.complete ? 'complete' : ''}`} role="status">{summary.complete ? 'Payment schedule complete' : 'Schedule incomplete · Draft saved'}</span></div>
    <dl className="summary-grid"><div><dt>Project price</dt><dd>{money(project.price_cents)}</dd></div><div><dt>Expected client receipts</dt><dd>{money(summary.receipts)}</dd></div><div><dt>Total expenses</dt><dd>{money(totalCents(expenses))}</dd></div><div><dt>{summary.difference < 0 ? 'Overallocated' : 'Still to allocate'}</dt><dd>{money(Math.abs(summary.difference))}</dd></div></dl>
    <p className={summary.complete ? 'summary-message' : 'summary-message mismatch'}>{summary.complete ? 'Client payments match the project price. Review your expense dates before continuing.' : summary.difference < 0 ? `Client payments exceed the project price by ${money(-summary.difference)}. Reduce or remove a payment, or review the project price.` : `Allocate another ${money(summary.difference)} to client payments to match the project price. You can keep saving this schedule as a draft.`}</p>
    <p className="summary-note">Expected receipts are forecasts, not confirmed payments. Open Forecast to review daily balances and funding gaps.</p>
  </section>
}
