'use client'

import { useState } from 'react'
import { useStore } from '@/lib/store'
import { REMINDER_TYPES } from '@/lib/data'
import { Icon } from '@/components/ui/icon'
import type { CalendarItem, ReminderType } from '@/lib/types'

// Add / edit a calendar reminder. Shared by the Calendar page and the
// opportunity detail right rail.
export function ReminderModal({ initial, defaultDate, defaultOppId, onClose }: {
  initial?: CalendarItem
  defaultDate?: string
  defaultOppId?: string | null
  onClose: () => void
}) {
  const opps           = useStore(s => s.opps)
  const addReminder    = useStore(s => s.addReminder)
  const updateReminder = useStore(s => s.updateReminder)
  const deleteReminder = useStore(s => s.deleteReminder)
  const flash          = useStore(s => s.flash)

  const [f, setF] = useState({
    type:  (initial?.type ?? 'custom') as string,
    title: initial?.title ?? '',
    date:  initial?.date ?? defaultDate ?? '',
    time:  initial?.time ?? '',
    oppId: initial?.oppId ?? defaultOppId ?? '',
    notes: initial?.notes ?? '',
  })
  const set = (k: keyof typeof f, v: string) => setF(p => ({ ...p, [k]: v }))

  const save = () => {
    if (!f.title.trim() || !f.date) { flash('Title and date are required'); return }
    const data: Partial<CalendarItem> = {
      type: f.type as ReminderType, title: f.title.trim(), date: f.date,
      time: f.time, oppId: f.oppId || null, notes: f.notes,
    }
    if (initial) { updateReminder(initial.id, data); flash('Reminder updated') }
    else { addReminder(data); flash('Reminder added') }
    onClose()
  }
  const remove = () => {
    if (!initial) return
    deleteReminder(initial.id)
    flash('Reminder deleted')
    onClose()
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'oklch(0.2 0.01 60 / 0.42)', backdropFilter: 'blur(3px)', zIndex: 90, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '12vh 20px', animation: 'bf-fade .16s ease' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bf-surface)', border: '1px solid var(--bf-border)', borderRadius: 20, boxShadow: 'var(--bf-shadow-pop)', width: '100%', maxWidth: 480, overflow: 'hidden', animation: 'bf-pop .18s cubic-bezier(.2,.8,.2,1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--bf-border)' }}>
          <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.02em' }}>{initial ? 'Edit reminder' : 'New reminder'}</span>
          <button className="bf-btn bf-btn-icon bf-btn-ghost" onClick={onClose}><Icon name="x" size={17} /></button>
        </div>

        <div style={{ padding: 20, display: 'grid', gap: 12 }}>
          <label className="bf-field">
            <span>Title *</span>
            <input className="bf-input" autoFocus value={f.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Technical review meeting" />
          </label>
          <label className="bf-field">
            <span>Type</span>
            <select className="bf-select" value={f.type} onChange={e => set('type', e.target.value)}>
              {REMINDER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label className="bf-field">
              <span>Date *</span>
              <input className="bf-input" type="date" value={f.date} onChange={e => set('date', e.target.value)} />
            </label>
            <label className="bf-field">
              <span>Time</span>
              <input className="bf-input" type="time" value={f.time} onChange={e => set('time', e.target.value)} />
            </label>
          </div>
          <label className="bf-field">
            <span>Linked opportunity <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--bf-text-faint)' }}>(optional)</span></span>
            <select className="bf-select" value={f.oppId} onChange={e => set('oppId', e.target.value)}>
              <option value="">— None —</option>
              {opps.map(o => <option key={o.id} value={o.id}>{o.ref} · {o.title}</option>)}
            </select>
          </label>
          <label className="bf-field">
            <span>Notes</span>
            <textarea className="bf-input" value={f.notes} onChange={e => set('notes', e.target.value)} rows={2} style={{ resize: 'vertical', fontFamily: 'inherit' }} />
          </label>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderTop: '1px solid var(--bf-border)', background: 'var(--bf-surface-2)' }}>
          {initial
            ? <button className="bf-btn bf-btn-sm" style={{ color: 'var(--bf-danger)', borderColor: 'var(--bf-danger)' }} onClick={remove}><Icon name="trash" size={14} />Delete</button>
            : <span />}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="bf-btn" onClick={onClose}>Cancel</button>
            <button className="bf-btn bf-btn-primary" onClick={save} disabled={!f.title.trim() || !f.date}>
              <Icon name="check" size={16} strokeWidth={2.2} />{initial ? 'Save' : 'Add'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
