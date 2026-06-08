'use client'

import { useEffect, useState } from 'react'
import { useStore, optionLabels } from '@/lib/store'
import { Icon } from '@/components/ui/icon'

// Asks the user for a Closed/Lost reason whenever an opportunity moves into a
// closing status (Closed Lost / Cancelled / No-Go / Postponed). Mounted globally
// in AppShell; renders only while the store has a `pendingClose`. (Fix 3)
export function CloseReasonModal() {
  const pending     = useStore(s => s.pendingClose)
  const opps        = useStore(s => s.opps)
  const options     = useStore(s => s.options)
  const confirmClose = useStore(s => s.confirmClose)
  const cancelClose  = useStore(s => s.cancelClose)
  const flash        = useStore(s => s.flash)

  const reasons = optionLabels(options, 'close_reason')
  const [category, setCategory] = useState(reasons[0] ?? 'Other')
  const [notes, setNotes] = useState('')

  // Reset the form each time a new close is requested.
  useEffect(() => {
    if (pending) { setCategory(reasons[0] ?? 'Other'); setNotes('') }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending?.id])

  if (!pending) return null

  const opp = opps.find(o => o.id === pending.id)
  const targetStatus = (pending.patch.status as string) || 'Closed / Lost'

  const confirm = () => {
    if (!category) return
    confirmClose(category, notes.trim())
    flash('Closed/Lost reason saved')
  }
  const cancel = () => { cancelClose(); flash('Change cancelled — nothing saved') }

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'oklch(0.2 0.01 60 / 0.42)', backdropFilter: 'blur(3px)',
        zIndex: 90, display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '10vh 20px', animation: 'bf-fade .16s ease',
      }}
      onClick={cancel}
    >
      <div
        style={{
          background: 'var(--bf-surface)', border: '1px solid var(--bf-border)',
          borderRadius: 20, boxShadow: 'var(--bf-shadow-pop)',
          width: '100%', maxWidth: 520, display: 'flex', flexDirection: 'column',
          animation: 'bf-pop .18s cubic-bezier(.2,.8,.2,1)', overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px', borderBottom: '1px solid var(--bf-border)' }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--bf-danger-soft)', color: 'var(--bf-danger)', display: 'grid', placeItems: 'center' }}>
            <Icon name="closed" size={17} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.02em' }}>Reason required</div>
            <div style={{ fontSize: 12, color: 'var(--bf-text-faint)' }}>Moving to <strong style={{ color: 'var(--bf-text-2)' }}>{targetStatus}</strong></div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: 20, display: 'grid', gap: 16 }}>
          {opp && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--bf-text-2)' }}>
              <span className="mono" style={{ color: 'var(--bf-text-faint)' }}>{opp.ref}</span>
              <span style={{ color: 'var(--bf-text-faint)' }}>·</span>
              <span style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{opp.title}</span>
            </div>
          )}

          <label className="bf-field">
            <span>Reason category *</span>
            <select className="bf-select" value={category} onChange={e => setCategory(e.target.value)}>
              {reasons.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </label>

          <label className="bf-field">
            <span>Detailed reason / notes</span>
            <textarea className="bf-input" value={notes} onChange={e => setNotes(e.target.value)}
              rows={3} style={{ resize: 'vertical', fontFamily: 'inherit' }}
              placeholder="What happened? Lessons learned, competitor, price gap…" />
          </label>

          <p style={{ fontSize: 12, color: 'var(--bf-text-faint)', margin: 0 }}>
            This reason is stored on the opportunity and shown on the Closed / Lost page. It is never auto-generated.
          </p>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, padding: '14px 20px', borderTop: '1px solid var(--bf-border)', background: 'var(--bf-surface-2)' }}>
          <button className="bf-btn" onClick={cancel}>Cancel change</button>
          <button className="bf-btn bf-btn-primary" onClick={confirm} disabled={!category}>
            <Icon name="check" size={16} strokeWidth={2.2} />Save reason &amp; close
          </button>
        </div>
      </div>
    </div>
  )
}
