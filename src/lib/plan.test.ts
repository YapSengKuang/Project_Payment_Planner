import { expect, it } from 'vitest'
import { comparePlan, shiftDate, type PlanBaseline } from './plan'
import type { Project } from './project'
import type { Expense, Milestone } from './schedule'

export const baseline: PlanBaseline = {
  project: { price_cents: 1000000, starting_cash_cents: 0, start_date: '2026-11-01', end_date: '2026-11-30', tax_basis: 'inclusive' } as Project,
  expenses: [{ id: 'e1', description: 'Materials', amount_cents: 300000, payment_date: '2026-11-05' }, { id: 'e2', description: 'Labour', amount_cents: 400000, payment_date: '2026-11-20' }] as Expense[],
  milestones: [{ id: 'd', kind: 'deposit', name: 'Deposit', amount_cents: 200000, expected_receipt_date: '2026-11-01' }, { id: 'm', kind: 'milestone', name: 'Delivery', amount_cents: 800000, expected_receipt_date: '2026-11-15' }] as Milestone[],
}
it('compares original and delayed receipts with increased expenses without changing the saved schedule', () => {
  const before = structuredClone(baseline)
  const result = comparePlan(baseline, { receiptDelayDays: 7, expenseIncreasePercent: 10 })
  expect(result.original.maximumGapCents).toBe(100000)
  expect(result.proposed.firstShortageDate).toBe('2026-11-05')
  expect(result.proposed.maximumGapCents).toBe(570000)
  expect(result.proposed.closingCashCents).toBe(230000)
  expect(baseline).toEqual(before)
})
it('rounds each expense half up in exact cents and shifts dates over leap years', () => {
  const result = comparePlan({ ...baseline, expenses: [{ ...baseline.expenses[0], amount_cents: 5 }] }, { receiptDelayDays: 0, expenseIncreasePercent: 10 })
  expect(result.expenses[0].amount_cents).toBe(6)
  expect(shiftDate('2028-02-28', 2)).toBe('2028-03-01')
  expect(() => shiftDate('9999-12-31', 1)).toThrow()
  expect(() => comparePlan(baseline, { receiptDelayDays: -1, expenseIncreasePercent: 0 })).toThrow()
  expect(() => comparePlan(baseline, { receiptDelayDays: 0, expenseIncreasePercent: 101 })).toThrow()
})
