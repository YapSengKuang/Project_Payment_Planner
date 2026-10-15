import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { forecastCash } from '../lib/forecast'
import ForecastChart from './ForecastChart'

it('allows keyboard/slider exploration of exact dated balances and recovers selection after data changes', () => {
  const forecast = forecastCash(0, [{ date: '2026-11-01', amount_cents: 200000, label: 'Deposit' }],
    [{ date: '2026-11-05', amount_cents: 300000, label: 'Materials' }])
  const { rerender } = render(<ForecastChart forecast={forecast}/>)
  expect(screen.getByRole('img')).toHaveAccessibleName(/red portion is below zero/)
  const slider = screen.getByRole('slider', { name: 'Explore a date' })
  expect(slider).toHaveAttribute('aria-valuetext', '1 Nov 2026: $2,000.00 closing cash')
  fireEvent.change(slider, { target: { value: '1' } })
  expect(slider).toHaveAttribute('aria-valuetext', '5 Nov 2026: -$1,000.00 closing cash')
  expect(screen.getByText('-$1,000.00 closing cash')).toBeInTheDocument()
  rerender(<ForecastChart forecast={forecastCash(0, [], [], ['2026-12-01'])}/>)
  expect(slider).toBeDisabled()
  expect(slider).toHaveAttribute('aria-valuetext', '1 Dec 2026: $0.00 closing cash')
})
