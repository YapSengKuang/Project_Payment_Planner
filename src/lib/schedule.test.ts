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

import { expectedReceiptDate, validateMilestone } from './schedule'
import type { MilestoneValues } from './schedule'
const payment: MilestoneValues = { kind: 'milestone', name: ' Delivery ', amount: '8000.29', completion_date: '2026-11-01', invoice_date: '2026-11-03', payment_terms_days: '7', receipt_override_date: '', receipt_override_reason: '' }
it('derives receipts from invoice dates across month/year/leap boundaries', () => {
  expect(expectedReceiptDate('2026-11-03', '7')).toBe('2026-11-10')
  expect(expectedReceiptDate('2028-02-28', '1')).toBe('2028-02-29')
  expect(expectedReceiptDate('2026-12-31', '1')).toBe('2027-01-01')
  expect(expectedReceiptDate('2026-10-03', '2')).toBe('2026-10-05')
  expect(expectedReceiptDate('2026-11-03', '0')).toBe('2026-11-03')
  for (const terms of ['-1', '1.5', '366', '', '1e2']) expect(expectedReceiptDate('2026-11-03', terms)).toBeNull()
  expect(expectedReceiptDate('9999-12-31', '1')).toBeNull()
})
it('keeps invoice timing independent and requires a reason for overrides', () => {
  expect(validateMilestone(payment).input).toMatchObject({ name: 'Delivery', amount_cents: 800029, invoice_date: '2026-11-03', payment_terms_days: 7, receipt_override_date: null, receipt_override_reason: null })
  expect(validateMilestone({ ...payment, receipt_override_date: '2026-11-20' }).errors.receipt_override_reason).toBeDefined()
  expect(validateMilestone({ ...payment, receipt_override_date: '2026-11-20', receipt_override_reason: ' Client agreed date ' }).input).toMatchObject({ receipt_override_date: '2026-11-20', receipt_override_reason: 'Client agreed date' })
  expect(validateMilestone({ ...payment, receipt_override_reason: 'Old reason' }).input?.receipt_override_reason).toBeNull()
})
