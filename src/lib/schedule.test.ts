import { expect, it } from 'vitest'
import { totalCents, validateExpense } from './schedule'
it('validates exact expense cents and real dates', () => {
  expect(validateExpense({ description: ' Materials ', amount: '3000.29', payment_date: '2026-11-05' }).input).toEqual({ description: 'Materials', amount_cents: 300029, payment_date: '2026-11-05' })
  expect(Object.keys(validateExpense({ description: ' ', amount: '-1', payment_date: '2026-02-30' }).errors)).toHaveLength(3)
  expect(validateExpense({ description: 'Cost', amount: '1.001', payment_date: '2026-11-01' }).input).toBeUndefined()
})
it('totals cents without rounding and refuses unsafe totals', () => {
  expect(totalCents([{ amount_cents: 29 }, { amount_cents: 101 }])).toBe(130)
  expect(totalCents([])).toBe(0)
  expect(() => totalCents([{ amount_cents: Number.MAX_SAFE_INTEGER }, { amount_cents: 1 }])).toThrow()
})
