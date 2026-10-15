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
