import { useId, useState } from 'react'
import type { Forecast } from '../lib/forecast'
import { displayDate, money } from '../lib/project'

export default function ForecastChart({ forecast }: { forecast: Forecast }) {
  const clipId = useId().replace(/:/g, '')
  const [selectedDate, setSelectedDate] = useState('')
  const { days } = forecast
  if (!days.length) return null
  const selectedIndex = Math.max(0, days.findIndex(day => day.date === selectedDate))
  const selected = days[selectedIndex]
  const balances = [0, forecast.startingCashCents, ...days.map(day => day.balanceCents)]
  // Use reductions rather than spreading a potentially large schedule into Math.min/max.
  const min = balances.reduce((a, b) => Math.min(a, b), 0)
  const max = balances.reduce((a, b) => Math.max(a, b), 0)
  const padding = Math.max((max - min) * 0.1, 100)
  const y = (amount: number) => 20 + (max + padding - amount) / (max - min + 2 * padding) * 200
  const firstTime = Date.parse(`${days[0].date}T00:00:00Z`)
  const lastTime = Date.parse(`${days[days.length - 1].date}T00:00:00Z`)
  const x = (date: string) => lastTime === firstTime ? 380 : 40 + (Date.parse(`${date}T00:00:00Z`) - firstTime) / (lastTime - firstTime) * 680
  const path = `M40,${y(forecast.startingCashCents)} ` + days.map(day => `H${x(day.date)} V${y(day.balanceCents)}`).join(' ') + ` H720`
  return <figure className="forecast-chart" aria-label="Cash balance chart">
    <figcaption><h3>Expected cash balance</h3><p>Daily closing cash; the line stays flat between payment dates.</p></figcaption>
    <div className="chart-scale"><span>Highest {money(max)}</span><span>Lowest {money(min)}</span></div>
    <svg viewBox="0 0 760 240" role="img" aria-label="Cash balance over time. The red portion is below zero. Exact amounts are in the cash timeline.">
      <defs><clipPath id={clipId}><rect x="0" y={y(0)} width="760" height={240 - y(0)}/></clipPath></defs>
      <line x1="40" x2="720" y1={y(0)} y2={y(0)} className="chart-zero"/>
      <text x="4" y={y(0) + 4} className="chart-zero-label">$0</text>
      <path d={path} className="chart-balance"/>
      <path d={path} className="chart-deficit" clipPath={`url(#${clipId})`}/>
      <line x1={x(selected.date)} x2={x(selected.date)} y1="12" y2="228" className="chart-cursor"/>
      <circle cx={x(selected.date)} cy={y(selected.balanceCents)} r="6" className={selected.balanceCents < 0 ? 'chart-point deficit' : 'chart-point'}/>
    </svg>
    <div className="chart-date-range"><span>{displayDate(days[0].date)}</span><span>{displayDate(days[days.length - 1].date)}</span></div>
    <label className="chart-control">Explore a date
      <input type="range" min="0" max={days.length - 1} value={selectedIndex} disabled={days.length === 1}
        aria-valuetext={`${displayDate(selected.date)}: ${money(selected.balanceCents)} closing cash`}
        onChange={event => setSelectedDate(days[Number(event.target.value)].date)}/>
    </label>
    <p className="chart-reading" aria-live="polite"><time dateTime={selected.date}>{displayDate(selected.date)}</time><strong className={selected.balanceCents < 0 ? 'negative' : ''}>{money(selected.balanceCents)} closing cash</strong>{selected.balanceCents < 0 && <span>Funding needed</span>}</p>
  </figure>
}
