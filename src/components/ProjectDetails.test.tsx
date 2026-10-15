import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Project } from '../lib/project'
vi.mock('../lib/schedule-api', () => ({ loadExpenses: vi.fn(), loadMilestones: vi.fn(), saveExpense: vi.fn() }))
import { loadExpenses, loadMilestones, saveExpense } from '../lib/schedule-api'
import ProjectDetails from './ProjectDetails'
it('prevents leaving a pending save, then updates totals and the GST lock', async () => {
  vi.mocked(loadExpenses).mockResolvedValue([])
  vi.mocked(loadMilestones).mockResolvedValue([])
  let finish!: (row: Awaited<ReturnType<typeof saveExpense>>) => void
  vi.mocked(saveExpense).mockImplementation(() => new Promise(resolve => { finish = resolve }))
  const user = userEvent.setup()
  render(<ProjectDetails client={{} as SupabaseClient} project={{ id: 'p', name: 'Example', price_cents: 1000000, tax_basis: 'inclusive' } as Project} onSave={vi.fn()} onBack={vi.fn()}/>)
  await user.click(screen.getByRole('button', { name: '02 Expenses' }))
  await user.click(await screen.findByRole('button', { name: /add expense/i }))
  await user.type(screen.getByLabelText('Description'), 'Materials')
  await user.type(screen.getByLabelText('Expense amount (AUD)'), '3000')
  await user.type(screen.getByLabelText('Expected payment date'), '2026-11-05')
  await user.click(screen.getByRole('button', { name: 'Save expense' }))
  expect(screen.getByRole('button', { name: '03 Milestones' })).toBeDisabled()
  expect(screen.getByRole('button', { name: '← All projects' })).toBeDisabled()
  await act(async () => finish({ id: 'e', project_id: 'p', description: 'Materials', amount_cents: 300000, payment_date: '2026-11-05', created_at: '', updated_at: '' }))
  expect(screen.getByRole('button', { name: '03 Milestones' })).toBeEnabled()
  await user.click(screen.getByRole('button', { name: '01 Setup' }))
  expect(screen.getByLabelText('GST convention')).toBeDisabled()
})
