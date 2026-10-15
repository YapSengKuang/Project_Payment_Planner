import type { SupabaseClient } from '@supabase/supabase-js'
import type { Project, ProjectInput } from './project'

const columns = 'id,owner_id,name,client_name,price_cents,starting_cash_cents,currency,start_date,end_date,tax_basis,created_at,updated_at'
export async function loadProjects(client: SupabaseClient, owner: string): Promise<Project[]> {
  const { data, error } = await client.from('projects').select(columns).eq('owner_id', owner).order('updated_at', { ascending: false })
  if (error) throw error
  return data as Project[]
}
export async function saveProject(client: SupabaseClient, owner: string, input: ProjectInput, id?: string): Promise<Project> {
  const query = id
    ? client.from('projects').update(input).eq('id', id).eq('owner_id', owner)
    : client.from('projects').insert({ ...input, owner_id: owner })
  const { data, error } = await query.select(columns).single()
  if (error) throw error
  return data as Project
}
