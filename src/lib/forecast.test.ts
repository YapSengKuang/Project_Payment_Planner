import { describe, expect, it } from 'vitest'
import examples from '../../fixtures/reference-projects.json'
import { forecastCash, type CashEvent } from './forecast'

const event = (date: string, amount_cents: number): CashEvent => ({ date, amount_cents, label: 'Test' })

describe('reference forecasts checked against fixed, independently calculated expectations', () => {
  for (const project of examples.projects) {
    it(project.id, () => {
      const result = forecastCash(project.starting_cash_cents,
        project.receipts.map(row => ({ ...row, label: 'Receipt' })),
        project.expenses.map(row => ({ ...row, label: 'Expense' })))
      expect(result.firstShortageDate).toBe(project.expected.first_shortage_date)
      expect(result.maximumGapCents).toBe(project.expected.maximum_gap_cents)
      expect(result.closingCashCents).toBe(project.expected.closing_cash_cents)
    })
  }
})

it('nets all same-day movements before evaluating a shortage, regardless of input order', () => {
  const result = forecastCash(0, [event('2026-11-05', 100), event('2026-11-05', 200)], [event('2026-11-05', 300)])
  expect(result.maximumGapCents).toBe(0)
  expect(result.days).toHaveLength(1)
  expect(result.days[0]).toMatchObject({ receiptsCents: 300, expensesCents: 300, balanceCents: 0 })
})

it('sorts dates and retains movements outside project boundaries without mutating inputs', () => {
  const receipts = [event('2027-01-04', 1000), event('2026-10-01', 100)]
  const expenses = [event('2026-12-10', 500), event('2026-09-30', 200)]
  const before = structuredClone({ receipts, expenses })
  const result = forecastCash(50, receipts, expenses, ['2026-11-01', '2026-12-01'])
  expect(result.days.map(day => day.date)).toEqual(['2026-09-30', '2026-10-01', '2026-11-01', '2026-12-01', '2026-12-10', '2027-01-04'])
  expect(result.firstShortageDate).toBe('2026-09-30')
  expect(result.maximumGapCents).toBe(550)
  expect(result.closingCashCents).toBe(450)
  expect({ receipts, expenses }).toEqual(before)
})

it('handles empty schedules and exact cents without expanding years into daily rows', () => {
  expect(forecastCash(0, [], [])).toMatchObject({ days: [], firstShortageDate: null, maximumGapCents: 0, closingCashCents: 0 })
  const result = forecastCash(1, [event('9999-12-31', 10)], [event('1900-01-01', 12)], ['1900-01-01', '9999-12-31'])
  expect(result.days).toHaveLength(2)
  expect(result.maximumGapCents).toBe(11)
  expect(result.closingCashCents).toBe(-1)
})

it('reports the earliest shortage and deepest later gap, including an unrecovered deficit', () => {
  const result = forecastCash(0, [event('2026-11-02', 100)], [event('2026-11-01', 200), event('2026-11-03', 500)])
  expect(result.firstShortageDate).toBe('2026-11-01')
  expect(result.maximumGapCents).toBe(600)
  expect(result.closingCashCents).toBe(-600)
})

it('rejects invalid dates, fractional/negative cents and unsafe totals instead of returning misleading results', () => {
  expect(() => forecastCash(-1, [], [])).toThrow()
  expect(() => forecastCash(0, [event('2026-02-30', 100)], [])).toThrow()
  expect(() => forecastCash(0, [], [event('2026-01-01', 0.5)])).toThrow()
  expect(() => forecastCash(0, [], [event('2026-01-01', -100)])).toThrow()
  expect(() => forecastCash(Number.MAX_SAFE_INTEGER, [event('2026-01-01', 1)], [])).toThrow()
  expect(() => forecastCash(0, [event('2026-01-01', Number.MAX_SAFE_INTEGER), event('2026-01-02', 1)], [])).toThrow()
})
