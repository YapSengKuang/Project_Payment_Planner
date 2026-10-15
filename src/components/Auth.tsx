import { useState } from 'react'
import type { FormEvent } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'

export default function Auth({ client }: { client: SupabaseClient }) {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [googleBusy, setGoogleBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError('')
    try {
      const { error } = await client.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: window.location.origin } })
      if (error) throw error
      setSent(true)
    } catch { setError('We could not send your sign-in link. Check your email address and connection, then try again.') }
    finally { setBusy(false) }
  }
  async function googleSignIn() {
    setGoogleBusy(true); setError('')
    try {
      const { error } = await client.auth.signInWithOAuth({
        provider: 'google', options: { redirectTo: window.location.origin, queryParams: { prompt: 'select_account' } },
      })
      if (error) throw error
    } catch { setError('Google sign-in could not be started. Try again or use an email link. Google must be enabled for this workspace.') }
    finally { setGoogleBusy(false) }
  }
  return <section className="panel auth-panel" aria-labelledby="auth-title"><p className="eyebrow">YOUR WORKSPACE</p><h2 id="auth-title">Good plans start here.</h2><p className="muted">Sign in to keep your projects saved and private.</p>
    <button className="button secondary full google-button" type="button" disabled={busy || googleBusy} onClick={() => void googleSignIn()}><span aria-hidden="true">G</span>{googleBusy ? 'Connecting to Google…' : 'Continue with Google'}</button>
    <div className="auth-divider"><span>or use your email</span></div>
    {sent && <p role="status" className="notice">Check your inbox for a sign-in link. Links expire; request a new one here if needed.</p>}
    <form onSubmit={submit}><label className="field" htmlFor="email"><span>Email address</span><input autoComplete="email" id="email" type="email" required value={email} disabled={busy || googleBusy} placeholder="you@yourbusiness.com" onChange={e => setEmail(e.target.value)} /></label>
    <button className="button full" disabled={busy || googleBusy}>{busy ? 'Sending…' : sent ? 'Send a new link' : 'Email me a sign-in link'} <span aria-hidden="true">↗</span></button></form>{error && <p className="notice error" role="alert">{error}</p>}<p className="fine-print">No password to remember. New here? Your first link creates your account.</p></section>
}
