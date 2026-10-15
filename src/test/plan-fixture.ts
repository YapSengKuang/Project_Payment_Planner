import type { PlanBaseline } from '../lib/plan'
import type { Project } from '../lib/project'
import type { Expense, Milestone } from '../lib/schedule'

export const planFixture: PlanBaseline = {
  project: { price_cents: 1000000, starting_cash_cents: 0, start_date: '2026-11-01', end_date: '2026-11-30', tax_basis: 'inclusive' } as Project,
  expenses: [{ id: 'e1', description: 'Materials', amount_cents: 300000, payment_date: '2026-11-05' }, { id: 'e2', description: 'Labour', amount_cents: 400000, payment_date: '2026-11-20' }] as Expense[],
  milestones: [{ id: 'd', kind: 'deposit', name: 'Deposit', amount_cents: 200000, expected_receipt_date: '2026-11-01' }, { id: 'm', kind: 'milestone', name: 'Delivery', amount_cents: 800000, expected_receipt_date: '2026-11-15' }] as Milestone[],
}
