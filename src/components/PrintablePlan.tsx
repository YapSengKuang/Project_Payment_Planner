import { displayDate, money } from '../lib/project'
import type { PlanBaseline, PlanSettings, comparePlan } from '../lib/plan'

export default function PrintablePlan({ baseline, settings, comparison, sourceLabel, saved, ready }: {
  baseline: PlanBaseline; settings: PlanSettings; comparison: ReturnType<typeof comparePlan>; sourceLabel: string; saved: boolean; ready: boolean
}) {
  if (!ready) return <article className="print-plan" aria-label="Printable payment plan"><h1>Payment plan unavailable</h1><p>Complete the client payment total and apply all proposal inputs with Update comparison before printing.</p></article>
  const { project } = baseline
  const dates = [...new Set([...comparison.original.days, ...comparison.proposed.days].map(day => day.date))].sort()
  const original = new Map(comparison.original.days.map(day => [day.date, day.balanceCents]))
  const proposed = new Map(comparison.proposed.days.map(day => [day.date, day.balanceCents]))
  let originalCash = project.starting_cash_cents, proposedCash = project.starting_cash_cents
  const timeline = []
  for (const date of dates) {
    originalCash = original.get(date) ?? originalCash
    proposedCash = proposed.get(date) ?? proposedCash
    timeline.push({ date, originalCash, proposedCash })
  }
  return <article className="print-plan" aria-label="Printable payment plan">
    <header><p className="eyebrow">PROJECT PAYMENT PLANNER · FOR DISCUSSION</p><h1>Payment plan</h1><h2>{project.name}</h2><p>Client: {project.client_name}</p><p>{saved ? 'Preserved revision' : 'Unsaved proposal'} · Source: {sourceLabel}</p><p>Prepared {new Date().toLocaleString('en-AU')}</p></header>
    <dl className="print-facts"><div><dt>Project price</dt><dd>{money(project.price_cents)} AUD</dd></div><div><dt>Starting cash allocated</dt><dd>{money(project.starting_cash_cents)}</dd></div><div><dt>Project dates</dt><dd>{displayDate(project.start_date)} – {displayDate(project.end_date)}</dd></div><div><dt>Tax convention</dt><dd>GST {project.tax_basis}</dd></div></dl>
    <h2>Funding comparison</h2><table><thead><tr><th scope="col">Measure</th><th scope="col">Original</th><th scope="col">Proposal</th></tr></thead><tbody>
      <tr><th scope="row">First shortage</th><td>{comparison.original.firstShortageDate ? displayDate(comparison.original.firstShortageDate) : 'None'}</td><td>{comparison.proposed.firstShortageDate ? displayDate(comparison.proposed.firstShortageDate) : 'None'}</td></tr>
      <tr><th scope="row">Maximum funding gap</th><td>{money(comparison.original.maximumGapCents)}</td><td>{money(comparison.proposed.maximumGapCents)}</td></tr>
      <tr><th scope="row">Closing cash</th><td>{money(comparison.original.closingCashCents)}</td><td>{money(comparison.proposed.closingCashCents)}</td></tr>
      <tr><th scope="row">Expected receipts</th><td>{money(comparison.original.receiptsCents)}</td><td>{money(comparison.proposed.receiptsCents)}</td></tr>
      <tr><th scope="row">Expected expenses</th><td>{money(comparison.original.expensesCents)}</td><td>{money(comparison.proposed.expensesCents)}</td></tr>
    </tbody></table>
    <p>{comparison.proposed.maximumGapCents ? `The proposal still requires up to ${money(comparison.proposed.maximumGapCents)} of additional funding under these assumptions.` : 'The proposal has no daily closing funding gap under these assumptions.'}</p>
    {!baseline.expenses.length && <p><strong>No expenses were entered. Funding needs may be understated.</strong></p>}
    <h2>Payment schedule comparison</h2><table><thead><tr><th scope="col">Client payment and original invoice terms</th><th scope="col">Original amount / expected receipt</th><th scope="col">Proposed amount / expected receipt</th><th scope="col">Reason for adjustment</th></tr></thead><tbody>
      {baseline.milestones.map(row => {
        const next = comparison.milestones.find(item => item.id === row.id)!
        const change = settings.changes.find(item => item.id === row.id)
        return <tr key={row.id}><th scope="row">{row.name} · {row.kind}<small>Completion/deposit: {displayDate(row.completion_date)}<br/>Invoice: {displayDate(row.invoice_date)} · {row.payment_terms_days} calendar days</small>{row.receipt_override_date && <small>Original receipt override: {row.receipt_override_reason}</small>}</th><td>{money(row.amount_cents)}<small>{displayDate(row.expected_receipt_date)}</small></td><td>{money(next.amount_cents)}<small>{displayDate(next.expected_receipt_date)}</small></td><td>{change?.reason || 'No manual adjustment'}{settings.receiptDelayDays > 0 && <small>Plus {settings.receiptDelayDays}-day receipt-delay scenario.</small>}</td></tr>
      })}
    </tbody></table>
    <h2>Expected expenses</h2><table><thead><tr><th scope="col">Expense</th><th scope="col">Expected payment</th><th scope="col">Original amount</th><th scope="col">Scenario amount</th></tr></thead><tbody>{baseline.expenses.map(row => <tr key={row.id}><th scope="row">{row.description}</th><td>{displayDate(row.payment_date)}</td><td>{money(row.amount_cents)}</td><td>{money(comparison.expenses.find(item => item.id === row.id)!.amount_cents)}</td></tr>)}</tbody></table>
    <h2>Cash timeline</h2><p>Payment dates and project boundaries. Unchanged balances carry forward between dates.</p><table><thead><tr><th scope="col">Date</th><th scope="col">Original closing cash</th><th scope="col">Proposal closing cash</th></tr></thead><tbody>{timeline.map(row => <tr key={row.date}><th scope="row">{displayDate(row.date)}</th><td>{money(row.originalCash)}{row.originalCash < 0 ? ' · Shortage' : ''}</td><td>{money(row.proposedCash)}{row.proposedCash < 0 ? ' · Shortage' : ''}</td></tr>)}</tbody></table>
    <h2>Assumptions and proposal limits</h2><ul>
      <li>Scenario: all expected receipts delayed {settings.receiptDelayDays} calendar days, including deposits and overrides; all expenses increased {settings.expenseIncreasePercent}%, rounded half up to whole cents per expense.</li>
      <li>Maximum total deposits configured for this proposal: {money(settings.depositCapCents)}. This is a planning constraint supplied by the owner.</li>
      <li>AUD only, GST {project.tax_basis}; no additional taxes, fees or unentered costs are included.</li>
      <li>Starting cash is allocated solely to this project before the earliest date. Receipts and expenses on the same day are netted at daily close. Intraday shortages are not modelled.</li>
      <li>All saved payment dates are included, even outside project dates. Expected receipts are not confirmed payments. Completion and invoicing do not mean cash has arrived.</li>
      <li>Proposed receipt dates do not amend the recorded invoice terms. This plan is for discussion and does not confirm client agreement or guarantee available cash.</li>
    </ul>
  </article>
}
