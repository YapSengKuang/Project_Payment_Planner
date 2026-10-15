import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import ProjectForm from './ProjectForm'

it('explains invalid inputs without sending a save request', async () => {
  const save = vi.fn()
  render(<ProjectForm onSave={save} onCancel={vi.fn()} />)
  await userEvent.click(screen.getByRole('button', { name: /create project/i }))
  expect(screen.getByText('Enter a project name.')).toBeInTheDocument()
  expect(screen.getByLabelText('Project name')).toHaveAttribute('aria-invalid', 'true')
  expect(save).not.toHaveBeenCalled()
})
it('retains input when saving fails and allows a retry', async () => {
  const user = userEvent.setup()
  const save = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(undefined)
  render(<ProjectForm onSave={save} onCancel={vi.fn()} />)
  await user.type(screen.getByLabelText('Project name'), 'Website')
  await user.type(screen.getByLabelText('Client name'), 'Example client')
  await user.type(screen.getByLabelText('Project price (AUD)'), '10000.29')
  await user.type(screen.getByLabelText('Start date'), '2026-11-01')
  await user.type(screen.getByLabelText('End date'), '2026-11-30')
  await user.click(screen.getByRole('button', { name: /create project/i }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Your entries are still here')
  expect(screen.getByLabelText('Project name')).toHaveValue('Website')
  await user.click(screen.getByRole('button', { name: /create project/i }))
  expect(save).toHaveBeenCalledTimes(2)
  expect(save).toHaveBeenLastCalledWith(expect.objectContaining({ price_cents: 1000029, starting_cash_cents: 0 }))
})
