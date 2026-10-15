import { useMemo, useState } from 'react'
import { forecastCash } from '../lib/forecast'
import { displayDate, money, type Project } from '../lib/project'
import { paymentSummary, type Expense, type Milestone } from '../lib/schedule'
import ForecastChart from './ForecastChart'

type Props = { project: Project; expenses: Expense[]; milestones: Milestone[] }

export default function ForecastPanel({ project, expenses, milestones }: Props) {
  const [visibleDays, setVisibleDays] = useState(50)
  const result = useMemo(() => {
    try {
      return { forecast: forecastCash(project.starting_cash_cents,
        milestones.map(row => ({ date: row.expected_receipt_date, amount_cents: row.amount_cents, label: row.name })),
        expenses.map(row => ({ date: row.payment_date, amount_cents: row.amount_cents, label: row.description })),
        [project.start_date, project.end_date]) }
    } catch {
      return { error: 'This forecast cannot be calculated safely. Review the saved amounts and dates before trying again.' }
    }
  }, [project, expenses, milestones])
  if (!result.forecast) return <section className="panel"><h2>Cash forecast</h2><p role="alert" className="notice error">{result.error}</p></section>
  const forecast = result.forecast
  const complete = paymentSummary(project.price_cents, milestones).complete
  const hasGap = forecast.maximumGapCents > 0
  const hasEntries = expenses.length + milestones.length > 0
  const outsideDates = forecast.days.some(day => (day.date < project.start_date || day.date > project.end_date) && (day.receipts.length || day.expenses.length))
  return <section className="panel forecast-panel" aria-label="Cash forecast">
    <p className="eyebrow">EXPECTED CASH · AUD</p>
    <h2>See when your project needs funding</h2>
    <p className="muted">Based on your latest saved setup, expenses and expected receipts. Save any edits before reviewing the forecast.</p>
    {!complete && <p className="notice" role="status">Provisional forecast: client payments do not yet match the project price. Missing or excess receipts affect the funding gap.</p>}
    {!expenses.length && <p className="notice">No expenses entered. Add expected costs before using this forecast to assess funding needs.</p>}
    {outsideDates && <p className="notice">Some payments fall outside the project dates. They are included in full, so early expenses and late receipts are not hidden.</p>}
    <div className={`forecast-outcome ${hasGap ? 'has-gap' : ''}`} role="status">
      <h3>{!hasEntries ? 'Add a schedule to assess funding' : hasGap ? `${money(forecast.maximumGapCents)} maximum funding gap` : 'No funding gap in the entered schedule'}</h3>
      <p>{hasGap ? `First shortage: ${displayDate(forecast.firstShortageDate!)}. The largest shortfall is ${money(forecast.maximumGapCents)} below zero at a day's close, after using starting cash.` : 'The daily closing balance stays at or above zero for the saved entries. Expected payments are not guaranteed.'}</p>
    </div>
    <dl className="summary-grid forecast-totals">
      <div><dt>Starting cash allocated</dt><dd>{money(forecast.startingCashCents)}</dd></div>
      <div><dt>Expected receipts</dt><dd>{money(forecast.receiptsCents)}</dd></div>
      <div><dt>Expected expenses</dt><dd>{money(forecast.expensesCents)}</dd></div>
      <div><dt>Closing cash</dt><dd className={forecast.closingCashCents < 0 ? 'negative' : ''}>{money(forecast.closingCashCents)}</dd></div>
    </dl>
    <ForecastChart forecast={forecast}/>
    <details className="forecast-assumptions"><summary>How this forecast is calculated</summary><ul>
      <li>Starting cash is available immediately before the earliest date shown and is allocated only to this project.</li>
      <li>Receipts use expected receipt dates, including invoice terms or a saved override; completion and invoicing do not mean cash has arrived.</li>
      <li>Each day's receipts and expenses are netted before checking the closing balance. This does not show any shortage within that day.</li>
      <li>All amounts use your project's GST {project.tax_basis} convention. No extra tax, fees or unentered costs are added.</li>
      <li>The maximum gap is the deepest negative closing balance, rather than the sum of individual shortfalls. Figures are forecasts, not confirmed payments.</li>
    </ul></details>
    <h3>Cash timeline</h3>
    <p className="muted">Payment dates and project boundaries are shown. Between these dates the balance carries forward.</p>
    <div className="forecast-table-wrap"><table className="forecast-table">
      <caption className="sr-only">Expected receipts, expenses and daily closing cash balance in date order</caption>
      <thead><tr><th scope="col">Date</th><th scope="col">Expected receipts</th><th scope="col">Expected expenses</th><th scope="col">Closing balance</th></tr></thead>
      <tbody>{forecast.days.slice(0, visibleDays).map(day => <tr key={day.date} className={day.balanceCents < 0 ? 'shortage-row' : ''}>
        <th scope="row"><time dateTime={day.date}>{displayDate(day.date)}</time>{day.date === project.start_date && <small>Project starts</small>}{day.date === project.end_date && <small>Project ends</small>}{day.date === forecast.firstShortageDate && <small className="negative">First shortage</small>}</th>
        <td data-label="Expected receipts"><span>{money(day.receiptsCents)}</span>{day.receipts.map((event, index) => <small key={index}>{event.label} · {money(event.amount_cents)}</small>)}</td>
        <td data-label="Expected expenses"><span>{money(day.expensesCents)}</span>{day.expenses.map((event, index) => <small key={index}>{event.label} · {money(event.amount_cents)}</small>)}</td>
        <td data-label="Closing balance" className={day.balanceCents < 0 ? 'negative' : ''}><strong>{money(day.balanceCents)}</strong>{day.balanceCents < 0 && <small>Funding needed</small>}</td>
      </tr>)}</tbody>
    </table></div>
    {forecast.days.length > visibleDays && <button className="button secondary" onClick={() => setVisibleDays(count => count + 50)}>Show more dates ({forecast.days.length - visibleDays} remaining)</button>}
  </section>
}
