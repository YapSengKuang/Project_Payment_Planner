import { validDate } from './project'

export type CashEvent = { date: string; amount_cents: number; label: string }
export type ForecastDay = {
  date: string
  receipts: CashEvent[]
  expenses: CashEvent[]
  receiptsCents: number
  expensesCents: number
  balanceCents: number
}
export type Forecast = {
  days: ForecastDay[]
  startingCashCents: number
  receiptsCents: number
  expensesCents: number
  closingCashCents: number
  firstShortageDate: string | null
  maximumGapCents: number
}

function checked(value: number): number {
  if (!Number.isSafeInteger(value)) throw new Error('Forecast amounts exceed the supported range of whole cents.')
  return value
}

/** Date-only movements, netted at each day's close. Boundary days carry the balance forward. */
export function forecastCash(startingCashCents: number, receipts: CashEvent[], expenses: CashEvent[], boundaries: string[] = []): Forecast {
  checked(startingCashCents)
  if (startingCashCents < 0) throw new Error('Starting cash must be zero or positive.')
  const byDate = new Map<string, ForecastDay>()
  function dayFor(date: string) {
    if (!validDate(date)) throw new Error('Forecast contains an invalid calendar date.')
    let day = byDate.get(date)
    if (!day) {
      day = { date, receipts: [], expenses: [], receiptsCents: 0, expensesCents: 0, balanceCents: 0 }
      byDate.set(date, day)
    }
    return day
  }
  boundaries.forEach(dayFor)
  for (const [kind, events] of [['receipts', receipts], ['expenses', expenses]] as const) {
    for (const event of events) {
      checked(event.amount_cents)
      if (event.amount_cents <= 0) throw new Error('Forecast entries must have positive amounts.')
      const day = dayFor(event.date)
      day[kind].push({ ...event })
      const key = kind === 'receipts' ? 'receiptsCents' : 'expensesCents'
      day[key] = checked(day[key] + event.amount_cents)
    }
  }
  const days = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date))
  let balance = startingCashCents
  let minimum = startingCashCents
  let firstShortageDate: string | null = null
  let receiptsCents = 0
  let expensesCents = 0
  for (const day of days) {
    receiptsCents = checked(receiptsCents + day.receiptsCents)
    expensesCents = checked(expensesCents + day.expensesCents)
    balance = checked(balance + checked(day.receiptsCents - day.expensesCents))
    day.balanceCents = balance
    minimum = Math.min(minimum, balance)
    if (balance < 0 && firstShortageDate === null) firstShortageDate = day.date
  }
  return { days, startingCashCents, receiptsCents, expensesCents, closingCashCents: balance,
    firstShortageDate, maximumGapCents: Math.max(0, -minimum) }
}
