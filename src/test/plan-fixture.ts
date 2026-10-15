import type { PlanBaseline } from '../lib/plan'
const meta = { project_id: 'p', created_at: '2026-10-15T00:00:00Z', updated_at: '2026-10-15T00:00:00Z' }
const payment = { ...meta, completion_date: '2026-11-01', invoice_date: '2026-11-01', payment_terms_days: 0, receipt_override_date: null, receipt_override_reason: null }
export const planFixture: PlanBaseline = {
  project: { id: 'p', owner_id: 'owner', name: 'Example project', client_name: 'Example client', currency: 'AUD', price_cents: 1000000, starting_cash_cents: 0, start_date: '2026-11-01', end_date: '2026-11-30', tax_basis: 'inclusive', created_at: meta.created_at, updated_at: meta.updated_at },
  expenses: [
    { ...meta, id: 'e1', description: 'Materials', amount_cents: 300000, payment_date: '2026-11-05' },
    { ...meta, id: 'e2', description: 'Labour', amount_cents: 400000, payment_date: '2026-11-20' },
  ],
  milestones: [
    { ...payment, id: 'd', kind: 'deposit', name: 'Deposit', amount_cents: 200000, expected_receipt_date: '2026-11-01' },
    { ...payment, id: 'm', kind: 'milestone', name: 'Delivery', amount_cents: 800000, completion_date: '2026-11-08', invoice_date: '2026-11-08', payment_terms_days: 7, expected_receipt_date: '2026-11-15' },
  ],
}
