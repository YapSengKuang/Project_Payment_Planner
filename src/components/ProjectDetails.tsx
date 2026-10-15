import { useEffect, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Project, ProjectInput } from '../lib/project'
import type { Expense } from '../lib/schedule'
import { loadExpenses } from '../lib/schedule-api'
import ProjectForm from './ProjectForm'
import ExpensePanel from './ExpensePanel'
type Props = { client: SupabaseClient; project: Project; onSave: (input: ProjectInput) => Promise<void>; onBack: () => void }
export default function ProjectDetails({ client, project, onSave, onBack }: Props) {
  const [tab, setTab] = useState('setup')
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [ready, setReady] = useState(false)
  const [failure, setFailure] = useState('')
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    let ignore = false
    void loadExpenses(client, project.id).then(rows => {
      if (!ignore) { setExpenses(rows); setReady(true) }
    }).catch(() => { if (!ignore) setFailure('Could not load the project schedule. Check your connection and database setup, then retry.') })
    return () => { ignore = true }
  }, [client, project.id, retry])
  return <div className="project-detail"><button className="text-button back-button" onClick={onBack}>← All projects</button><div className="project-context"><h2>{project.name}</h2><p>{project.client_name} · AUD · GST {project.tax_basis}</p></div>
    <nav className="project-tabs" aria-label="Project sections">{['setup', 'expenses'].map(item => <button key={item} aria-current={tab === item ? 'page' : undefined} onClick={() => setTab(item)}>{item === 'setup' ? '01 Setup' : '02 Expenses'}</button>)}</nav>
    {failure && <p role="alert" className="notice error">{failure} <button className="text-button" onClick={() => { setFailure(''); setReady(false); setRetry(v => v + 1) }}>Retry schedule</button></p>}
    {!ready && !failure && <p role="status">Loading project schedule…</p>}
    {tab === 'setup' ? <ProjectForm project={project} taxBasisLocked={!ready || expenses.length > 0} onSave={onSave} onCancel={onBack}/> : ready && <ExpensePanel client={client} project={project} expenses={expenses} onChange={setExpenses}/>}
  </div>
}
