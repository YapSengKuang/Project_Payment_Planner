import type { SupabaseClient } from '@supabase/supabase-js'
import type { Expense, ExpenseInput, Milestone, MilestoneInput } from './schedule'

// Fetch all supported rows; never silently calculate totals from a truncated API response.
export async function loadRows<T>(client: SupabaseClient, table: string, projectId: string, order: string): Promise<T[]> {
  const rows: T[] = []
  for (let start = 0; start <= 10000; start += 500) {
    const { data, error } = await client.from(table).select('*').eq('project_id', projectId).order(order).order('id').range(start, start + 499)
    if (error) throw error
    if (rows.length + data.length > 10000) throw new Error('This project exceeds the supported 10,000 schedule entries.')
    rows.push(...data as T[])
    if (data.length < 500) return rows
  }
  throw new Error('Could not load the full schedule.')
}
export const loadExpenses = (client: SupabaseClient, projectId: string) => loadRows<Expense>(client, 'expenses', projectId, 'payment_date')
export async function saveExpense(client: SupabaseClient, projectId: string, input: ExpenseInput, id?: string): Promise<Expense> {
  const query = id ? client.from('expenses').update(input).eq('id', id).eq('project_id', projectId) : client.from('expenses').insert({ ...input, project_id: projectId })
  const { data, error } = await query.select().single()
  if (error) throw error
  return data as Expense
}
export async function deleteRow(client: SupabaseClient, table: 'expenses' | 'milestones', projectId: string, id: string) {
  const { data, error } = await client.from(table).delete().eq('id', id).eq('project_id', projectId).select('id')
  if (error) throw error
  if (!data?.length) throw new Error('The entry could not be removed. Reload and try again.')
}

export const loadMilestones = (client: SupabaseClient, projectId: string) => loadRows<Milestone>(client, 'milestones', projectId, 'expected_receipt_date')
export async function saveMilestone(client: SupabaseClient, projectId: string, input: MilestoneInput, id?: string): Promise<Milestone> {
  const query = id ? client.from('milestones').update(input).eq('id', id).eq('project_id', projectId) : client.from('milestones').insert({ ...input, project_id: projectId })
  const { data, error } = await query.select().single()
  if (error) throw error
  return data as Milestone
}
