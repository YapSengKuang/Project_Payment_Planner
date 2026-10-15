export type Project = {
  id: string
  owner_id: string
  name: string
  client_name: string
  price_cents: number
  starting_cash_cents: number
  currency: 'AUD'
  start_date: string
  end_date: string
  tax_basis: 'inclusive' | 'exclusive'
  created_at: string
  updated_at: string
}
export type ProjectInput = Omit<Project, 'id' | 'owner_id' | 'created_at' | 'updated_at'>
export type ProjectFormValues = {
  name: string; client_name: string; price: string; starting_cash: string
  start_date: string; end_date: string; tax_basis: 'inclusive' | 'exclusive'
}
export type FormErrors = Partial<Record<keyof ProjectFormValues, string>>
// Matches the database ceiling; exact integer conversion avoids floating-point rounding.
export const MAX_CENTS = 99999999999
export function toCents(value: string): number | null {
  if (!/^\d+(\.\d{1,2})?$/.test(value.trim())) return null
  const [whole, fraction = ''] = value.trim().split('.')
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'))
  return Number.isSafeInteger(cents) && cents <= MAX_CENTS ? cents : null
}
export function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value < '1900-01-01' || value > '9999-12-31') return false
  const parsed = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}
export function validateProject(values: ProjectFormValues): { errors: FormErrors; input?: ProjectInput } {
  const errors: FormErrors = {}
  for (const field of ['name', 'client_name'] as const) {
    if (!values[field].trim()) errors[field] = field === 'name' ? 'Enter a project name.' : 'Enter a client name.'
    else if (values[field].trim().length > 160) errors[field] = 'Use 160 characters or fewer.'
  }
  const price = toCents(values.price)
  const cash = toCents(values.starting_cash)
  if (price === null || price <= 0) errors.price = 'Enter a positive amount with up to two decimal places (maximum $999,999,999.99).'
  if (cash === null) errors.starting_cash = 'Enter zero or a positive amount with up to two decimal places (maximum $999,999,999.99).'
  if (!validDate(values.start_date)) errors.start_date = 'Enter a valid start date from 1900 onwards.'
  if (!validDate(values.end_date)) errors.end_date = 'Enter a valid end date from 1900 onwards.'
  else if (validDate(values.start_date) && values.end_date < values.start_date) errors.end_date = 'End date must be on or after the start date.'
  if (!['inclusive', 'exclusive'].includes(values.tax_basis)) errors.tax_basis = 'Choose a GST convention.'
  if (Object.keys(errors).length) return { errors }
  return { errors, input: { name: values.name.trim(), client_name: values.client_name.trim(),
    price_cents: price!, starting_cash_cents: cash!, currency: 'AUD', start_date: values.start_date,
    end_date: values.end_date, tax_basis: values.tax_basis } }
}
export const money = (cents: number) => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(cents / 100)
export const displayDate = (value: string) => new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`))
