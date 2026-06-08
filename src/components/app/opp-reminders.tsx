'use client'

import { useState } from 'react'
import { useStore } from '@/lib/store'
import { reminderMeta } from '@/lib/data'
import { fmtDate, toneStyle } from '@/lib/helpers'
import { Icon } from '@/components/ui/icon'
import { ReminderModal } from './reminder-modal'
import type { CalendarItem } from '@/lib/types'

type Modal = { mode: 'add' } | { mode: 'edit'; reminder: CalendarItem } | null

// Reminders linked to one opportunity (shown in the detail right rail). Anything
// added here also appears on the Calendar page.
export function OppReminders({ oppId, theme }: { oppId: string; theme: 'light' | 'dark' }) {
  const reminders      = useStore(s => s.reminders).filter(r => r.oppId === oppId)
  const updateReminder = useStore(s => s.updateReminder)
  const [modal, setModal] = useState<Modal>(null)

  const sorted = [...reminders].sort((a, b) => (a.date > b.date ? 1 : -1))

  return (
    <div className="bf-card bf-card-pad" style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span className="eyebrow">Reminders</span>
        <button className="bf-btn bf-btn-sm bf-btn-ghost" style={{ padding: '3px 6px' }} onClick={() => setModal({ mode: 'add' })}>
          <Icon name="plus" size={13} />Add
        </button>
      </div>

      {sorted.length === 0 ? (
        <span style={{ fontSize: 12.5, color: 'var(--bf-text-2)' }}>No reminders yet.</span>
      ) : (
        <div style={{ display: 'grid', gap: 4 }}>
          {sorted.map(r => {
            const m = reminderMeta(r.type)
            const t = toneStyle(m.hue, theme)
            return (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0' }}>
                <button title={r.done ? 'Mark not done' : 'Mark done'}
                  onClick={() => updateReminder(r.id, { done: !r.done })}
                  style={{ width: 16, height: 16, borderRadius: 5, flexShrink: 0, display: 'grid', placeItems: 'center', cursor: 'pointer', background: r.done ? 'var(--bf-good)' : 'transparent', border: r.done ? 'none' : `1px solid var(--bf-border-strong)`, color: '#fff' }}>
                  {r.done && <Icon name="check" size={11} strokeWidth={3} />}
                </button>
                <button onClick={() => setModal({ mode: 'edit', reminder: r })}
                  style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 7, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', padding: 0 }}>
                  <span style={{ width: 6, height: 6, borderRadius: 99, background: t.solid, flexShrink: 0 }} />
                  <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, textDecoration: r.done ? 'line-through' : 'none', color: r.done ? 'var(--bf-text-faint)' : 'var(--bf-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.title}</span>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--bf-text-faint)', flexShrink: 0 }}>{r.date ? fmtDate(r.date) : ''}{r.time ? ` ${r.time}` : ''}</span>
                </button>
              </div>
            )
          })}
        </div>
      )}

      {modal && (
        <ReminderModal
          initial={modal.mode === 'edit' ? modal.reminder : undefined}
          defaultOppId={oppId}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
