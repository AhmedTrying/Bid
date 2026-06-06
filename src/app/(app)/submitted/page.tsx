'use client'

import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { relDue, fmtDate, toneStyle } from '@/lib/helpers'
import { byClient } from '@/lib/data'
import { Icon } from '@/components/ui/icon'
import { Avatar } from '@/components/ui/avatar'
import { StatusBadge } from '@/components/ui/badges'
import type { Opportunity } from '@/lib/types'

export default function SubmittedPage() {
  const opps   = useStore(s => s.opps)
  const theme  = useStore(s => s.theme)
  const router = useRouter()

  const submitted   = opps.filter(o => o.status === 'Submitted')
  const negotiation = opps.filter(o => o.status === 'Negotiation')

  function Group({ title, items, color }: { title: string; items: Opportunity[]; color: string }) {
    if (!items.length) return null
    return (
      <div style={{ marginBottom: 26 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
          <span style={{ width: 9, height: 9, borderRadius: 99, background: color }} />
          <span style={{ fontWeight: 700, fontSize: 15 }}>{title}</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--bf-text-faint)' }}>{items.length}</span>
        </div>
        <div style={{ display: 'grid', gap: 11 }}>
          {items.map(o => {
            const fu = relDue(o.followUp)
            const lastFu = o.followUps.filter(f => f.done).length
            const client = byClient(o.client)
            return (
              <div key={o.id} className="bf-card bf-hoverlift" style={{ padding: '14px 16px', cursor: 'pointer' }} onClick={() => router.push(`/opportunities/${o.id}`)}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <Avatar person={o.owner} size={32} theme={theme} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontWeight: 650, fontSize: 14 }}>{o.title}</span>
                      <StatusBadge status={o.status} theme={theme} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '3px 0 11px' }}>
                      <span className="mono" style={{ fontSize: 11, color: 'var(--bf-text-faint)' }}>{o.ref}</span>
                      <span style={{ color: 'var(--bf-text-faint)' }}>·</span>
                      <span style={{ fontSize: 12, color: 'var(--bf-text-2)' }}>{client?.name}</span>
                      <span style={{ color: 'var(--bf-text-faint)' }}>·</span>
                      <span style={{ fontSize: 12, color: 'var(--bf-text-2)' }}>Submitted {fmtDate(o.submission)}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      {[1,2,3].map(n => (
                        <span key={n} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, display: 'inline-flex', alignItems: 'center', gap: 3, height: 22, background: n <= lastFu ? 'var(--bf-good-soft)' : 'var(--bf-surface-3)', color: n <= lastFu ? 'var(--bf-good)' : 'var(--bf-text-faint)' }}>
                          {n <= lastFu && <Icon name="check" size={11} strokeWidth={3} />}Follow-up {n}
                        </span>
                      ))}
                      <span style={{ flex: 1 }} />
                      <span style={{ fontSize: 12, color: 'var(--bf-text-2)' }}>Next: <strong>{o.status === 'Negotiation' ? 'Commercial alignment' : 'Await opening'}</strong></span>
                      {o.followUp && (
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, display: 'inline-flex', alignItems: 'center', gap: 4, background: fu.tone === 'danger' ? 'var(--bf-danger-soft)' : 'var(--bf-warn-soft)', color: fu.tone === 'danger' ? 'var(--bf-danger)' : 'var(--bf-warn)' }}>
                          <Icon name="sent" size={12} />Follow-up {fu.label}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 7, marginTop: 11 }}>
                      <span style={{ fontSize: 11.5, padding: '2px 9px', borderRadius: 99, background: 'var(--bf-surface-3)', color: 'var(--bf-text-2)' }}>Commercial: {o.status === 'Negotiation' ? 'In progress' : 'Pending'}</span>
                      <span style={{ fontSize: 11.5, padding: '2px 9px', borderRadius: 99, background: 'var(--bf-surface-3)', color: 'var(--bf-text-2)' }}>Technical: Cleared</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="bf-canvas-pad" style={{ animation: 'bf-rise-up .4s cubic-bezier(.2,.8,.2,1)' }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.025em', margin: 0 }}>Submitted & Negotiation</h1>
          <span style={{ fontSize: 11.5, fontWeight: 700, padding: '2px 9px', borderRadius: 99, background: 'var(--bf-surface-3)', color: 'var(--bf-text-2)', height: 24, display: 'inline-flex', alignItems: 'center' }}>{submitted.length + negotiation.length}</span>
        </div>
        <p style={{ margin: '5px 0 0', fontSize: 13.5, color: 'var(--bf-text-2)' }}>Bids after submission — track follow-ups, clarifications and client response.</p>
      </div>

      {submitted.length + negotiation.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--bf-text-faint)' }}>
          <Icon name="sent" size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
          <div style={{ fontWeight: 700, fontSize: 15 }}>Nothing submitted yet</div>
        </div>
      )}

      <Group title="Negotiation" items={negotiation} color={toneStyle(300, theme).solid} />
      <Group title="Submitted — awaiting result" items={submitted} color={toneStyle(175, theme).solid} />
    </div>
  )
}
