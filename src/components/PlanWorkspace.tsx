import { useEffect, useRef, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { listRevisions, loadRevision, saveRevision, type PlanRevision, type RevisionSummary } from '../lib/revisions-api'
import type { PlanBaseline, PlanSettings } from '../lib/plan'
import PlanPanel from './PlanPanel'

export default function PlanWorkspace({ client, baseline, onBusyChange }: { client: SupabaseClient; baseline: PlanBaseline; onBusyChange: (busy: boolean) => void }) {
  const [revisions, setRevisions] = useState<RevisionSummary[]>([])
  const [selected, setSelected] = useState<PlanRevision | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState('')
  const [notice, setNotice] = useState('')
  const [retry, setRetry] = useState(0)
  const alive = useRef(true)
  useEffect(() => { alive.current = true; return () => { alive.current = false } }, [])
  useEffect(() => {
    let ignore = false
    void listRevisions(client, baseline.project.id).then(rows => { if (!ignore) setRevisions(rows) })
      .catch(() => { if (!ignore) setFailure('Could not load saved revisions. Check your connection and the Sprint 4 database migration, then retry.') })
      .finally(() => { if (!ignore) setLoading(false) })
    return () => { ignore = true }
  }, [client, baseline.project.id, retry])
  function working(value: boolean) { setBusy(value); onBusyChange(value) }
  async function select(id: string) {
    setFailure(''); setNotice('')
    if (!id) { setSelected(null); return }
    working(true)
    try { const row = await loadRevision(client, baseline.project.id, id); if (alive.current) setSelected(row) }
    catch { if (alive.current) setFailure('Could not open this revision. Your current comparison is still available. Retry the selection.') }
    finally { if (alive.current) working(false) }
  }
  async function save(name: string, settings: PlanSettings) {
    const saved = await saveRevision(client, baseline.project.id, name, selected?.baseline ?? baseline, settings, selected?.id ?? null)
    if (!alive.current) return
    setRevisions(rows => [saved, ...rows].slice(0, 100)); setSelected(saved); setNotice(`Revision “${saved.name}” saved. Earlier versions and the working schedule are unchanged.`)
  }
  return <div className="plan-workspace">
    <section className="panel revision-picker" aria-label="Saved plan revisions"><h2>Saved plan revisions</h2>
      <p className="muted">Choose the working schedule or reopen a preserved revision. Changing selection or leaving this section discards unsaved proposal inputs. The latest 100 revisions are listed.</p>
      {failure && <p role="alert" className="notice error">{failure} <button className="text-button" disabled={busy} onClick={() => { setLoading(true); setFailure(''); setRetry(value => value + 1) }}>Retry revision list</button></p>}
      <label className="field" htmlFor="revision-select">Compare from<select id="revision-select" value={selected?.id ?? ''} disabled={loading || busy} onChange={event => void select(event.target.value)}><option value="">Current saved working schedule</option>{revisions.map(row => <option key={row.id} value={row.id}>{row.name} · {new Date(row.created_at).toLocaleString('en-AU')}</option>)}</select></label>
      {loading && <p role="status">Loading saved revisions…</p>}{busy && <p role="status">Working with revision…</p>}
      {selected && <p className="summary-note">Viewing “{selected.name}”, saved {new Date(selected.created_at).toLocaleString('en-AU')}. Its original schedule, assumptions and proposal are preserved. Further saves create a new revision.</p>}
      {notice && <p role="status" className="notice success">{notice}</p>}
    </section>
    <PlanPanel key={selected?.id ?? 'working'} baseline={selected?.baseline ?? baseline} savedSettings={selected?.settings} sourceLabel={selected?.name ?? 'Current saved working schedule'} onSaveRevision={save} onBusyChange={working}/>
  </div>
}
