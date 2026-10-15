import { forecastCash } from './forecast'
import { MAX_CENTS, validDate, type Project } from './project'
import type { Expense, Milestone } from './schedule'

export type PlanBaseline = { project: Project; expenses: Expense[]; milestones: Milestone[] }
export type PlanSettings = { receiptDelayDays: number; expenseIncreasePercent: number }
export const initialSettings = (): PlanSettings => ({ receiptDelayDays: 0, expenseIncreasePercent: 0 })

export function shiftDate(date: string, days: number): string {
  if (!validDate(date) || !Number.isInteger(days) || days < 0 || days > 365) throw new Error('Use a receipt delay from 0 to 365 whole calendar days.')
  const value = new Date(`${date}T00:00:00Z`)
  value.setUTCDate(value.getUTCDate() + days)
  const result = value.toISOString().slice(0, 10)
  if (!validDate(result)) throw new Error('A delayed receipt falls outside the supported date range.')
  return result
}

export function comparePlan(baseline: PlanBaseline, settings: PlanSettings) {
  if (!Number.isInteger(settings.expenseIncreasePercent) || settings.expenseIncreasePercent < 0 || settings.expenseIncreasePercent > 100) {
    throw new Error('Use an expense increase from 0 to 100 whole percent.')
  }
  if (!Number.isInteger(settings.receiptDelayDays) || settings.receiptDelayDays < 0 || settings.receiptDelayDays > 365) {
    throw new Error('Use a receipt delay from 0 to 365 whole calendar days.')
  }
  const milestones = baseline.milestones.map(row => ({ ...row, expected_receipt_date: shiftDate(row.expected_receipt_date, settings.receiptDelayDays) }))
  const expenses = baseline.expenses.map(row => {
    // BigInt implements half-up rounding per expense without floating-point multiplication.
    const cents = Number((BigInt(row.amount_cents) * BigInt(100 + settings.expenseIncreasePercent) + 50n) / 100n)
    if (cents > MAX_CENTS) throw new Error('An increased expense exceeds the supported amount. Reduce the percentage.')
    return { ...row, amount_cents: cents }
  })
  const calculate = (costs: Expense[], receipts: Milestone[]) => forecastCash(baseline.project.starting_cash_cents,
    receipts.map(row => ({ date: row.expected_receipt_date, amount_cents: row.amount_cents, label: row.name })),
    costs.map(row => ({ date: row.payment_date, amount_cents: row.amount_cents, label: row.description })),
    [baseline.project.start_date, baseline.project.end_date])
  return { original: calculate(baseline.expenses, baseline.milestones), proposed: calculate(expenses, milestones), expenses, milestones }
}
