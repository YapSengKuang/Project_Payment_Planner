import { useState } from 'react'
import type { FormEvent } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'

export default function Auth({ client }: { client: SupabaseClient }) {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
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
  return <section className="panel auth-panel" aria-labelledby="auth-title"><p className="eyebrow">YOUR WORKSPACE</p><h2 id="auth-title">Good plans start here.</h2><p className="muted">Sign in to keep your projects saved and private.</p>
    {sent && <p role="status" className="notice">Check your inbox for a sign-in link. Links expire; request a new one here if needed.</p>}
    <form onSubmit={submit}><label className="field" htmlFor="email"><span>Email address</span><input autoComplete="email" id="email" type="email" required value={email} disabled={busy} placeholder="you@yourbusiness.com" onChange={e => setEmail(e.target.value)} /></label>
    {error && <p className="notice error" role="alert">{error}</p>}
    <button className="button full" disabled={busy}>{busy ? 'Sending…' : sent ? 'Send a new link' : 'Email me a sign-in link'} <span aria-hidden="true">↗</span></button></form><p className="fine-print">No password to remember. New here? Your first link creates your account.</p></section>
}
