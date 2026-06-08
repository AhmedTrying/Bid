'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { toneStyle } from '@/lib/helpers'
import { STATUS, reminderMeta, REMINDER_TYPES } from '@/lib/data'
import { Icon } from '@/components/ui/icon'
import { ReminderModal } from '@/components/app/reminder-modal'
import type { CalendarItem } from '@/lib/types'

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const MONTHS_LONG = ['January','February','March','April','May','June','July','August','September','October','November','December']

interface CalEvent {
  label: string
  hue: number
  kind: 'opp' | 'reminder'
  oppId?: string
  reminder?: CalendarItem
}

type ModalState = { mode: 'add'; date: string } | { mode: 'edit'; reminder: CalendarItem } | null

export default function CalendarPage() {
  const opps      = useStore(s => s.opps)
  const reminders = useStore(s => s.reminders)
  const theme     = useStore(s => s.theme)
  const router    = useRouter()

  const [year,  setYear]  = useState(2026)
  const [month, setMonth] = useState(5) // June = 5 (0-indexed)
  const [modal, setModal] = useState<ModalState>(null)

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const pad = (n: number) => n.toString().padStart(2, '0')
  const dateStr = (d: number) => `${year}-${pad(month + 1)}-${pad(d)}`

  const events = useMemo(() => {
    const map: Record<number, CalEvent[]> = {}
    const prefix = `${year}-${pad(month + 1)}-`
    const push = (date: string, ev: CalEvent) => {
      if (!date || !date.startsWith(prefix)) return
      const d = parseInt(date.split('-')[2])
      ;(map[d] = map[d] || []).push(ev)
    }
    opps.forEach(o => {
      push(o.bidDue,      { label: 'Bid due',    hue: STATUS[o.status]?.hue ?? 46, kind: 'opp', oppId: o.id })
      push(o.qDeadline,   { label: 'Q close',    hue: 60,  kind: 'opp', oppId: o.id })
      if (o.siteVisitMode === 'date') push(o.siteVisit, { label: 'Site visit', hue: 175, kind: 'opp', oppId: o.id })
      push(o.followUp,    { label: 'Follow-up',  hue: 230, kind: 'opp', oppId: o.id })
      push(o.bondValidity,{ label: 'Bond exp.',  hue: 80,  kind: 'opp', oppId: o.id })
    })
    reminders.forEach(r => {
      const m = reminderMeta(r.type)
      push(r.date, { label: r.title, hue: m.hue, kind: 'reminder', reminder: r })
    })
    return map
  }, [opps, reminders, year, month])

  const prev = () => { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }
  const next = () => { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) }

  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  while (cells.length % 7) cells.push(null)

  const openEvent = (ev: CalEvent) => {
    if (ev.kind === 'reminder' && ev.reminder) setModal({ mode: 'edit', reminder: ev.reminder })
    else if (ev.oppId) router.push(`/opportunities/${ev.oppId}`)
  }

  return (
    <div className="bf-canvas-pad" style={{ animation: 'bf-rise-up .4s cubic-bezier(.2,.8,.2,1)' }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.025em', margin: 0 }}>Calendar</h1>
          <p style={{ margin: '5px 0 0', fontSize: 13.5, color: 'var(--bf-text-2)' }}>Deadlines plus your own reminders — click a day to add, click a reminder to edit.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="bf-btn bf-btn-ghost" onClick={prev}><Icon name="chevLeft" size={16} /></button>
          <span style={{ fontWeight: 700, fontSize: 16, minWidth: 160, textAlign: 'center' }}>{MONTHS_LONG[month]} {year}</span>
          <button className="bf-btn bf-btn-ghost" onClick={next}><Icon name="chevRight" size={16} /></button>
          <button className="bf-btn bf-btn-primary" style={{ marginLeft: 6 }} onClick={() => setModal({ mode: 'add', date: dateStr(Math.min(4, daysInMonth)) })}>
            <Icon name="plus" size={15} />New reminder
          </button>
        </div>
      </div>

      {/* calendar grid */}
      <div className="bf-card" style={{ overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', borderBottom: '1px solid var(--bf-border)' }}>
          {DAYS.map(d => (
            <div key={d} style={{ padding: '10px 12px', fontSize: 11.5, fontWeight: 700, color: 'var(--bf-text-faint)', textTransform: 'uppercase', letterSpacing: '.04em', textAlign: 'center' }}>{d}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
          {cells.map((d, i) => {
            const dayEvents = d ? (events[d] ?? []) : []
            const today = d ? dateStr(d) === '2026-06-04' : false
            return (
              <div key={i} className="bf-cal-cell"
                style={{ minHeight: 104, padding: '6px 8px', borderRight: i % 7 !== 6 ? '1px solid var(--bf-border-2)' : 'none', borderBottom: i < cells.length - 7 ? '1px solid var(--bf-border-2)' : 'none', background: !d ? 'var(--bf-surface-2)' : today ? 'oklch(0.96 0.03 var(--bf-accent-hue) / 0.4)' : undefined, position: 'relative' }}>
                {d && (
                  <>
                    <button
                      onClick={() => setModal({ mode: 'add', date: dateStr(d) })}
                      title="Add reminder"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', padding: '2px 2px 4px', marginBottom: 2 }}>
                      <span style={{ fontWeight: today ? 800 : 550, fontSize: 13, color: today ? 'var(--bf-accent)' : 'var(--bf-text)' }}>{d}</span>
                      <Icon name="plus" size={12} style={{ color: 'var(--bf-text-faint)' }} />
                    </button>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {dayEvents.slice(0, 4).map((ev, j) => {
                        const t = toneStyle(ev.hue, theme)
                        return (
                          <button key={j} onClick={() => openEvent(ev)}
                            title={`${ev.kind === 'reminder' ? reminderMeta(ev.reminder!.type).label : ev.label}: ${ev.kind === 'reminder' ? ev.reminder!.title : (opps.find(o => o.id === ev.oppId)?.title ?? '')}`}
                            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 6px', borderRadius: 5, background: t.bg, color: t.fg, fontSize: 10.5, fontWeight: 600, border: ev.kind === 'reminder' ? `1px solid ${t.bd}` : 'none', cursor: 'pointer', textAlign: 'left', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', fontFamily: 'inherit' }}>
                            <span style={{ flexShrink: 0, width: 5, height: 5, borderRadius: 99, background: t.solid }} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.label}</span>
                          </button>
                        )
                      })}
                      {dayEvents.length > 4 && (
                        <span style={{ fontSize: 10, color: 'var(--bf-text-faint)', paddingLeft: 4 }}>+{dayEvents.length - 4} more</span>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* legend */}
      <div style={{ display: 'flex', gap: 14, marginTop: 16, flexWrap: 'wrap' }}>
        {REMINDER_TYPES.map(({ label, hue }) => {
          const t = toneStyle(hue, theme)
          return (
            <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--bf-text-2)' }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: t.bg, border: `1px solid ${t.bd}` }} />
              {label}
            </span>
          )
        })}
      </div>

      {modal && (
        <ReminderModal
          initial={modal.mode === 'edit' ? modal.reminder : undefined}
          defaultDate={modal.mode === 'add' ? modal.date : undefined}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
