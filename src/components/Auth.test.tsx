import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { SupabaseClient } from '@supabase/supabase-js'
import { expect, it, vi } from 'vitest'
import Auth from './Auth'
it('requests a sign-in link and handles delivery errors with retry', async () => {
  const signInWithOtp = vi.fn().mockResolvedValueOnce({ error: new Error('offline') }).mockResolvedValueOnce({ error: null })
  const client = { auth: { signInWithOtp } } as unknown as SupabaseClient
  render(<Auth client={client} />)
  await userEvent.type(screen.getByLabelText('Email address'), 'owner@example.com')
  await userEvent.click(screen.getByRole('button', { name: /email me/i }))
  expect(await screen.findByRole('alert')).toHaveTextContent('could not send')
  await userEvent.click(screen.getByRole('button', { name: /email me/i }))
  expect(await screen.findByRole('status')).toHaveTextContent('Check your inbox')
  expect(signInWithOtp).toHaveBeenLastCalledWith({ email: 'owner@example.com', options: { emailRedirectTo: window.location.origin } })
})

it('starts Google OAuth with the current origin and handles provider errors', async () => {
  const signInWithOAuth = vi.fn().mockResolvedValueOnce({ error: new Error('provider disabled') }).mockResolvedValueOnce({ error: null })
  const client = { auth: { signInWithOAuth } } as unknown as SupabaseClient
  render(<Auth client={client} />)
  await userEvent.click(screen.getByRole('button', { name: 'Continue with Google' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Google sign-in could not be started')
  await userEvent.click(screen.getByRole('button', { name: 'Continue with Google' }))
  expect(signInWithOAuth).toHaveBeenLastCalledWith({ provider: 'google', options: { redirectTo: window.location.origin, queryParams: { prompt: 'select_account' } } })
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})
