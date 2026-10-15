import { useState } from 'react'
import { comparePlan, initialSettings, planValues, settingsFromValues, suggestDeposit, type PlanBaseline, type PlanSettings } from '../lib/plan'
import { displayDate, money } from '../lib/project'
import { paymentSummary } from '../lib/schedule'
import ForecastChart from './ForecastChart'
import PrintablePlan from './PrintablePlan'

type Props = { disabled?: boolean; baseline: PlanBaseline; savedSettings?: PlanSettings; sourceLabel?: string; onSaveRevision?: (name: string, settings: PlanSettings) => Promise<void>; onBusyChange?: (busy: boolean) => void }
export default function PlanPanel({ baseline, savedSettings, sourceLabel = 'Current saved working schedule', onSaveRevision, onBusyChange, disabled = false }: Props) {
  const [settings, setSettings] = useState<PlanSettings>(() => savedSettings ?? initialSettings(baseline.project.price_cents))
  const [values, setValues] = useState(() => planValues(baseline, savedSettings ?? initialSettings(baseline.project.price_cents)))
  const [revisionName, setRevisionName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const working = saving || disabled
  const [explanation, setExplanation] = useState('')
  const [error, setError] = useState('')
  const [comparison, setComparison] = useState(() => {
    try { return comparePlan(baseline, savedSettings ?? initialSettings(baseline.project.price_cents)) } catch { return null }
  })
  const dirty = JSON.stringify(values) !== JSON.stringify(planValues(baseline, settings))
  const complete = paymentSummary(baseline.project.price_cents, baseline.milestones).complete
  function update(event: React.FormEvent) {
    event.preventDefault()
    try {
      const next = settingsFromValues(baseline, values)
      setComparison(comparePlan(baseline, next)); setSettings(next); setValues(planValues(baseline, next)); setExplanation(''); setError('')
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not calculate this scenario.') }
  }
  function previewSuggestion() {
    try {
      const suggestion = suggestDeposit(baseline, settings)
      setComparison(comparePlan(baseline, suggestion.settings)); setSettings(suggestion.settings)
      setValues(planValues(baseline, suggestion.settings)); setExplanation(suggestion.explanation); setError('')
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not suggest a deposit change.') }
  }
  async function save() {
    if (!revisionName.trim() || revisionName.trim().length > 160) { setSaveError('Enter a revision name of 1 to 160 characters.'); return }
    if (!onSaveRevision || dirty || !complete || !comparison) return
    setSaving(true); onBusyChange?.(true); setSaveError('')
    try { await onSaveRevision(revisionName.trim(), settings) }
    catch (cause) { setSaveError(`Revision not saved. ${cause instanceof Error ? cause.message : 'Check your connection and retry.'} Your proposal inputs are retained.`) }
    finally { setSaving(false); onBusyChange?.(false) }
  }
  return <section className="panel plan-panel" aria-label="Plan and compare">
    <p className="eyebrow">EXPLORE BEFORE AGREEING</p><h2>Plan and compare</h2>
    <p className="muted">Explore changes against the saved schedule. Your working project is unchanged.</p>
    <p className="summary-note">Source: {sourceLabel}. Save a named revision to preserve a proposal before leaving this section.</p>
    {!complete && <p className="notice">This schedule is incomplete. Match client payments to the project price before relying on a comparison.</p>}
    {!baseline.expenses.length && <p className="notice">No expenses entered. Funding needs may be understated.</p>}
    <form onSubmit={update} className="scenario-form" noValidate><fieldset disabled={working}>
      <div className="form-grid"><div className="field"><label htmlFor="receipt-delay">Delay all receipts (calendar days)</label><input id="receipt-delay" inputMode="numeric" value={values.delay} onChange={event => setValues({ ...values, delay: event.target.value })}/><small>0–365 days, including deposits and overridden receipts. Completion and invoice dates stay as recorded.</small></div>
        <div className="field"><label htmlFor="expense-increase">Increase all expenses (%)</label><input id="expense-increase" inputMode="numeric" value={values.increase} onChange={event => setValues({ ...values, increase: event.target.value })}/><small>0–100%. Each expense rounds to the nearest cent, with half cents rounded up.</small></div></div>
      <div className="field deposit-limit"><label htmlFor="deposit-cap">Maximum total deposits (AUD)</label><input id="deposit-cap" inputMode="decimal" value={values.cap} onChange={event => setValues({ ...values, cap: event.target.value })}/><small>Enter the limit agreed for this project, from zero to the project price. This is your planning constraint; no legal maximum is assumed.</small></div>
      <h3>Proposed client payments</h3><p className="muted">Keep the total unchanged. Changing a receipt date is a planning proposal and does not change the original invoice or completion date. Scenario delays apply after these dates.</p>
      {values.payments.map((payment, index) => {
        const original = baseline.milestones.find(row => row.id === payment.id)!
        function edit(field: 'amount' | 'date' | 'reason', value: string) {
          setValues({ ...values, payments: values.payments.map((row, i) => i === index ? { ...row, [field]: value } : row) })
        }
        return <fieldset key={payment.id} className="proposal-payment"><legend>{original.name} · {original.kind}</legend>
          <p className="muted">Original: {money(original.amount_cents)} expected {displayDate(original.expected_receipt_date)}</p>
          <div className="form-grid"><div className="field"><label htmlFor={`amount-${payment.id}`}>{original.name} proposed amount (AUD)</label><input id={`amount-${payment.id}`} inputMode="decimal" value={payment.amount} onChange={event => edit('amount', event.target.value)}/></div>
          <div className="field"><label htmlFor={`date-${payment.id}`}>{original.name} proposed receipt date</label><input id={`date-${payment.id}`} type="date" min="1900-01-01" max="9999-12-31" value={payment.date} onChange={event => edit('date', event.target.value)}/></div></div>
          <div className="field"><label htmlFor={`reason-${payment.id}`}>{original.name} change reason</label><input id={`reason-${payment.id}`} maxLength={500} value={payment.reason} onChange={event => edit('reason', event.target.value)}/><small>Required when changing the amount or receipt date.</small></div>
        </fieldset>
      })}
      {error && <p className="notice error" role="alert">{error}</p>}
      <div className="form-actions"><button type="submit" className="button">Update comparison</button></div>
    </fieldset></form>
    {dirty && <p className="notice" role="status">Inputs changed. Update comparison to see their effect. Results below use the last applied settings.</p>}
    {comparison ? <>
      <div className="suggestion-box"><h3>Try an earlier deposit allocation</h3><p>Preview moving funds from later milestones into an existing deposit expected by the first shortage. The total price and your deposit limit are respected; further funding may still be needed.</p><button type="button" className="button secondary" disabled={working || dirty || !complete} onClick={previewSuggestion}>Preview suggested deposit</button>{explanation && <p role="status">{explanation}</p>}</div>
      <h3>Original versus proposal</h3><p className="muted">Applied scenario: receipts delayed {settings.receiptDelayDays} days; expenses increased {settings.expenseIncreasePercent}%.</p>
      <table className="comparison-table"><caption className="sr-only">Original and proposed cash forecast</caption><thead><tr><th scope="col">Measure</th><th scope="col">Original</th><th scope="col">Proposal</th></tr></thead><tbody>
        <tr><th scope="row">First shortage</th><td>{comparison.original.firstShortageDate ? displayDate(comparison.original.firstShortageDate) : 'None'}</td><td>{comparison.proposed.firstShortageDate ? displayDate(comparison.proposed.firstShortageDate) : 'None'}</td></tr>
        <tr><th scope="row">Maximum funding gap</th><td>{money(comparison.original.maximumGapCents)}</td><td>{money(comparison.proposed.maximumGapCents)}</td></tr>
        <tr><th scope="row">Closing cash</th><td>{money(comparison.original.closingCashCents)}</td><td>{money(comparison.proposed.closingCashCents)}</td></tr>
      </tbody></table>
      <p className="notice">{comparison.proposed.maximumGapCents > 0 ? `Remaining funding gap: ${money(comparison.proposed.maximumGapCents)}. This proposal still needs funding or further schedule changes.` : 'No daily closing funding gap in this proposal. Expected receipts are not guaranteed.'}</p>
      <ForecastChart forecast={comparison.proposed}/>
      <p className="summary-note">Starting cash is allocated to this project before the earliest date. Same-day movements are netted at daily close; intraday shortages are not shown. GST {baseline.project.tax_basis}; no unentered taxes or costs are added.</p>
      <div className="print-actions"><h3>Share a readable payment plan</h3><p className="muted">Print the applied comparison, payment schedules, expenses, dated balances and assumptions. Choose “Save as PDF” in your browser's print dialog. Save a named revision first if you want to preserve this proposal in the app.</p><button type="button" className="button secondary" disabled={working || dirty || !complete} onClick={() => window.print()}>Print / save PDF</button>{!complete && <p className="summary-note">Complete the original payment total before printing a payment plan.</p>}</div>
      {onSaveRevision && <div className="revision-save"><h3>Preserve this proposal</h3><p className="muted">A named revision saves the original inputs and this proposal together. It does not overwrite existing versions or update the working project.</p><div className="field"><label htmlFor="revision-name">Revision name</label><input id="revision-name" maxLength={160} value={revisionName} disabled={working} onChange={event => setRevisionName(event.target.value)}/></div>{saveError && <p role="alert" className="notice error">{saveError}</p>}<button className="button" type="button" disabled={working || dirty || !complete} onClick={() => void save()}>{saving ? 'Saving revision…' : 'Save named revision'}</button>{!complete && <p className="summary-note">Complete the original payment total before saving a revision.</p>}</div>}
      <PrintablePlan baseline={baseline} settings={settings} comparison={comparison} sourceLabel={sourceLabel} saved={!!savedSettings && JSON.stringify(settings) === JSON.stringify(savedSettings)} ready={!dirty && complete}/>
    </> : <p className="notice error" role="alert">The saved schedule cannot be calculated safely. Review its amounts and dates.</p>}
  </section>
}
