import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Project } from '../lib/project'
vi.mock('../lib/schedule-api', () => ({ saveExpense: vi.fn(), deleteRow: vi.fn() }))
import { saveExpense, deleteRow } from '../lib/schedule-api'
import ExpensePanel from './ExpensePanel'
const project = { id: 'p', tax_basis: 'inclusive' } as Project
const expense = { id: 'e', project_id: 'p', description: 'Materials', amount_cents: 300000, payment_date: '2026-11-05', created_at: '', updated_at: '' }
it('validates, retains a failed expense, then saves successfully', async () => {
  vi.mocked(saveExpense).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(expense)
  const change = vi.fn(), user = userEvent.setup()
  render(<ExpensePanel client={{} as SupabaseClient} project={project} expenses={[]} onChange={change}/>)
  await user.click(screen.getByRole('button', { name: /add expense/i }))
  await user.click(screen.getByRole('button', { name: 'Save expense' }))
  expect(screen.getByText('Enter a description of 1 to 160 characters.')).toBeInTheDocument()
  await user.type(screen.getByLabelText('Description'), 'Materials')
  await user.type(screen.getByLabelText('Expense amount (AUD)'), '3000')
  await user.type(screen.getByLabelText('Expected payment date'), '2026-11-05')
  await user.click(screen.getByRole('button', { name: 'Save expense' }))
  expect(await screen.findByText(/Your entries are still here/)).toBeInTheDocument()
  expect(screen.getByLabelText('Description')).toHaveValue('Materials')
  await user.click(screen.getByRole('button', { name: 'Save expense' }))
  expect(change).toHaveBeenCalledWith([expense])
})
it('requires a delete confirmation and leaves a failed delete in the list', async () => {
  vi.mocked(deleteRow).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(undefined)
  const change = vi.fn(), user = userEvent.setup()
  render(<ExpensePanel client={{} as SupabaseClient} project={project} expenses={[expense]} onChange={change}/>)
  await user.click(screen.getByRole('button', { name: 'Delete expense Materials' }))
  expect(deleteRow).not.toHaveBeenCalled()
  await user.click(screen.getByRole('button', { name: 'Confirm delete' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Could not delete')
  expect(change).not.toHaveBeenCalled()
  await user.click(screen.getByRole('button', { name: 'Confirm delete' }))
  expect(change).toHaveBeenCalledWith([])
})
