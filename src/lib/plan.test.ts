import { expect, it } from 'vitest'
import { planFixture as baseline } from '../test/plan-fixture'
import { comparePlan, initialSettings, suggestDeposit, shiftDate } from './plan'

it('compares original and delayed receipts with increased expenses without changing the saved schedule', () => {
  const before = structuredClone(baseline)
  const result = comparePlan(baseline, { ...initialSettings(baseline.project.price_cents), receiptDelayDays: 7, expenseIncreasePercent: 10 })
  expect(result.original.maximumGapCents).toBe(100000)
  expect(result.proposed.firstShortageDate).toBe('2026-11-05')
  expect(result.proposed.maximumGapCents).toBe(570000)
  expect(result.proposed.closingCashCents).toBe(230000)
  expect(baseline).toEqual(before)
})
it('rounds each expense half up in exact cents and shifts dates over leap years', () => {
  const result = comparePlan({ ...baseline, expenses: [{ ...baseline.expenses[0], amount_cents: 5 }] }, { ...initialSettings(baseline.project.price_cents), receiptDelayDays: 0, expenseIncreasePercent: 10 })
  expect(result.expenses[0].amount_cents).toBe(6)
  expect(shiftDate('2028-02-28', 2)).toBe('2028-03-01')
  expect(() => shiftDate('9999-12-31', 1)).toThrow()
  expect(() => comparePlan(baseline, { ...initialSettings(baseline.project.price_cents), receiptDelayDays: -1, expenseIncreasePercent: 0 })).toThrow()
  expect(() => comparePlan(baseline, { ...initialSettings(baseline.project.price_cents), receiptDelayDays: 0, expenseIncreasePercent: 101 })).toThrow()
})

it('moves a thousand dollars into the deposit while preserving the total price', () => {
  const result = suggestDeposit(baseline, initialSettings(baseline.project.price_cents))
  expect(result.movedCents).toBe(100000)
  expect(result.remainingGapCents).toBe(0)
  const after = comparePlan(baseline, result.settings)
  expect(after.milestones.map(row => row.amount_cents)).toEqual([300000, 700000])
  expect(after.proposed.receiptsCents).toBe(1000000)
})
it('respects a configured deposit cap and explicitly retains the residual gap', () => {
  const result = suggestDeposit(baseline, { ...initialSettings(baseline.project.price_cents), depositCapCents: 250000 })
  expect(result.movedCents).toBe(50000)
  expect(result.remainingGapCents).toBe(50000)
  expect(result.explanation).toContain('$500.00')
  expect(suggestDeposit(baseline, { ...initialSettings(baseline.project.price_cents), depositCapCents: 200000 }).movedCents).toBe(0)
})
it('does not claim a later deposit can cover an earlier shortage, and rejects invalid adjustments', () => {
  const settings = initialSettings(baseline.project.price_cents)
  expect(suggestDeposit(baseline, { ...settings, receiptDelayDays: 7 }).movedCents).toBe(0)
  const change = { id: 'd', amount_cents: 300000, receipt_date: '2026-11-01', reason: 'Earlier funding' }
  expect(() => comparePlan(baseline, { ...settings, changes: [change] })).toThrow(/total client payments/)
  expect(() => comparePlan(baseline, { ...settings, changes: [{ ...change, reason: '' }] })).toThrow(/Explain/)
  expect(() => comparePlan(baseline, { ...settings, changes: [{ ...change, id: 'unknown' }] })).toThrow(/unknown/)
})

it('preserves existing timing explanations when suggesting an amount adjustment', () => {
  const settings = { ...initialSettings(baseline.project.price_cents), changes: [
    { id: 'd', amount_cents: 200000, receipt_date: '2026-10-31', reason: 'Client agreed to pay the deposit before work starts.' },
  ] }
  const result = suggestDeposit(baseline, settings)
  expect(result.settings.changes.find(row => row.id === 'd')).toMatchObject({ receipt_date: '2026-10-31', amount_cents: 300000 })
  expect(result.settings.changes.find(row => row.id === 'd')?.reason).toContain(settings.changes[0].reason)
  const longReason = { ...settings, changes: [{ ...settings.changes[0], reason: 'x'.repeat(500) }] }
  expect(() => suggestDeposit(baseline, longReason)).toThrow(/proposal is unchanged/)
  expect(longReason.changes[0].amount_cents).toBe(200000)
})
