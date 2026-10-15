import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { planFixture } from '../test/plan-fixture'
import { initialSettings } from '../lib/plan'
import type { PlanRevision } from '../lib/revisions-api'
vi.mock('../lib/revisions-api', () => ({ listRevisions: vi.fn(), loadRevision: vi.fn(), saveRevision: vi.fn() }))
import { listRevisions, loadRevision, saveRevision } from '../lib/revisions-api'
import PlanWorkspace from './PlanWorkspace'

const saved: PlanRevision = { id: 'r1', project_id: 'p', name: 'Original terms', schema_version: 1, baseline: planFixture,
  settings: initialSettings(planFixture.project.price_cents), source_revision_id: null, created_at: '2026-10-15T00:00:00Z' }

it('preserves failed-save inputs, retries, and selects the newly saved immutable revision', async () => {
  vi.mocked(listRevisions).mockResolvedValue([])
  vi.mocked(saveRevision).mockRejectedValueOnce(new Error('Offline')).mockResolvedValueOnce(saved)
  const user = userEvent.setup(), busy = vi.fn()
  render(<PlanWorkspace client={{} as SupabaseClient} baseline={planFixture} onBusyChange={busy}/>)
  await user.type(screen.getByLabelText('Revision name'), 'Original terms')
  await user.click(screen.getByRole('button', { name: 'Save named revision' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Revision not saved. Offline')
  expect(screen.getByLabelText('Revision name')).toHaveValue('Original terms')
  expect(busy).toHaveBeenCalledWith(true)
  expect(busy).toHaveBeenLastCalledWith(false)
  await user.click(screen.getByRole('button', { name: 'Save named revision' }))
  expect(await screen.findByText(/Revision “Original terms” saved/)).toBeInTheDocument()
  expect(screen.getByLabelText('Compare from')).toHaveValue('r1')
})

it('reopens a preserved baseline even when the working schedule has changed', async () => {
  vi.mocked(listRevisions).mockResolvedValue([saved])
  vi.mocked(loadRevision).mockResolvedValue(saved)
  const user = userEvent.setup()
  render(<PlanWorkspace client={{} as SupabaseClient} baseline={{ ...planFixture, milestones: [] }} onBusyChange={vi.fn()}/>)
  await screen.findByRole('option', { name: /Original terms/ })
  await user.selectOptions(screen.getByLabelText('Compare from'), 'r1')
  expect(await screen.findByText(/Source: Original terms/)).toBeInTheDocument()
  expect(screen.getByLabelText('Deposit proposed amount (AUD)')).toHaveValue('2000.00')
  expect(screen.getByRole('button', { name: 'Save named revision' })).toBeEnabled()
})
