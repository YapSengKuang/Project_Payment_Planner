import { useState } from 'react'
import type { FormEvent } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Project } from '../lib/project'
import { displayDate, money } from '../lib/project'
import type { Errors, Expense, ExpenseValues } from '../lib/schedule'
import { totalCents, validateExpense } from '../lib/schedule'
import { deleteRow, saveExpense } from '../lib/schedule-api'
import ScheduleField from './ScheduleField'
type Props = { client: SupabaseClient; project: Project; expenses: Expense[]; onBusyChange?: (busy: boolean) => void; onChange: (rows: Expense[]) => void }
export default function ExpensePanel({ client, project, expenses, onChange, onBusyChange }: Props) {
  const [editor, setEditor] = useState<Expense | 'new' | null>(null)
  const [values, setValues] = useState<ExpenseValues>({ description: '', amount: '', payment_date: '' })
  const [errors, setErrors] = useState<Errors<ExpenseValues>>({})
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState('')
  const [notice, setNotice] = useState('')
  const [removing, setRemoving] = useState<string | null>(null)
  function open(row?: Expense) {
    setValues({ description: row?.description ?? '', amount: row ? (row.amount_cents / 100).toFixed(2) : '', payment_date: row?.payment_date ?? '' })
    setErrors({}); setFailure(''); setNotice(''); setRemoving(null); setEditor(row ?? 'new')
  }
  async function submit(event: FormEvent) {
    event.preventDefault()
    const result = validateExpense(values); setErrors(result.errors)
    if (!result.input) return
    setBusy(true); onBusyChange?.(true); setFailure('')
    try {
      const saved = await saveExpense(client, project.id, result.input, editor && editor !== 'new' ? editor.id : undefined)
      onChange([...expenses.filter(row => row.id !== saved.id), saved]); setEditor(null); setNotice('Expense saved.')
    } catch { setFailure('Could not save the expense. Your entries are still here. Check your connection and try again.') }
    finally { setBusy(false); onBusyChange?.(false) }
  }
  async function remove(id: string) {
    setBusy(true); onBusyChange?.(true); setFailure('')
    try { await deleteRow(client, 'expenses', project.id, id); onChange(expenses.filter(row => row.id !== id)); setRemoving(null); setNotice('Expense deleted.') }
    catch { setFailure('Could not delete the expense. Try again; the entry has been kept in the list.') }
    finally { setBusy(false); onBusyChange?.(false) }
  }
  return <section className="panel schedule-panel" aria-labelledby="expenses-title"><div className="section-top"><div><p className="eyebrow">STEP 02 · EXPECTED COSTS</p><h2 id="expenses-title">Expenses</h2></div><strong className="schedule-total">{money(totalCents(expenses))}</strong></div>
    <p className="muted schedule-intro">Enter what you expect to pay and when. All amounts {project.tax_basis === 'inclusive' ? 'include' : 'exclude'} GST.</p>
    {failure && <p role="alert" className="notice error">{failure}</p>}{notice && <p role="status" className="notice success">{notice}</p>}
    {editor ? <form onSubmit={submit} noValidate><h3>{editor === 'new' ? 'Add expense' : 'Edit expense'}</h3><fieldset disabled={busy}><legend className="sr-only">Expense details</legend><div className="form-grid">
      <ScheduleField label="Description" value={values.description} error={errors.description} onChange={v => setValues({ ...values, description: v })}/>
      <ScheduleField label="Expense amount (AUD)" value={values.amount} error={errors.amount} onChange={v => setValues({ ...values, amount: v })}/>
      <ScheduleField label="Expected payment date" type="date" value={values.payment_date} error={errors.payment_date} onChange={v => setValues({ ...values, payment_date: v })}/>
    </div></fieldset>{Object.keys(errors).length > 0 && <p role="alert" className="error-text">Check the highlighted expense fields.</p>}
      <div className="form-actions"><button type="button" className="button secondary" disabled={busy} onClick={() => setEditor(null)}>Cancel</button><button className="button" disabled={busy}>{busy ? 'Saving…' : 'Save expense'}</button></div></form> : <>
      <button className="button" disabled={busy} onClick={() => open()}>Add expense ＋</button>
      {expenses.length === 0 ? <p className="empty-state muted">No expenses yet. Add your first expected cost.</p> : <ul className="schedule-list">{[...expenses].sort((a,b) => a.payment_date.localeCompare(b.payment_date) || a.id.localeCompare(b.id)).map(row => <li key={row.id} className="schedule-row"><div className="schedule-entry"><h3>{row.description}</h3><p>Expected payment · {displayDate(row.payment_date)}</p></div><strong>{money(row.amount_cents)}</strong><div className="row-actions">
        {removing === row.id ? <><span>Delete this expense?</span><button className="button danger" disabled={busy} onClick={() => void remove(row.id)}>Confirm delete</button><button className="button secondary" disabled={busy} onClick={() => setRemoving(null)}>Keep</button></> : <><button className="button secondary" disabled={busy} onClick={() => open(row)} aria-label={`Edit expense ${row.description}`}>Edit</button><button className="text-button" disabled={busy} onClick={() => { setRemoving(row.id); setNotice('') }} aria-label={`Delete expense ${row.description}`}>Delete</button></>}
      </div></li>)}</ul>}
    </>}
  </section>
}
