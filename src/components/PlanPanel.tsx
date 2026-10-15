import { useState } from 'react'
import { comparePlan, initialSettings, type PlanBaseline, type PlanSettings } from '../lib/plan'
import { displayDate, money } from '../lib/project'
import { paymentSummary } from '../lib/schedule'
import ForecastChart from './ForecastChart'

export default function PlanPanel({ baseline }: { baseline: PlanBaseline }) {
  const [settings, setSettings] = useState<PlanSettings>(initialSettings)
  const [delay, setDelay] = useState('0')
  const [increase, setIncrease] = useState('0')
  const [error, setError] = useState('')
  const [comparison, setComparison] = useState(() => {
    try { return comparePlan(baseline, initialSettings()) } catch { return null }
  })
  const dirty = delay !== String(settings.receiptDelayDays) || increase !== String(settings.expenseIncreasePercent)
  const complete = paymentSummary(baseline.project.price_cents, baseline.milestones).complete
  function update(event: React.FormEvent) {
    event.preventDefault()
    try {
      if (!/^\d{1,3}$/.test(delay) || !/^\d{1,3}$/.test(increase)) throw new Error('Enter whole numbers for both scenario controls.')
      const next = { receiptDelayDays: Number(delay), expenseIncreasePercent: Number(increase) }
      setComparison(comparePlan(baseline, next)); setSettings(next); setDelay(String(next.receiptDelayDays)); setIncrease(String(next.expenseIncreasePercent)); setError('')
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not calculate this scenario.') }
  }
  return <section className="panel plan-panel" aria-label="Plan and compare">
    <p className="eyebrow">EXPLORE BEFORE AGREEING</p><h2>Plan and compare</h2>
    <p className="muted">Explore changes against the saved schedule. Your working project is unchanged.</p>
    {!complete && <p className="notice">This schedule is incomplete. Match client payments to the project price before relying on a comparison.</p>}
    {!baseline.expenses.length && <p className="notice">No expenses entered. Funding needs may be understated.</p>}
    <form onSubmit={update} className="scenario-form" noValidate>
      <div className="form-grid"><div className="field"><label htmlFor="receipt-delay">Delay all receipts (calendar days)</label><input id="receipt-delay" inputMode="numeric" value={delay} onChange={event => setDelay(event.target.value)}/><small>0–365 days, including deposits and overridden receipts. Completion and invoice dates stay as recorded.</small></div>
        <div className="field"><label htmlFor="expense-increase">Increase all expenses (%)</label><input id="expense-increase" inputMode="numeric" value={increase} onChange={event => setIncrease(event.target.value)}/><small>0–100%. Each expense rounds to the nearest cent, with half cents rounded up.</small></div></div>
      {error && <p className="notice error" role="alert">{error}</p>}
      <div className="form-actions"><button type="submit" className="button">Update comparison</button></div>
    </form>
    {dirty && <p className="notice" role="status">Inputs changed. Update comparison to see their effect. Results below use the last applied settings.</p>}
    {comparison ? <>
      <h3>Original versus proposal</h3><p className="muted">Applied scenario: receipts delayed {settings.receiptDelayDays} days; expenses increased {settings.expenseIncreasePercent}%.</p>
      <table className="comparison-table"><caption className="sr-only">Original and proposed cash forecast</caption><thead><tr><th scope="col">Measure</th><th scope="col">Original</th><th scope="col">Proposal</th></tr></thead><tbody>
        <tr><th scope="row">First shortage</th><td>{comparison.original.firstShortageDate ? displayDate(comparison.original.firstShortageDate) : 'None'}</td><td>{comparison.proposed.firstShortageDate ? displayDate(comparison.proposed.firstShortageDate) : 'None'}</td></tr>
        <tr><th scope="row">Maximum funding gap</th><td>{money(comparison.original.maximumGapCents)}</td><td>{money(comparison.proposed.maximumGapCents)}</td></tr>
        <tr><th scope="row">Closing cash</th><td>{money(comparison.original.closingCashCents)}</td><td>{money(comparison.proposed.closingCashCents)}</td></tr>
      </tbody></table>
      <p className="notice">{comparison.proposed.maximumGapCents > 0 ? `Remaining funding gap: ${money(comparison.proposed.maximumGapCents)}. This proposal still needs funding or further schedule changes.` : 'No daily closing funding gap in this proposal. Expected receipts are not guaranteed.'}</p>
      <ForecastChart forecast={comparison.proposed}/>
      <p className="summary-note">Starting cash is allocated to this project before the earliest date. Same-day movements are netted at daily close; intraday shortages are not shown. GST {baseline.project.tax_basis}; no unentered taxes or costs are added.</p>
    </> : <p className="notice error" role="alert">The saved schedule cannot be calculated safely. Review its amounts and dates.</p>}
  </section>
}
