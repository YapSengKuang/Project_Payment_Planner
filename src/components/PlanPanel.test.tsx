import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { planFixture } from '../test/plan-fixture'
import PlanPanel from './PlanPanel'

it('previews a constrained deposit suggestion and explains the remaining gap', async () => {
  const user = userEvent.setup()
  render(<PlanPanel baseline={planFixture}/>)
  await user.clear(screen.getByLabelText('Maximum total deposits (AUD)'))
  await user.type(screen.getByLabelText('Maximum total deposits (AUD)'), '2500')
  expect(screen.getByRole('button', { name: 'Preview suggested deposit' })).toBeDisabled()
  await user.click(screen.getByRole('button', { name: 'Update comparison' }))
  await user.click(screen.getByRole('button', { name: 'Preview suggested deposit' }))
  expect(screen.getByText(/Remaining funding gap: \$500.00/)).toBeInTheDocument()
  expect(screen.getByLabelText('Deposit proposed amount (AUD)')).toHaveValue('2500.00')
  expect(screen.getByLabelText('Delivery proposed amount (AUD)')).toHaveValue('7500.00')
  expect(screen.getByRole('status')).toHaveTextContent('within your $2,500.00 total deposit limit')
})

it('requires a balanced total and a reason for manual payment changes', async () => {
  const user = userEvent.setup()
  render(<PlanPanel baseline={planFixture}/>)
  await user.clear(screen.getByLabelText('Deposit proposed amount (AUD)'))
  await user.type(screen.getByLabelText('Deposit proposed amount (AUD)'), '3000')
  await user.click(screen.getByRole('button', { name: 'Update comparison' }))
  expect(screen.getByRole('alert')).toHaveTextContent('Explain each changed payment')
  await user.type(screen.getByLabelText('Deposit change reason'), 'Cover materials')
  await user.click(screen.getByRole('button', { name: 'Update comparison' }))
  expect(screen.getByRole('alert')).toHaveTextContent('Keep the total client payments unchanged')
})

it('prints applied plans and prevents exporting unapplied inputs', async () => {
  const user = userEvent.setup(), print = vi.spyOn(window, 'print').mockImplementation(() => {})
  render(<PlanPanel baseline={planFixture}/>)
  await user.click(screen.getByRole('button', { name: 'Print / save PDF' }))
  expect(print).toHaveBeenCalledOnce()
  await user.clear(screen.getByLabelText('Increase all expenses (%)'))
  await user.type(screen.getByLabelText('Increase all expenses (%)'), '10')
  expect(screen.getByRole('button', { name: 'Print / save PDF' })).toBeDisabled()
  expect(screen.getByRole('article', { name: 'Printable payment plan' })).toHaveTextContent('Payment plan unavailable')
  await user.click(screen.getByRole('button', { name: 'Update comparison' }))
  expect(screen.getByRole('button', { name: 'Print / save PDF' })).toBeEnabled()
  expect(screen.getByRole('article', { name: 'Printable payment plan' })).toHaveTextContent('expenses increased 10%')
})
