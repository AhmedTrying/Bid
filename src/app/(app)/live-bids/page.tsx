'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { relDue, daysUntil, fmtDate, money, toneStyle } from '@/lib/helpers'
import { byClient, byId } from '@/lib/data'
import { Icon } from '@/components/ui/icon'
import { Avatar } from '@/components/ui/avatar'
import { PriorityBadge, StatusBadge } from '@/components/ui/badges'
import type { Opportunity } from '@/lib/types'

export default function LiveBidsPage() {
  const opps      = useStore(s => s.opps)
  const theme     = useStore(s => s.theme)
  const cardStyle = useStore(s => s.cardStyle)
  const router    = useRouter()
  const [mode, setMode] = useState<'timeline'|'cards'>('timeline')

  const bids = opps.filter(o => ['Live Bid', 'Bid in Progress'].includes(o.status))

  const flags = (o: Opportunity) => {
    const f: { l: string; c: 'danger'|'warn' }[] = []
    const d = daysUntil(o.bidDue), q = daysUntil(o.qDeadline)
    if (d !== null && d < 0)          f.push({ l: 'Overdue', c: 'danger' })
    else if (d === 1 || d === 0)      f.push({ l: 'Due ≤1 day', c: 'danger' })
    else if (d !== null && d <= 3)    f.push({ l: 'Due ≤3 days', c: 'warn' })
    if (q !== null && q < 0)          f.push({ l: 'Questions closed', c: 'warn' })
    if (o.bondReq && !o.bondValidity) f.push({ l: 'Missing bond info', c: 'warn' })
    if (!o.owner)                     f.push({ l: 'No owner', c: 'danger' })
    return f
  }

  const buckets = [
    { k: 'Overdue',              t: 'danger', f: (o: Opportunity) => { const d = daysUntil(o.bidDue); return d !== null && d < 0 } },
    { k: 'Due today / tomorrow', t: 'danger', f: (o: Opportunity) => { const d = daysUntil(o.bidDue); return d === 0 || d === 1 } },
    { k: 'Due this week',        t: 'warn',   f: (o: Opportunity) => { const d = daysUntil(o.bidDue); return d !== null && d >= 2 && d <= 7 } },
    { k: 'Later',                t: 'none',   f: (o: Opportunity) => { const d = daysUntil(o.bidDue); return d === null || d > 7 } },
  ]

  return (
    <div className="bf-canvas-pad" style={{ animation: 'bf-rise-up .4s cubic-bezier(.2,.8,.2,1)' }}>
      {/* header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.025em', margin: 0 }}>Live Bids</h1>
            <span style={{ fontSize: 11.5, fontWeight: 700, padding: '2px 9px', borderRadius: 99, background: 'var(--bf-surface-3)', color: 'var(--bf-text-2)', height: 24, display: 'inline-flex', alignItems: 'center' }}>{bids.length}</span>
          </div>
          <p style={{ margin: '5px 0 0', fontSize: 13.5, color: 'var(--bf-text-2)' }}>Active bids in progress — sorted by urgency.</p>
        </div>
        <div style={{ display: 'flex', gap: 3, background: 'var(--bf-surface-2)', padding: 3, borderRadius: 9, border: '1px solid var(--bf-border)' }}>
          {([['timeline','sort','Timeline'],['cards','kanban','Cards']] as [string,string,string][]).map(([m, ic, l]) => (
            <button key={m} onClick={() => setMode(m as 'timeline'|'cards')}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 11px', border: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, background: mode === m ? 'var(--bf-surface)' : 'transparent', color: mode === m ? 'var(--bf-text)' : 'var(--bf-text-3)', boxShadow: mode === m ? 'var(--bf-shadow-sm)' : 'none' }}>
              <Icon name={ic} size={14} />{l}
            </button>
          ))}
        </div>
      </div>

      {bids.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--bf-text-faint)' }}>
          <Icon name="bid" size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
          <div style={{ fontWeight: 700, fontSize: 15 }}>No live bids</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Bids you move to Live will appear here.</div>
        </div>
      )}

      {mode === 'timeline' && buckets.map(b => {
        const items = bids.filter(b.f).sort((x, y) => (x.bidDue > y.bidDue ? 1 : -1))
        if (!items.length) return null
        const c = b.t === 'danger' ? 'var(--bf-danger)' : b.t === 'warn' ? 'var(--bf-warn)' : 'var(--bf-text-faint)'
        return (
          <div key={b.k} style={{ marginBottom: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 11 }}>
              <span style={{ width: 8, height: 8, borderRadius: 99, background: c }} />
              <span style={{ fontWeight: 700, fontSize: 13.5 }}>{b.k}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--bf-text-faint)' }}>{items.length}</span>
            </div>
            <div style={{ display: 'grid', gap: 9 }}>
              {items.map(o => {
                const due = relDue(o.bidDue)
                const client = byClient(o.client)
                return (
                  <button key={o.id} onClick={() => router.push(`/opportunities/${o.id}`)} className="bf-hoverlift"
                    style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 16px', width: '100%', border: '1px solid var(--bf-border)', borderRadius: 12, background: 'var(--bf-surface)', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
                    <Avatar person={o.owner} size={30} theme={theme} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontWeight: 650, fontSize: 13.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{o.title}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                        <span className="mono" style={{ fontSize: 11, color: 'var(--bf-text-faint)' }}>{o.ref}</span>
                        <span style={{ color: 'var(--bf-text-faint)' }}>·</span>
                        <span style={{ fontSize: 12, color: 'var(--bf-text-2)' }}>{client?.name}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: 240 }}>
                      {flags(o).map((fl, i) => (
                        <span key={i} style={{ fontSize: 10.5, padding: '2px 7px', borderRadius: 99, background: fl.c === 'danger' ? 'var(--bf-danger-soft)' : 'var(--bf-warn-soft)', color: fl.c === 'danger' ? 'var(--bf-danger)' : 'var(--bf-warn)' }}>{fl.l}</span>
                      ))}
                    </div>
                    <span className="mono" style={{ fontSize: 12, fontWeight: 600, minWidth: 64, textAlign: 'right', color: c }}>{o.bidDue ? fmtDate(o.bidDue) : '—'}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}

      {mode === 'cards' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 13 }}>
          {bids.sort((x, y) => x.bidDue > y.bidDue ? 1 : -1).map(o => {
            const due = relDue(o.bidDue)
            const client = byClient(o.client)
            const t = toneStyle(46, theme)
            return (
              <div key={o.id} onClick={() => router.push(`/opportunities/${o.id}`)} className="bf-hoverlift"
                style={{ background: 'var(--bf-surface)', border: `1px solid var(--bf-border)`, borderLeft: cardStyle === 'accent' ? `3px solid ${t.solid}` : undefined, borderRadius: 12, padding: 14, cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--bf-text-faint)' }}>{o.ref}</span>
                  {due.tone !== 'none' && <span style={{ fontSize: 10.5, padding: '2px 7px', borderRadius: 99, background: due.tone === 'danger' ? 'var(--bf-danger-soft)' : 'var(--bf-warn-soft)', color: due.tone === 'danger' ? 'var(--bf-danger)' : 'var(--bf-warn)' }}>{due.label}</span>}
                </div>
                <div style={{ fontWeight: 650, fontSize: 13, lineHeight: 1.3, marginBottom: 8 }}>{o.title}</div>
                <div style={{ fontSize: 12, color: 'var(--bf-text-2)', marginBottom: 12 }}>{client?.name}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Avatar person={o.owner} size={22} theme={theme} />
                  <span className="mono" style={{ fontSize: 12, color: 'var(--bf-text-2)' }}>{money(o.value, true)}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
