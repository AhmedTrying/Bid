'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { daysUntil, toneStyle } from '@/lib/helpers'
import { byClient, STATUS } from '@/lib/data'
import { Icon } from '@/components/ui/icon'
import type { Opportunity } from '@/lib/types'

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const MONTHS_LONG = ['January','February','March','April','May','June','July','August','September','October','November','December']

interface DayEvent { o: Opportunity; type: string; hue: number }

export default function CalendarPage() {
  const opps   = useStore(s => s.opps)
  const theme  = useStore(s => s.theme)
  const router = useRouter()

  const [year,  setYear]  = useState(2026)
  const [month, setMonth] = useState(5) // June = 5 (0-indexed)

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const pad = (n: number) => n.toString().padStart(2, '0')
  const dateStr = (d: number) => `${year}-${pad(month + 1)}-${pad(d)}`

  const events = useMemo(() => {
    const map: Record<string, DayEvent[]> = {}
    opps.forEach(o => {
      const add = (date: string, type: string, hue: number) => {
        if (!date || !date.startsWith(`${year}-${pad(month + 1)}-`)) return
        const d = parseInt(date.split('-')[2])
        if (!map[d]) map[d] = []
        map[d].push({ o, type, hue })
      }
      add(o.bidDue,      'Bid due',   STATUS[o.status]?.hue ?? 46)
      add(o.qDeadline,   'Q close',   60)
      add(o.siteVisit,   'Site visit',175)
      add(o.followUp,    'Follow-up', 230)
      add(o.bondValidity,'Bond exp.', 80)
    })
    return map
  }, [opps, year, month])

  const prev = () => { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }
  const next = () => { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) }

  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  while (cells.length % 7) cells.push(null)

  return (
    <div className="bf-canvas-pad" style={{ animation: 'bf-rise-up .4s cubic-bezier(.2,.8,.2,1)' }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.025em', margin: 0 }}>Calendar</h1>
          <p style={{ margin: '5px 0 0', fontSize: 13.5, color: 'var(--bf-text-2)' }}>Deadline view — bid dues, question deadlines, site visits, follow-ups.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="bf-btn bf-btn-ghost" onClick={prev}><Icon name="chevLeft" size={16} /></button>
          <span style={{ fontWeight: 700, fontSize: 16, minWidth: 160, textAlign: 'center' }}>{MONTHS_LONG[month]} {year}</span>
          <button className="bf-btn bf-btn-ghost" onClick={next}><Icon name="chevRight" size={16} /></button>
        </div>
      </div>

      {/* calendar grid */}
      <div className="bf-card" style={{ overflow: 'hidden' }}>
        {/* day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', borderBottom: '1px solid var(--bf-border)' }}>
          {DAYS.map(d => (
            <div key={d} style={{ padding: '10px 12px', fontSize: 11.5, fontWeight: 700, color: 'var(--bf-text-faint)', textTransform: 'uppercase', letterSpacing: '.04em', textAlign: 'center' }}>{d}</div>
          ))}
        </div>
        {/* weeks */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
          {cells.map((d, i) => {
            const dayEvents = d ? (events[d] ?? []) : []
            const today = d ? dateStr(d) === '2026-06-04' : false
            return (
              <div key={i} style={{ minHeight: 100, padding: '8px 10px', borderRight: i % 7 !== 6 ? '1px solid var(--bf-border-2)' : 'none', borderBottom: i < cells.length - 7 ? '1px solid var(--bf-border-2)' : 'none', background: !d ? 'var(--bf-surface-2)' : today ? 'oklch(0.96 0.03 var(--bf-accent-hue) / 0.4)' : undefined }}>
                {d && (
                  <>
                    <div style={{ fontWeight: today ? 800 : 550, fontSize: 13, marginBottom: 6, color: today ? 'var(--bf-accent)' : 'var(--bf-text)' }}>{d}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {dayEvents.slice(0, 3).map((ev, j) => {
                        const t = toneStyle(ev.hue, theme)
                        return (
                          <button key={j} onClick={() => router.push(`/opportunities/${ev.o.id}`)}
                            title={`${ev.type}: ${ev.o.title}`}
                            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 6px', borderRadius: 5, background: t.bg, color: t.fg, fontSize: 10.5, fontWeight: 600, border: 'none', cursor: 'pointer', textAlign: 'left', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', fontFamily: 'inherit' }}>
                            <span style={{ flexShrink: 0, fontSize: 9, fontWeight: 700, opacity: 0.8 }}>{ev.type}</span>
                          </button>
                        )
                      })}
                      {dayEvents.length > 3 && (
                        <span style={{ fontSize: 10, color: 'var(--bf-text-faint)', paddingLeft: 4 }}>+{dayEvents.length - 3} more</span>
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
        {[['Bid due',46],['Q close',60],['Site visit',175],['Follow-up',230],['Bond exp.',80]].map(([l, h]) => {
          const t = toneStyle(h as number, theme)
          return (
            <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--bf-text-2)' }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: t.bg, border: `1px solid ${t.bd}` }} />
              {l}
            </span>
          )
        })}
      </div>
    </div>
  )
}
