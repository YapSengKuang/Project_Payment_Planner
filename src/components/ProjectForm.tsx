import { useState } from 'react'
import type { FormEvent } from 'react'
import { validateProject } from '../lib/project'
import type { FormErrors, Project, ProjectFormValues, ProjectInput } from '../lib/project'

type Props = { project?: Project; taxBasisLocked?: boolean; onBusyChange?: (busy: boolean) => void; onSave: (input: ProjectInput) => Promise<void>; onCancel: () => void }
export default function ProjectForm({ project, taxBasisLocked = false, onSave, onCancel, onBusyChange }: Props) {
  const [values, setValues] = useState<ProjectFormValues>({
    name: project?.name ?? '', client_name: project?.client_name ?? '',
    price: project ? (project.price_cents / 100).toFixed(2) : '',
    starting_cash: project ? (project.starting_cash_cents / 100).toFixed(2) : '0.00',
    start_date: project?.start_date ?? '', end_date: project?.end_date ?? '', tax_basis: project?.tax_basis ?? 'inclusive',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [failure, setFailure] = useState('')
  const [saving, setSaving] = useState(false)
  async function submit(event: FormEvent) {
    event.preventDefault()
    const result = validateProject(values)
    setErrors(result.errors)
    if (!result.input) return
    setSaving(true); onBusyChange?.(true); setFailure('')
    try { await onSave(result.input) }
    catch { setFailure('Your project could not be saved. Check your connection and try again. Your entries are still here.') }
    finally { setSaving(false); onBusyChange?.(false) }
  }
  function field(key: keyof ProjectFormValues, label: string, type = 'text', hint?: string) {
    return <div className="field" key={key}><label htmlFor={key}>{label}</label>
      <input id={key} type={type} value={values[key]} disabled={saving}
        inputMode={key === 'price' || key === 'starting_cash' ? 'decimal' : undefined}
        maxLength={type === 'text' ? 160 : undefined}
        min={type === 'date' ? '1900-01-01' : undefined} max={type === 'date' ? '9999-12-31' : undefined}
        aria-invalid={!!errors[key]} aria-describedby={errors[key] ? `${key}-error` : hint ? `${key}-hint` : undefined}
        onChange={e => setValues({ ...values, [key]: e.target.value })} />
      {hint && <small id={`${key}-hint`}>{hint}</small>}
      {errors[key] && <small className="error-text" id={`${key}-error`}>{errors[key]}</small>}
    </div>
  }
  return <section className="panel form-panel" aria-labelledby="form-title">
    <div className="section-top"><div><p className="eyebrow">PROJECT SETUP</p><h2 id="form-title">{project ? 'Edit your project' : 'Start with the essentials'}</h2></div><span className="step-label">Step 01 / 06</span></div>
    <p className="muted">A few details now. A clearer payment plan ahead.</p>
    <form onSubmit={submit} noValidate>
      <fieldset disabled={saving}><legend className="sr-only">Project details</legend><div className="form-grid">
        {field('name', 'Project name')}{field('client_name', 'Client name')}
        {field('price', 'Project price (AUD)', 'text', 'The total agreed price for this project.')}
        {field('starting_cash', 'Available starting cash (AUD)', 'text', 'Money you can allocate to this project before client receipts.')}
        {field('start_date', 'Start date', 'date')}{field('end_date', 'End date', 'date')}
        <div className="field"><label htmlFor="currency">Currency</label><input id="currency" value="AUD · Australian dollar" readOnly /><small>One currency per project. The pilot supports AUD.</small></div>
        <div className="field"><label htmlFor="tax_basis">GST convention</label><select disabled={taxBasisLocked} id="tax_basis" value={values.tax_basis} onChange={e => setValues({ ...values, tax_basis: e.target.value as ProjectFormValues['tax_basis'] })} aria-invalid={!!errors.tax_basis}>
          <option value="inclusive">All amounts include GST</option><option value="exclusive">All amounts exclude GST</option>
        </select><small>{taxBasisLocked ? 'GST convention is fixed while schedule entries exist or are loading.' : 'Use the same convention for every amount.'}</small>{errors.tax_basis && <small className="error-text">{errors.tax_basis}</small>}</div>
      </div></fieldset>
      {Object.keys(errors).length > 0 && <p role="alert" className="notice error">Please check the highlighted fields.</p>}
      {failure && <p role="alert" className="notice error">{failure}</p>}
      <div className="form-actions"><button className="button secondary" type="button" disabled={saving} onClick={onCancel}>Cancel</button><button className="button" type="submit" disabled={saving}>{saving ? 'Saving…' : project ? 'Save changes' : 'Create project'} <span aria-hidden="true">↗</span></button></div>
    </form>
  </section>
}
