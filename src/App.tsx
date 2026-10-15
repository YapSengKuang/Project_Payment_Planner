import { useEffect, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import Auth from './components/Auth'
import ProjectForm from './components/ProjectForm'
import ProjectDetails from './components/ProjectDetails'
import { supabase } from './lib/supabase'
import { displayDate, money } from './lib/project'
import type { Project, ProjectInput } from './lib/project'
import { loadProjects, saveProject } from './lib/projects-api'

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [authReady, setAuthReady] = useState(!supabase)
  const [authError, setAuthError] = useState(() => new URLSearchParams(window.location.hash.slice(1)).has('error_description') ? 'Sign-in was cancelled or could not be completed. Try Google again or request a new email link.' : '')
  useEffect(() => {
    if (!supabase) return
    let active = true
    let authEventReceived = false
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, next) => {
      authEventReceived = true
      if (active) { setSession(next); setAuthReady(true) }
    })
    // onAuthStateChange handles callback links as well as later account changes.
    void supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return
      if (!authEventReceived) setSession(data.session)
      if (error) setAuthError('Your sign-in session could not be restored. Please sign in again.')
      setAuthReady(true)
    }).catch(() => {
      if (active) { setAuthReady(true); setAuthError('Could not restore your session. Please sign in again.') }
    })
    const callback = new URLSearchParams(window.location.hash.slice(1))
    if (callback.has('error_description')) {
      window.history.replaceState(null, '', window.location.pathname)
    }
    return () => { active = false; subscription.unsubscribe() }
  }, [])
  return <div className="app-shell"><a className="skip-link" href="#main">Skip to content</a>
    <aside className="sidebar"><a className="brand" href="/" aria-label="Project Payment Planner home"><span className="brand-mark" aria-hidden="true">p<span>↗</span></span><span>payment<br/><strong>planner</strong></span></a>
      <p className="nav-caption">WORKSPACE</p><a className="nav-item active" href="#main"><span aria-hidden="true">▦</span> Projects <span className="nav-arrow" aria-hidden="true">↗</span></a>
      <div className="sidebar-note"><span className="mini-line"/><p>Plan the work.<br/>Prepare the cash.</p><small>Project Payment Planner</small></div>
    </aside>
    <div className="workspace"><header className="topbar"><span>Workspace <span className="breadcrumb">/ Projects</span></span><span className="pilot-badge">EARLY ACCESS</span></header>
      <main id="main"><div className="page-heading"><div><p className="eyebrow">MAKE ROOM FOR WHAT’S NEXT</p><h1>Your projects<span className="purple">.</span></h1><p className="muted">A clear starting point for every payment plan.</p></div><span className="chapter" aria-hidden="true">01</span></div>
      {!authReady ? <p role="status" className="panel">Restoring your session…</p> : session && supabase ? <Workspace key={session.user.id} session={session}/> : <>
        {authError && <p role="alert" className="notice error">{authError}</p>}
        <div className="welcome-grid"><div className="intro-card"><p className="eyebrow">BEFORE THE FIRST INVOICE</p><h2>Give every project<br/>a stronger start.</h2><p>Bring your project details together, then build towards a payment schedule that works for your business.</p><div className="plan-illustration" aria-hidden="true"><div className="illustration-top">YOUR NEXT PROJECT <span>↗</span></div><div className="illustration-line"/><div className="cash-bars"><i/><i/><i/><i/><i/></div><div className="illustration-bottom"><span>Clarity from day one</span><b>01 — 06</b></div></div><span className="intro-foot">YOUR PROJECT. YOUR STARTING POINT.</span></div>
        {supabase ? <Auth client={supabase}/> : <section className="panel auth-panel" aria-labelledby="setup-title"><p className="eyebrow">WORKSPACE SETUP</p><h2 id="setup-title">Connect your workspace.</h2><p className="muted">The app is ready to connect to Supabase for secure sign-in and saved projects.</p><ol className="setup-steps"><li>Start local Supabase or create a hosted project.</li><li>Apply the included database migration.</li><li>Add the project URL and public key to <code>.env.local</code>, then restart the dev server.</li></ol><p className="notice">Open <code>docs/development.md</code> for the setup commands. Project saving becomes available once connected.</p></section>}
        </div></>}
      <footer className="page-footer"><span>A little planning. A clearer path ahead.</span><span>AUD pilot · Project setup</span></footer></main>
    </div></div>
}

function Workspace({ session }: { session: Session }) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [failure, setFailure] = useState('')
  const [notice, setNotice] = useState('')
  const [editor, setEditor] = useState<Project | 'new' | null>(null)
  const [retry, setRetry] = useState(0)
  const [signingOut, setSigningOut] = useState(false)
  const alive = useRef(true)
  const owner = session.user.id
  useEffect(() => {
    alive.current = true
    return () => { alive.current = false }
  }, [])
  useEffect(() => {
    let ignore = false
    void loadProjects(supabase!, owner).then(data => {
      if (!ignore) setProjects(data)
    }).catch(() => {
      if (!ignore) setFailure('Your projects could not be loaded. Check your connection and try again.')
    }).finally(() => { if (!ignore) setLoading(false) })
    return () => { ignore = true }
  }, [owner, retry])
  async function save(input: ProjectInput) {
    const saved = await saveProject(supabase!, owner, input, editor && editor !== 'new' ? editor.id : undefined)
    if (!alive.current) return
    setProjects(existing => [saved, ...existing.filter(p => p.id !== saved.id)])
    setEditor(editor === 'new' ? null : saved); setNotice('Project saved.'); setFailure('')
  }
  async function signOut() {
    setSigningOut(true); setFailure('')
    // Clear private UI immediately; the parent unmounts this workspace after auth changes.
    setEditor(null); setProjects([]); setNotice('')
    try {
      const { error } = await supabase!.auth.signOut({ scope: 'local' })
      if (error) throw error
    } catch {
      setFailure('Sign-out failed. Please try again.'); setLoading(true); setRetry(value => value + 1)
    } finally { if (alive.current) setSigningOut(false) }
  }
  return <><div className="account-strip"><span className="account-email">{session.user.email}</span><button className="text-button" disabled={signingOut} onClick={() => void signOut()}>{signingOut ? 'Signing out…' : 'Sign out'}</button></div>
    {notice && <p role="status" className="notice success">{notice}</p>}
    {failure && <div role="alert" className="notice error">{failure} <button className="text-button" onClick={() => { setLoading(true); setFailure(''); setRetry(v => v + 1) }}>Retry</button></div>}
    {editor ? editor === 'new' ? <ProjectForm onSave={save} onCancel={() => setEditor(null)}/> : <ProjectDetails key={editor.id} client={supabase!} project={editor} onSave={save} onBack={() => { setEditor(null); setNotice('') }}/> : <>
    <section className="overview"><div><p className="eyebrow">YOUR PROJECT BOOK</p><h2>Start organised. Stay ahead.</h2><p>Set up a project with its price, dates and available cash.</p></div><button className="button" disabled={signingOut || loading} onClick={() => { setEditor('new'); setNotice('') }}>New project <span aria-hidden="true">＋</span></button></section>
    <section className="panel project-list" aria-labelledby="list-title"><div className="section-top"><h2 id="list-title">All projects <span className="count">{projects.length}</span></h2><span className="muted">Most recently updated</span></div>
      {loading ? <p role="status" className="empty-state">Loading your projects…</p> : projects.length === 0 ? <div className="empty-state"><span className="empty-symbol" aria-hidden="true">＋</span><h3>{failure ? 'Projects unavailable' : 'Your next project starts here'}</h3><p>{failure ? 'Retry loading your projects above.' : 'Add the essentials now. Build your payment plan as you go.'}</p>{!failure && <button className="button secondary" disabled={signingOut || loading} onClick={() => setEditor('new')}>Create your first project ↗</button>}</div> : <div>{projects.map(project => <article className="project-row" key={project.id}><div className="project-icon" aria-hidden="true">{project.name.charAt(0).toUpperCase()}</div><div className="project-title"><h3>{project.name}</h3><p>{project.client_name}</p></div><div className="project-dates"><small>PROJECT DATES</small><p>{displayDate(project.start_date)} – {displayDate(project.end_date)}</p></div><div className="project-price"><small>PROJECT PRICE</small><p>{money(project.price_cents)}</p></div><button className="button secondary" disabled={signingOut || loading} onClick={() => { setEditor(project); setNotice('') }}>Open<span className="sr-only"> {project.name}</span> ↗</button></article>)}</div>}
    </section><div className="next-step"><span className="step-dot">01</span><p><strong>A solid foundation first.</strong> Open a project to enter expenses. Payment milestones and forecasting follow in the planning journey.</p></div></>}
  </>
}
