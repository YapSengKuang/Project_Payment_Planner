import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Project } from '../lib/project'
vi.mock('../lib/schedule-api', () => ({ saveMilestone: vi.fn(), deleteRow: vi.fn() }))
import { saveMilestone, deleteRow } from '../lib/schedule-api'
import MilestonePanel from './MilestonePanel'
const project = { id: 'p', tax_basis: 'inclusive' } as Project
const payment = { id: 'm', project_id: 'p', kind: 'deposit' as const, name: 'Deposit', amount_cents: 200000, completion_date: '2026-11-01', invoice_date: '2026-11-01', payment_terms_days: 7, receipt_override_date: null, receipt_override_reason: null, expected_receipt_date: '2026-11-08', created_at: '', updated_at: '' }
it('defaults invoices to completion and preserves failed saves with overrides', async () => {
  const user = userEvent.setup(), change = vi.fn()
  vi.mocked(saveMilestone).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(payment)
  render(<MilestonePanel client={{} as SupabaseClient} project={project} milestones={[]} onChange={change}/>)
  await user.click(screen.getByRole('button', { name: /add deposit/i }))
  await user.type(screen.getByLabelText('Payment name'), 'Deposit')
  await user.type(screen.getByLabelText('Payment amount (AUD)'), '2000')
  await user.type(screen.getByLabelText('Completion / deposit date'), '2026-11-01')
  expect(screen.getByLabelText('Invoice date')).toHaveValue('2026-11-01')
  await user.clear(screen.getByLabelText('Payment terms (calendar days)'))
  await user.type(screen.getByLabelText('Payment terms (calendar days)'), '7')
  expect(screen.getByRole('status')).toHaveTextContent('8 Nov 2026')
  await user.click(screen.getByLabelText('Override the expected receipt date'))
  await user.type(screen.getByLabelText('Override receipt date'), '2026-11-10')
  await user.click(screen.getByRole('button', { name: 'Save payment' }))
  expect(screen.getByText('Explain the override in 1 to 500 characters.')).toBeInTheDocument()
  await user.type(screen.getByLabelText('Reason for receipt override'), 'Client agreed')
  await user.click(screen.getByRole('button', { name: 'Save payment' }))
  expect(await screen.findByText(/Your entries are still here/)).toBeInTheDocument()
  expect(screen.getByLabelText('Payment name')).toHaveValue('Deposit')
  await user.click(screen.getByRole('button', { name: 'Save payment' }))
  expect(change).toHaveBeenCalledWith([payment])
  expect(saveMilestone).toHaveBeenLastCalledWith(expect.anything(), 'p', expect.objectContaining({ receipt_override_date: '2026-11-10', receipt_override_reason: 'Client agreed' }), undefined)
})
it('reopens existing payment dates and confirms deletion', async () => {
  const user = userEvent.setup(), change = vi.fn()
  vi.mocked(deleteRow).mockResolvedValueOnce(undefined)
  render(<MilestonePanel client={{} as SupabaseClient} project={project} milestones={[payment]} onChange={change}/>)
  await user.click(screen.getByRole('button', { name: 'Edit payment Deposit' }))
  expect(screen.getByLabelText('Invoice date')).toHaveValue('2026-11-01')
  expect(screen.getByLabelText('Payment terms (calendar days)')).toHaveValue('7')
  await user.click(screen.getByRole('button', { name: 'Cancel' }))
  await user.click(screen.getByRole('button', { name: 'Delete payment Deposit' }))
  await user.click(screen.getByRole('button', { name: 'Confirm delete' }))
  expect(change).toHaveBeenCalledWith([])
})
