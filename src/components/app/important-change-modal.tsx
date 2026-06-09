'use client'

import { useEffect, useMemo, useState } from 'react'
import { useStore } from '@/lib/store'
import { TEAM, TEAM_GROUPS } from '@/lib/data'
import { allowSkipEmailFor } from '@/lib/notificationRulesService'
import { Icon } from '@/components/ui/icon'

// Confirms a major change before saving and offers to notify the team (Feature 3).
// Mounted globally in AppShell; renders only while the store has a `pendingMajor`.
export function ImportantChangeModal() {
  const pending  = useStore(s => s.pendingMajor)
  const opps     = useStore(s => s.opps)
  const me       = useStore(s => s.currentUser)
  const rules    = useStore(s => s.notificationRules)
  const confirmMajor = useStore(s => s.confirmMajor)
  const cancelMajor  = useStore(s => s.cancelMajor)
  const flash    = useStore(s => s.flash)

  const recipients = useMemo(() => TEAM.filter(t => t.email), [])
  const [mode, setMode] = useState<'all' | 'specific'>('all')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (pending) { setMode('all'); setSelected(new Set()); setNote(''); setBusy(false) }
  }, [pending?.id])

  if (!pending) return null

  const opp = opps.find(o => o.id === pending.id)
  const allowSkip = allowSkipEmailFor(rules, pending.majors.map(m => m.field))

  const chosen = mode === 'all' ? recipients : recipients.filter(r => selected.has(r.id))
  const summary = mode === 'all' ? 'all team members' : `${chosen.length} selected recipient${chosen.length === 1 ? '' : 's'}`
  const canSend = mode === 'all' || chosen.length > 0

  const toggle = (id: string) =>
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

  const finish = async (sendEmail: boolean) => {
    setBusy(true)
    await confirmMajor({
      sendEmail,
      recipientIds: chosen.map(r => r.id),
      recipientEmails: chosen.map(r => r.email!).filter(Boolean),
      recipientsSummary: summary,
      note: note.trim(),
    })
    flash(
      sendEmail
        ? (mode === 'all'
            ? 'Change saved and email sent to all team members.'
            : `Change saved and email sent to ${chosen.length} selected recipient${chosen.length === 1 ? '' : 's'}.`)
        : 'Change saved — no email sent.',
    )
  }
  const cancel = () => { cancelMajor(); flash('Change cancelled — nothing saved') }

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'oklch(0.2 0.01 60 / 0.42)', backdropFilter: 'blur(3px)',
        zIndex: 92, display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '6vh 20px', animation: 'bf-fade .16s ease',
      }}
      onClick={cancel}
    >
      <div
        style={{
          background: 'var(--bf-surface)', border: '1px solid var(--bf-border)',
          borderRadius: 20, boxShadow: 'var(--bf-shadow-pop)',
          width: '100%', maxWidth: 580, maxHeight: '88vh',
          display: 'flex', flexDirection: 'column',
          animation: 'bf-pop .18s cubic-bezier(.2,.8,.2,1)', overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px', borderBottom: '1px solid var(--bf-border)', flexShrink: 0 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--bf-warn-soft)', color: 'var(--bf-warn)', display: 'grid', placeItems: 'center' }}>
            <Icon name="alert" size={17} />
          </div>
          <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.02em' }}>Important Change — Notify Team?</span>
        </div>

        {/* Body */}
        <div style={{ padding: 20, display: 'grid', gap: 16, overflowY: 'auto' }}>
          {/* context */}
          <div style={{ display: 'grid', gap: 8 }}>
            {opp && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                <span className="mono" style={{ color: 'var(--bf-text-faint)' }}>{opp.ref}</span>
                <span style={{ color: 'var(--bf-text-faint)' }}>·</span>
                <span style={{ fontWeight: 600 }}>{opp.title}</span>
              </div>
            )}
            <div style={{ display: 'grid', gap: 6, padding: '10px 12px', borderRadius: 10, background: 'var(--bf-surface-2)', border: '1px solid var(--bf-border-2)' }}>
              {pending.majors.map(m => (
                <div key={m.field} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 650 }}>{m.label}</span>
                  <span className="mono" style={{ color: 'var(--bf-text-faint)', textDecoration: 'line-through' }}>{m.oldValue}</span>
                  <Icon name="chevRight" size={12} style={{ color: 'var(--bf-text-faint)' }} />
                  <span className="mono" style={{ fontWeight: 600 }}>{m.newValue}</span>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--bf-text-2)' }}>Changed by <strong>{me.name}</strong></div>
            <p style={{ margin: 0, fontSize: 12.5, color: 'var(--bf-text-2)' }}>
              This is an important change. An email notification will be sent to the team unless you choose specific recipients.
            </p>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--bf-text-faint)' }}>
              This change will be saved in the dashboard and included in the next Excel export.
            </p>
          </div>

          {/* recipient mode */}
          <div style={{ display: 'flex', gap: 8 }}>
            {([['all', 'Notify all team members'], ['specific', 'Select specific recipients']] as const).map(([m, label]) => (
              <button key={m} type="button" className="bf-btn" onClick={() => setMode(m)}
                style={{ flex: 1, fontWeight: 600, background: mode === m ? 'var(--bf-accent)' : undefined, color: mode === m ? 'var(--bf-on-accent)' : undefined }}>
                {label}
              </button>
            ))}
          </div>

          {/* recipient list */}
          {mode === 'specific' && (
            <div style={{ border: '1px solid var(--bf-border)', borderRadius: 10, maxHeight: 240, overflowY: 'auto' }}>
              {TEAM_GROUPS.map(group => {
                const members = recipients.filter(r => r.group === group)
                if (!members.length) return null
                return (
                  <div key={group}>
                    <div className="eyebrow" style={{ padding: '8px 12px 4px', position: 'sticky', top: 0, background: 'var(--bf-surface)' }}>{group}</div>
                    {members.map(r => (
                      <label key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 12px', cursor: 'pointer', borderTop: '1px solid var(--bf-border-2)' }}>
                        <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggle(r.id)} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{r.name}</div>
                          <div style={{ fontSize: 11.5, color: 'var(--bf-text-faint)' }}>{r.role} · {r.email}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                )
              })}
            </div>
          )}

          {/* note */}
          <label className="bf-field">
            <span>Add a short note <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--bf-text-faint)' }}>optional</span></span>
            <textarea className="bf-input" value={note} onChange={e => setNote(e.target.value)} rows={2}
              style={{ resize: 'vertical', fontFamily: 'inherit' }} placeholder="Context for the team…" />
          </label>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '14px 20px', borderTop: '1px solid var(--bf-border)', background: 'var(--bf-surface-2)', flexShrink: 0 }}>
          <span style={{ fontSize: 12, color: 'var(--bf-text-faint)' }}>Will notify <strong style={{ color: 'var(--bf-text-2)' }}>{summary}</strong></span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="bf-btn" onClick={cancel} disabled={busy}>Cancel change</button>
            {allowSkip && (
              <button className="bf-btn" onClick={() => finish(false)} disabled={busy}>Save without email</button>
            )}
            <button className="bf-btn bf-btn-primary" onClick={() => finish(true)} disabled={busy || !canSend}>
              <Icon name="sent" size={15} strokeWidth={2.2} />Confirm change &amp; send
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
