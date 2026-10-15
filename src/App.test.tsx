import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, it, vi } from 'vitest'
import type { Session } from '@supabase/supabase-js'
const mocks = vi.hoisted(() => ({
  listener: null as null | ((event: string, session: Session | null) => void),
  getSession: vi.fn(), signOut: vi.fn(), unsubscribe: vi.fn(), load: vi.fn(), save: vi.fn(), demo: vi.fn(),
}))
vi.mock('./lib/supabase', () => ({ supabase: { auth: {
  getSession: mocks.getSession, signOut: mocks.signOut,
  onAuthStateChange: (listener: typeof mocks.listener) => { mocks.listener = listener; return { data: { subscription: { unsubscribe: mocks.unsubscribe } } } },
} } }))
vi.mock('./lib/projects-api', () => ({ loadProjects: mocks.load, saveProject: mocks.save }))
vi.mock('./lib/demo-api', () => ({ loadDemoProjects: mocks.demo }))
vi.mock('./lib/schedule-api', () => ({ loadExpenses: vi.fn().mockResolvedValue([]), loadMilestones: vi.fn().mockResolvedValue([]) }))
import App from './App'
const session = (id: string) => ({ user: { id, email: `${id}@example.com` } }) as Session
const project = { id: 'p1', owner_id: 'a', name: 'Private project A', client_name: 'Client A', price_cents: 1000000, starting_cash_cents: 0, currency: 'AUD', start_date: '2026-11-01', end_date: '2026-11-30', tax_basis: 'inclusive', created_at: '', updated_at: '' }
beforeEach(() => {
  mocks.getSession.mockReset().mockResolvedValue({ data: { session: session('a') }, error: null })
  mocks.load.mockReset().mockResolvedValue([project])
  mocks.signOut.mockReset().mockResolvedValue({ error: null })
  mocks.demo.mockReset().mockResolvedValue([ { ...project, id: 'demo', name: 'Demo · Website redesign' }, { ...project, id: 'draft', name: 'Demo · Incomplete draft' } ])
})
it('restores a saved session and clears previous account records before loading another account', async () => {
  render(<App />)
  expect(await screen.findByRole('heading', { name: 'Private project A' })).toBeInTheDocument()
  mocks.load.mockResolvedValueOnce([])
  act(() => mocks.listener!('SIGNED_IN', session('b')))
  expect(screen.queryByRole('heading', { name: 'Private project A' })).not.toBeInTheDocument()
  expect(await screen.findByText('Your next project starts here')).toBeInTheDocument()
})
it('ignores late project responses after an account change', async () => {
  let resolve!: (value: typeof project[]) => void
  mocks.load.mockImplementationOnce(() => new Promise(done => { resolve = done })).mockResolvedValueOnce([])
  render(<App />)
  await waitFor(() => expect(mocks.load).toHaveBeenCalled())
  act(() => mocks.listener!('SIGNED_IN', session('b')))
  await screen.findByText('Your next project starts here')
  await act(async () => resolve([project]))
  expect(screen.queryByRole('heading', { name: 'Private project A' })).not.toBeInTheDocument()
})
it('clears projects on sign-out and returns to the sign-in form', async () => {
  mocks.signOut.mockImplementationOnce(async () => { mocks.listener!('SIGNED_OUT', null); return { error: null } })
  render(<App />)
  await screen.findByRole('heading', { name: 'Private project A' })
  await userEvent.click(screen.getByRole('button', { name: 'Sign out' }))
  expect(await screen.findByLabelText('Email address')).toBeInTheDocument()
  expect(screen.queryByRole('heading', { name: 'Private project A' })).not.toBeInTheDocument()
})
it('offers retry after failing to load projects', async () => {
  mocks.load.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce([project])
  render(<App />)
  expect(await screen.findByRole('alert')).toHaveTextContent('could not be loaded')
  await userEvent.click(screen.getByRole('button', { name: 'Retry' }))
  expect(await screen.findByRole('heading', { name: 'Private project A' })).toBeInTheDocument()
})

it('loads the demo, blocks overlapping actions, then opens it without losing other projects', async () => {
  let finish!: (rows: typeof project[]) => void
  mocks.demo.mockImplementationOnce(() => new Promise(resolve => { finish = resolve }))
  const user = userEvent.setup()
  render(<App/>)
  await screen.findByRole('heading', { name: 'Private project A' })
  await user.click(screen.getByRole('button', { name: 'Load demo projects' }))
  expect(screen.getByRole('button', { name: 'Loading demo projects…' })).toBeDisabled()
  expect(screen.getByRole('button', { name: 'Sign out' })).toBeDisabled()
  expect(screen.getByRole('button', { name: /New project/ })).toBeDisabled()
  await act(async () => finish([{ ...project, id: 'demo', name: 'Demo · Website redesign' }, { ...project, id: 'draft', name: 'Demo · Incomplete draft' }]))
  expect(await screen.findByRole('heading', { name: 'Demo · Website redesign' })).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: '← All projects' }))
  expect(screen.getByRole('heading', { name: 'Private project A' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'All projects 3' })).toBeInTheDocument()
})
it('allows a demo retry after failure without clearing existing project records', async () => {
  mocks.demo.mockRejectedValueOnce(new Error('Offline'))
  const user = userEvent.setup()
  render(<App/>)
  await screen.findByRole('heading', { name: 'Private project A' })
  await user.click(screen.getByRole('button', { name: 'Load demo projects' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Demo projects could not be loaded')
  expect(screen.getByRole('heading', { name: 'Private project A' })).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Load demo projects' }))
  expect(await screen.findByRole('heading', { name: 'Demo · Website redesign' })).toBeInTheDocument()
})
it('ignores a late demo response after the account changes', async () => {
  let finish!: (rows: typeof project[]) => void
  mocks.demo.mockImplementationOnce(() => new Promise(resolve => { finish = resolve }))
  render(<App/>)
  await screen.findByRole('heading', { name: 'Private project A' })
  await userEvent.click(screen.getByRole('button', { name: 'Load demo projects' }))
  mocks.load.mockResolvedValueOnce([])
  act(() => mocks.listener!('SIGNED_IN', session('b')))
  await screen.findByText('Your next project starts here')
  await act(async () => finish([{ ...project, name: 'Old account demo' }, { ...project, id: 'draft' }]))
  expect(screen.queryByText('Old account demo')).not.toBeInTheDocument()
})
