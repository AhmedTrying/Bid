'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { Icon } from '@/components/ui/icon'

export default function LoginPage() {
  const login  = useStore(s => s.login)
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true); setError('')
    const res = await login(email.trim(), password)
    setBusy(false)
    if (res.ok) router.push('/home')
    else setError(res.error || 'Login failed')
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bf-bg, #f6f5f3)', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 22, justifyContent: 'center' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--bf-accent, #c8841f)', display: 'grid', placeItems: 'center' }}>
            <Icon name="zap" size={20} strokeWidth={2.2} style={{ color: '#fff' }} />
          </div>
          <div>
            <div style={{ fontWeight: 800, letterSpacing: '-0.03em', fontSize: 19, lineHeight: 1 }}>BidFlow</div>
            <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.04em', marginTop: 2, color: 'var(--bf-text-faint, #999)' }}>TENDER COMMAND CENTER</div>
          </div>
        </div>

        <form onSubmit={submit} className="bf-card" style={{ padding: 24, display: 'grid', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 750, margin: 0 }}>Sign in</h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--bf-text-2, #666)' }}>Welcome back — sign in to your workspace.</p>
          </div>

          <label className="bf-field">
            <span>Email</span>
            <input className="bf-input" type="email" autoFocus value={email}
              onChange={e => setEmail(e.target.value)} placeholder="you@satco.example" required />
          </label>
          <label className="bf-field">
            <span>Password</span>
            <input className="bf-input" type="password" value={password}
              onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          </label>

          {error && (
            <div style={{ fontSize: 12.5, color: 'var(--bf-danger, #c0392b)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="alert" size={14} />{error}
            </div>
          )}

          <button className="bf-btn bf-btn-primary" type="submit" disabled={busy} style={{ justifyContent: 'center', height: 38 }}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--bf-text-faint, #999)', marginTop: 16 }}>
          Seeded users sign in with the temporary password <strong>bidflow123</strong>.
        </p>
      </div>
    </div>
  )
}
