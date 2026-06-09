'use client'

import Link from 'next/link'
import { useStore } from '@/lib/store'
import { Icon } from '@/components/ui/icon'

export default function NotificationRulesPage() {
  const rules = useStore(s => s.notificationRules)
  const setRule = useStore(s => s.setNotificationRule)
  const flash = useStore(s => s.flash)

  return (
    <div className="bf-canvas-pad" style={{ animation: 'bf-rise-up .4s cubic-bezier(.2,.8,.2,1)', maxWidth: 760 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14, fontSize: 12.5 }}>
        <Link href="/settings" className="bf-btn bf-btn-sm bf-btn-ghost" style={{ textDecoration: 'none' }}>
          <Icon name="arrowLeft" size={14} />Settings
        </Link>
        <Icon name="chevRight" size={13} style={{ color: 'var(--bf-text-faint)' }} />
        <span style={{ color: 'var(--bf-text-faint)' }}>Notification rules</span>
      </div>

      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.025em', margin: 0 }}>Notification rules</h1>
        <p style={{ margin: '5px 0 0', fontSize: 13.5, color: 'var(--bf-text-2)' }}>
          Choose which changes are important enough to ask &ldquo;Notify Team?&rdquo; before saving, and which may be saved without an email.
        </p>
      </div>

      <div className="bf-card" style={{ overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px 150px', gap: 10, padding: '11px 16px', borderBottom: '1px solid var(--bf-border)', background: 'var(--bf-surface-2)' }}>
          <span className="eyebrow">Change</span>
          <span className="eyebrow" style={{ textAlign: 'center' }}>Ask to notify</span>
          <span className="eyebrow" style={{ textAlign: 'center' }}>Allow save w/o email</span>
        </div>
        {rules.map(r => (
          <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '1fr 130px 150px', gap: 10, alignItems: 'center', padding: '11px 16px', borderBottom: '1px solid var(--bf-border-2)' }}>
            <span style={{ fontSize: 13, fontWeight: 550 }}>{r.label}</span>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Switch on={r.isMajor} onClick={() => { setRule(r.id, { isMajor: !r.isMajor }); flash('Notification rule updated') }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Switch on={r.allowSkipEmail} disabled={!r.isMajor}
                onClick={() => { setRule(r.id, { allowSkipEmail: !r.allowSkipEmail }); flash('Notification rule updated') }} />
            </div>
          </div>
        ))}
      </div>

      <p style={{ fontSize: 12.5, color: 'var(--bf-text-faint)', marginTop: 14 }}>
        When &ldquo;Ask to notify&rdquo; is on, editing that field opens the Important Change confirmation. With it off, the
        change saves silently and is still recorded in Change History.
      </p>
    </div>
  )
}

function Switch({ on, onClick, disabled }: { on: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-pressed={on}
      style={{
        width: 40, height: 23, borderRadius: 99, border: 'none', position: 'relative',
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1,
        background: on ? 'var(--bf-accent)' : 'var(--bf-surface-3)', transition: 'background .15s',
      }}>
      <span style={{
        position: 'absolute', top: 2, left: on ? 19 : 2, width: 19, height: 19, borderRadius: 99,
        background: '#fff', boxShadow: 'var(--bf-shadow-sm)', transition: 'left .15s',
      }} />
    </button>
  )
}
