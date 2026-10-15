import type { SupabaseClient } from '@supabase/supabase-js'
import type { PlanBaseline, PlanSettings } from './plan'
export type PlanRevision = { id: string; project_id: string; name: string; schema_version: 1; baseline: PlanBaseline; settings: PlanSettings; source_revision_id: string | null; created_at: string }
export type RevisionSummary = Pick<PlanRevision, 'id' | 'name' | 'created_at' | 'source_revision_id'>
export function canonicalBaseline(baseline: PlanBaseline): PlanBaseline {
  const byId = <T extends { id: string }>(rows: T[]) => [...rows].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
  return { project: baseline.project, expenses: byId(baseline.expenses), milestones: byId(baseline.milestones) }
}
export async function listRevisions(client: SupabaseClient, projectId: string): Promise<RevisionSummary[]> {
  const { data, error } = await client.from('plan_revisions').select('id,name,created_at,source_revision_id').eq('project_id', projectId).order('created_at', { ascending: false }).order('id').limit(100)
  if (error) throw error
  return data
}
export async function loadRevision(client: SupabaseClient, projectId: string, id: string): Promise<PlanRevision> {
  const { data, error } = await client.from('plan_revisions').select('*').eq('project_id', projectId).eq('id', id).single()
  if (error) throw error
  if (data.schema_version !== 1) throw new Error('This revision format is not supported.')
  return data as PlanRevision
}
export async function saveRevision(client: SupabaseClient, projectId: string, name: string, baseline: PlanBaseline, settings: PlanSettings, sourceId: string | null): Promise<PlanRevision> {
  const { data, error } = await client.rpc('save_plan_revision', { p_project_id: projectId, p_name: name,
    p_expected_baseline: canonicalBaseline(baseline), p_settings: settings, p_source_revision_id: sourceId }).single()
  if (error) throw new Error(error.message)
  return data as PlanRevision
}
