import { forecastCash } from './forecast'
import { MAX_CENTS, money, toCents, validDate, type Project } from './project'
import { totalCents, type Expense, type Milestone } from './schedule'

export type PlanBaseline = { project: Project; expenses: Expense[]; milestones: Milestone[] }
export type PaymentChange = { id: string; amount_cents: number; receipt_date: string; reason: string }
export type PlanSettings = { receiptDelayDays: number; expenseIncreasePercent: number; depositCapCents: number; changes: PaymentChange[] }
export const initialSettings = (price: number): PlanSettings => ({ receiptDelayDays: 0, expenseIncreasePercent: 0, depositCapCents: price, changes: [] })
export type PlanValues = { delay: string; increase: string; cap: string; payments: { id: string; amount: string; date: string; reason: string }[] }
export function planValues(baseline: PlanBaseline, settings: PlanSettings): PlanValues {
  return { delay: String(settings.receiptDelayDays), increase: String(settings.expenseIncreasePercent), cap: (settings.depositCapCents / 100).toFixed(2),
    payments: baseline.milestones.map(row => {
      const change = settings.changes.find(item => item.id === row.id)
      return { id: row.id, amount: ((change?.amount_cents ?? row.amount_cents) / 100).toFixed(2), date: change?.receipt_date ?? row.expected_receipt_date, reason: change?.reason ?? '' }
    }) }
}
export function settingsFromValues(baseline: PlanBaseline, values: PlanValues): PlanSettings {
  if (!/^\d{1,3}$/.test(values.delay) || !/^\d{1,3}$/.test(values.increase)) throw new Error('Enter whole numbers for both scenario controls.')
  const cap = toCents(values.cap)
  if (cap === null) throw new Error('Enter a valid maximum total deposit amount in AUD.')
  const changes = values.payments.flatMap(payment => {
    const original = baseline.milestones.find(row => row.id === payment.id)
    if (!original) throw new Error('Unknown payment in proposal.')
    const amount = toCents(payment.amount)
    if (amount === null || amount <= 0) throw new Error('Every proposed payment needs a positive amount with up to two decimal places.')
    return amount === original.amount_cents && payment.date === original.expected_receipt_date ? [] : [{ id: payment.id, amount_cents: amount, receipt_date: payment.date, reason: payment.reason.trim() }]
  })
  return { receiptDelayDays: Number(values.delay), expenseIncreasePercent: Number(values.increase), depositCapCents: cap, changes }
}

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
  if (!Number.isSafeInteger(settings.depositCapCents) || settings.depositCapCents < 0 || settings.depositCapCents > baseline.project.price_cents) throw new Error('The maximum total deposit must be between zero and the project price.')
  const changes = new Map<string, PaymentChange>()
  for (const change of settings.changes) {
    if (changes.has(change.id) || !baseline.milestones.some(row => row.id === change.id)) throw new Error('Duplicate or unknown payment in proposal.')
    if (!Number.isSafeInteger(change.amount_cents) || change.amount_cents <= 0 || change.amount_cents > MAX_CENTS || !validDate(change.receipt_date)) throw new Error('Each payment needs a positive amount and valid receipt date.')
    if (!change.reason.trim() || change.reason.trim().length > 500) throw new Error('Explain each changed payment in 1 to 500 characters.')
    changes.set(change.id, change)
  }
  const milestones = baseline.milestones.map(row => {
    const change = changes.get(row.id)
    return { ...row, amount_cents: change?.amount_cents ?? row.amount_cents,
      expected_receipt_date: shiftDate(change?.receipt_date ?? row.expected_receipt_date, settings.receiptDelayDays) }
  })
  if (totalCents(milestones) !== totalCents(baseline.milestones)) throw new Error('Keep the total client payments unchanged: balance increases with reductions to other payments.')
  if (totalCents(milestones.filter(row => row.kind === 'deposit')) > settings.depositCapCents) throw new Error('Proposed deposits exceed your maximum total deposit. Adjust their amounts or review the limit.')
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

export function suggestDeposit(baseline: PlanBaseline, settings: PlanSettings) {
  const current = comparePlan(baseline, settings)
  const gap = current.proposed.maximumGapCents
  const unavailable = (explanation: string) => ({ settings, movedCents: 0, remainingGapCents: gap, explanation })
  if (!gap) return unavailable('This proposal has no daily closing funding gap to reduce.')
  const deposit = current.milestones.filter(row => row.kind === 'deposit' && row.expected_receipt_date <= current.proposed.firstShortageDate!).sort((a, b) => a.expected_receipt_date.localeCompare(b.expected_receipt_date))[0]
  if (!deposit) return unavailable('No deposit is expected by the first shortage. Review an earlier receipt date manually; increasing a later deposit cannot cover that first shortage.')
  const donors = current.milestones.filter(row => row.kind === 'milestone' && row.expected_receipt_date > current.proposed.firstShortageDate!).sort((a, b) => b.expected_receipt_date.localeCompare(a.expected_receipt_date))
  const available = donors.reduce((sum, row) => sum + row.amount_cents - 1, 0)
  const headroom = settings.depositCapCents - totalCents(current.milestones.filter(row => row.kind === 'deposit'))
  const moved = Math.min(gap, headroom, available, MAX_CENTS - deposit.amount_cents)
  if (moved <= 0) return unavailable('Your deposit limit or available later milestone amounts prevent an increase. Review receipt timing or other funding; the remaining gap is unchanged.')
  const changes = new Map(settings.changes.map(change => [change.id, { ...change }]))
  function changeAmount(row: Milestone, amount: number) {
    const original = baseline.milestones.find(item => item.id === row.id)!
    changes.set(row.id, { id: row.id, amount_cents: amount, receipt_date: changes.get(row.id)?.receipt_date ?? original.expected_receipt_date,
      reason: `Move ${money(moved)} from later milestones into the earlier deposit to reduce the funding gap; total project receipts stay unchanged.` })
  }
  changeAmount(deposit, deposit.amount_cents + moved)
  let remaining = moved
  for (const row of donors) {
    const reduction = Math.min(remaining, row.amount_cents - 1)
    if (reduction > 0) changeAmount(row, row.amount_cents - reduction)
    remaining -= reduction
    if (!remaining) break
  }
  const next = { ...settings, changes: [...changes.values()] }
  const after = comparePlan(baseline, next)
  return { settings: next, movedCents: moved, remainingGapCents: after.proposed.maximumGapCents,
    explanation: `Move ${money(moved)} into ${deposit.name} from later milestones. Total client payments stay unchanged. The maximum gap changes from ${money(gap)} to ${money(after.proposed.maximumGapCents)}, within your ${money(settings.depositCapCents)} total deposit limit.` }
}
