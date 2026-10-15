import { useState } from 'react'
import type { FormEvent } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { displayDate, money } from '../lib/project'
import type { Project } from '../lib/project'
import { expectedReceiptDate, validateMilestone } from '../lib/schedule'
import type { Errors, Milestone, MilestoneValues } from '../lib/schedule'
import { deleteRow, saveMilestone } from '../lib/schedule-api'
import ScheduleField from './ScheduleField'
type Props = { client: SupabaseClient; project: Project; milestones: Milestone[]; onBusyChange?: (busy: boolean) => void; onChange: (rows: Milestone[]) => void }
const empty: MilestoneValues = { kind: 'milestone', name: '', amount: '', completion_date: '', invoice_date: '', payment_terms_days: '0', receipt_override_date: '', receipt_override_reason: '' }
export default function MilestonePanel({ client, project, milestones, onChange, onBusyChange }: Props) {
  const [editor, setEditor] = useState<Milestone | 'new' | null>(null)
  const [values, setValues] = useState<MilestoneValues>(empty)
  const [errors, setErrors] = useState<Errors<MilestoneValues>>({})
  const [override, setOverride] = useState(false)
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState('')
  const [notice, setNotice] = useState('')
  const [removing, setRemoving] = useState<string | null>(null)
  function open(row?: Milestone, kind: MilestoneValues['kind'] = 'milestone') {
    setValues(row ? { kind: row.kind, name: row.name, amount: (row.amount_cents / 100).toFixed(2), completion_date: row.completion_date, invoice_date: row.invoice_date, payment_terms_days: String(row.payment_terms_days), receipt_override_date: row.receipt_override_date ?? '', receipt_override_reason: row.receipt_override_reason ?? '' } : { ...empty, kind })
    setOverride(!!row?.receipt_override_date); setErrors({}); setFailure(''); setNotice(''); setRemoving(null); setEditor(row ?? 'new')
  }
  function change(key: keyof MilestoneValues, value: string) { setValues(previous => ({ ...previous, [key]: value })) }
  async function submit(event: FormEvent) {
    event.preventDefault()
    const result = validateMilestone(override ? values : { ...values, receipt_override_date: '', receipt_override_reason: '' })
    const nextErrors = { ...result.errors }
    if (override && !values.receipt_override_date) nextErrors.receipt_override_date = 'Enter an override receipt date or turn off the override.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length || !result.input) return
    setBusy(true); onBusyChange?.(true); setFailure('')
    try {
      const saved = await saveMilestone(client, project.id, result.input, editor && editor !== 'new' ? editor.id : undefined)
      onChange([...milestones.filter(row => row.id !== saved.id), saved]); setEditor(null); setNotice('Payment milestone saved.')
    } catch { setFailure('Could not save the payment milestone. Your entries are still here. Check your connection and try again.') }
    finally { setBusy(false); onBusyChange?.(false) }
  }
  async function remove(id: string) {
    setBusy(true); onBusyChange?.(true); setFailure('')
    try { await deleteRow(client, 'milestones', project.id, id); onChange(milestones.filter(row => row.id !== id)); setRemoving(null); setNotice('Payment milestone deleted.') }
    catch { setFailure('Could not delete the payment milestone. Try again; the entry has been kept in the list.') }
    finally { setBusy(false); onBusyChange?.(false) }
  }
  const calculated = expectedReceiptDate(values.invoice_date, values.payment_terms_days)
  const receipt = override ? values.receipt_override_date : calculated
  return <section className="panel schedule-panel" aria-labelledby="milestones-title"><div className="section-top"><div><p className="eyebrow">STEP 03 · EXPECTED CLIENT RECEIPTS</p><h2 id="milestones-title">Deposits and milestones</h2></div></div>
    <p className="muted schedule-intro">Plan expected client receipts, not confirmed payments. All amounts {project.tax_basis === 'inclusive' ? 'include' : 'exclude'} GST.</p>
    {failure && <p role="alert" className="notice error">{failure}</p>}{notice && <p role="status" className="notice success">{notice}</p>}
    {editor ? <form onSubmit={submit} noValidate><h3>{editor === 'new' ? 'Add client payment' : 'Edit client payment'}</h3><fieldset disabled={busy}><legend className="sr-only">Payment details</legend><div className="form-grid">
      <div className="field"><label htmlFor="payment-kind">Payment type</label><select id="payment-kind" value={values.kind} onChange={e => change('kind', e.target.value)}><option value="deposit">Deposit</option><option value="milestone">Milestone</option></select></div>
      <ScheduleField label="Payment name" value={values.name} error={errors.name} onChange={v => change('name', v)}/>
      <ScheduleField label="Payment amount (AUD)" value={values.amount} error={errors.amount} onChange={v => change('amount', v)}/>
      <ScheduleField label="Completion / deposit date" type="date" value={values.completion_date} error={errors.completion_date} hint="Milestone completion or the planned deposit date; this is separate from receipt." onChange={v => setValues(old => ({ ...old, completion_date: v, invoice_date: !old.invoice_date || old.invoice_date === old.completion_date ? v : old.invoice_date }))}/>
      <ScheduleField label="Invoice date" type="date" value={values.invoice_date} error={errors.invoice_date} hint="Defaults to the completion / deposit date. Change it if invoicing happens earlier or later." onChange={v => change('invoice_date', v)}/>
      <ScheduleField label="Payment terms (calendar days)" value={values.payment_terms_days} error={errors.payment_terms_days} hint="0 means expected receipt on the invoice date. Weekends are counted." onChange={v => change('payment_terms_days', v)}/>
    </div><label className="checkbox-field"><input type="checkbox" checked={override} onChange={e => setOverride(e.target.checked)}/> Override the expected receipt date</label>
    {override && <div className="form-grid"><ScheduleField label="Override receipt date" type="date" value={values.receipt_override_date} error={errors.receipt_override_date} onChange={v => change('receipt_override_date', v)}/><ScheduleField label="Reason for receipt override" value={values.receipt_override_reason} maxLength={500} error={errors.receipt_override_reason} onChange={v => change('receipt_override_reason', v)}/></div>}
    </fieldset><p className="notice" role="status">Expected receipt: <strong>{receipt && /^\d{4}-\d{2}-\d{2}$/.test(receipt) ? displayDate(receipt) : 'Enter valid dates and terms'}</strong>{override ? ' · Manual override' : ' · Invoice date + payment terms'}</p>
    {Object.keys(errors).length > 0 && <p role="alert" className="error-text">Check the highlighted payment fields.</p>}
    <div className="form-actions"><button type="button" className="button secondary" disabled={busy} onClick={() => setEditor(null)}>Cancel</button><button className="button" disabled={busy}>{busy ? 'Saving…' : 'Save payment'}</button></div></form> : <>
      <div className="row-actions"><button className="button" disabled={busy} onClick={() => open(undefined, 'deposit')}>Add deposit ＋</button><button className="button secondary" disabled={busy} onClick={() => open()}>Add milestone ＋</button></div>
      {milestones.length === 0 ? <p className="empty-state muted">No client payments yet. Add a deposit or milestone.</p> : <ul className="schedule-list">{[...milestones].sort((a,b) => a.expected_receipt_date.localeCompare(b.expected_receipt_date) || a.id.localeCompare(b.id)).map(row => <li key={row.id} className="schedule-row"><div className="schedule-entry"><span className="entry-kind">{row.kind}</span><h3>{row.name}</h3><p>Completion / deposit · {displayDate(row.completion_date)}</p><p>Invoice · {displayDate(row.invoice_date)} · {row.payment_terms_days} calendar days</p><p>Expected receipt · <strong>{displayDate(row.expected_receipt_date)}</strong></p>{row.receipt_override_reason && <p className="override-reason">Receipt override · {row.receipt_override_reason}</p>}</div><strong>{money(row.amount_cents)}</strong><div className="row-actions">
        {removing === row.id ? <><span>Delete this payment?</span><button className="button danger" disabled={busy} onClick={() => void remove(row.id)}>Confirm delete</button><button className="button secondary" disabled={busy} onClick={() => setRemoving(null)}>Keep</button></> : <><button className="button secondary" disabled={busy} onClick={() => open(row)} aria-label={`Edit payment ${row.name}`}>Edit</button><button className="text-button" disabled={busy} onClick={() => { setRemoving(row.id); setNotice('') }} aria-label={`Delete payment ${row.name}`}>Delete</button></>}
      </div></li>)}</ul>}
    </>}
  </section>
}
