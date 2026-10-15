import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it } from 'vitest'
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
