import { useEffect, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Project, ProjectInput } from '../lib/project'
import type { Expense, Milestone } from '../lib/schedule'
import { loadExpenses, loadMilestones } from '../lib/schedule-api'
import ProjectForm from './ProjectForm'
import ExpensePanel from './ExpensePanel'
import MilestonePanel from './MilestonePanel'
type Props = { client: SupabaseClient; project: Project; onSave: (input: ProjectInput) => Promise<void>; onBack: () => void }
export default function ProjectDetails({ client, project, onSave, onBack }: Props) {
  const [tab, setTab] = useState('setup')
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [ready, setReady] = useState(false)
  const [failure, setFailure] = useState('')
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    let ignore = false
    void Promise.all([loadExpenses(client, project.id), loadMilestones(client, project.id)]).then(([costs, payments]) => {
      if (!ignore) { setExpenses(costs); setMilestones(payments); setReady(true) }
    }).catch(() => { if (!ignore) setFailure('Could not load the project schedule. Check your connection and database setup, then retry.') })
    return () => { ignore = true }
  }, [client, project.id, retry])
  return <div className="project-detail"><button className="text-button back-button" onClick={onBack}>← All projects</button><div className="project-context"><h2>{project.name}</h2><p>{project.client_name} · AUD · GST {project.tax_basis}</p></div>
    <nav className="project-tabs" aria-label="Project sections">{['setup', 'expenses', 'milestones'].map(item => <button key={item} aria-current={tab === item ? 'page' : undefined} onClick={() => setTab(item)}>{item === 'setup' ? '01 Setup' : item === 'expenses' ? '02 Expenses' : '03 Milestones'}</button>)}</nav>
    {failure && <p role="alert" className="notice error">{failure} <button className="text-button" onClick={() => { setFailure(''); setReady(false); setRetry(v => v + 1) }}>Retry schedule</button></p>}
    {!ready && !failure && <p role="status">Loading project schedule…</p>}
    {tab === 'setup' ? <ProjectForm project={project} taxBasisLocked={!ready || expenses.length > 0 || milestones.length > 0} onSave={onSave} onCancel={onBack}/> : ready && (tab === 'expenses' ? <ExpensePanel client={client} project={project} expenses={expenses} onChange={setExpenses}/> : <MilestonePanel client={client} project={project} milestones={milestones} onChange={setMilestones}/>)}
  </div>
}
