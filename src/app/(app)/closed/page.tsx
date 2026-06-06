'use client'

import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { daysUntil, fmtDate, toneStyle } from '@/lib/helpers'
import { byClient } from '@/lib/data'
import { Icon } from '@/components/ui/icon'
import { StatusBadge } from '@/components/ui/badges'

export default function ClosedPage() {
  const opps   = useStore(s => s.opps)
  const theme  = useStore(s => s.theme)
  const router = useRouter()

  const items = opps.filter(o => ['Closed Lost','Cancelled','No-Go','Postponed'].includes(o.status))

  const reasonFor = (o: typeof items[0]) =>
    o.status === 'Postponed'  ? 'Client postponed' :
    o.status === 'Cancelled'  ? 'Tender cancelled' :
    o.notes.includes('price') ? 'Price (commercial)' :
    o.notes.toLowerCase().includes('technical') ? 'Technical non-compliance' :
    'Commercial'

  return (
    <div className="bf-canvas-pad" style={{ animation: 'bf-rise-up .4s cubic-bezier(.2,.8,.2,1)' }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.025em', margin: 0 }}>Closed / Lost</h1>
          <span style={{ fontSize: 11.5, fontWeight: 700, padding: '2px 9px', borderRadius: 99, background: 'var(--bf-surface-3)', color: 'var(--bf-text-2)', height: 24, display: 'inline-flex', alignItems: 'center' }}>{items.length}</span>
        </div>
        <p style={{ margin: '5px 0 0', fontSize: 13.5, color: 'var(--bf-text-2)' }}>Lost, cancelled and postponed opportunities — capture reasons and lessons learned.</p>
      </div>

      {items.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--bf-text-faint)' }}>
          <Icon name="closed" size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
          <div style={{ fontWeight: 700, fontSize: 15 }}>Nothing closed</div>
        </div>
      )}

      <div style={{ display: 'grid', gap: 10 }}>
        {items.map(o => {
          const reopen = daysUntil(o.followUp)
          const client = byClient(o.client)
          const postponedT = toneStyle(80, theme)
          const isPostponed = o.status === 'Postponed'
          return (
            <div key={o.id} className="bf-card bf-hoverlift"
              style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}
              onClick={() => router.push(`/opportunities/${o.id}`)}>
              <span style={{ width: 36, height: 36, borderRadius: 9, display: 'grid', placeItems: 'center', flexShrink: 0, background: isPostponed ? postponedT.bg : 'var(--bf-danger-soft)', color: isPostponed ? postponedT.fg : 'var(--bf-danger)' }}>
                <Icon name={isPostponed ? 'clock' : 'closed'} size={18} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <span style={{ fontWeight: 650, fontSize: 13.5 }}>{o.title}</span>
                  <StatusBadge status={o.status} theme={theme} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                  <span style={{ fontSize: 12, color: 'var(--bf-text-2)' }}>{client?.name}</span>
                  <span style={{ color: 'var(--bf-text-faint)' }}>·</span>
                  <span style={{ fontSize: 12, color: 'var(--bf-text-2)' }}>Closed {fmtDate(o.updated, { year: true })}</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="eyebrow" style={{ marginBottom: 3 }}>Reason</div>
                <span style={{ fontSize: 11.5, padding: '2px 9px', borderRadius: 99, background: 'var(--bf-surface-3)', color: 'var(--bf-text-2)' }}>{reasonFor(o)}</span>
              </div>
              {isPostponed && reopen !== null && reopen > 0 && (
                <span style={{ fontSize: 11.5, padding: '2px 9px', borderRadius: 99, display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--bf-warn-soft)', color: 'var(--bf-warn)', fontWeight: 600 }}>
                  <Icon name="refresh" size={12} />Re-open in {reopen}d
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
