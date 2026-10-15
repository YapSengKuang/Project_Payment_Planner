import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it } from 'vitest'
import type { Project } from '../lib/project'
import type { Expense, Milestone } from '../lib/schedule'
import ForecastPanel from './ForecastPanel'

const project = { id: 'p', name: 'Example', price_cents: 1000000, starting_cash_cents: 0,
  start_date: '2026-11-01', end_date: '2026-11-30', tax_basis: 'inclusive' } as Project
const expenses = [{ id: 'e', description: 'Materials', amount_cents: 300000, payment_date: '2026-11-05' }] as Expense[]
const milestones = [
  { id: 'd', name: 'Deposit', amount_cents: 200000, expected_receipt_date: '2026-11-01' },
  { id: 'm', name: 'Delivery', amount_cents: 800000, expected_receipt_date: '2026-11-15' },
] as Milestone[]

it('shows the documented shortfall and dated movements, then recalculates after saved changes', () => {
  const { rerender } = render(<ForecastPanel project={project} expenses={expenses} milestones={milestones}/>)
  expect(screen.getByRole('heading', { name: '$1,000.00 maximum funding gap' })).toBeInTheDocument()
  expect(screen.getByText(/First shortage: 5 Nov 2026/)).toBeInTheDocument()
  expect(screen.queryByText(/Provisional forecast/)).not.toBeInTheDocument()
  const row = screen.getByRole('rowheader', { name: /^5 Nov 2026/ }).closest('tr')!
  expect(within(row).getByText('Materials · $3,000.00')).toBeInTheDocument()
  expect(within(row).getByText('-$1,000.00')).toBeInTheDocument()
  rerender(<ForecastPanel project={{ ...project, starting_cash_cents: 100000 }} expenses={expenses} milestones={milestones}/>)
  expect(screen.getByRole('heading', { name: 'No funding gap in the entered schedule' })).toBeInTheDocument()
  expect(screen.queryByText('First shortage')).not.toBeInTheDocument()
})

it('warns about empty/incomplete schedules and explains assumptions', async () => {
  const user = userEvent.setup()
  render(<ForecastPanel project={project} expenses={[]} milestones={[]}/>)
  expect(screen.getByRole('heading', { name: 'Add a schedule to assess funding' })).toBeInTheDocument()
  expect(screen.getByText(/Provisional forecast/)).toBeInTheDocument()
  expect(screen.getByText(/No expenses entered/)).toBeInTheDocument()
  await user.click(screen.getByText('How this forecast is calculated'))
  expect(screen.getByText(/This does not show any shortage within that day/)).toBeVisible()
})

it('includes expected dates beyond project end, including receipt overrides supplied by the database', () => {
  render(<ForecastPanel project={project} expenses={expenses} milestones={[{ ...milestones[0], expected_receipt_date: '2026-12-15' }]}/>)
  expect(screen.getByText(/Some payments fall outside/)).toBeInTheDocument()
  expect(screen.getByRole('rowheader', { name: '15 Dec 2026' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: '$3,000.00 maximum funding gap' })).toBeInTheDocument()
})

it('fails visibly rather than showing a partial forecast for malformed saved data', () => {
  render(<ForecastPanel project={project} expenses={[{ ...expenses[0], payment_date: 'invalid' }]} milestones={milestones}/>)
  expect(screen.getByRole('alert')).toHaveTextContent('cannot be calculated safely')
  expect(screen.queryByRole('table')).not.toBeInTheDocument()
})

it('lets a user read further dates in a large schedule', async () => {
  const user = userEvent.setup()
  const rows = Array.from({ length: 60 }, (_, index) => ({ ...expenses[0], id: String(index),
    payment_date: new Date(Date.UTC(2026, 10, index + 1)).toISOString().slice(0, 10) }))
  render(<ForecastPanel project={project} expenses={rows} milestones={milestones}/>)
  expect(screen.getAllByRole('row')).toHaveLength(51)
  await user.click(screen.getByRole('button', { name: /Show more dates/ }))
  expect(screen.getAllByRole('row')).toHaveLength(61)
  expect(screen.queryByRole('button', { name: /Show more dates/ })).not.toBeInTheDocument()
})
