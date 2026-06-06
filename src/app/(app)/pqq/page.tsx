'use client'

import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { relDue } from '@/lib/helpers'
import { byClient, byId, DOC_TEMPLATE } from '@/lib/data'
import { Icon } from '@/components/ui/icon'
import { Avatar } from '@/components/ui/avatar'
import { StatusBadge, TypePill } from '@/components/ui/badges'

export default function PqqPage() {
  const opps   = useStore(s => s.opps)
  const theme  = useStore(s => s.theme)
  const router = useRouter()

  const items = opps.filter(o => ['Live PQQ', 'Live RFQ'].includes(o.status))

  return (
    <div className="bf-canvas-pad" style={{ animation: 'bf-rise-up .4s cubic-bezier(.2,.8,.2,1)' }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.025em', margin: 0 }}>Live PQQ / RFQ</h1>
          <span style={{ fontSize: 11.5, fontWeight: 700, padding: '2px 9px', borderRadius: 99, background: 'var(--bf-surface-3)', color: 'var(--bf-text-2)', height: 24, display: 'inline-flex', alignItems: 'center' }}>{items.length}</span>
        </div>
        <p style={{ margin: '5px 0 0', fontSize: 13.5, color: 'var(--bf-text-2)' }}>Qualifications and requests for quotation — track required documents.</p>
      </div>

      {items.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--bf-text-faint)' }}>
          <Icon name="pqq" size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
          <div style={{ fontWeight: 700, fontSize: 15 }}>No live qualifications</div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(360px,1fr))', gap: 14 }}>
        {items.map(o => {
          const cl = o.checklist ?? Object.fromEntries(DOC_TEMPLATE.map(d => [d, false]))
          const done = Object.values(cl).filter(Boolean).length
          const total = Object.keys(cl).length
          const due = relDue(o.bidDue)
          const client = byClient(o.client)
          const owner = byId(o.owner)
          return (
            <div key={o.id} className="bf-card bf-hoverlift" style={{ padding: 16, cursor: 'pointer' }} onClick={() => router.push(`/opportunities/${o.id}`)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 9 }}>
                <div style={{ display: 'flex', gap: 7 }}>
                  <TypePill type={o.type} />
                  <StatusBadge status={o.status} theme={theme} />
                </div>
                <span className="mono" style={{ fontSize: 11, color: 'var(--bf-text-faint)' }}>{o.ref}</span>
              </div>
              <div style={{ fontWeight: 700, fontSize: 14.5, lineHeight: 1.3, marginBottom: 6 }}>{o.title}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 13 }}>
                <Icon name="building" size={13} style={{ color: 'var(--bf-text-faint)' }} />
                <span style={{ fontSize: 12.5, color: 'var(--bf-text-2)' }}>{client?.name}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                <span className="eyebrow">Required documents</span>
                <span className="mono" style={{ fontSize: 11.5, fontWeight: 700, color: done === total ? 'var(--bf-good)' : 'var(--bf-text-2)' }}>{done}/{total}</span>
              </div>
              <div className="bf-track" style={{ marginBottom: 12 }}>
                <span style={{ width: `${(done / total) * 100}%`, background: done === total ? 'var(--bf-good)' : 'var(--bf-accent)' }} />
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 13 }}>
                {Object.entries(cl).map(([d, ok]) => (
                  <span key={d} style={{ fontSize: 10.5, padding: '2px 7px', borderRadius: 99, display: 'inline-flex', alignItems: 'center', gap: 3, background: ok ? 'var(--bf-good-soft)' : 'var(--bf-surface-3)', color: ok ? 'var(--bf-good)' : 'var(--bf-text-faint)' }}>
                    {ok && <Icon name="check" size={10} strokeWidth={3} />}{d.split(' ')[0]}
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 11, borderTop: '1px solid var(--bf-border-2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <Avatar person={o.owner} size={22} theme={theme} />
                  <span style={{ fontSize: 12, color: 'var(--bf-text-2)' }}>{owner?.name?.split(' ')[0] ?? '—'}</span>
                </div>
                {o.bidDue && (
                  <span style={{ fontSize: 11.5, padding: '2px 8px', borderRadius: 99, display: 'inline-flex', alignItems: 'center', gap: 4, background: due.tone === 'danger' ? 'var(--bf-danger-soft)' : due.tone === 'warn' ? 'var(--bf-warn-soft)' : 'var(--bf-surface-3)', color: due.tone === 'danger' ? 'var(--bf-danger)' : due.tone === 'warn' ? 'var(--bf-warn)' : 'var(--bf-text-2)' }}>
                    <Icon name="clock" size={12} />{due.label}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
