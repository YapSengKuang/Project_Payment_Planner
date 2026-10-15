import { toCents, validDate } from './project'
export type Expense = {
  id: string; project_id: string; description: string; amount_cents: number; payment_date: string
  created_at: string; updated_at: string
}
export type ExpenseInput = Pick<Expense, 'description' | 'amount_cents' | 'payment_date'>
export type ExpenseValues = { description: string; amount: string; payment_date: string }
export type Errors<T> = Partial<Record<keyof T, string>>
export function validateExpense(values: ExpenseValues): { errors: Errors<ExpenseValues>; input?: ExpenseInput } {
  const errors: Errors<ExpenseValues> = {}
  if (!values.description.trim() || values.description.trim().length > 160) errors.description = 'Enter a description of 1 to 160 characters.'
  const amount = toCents(values.amount)
  if (amount === null || amount <= 0) errors.amount = 'Enter a positive amount with up to two decimal places (maximum $999,999,999.99).'
  if (!validDate(values.payment_date)) errors.payment_date = 'Enter a valid expected payment date.'
  if (Object.keys(errors).length) return { errors }
  return { errors, input: { description: values.description.trim(), amount_cents: amount!, payment_date: values.payment_date } }
}
export function totalCents(rows: { amount_cents: number }[]): number {
  const total = rows.reduce((sum, row) => sum + row.amount_cents, 0)
  if (!Number.isSafeInteger(total)) throw new Error('Schedule total exceeds the supported amount.')
  return total
}

export type Milestone = {
  id: string; project_id: string; kind: 'deposit' | 'milestone'; name: string; amount_cents: number
  completion_date: string; invoice_date: string; payment_terms_days: number
  receipt_override_date: string | null; receipt_override_reason: string | null; expected_receipt_date: string
  created_at: string; updated_at: string
}
export type MilestoneInput = Omit<Milestone, 'id' | 'project_id' | 'expected_receipt_date' | 'created_at' | 'updated_at'>
export type MilestoneValues = {
  kind: 'deposit' | 'milestone'; name: string; amount: string; completion_date: string; invoice_date: string
  payment_terms_days: string; receipt_override_date: string; receipt_override_reason: string
}
export function expectedReceiptDate(invoice: string, terms: string): string | null {
  if (!validDate(invoice) || !/^\d{1,3}$/.test(terms) || Number(terms) > 365) return null
  const result = new Date(`${invoice}T00:00:00Z`)
  result.setUTCDate(result.getUTCDate() + Number(terms))
  const value = result.toISOString().slice(0, 10)
  return validDate(value) ? value : null
}
export function validateMilestone(values: MilestoneValues): { errors: Errors<MilestoneValues>; input?: MilestoneInput } {
  const errors: Errors<MilestoneValues> = {}
  if (!['deposit', 'milestone'].includes(values.kind)) errors.kind = 'Choose deposit or milestone.'
  if (!values.name.trim() || values.name.trim().length > 160) errors.name = 'Enter a name of 1 to 160 characters.'
  const amount = toCents(values.amount)
  if (amount === null || amount <= 0) errors.amount = 'Enter a positive amount with up to two decimal places (maximum $999,999,999.99).'
  if (!validDate(values.completion_date)) errors.completion_date = 'Enter a valid completion or deposit date.'
  if (!validDate(values.invoice_date)) errors.invoice_date = 'Enter a valid invoice date.'
  if (!/^\d{1,3}$/.test(values.payment_terms_days) || Number(values.payment_terms_days) > 365) errors.payment_terms_days = 'Enter whole calendar days from 0 to 365.'
  else if (validDate(values.invoice_date) && !expectedReceiptDate(values.invoice_date, values.payment_terms_days)) errors.invoice_date = 'Invoice date plus payment terms must be within the supported date range.'
  if (values.receipt_override_date) {
    if (!validDate(values.receipt_override_date)) errors.receipt_override_date = 'Enter a valid override receipt date.'
    if (!values.receipt_override_reason.trim() || values.receipt_override_reason.trim().length > 500) errors.receipt_override_reason = 'Explain the override in 1 to 500 characters.'
  }
  if (Object.keys(errors).length) return { errors }
  return { errors, input: { kind: values.kind, name: values.name.trim(), amount_cents: amount!, completion_date: values.completion_date,
    invoice_date: values.invoice_date, payment_terms_days: Number(values.payment_terms_days),
    receipt_override_date: values.receipt_override_date || null, receipt_override_reason: values.receipt_override_date ? values.receipt_override_reason.trim() : null } }
}

export function paymentSummary(priceCents: number, payments: { amount_cents: number }[]) {
  const receipts = totalCents(payments)
  const difference = priceCents - receipts
  return { receipts, difference, complete: payments.length > 0 && difference === 0 }
}
