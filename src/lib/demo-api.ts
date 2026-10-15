import type { SupabaseClient } from '@supabase/supabase-js'
import type { Project } from './project'

export function localToday(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

// The server owns the synthetic dataset and creates the whole showcase transactionally.
export async function loadDemoProjects(client: SupabaseClient): Promise<Project[]> {
  const { data, error } = await client.rpc('load_demo_projects', { p_start_date: localToday() })
  if (error) throw error
  if (!Array.isArray(data) || data.length !== 2) throw new Error('The demo response was incomplete. Try loading it again.')
  return data as Project[]
}
