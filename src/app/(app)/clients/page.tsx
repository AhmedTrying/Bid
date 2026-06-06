'use client'

import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { CLIENTS, STATUS } from '@/lib/data'
import { toneStyle } from '@/lib/helpers'
import { Icon } from '@/components/ui/icon'

export default function ClientsPage() {
  const opps  = useStore(s => s.opps)
  const theme = useStore(s => s.theme)
  const router = useRouter()

  const clientStats = CLIENTS.map(c => {
    const co = opps.filter(o => o.client === c.id)
    const live = co.filter(o => ['Live Bid','Bid in Progress','Live PQQ','Live RFQ'].includes(o.status)).length
    const submitted = co.filter(o => ['Submitted','Negotiation'].includes(o.status)).length
    const total = c.wins + c.losses
    const winRate = total ? Math.round((c.wins / total) * 100) : null
    return { ...c, co, live, submitted, winRate }
  })

  return (
    <div className="bf-canvas-pad" style={{ animation: 'bf-rise-up .4s cubic-bezier(.2,.8,.2,1)' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.025em', margin: 0 }}>Clients & Portals</h1>
        <p style={{ margin: '5px 0 0', fontSize: 13.5, color: 'var(--bf-text-2)' }}>Client relationships, portal access, and win/loss track record.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: 14 }}>
        {clientStats.map(c => {
          const t = toneStyle(175, theme)
          return (
            <div key={c.id} className="bf-card bf-hoverlift" style={{ padding: 18, cursor: 'default' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 3 }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--bf-text-2)' }}>{c.sector}</div>
                </div>
                <span style={{ fontSize: 11.5, padding: '3px 10px', borderRadius: 99, background: 'var(--bf-surface-3)', color: 'var(--bf-text-2)', fontWeight: 600 }}>{c.portal}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid var(--bf-border-2)' }}>
                <div>
                  <div className="eyebrow" style={{ marginBottom: 3 }}>Active</div>
                  <div style={{ fontSize: 18, fontWeight: 800 }}>{c.live}</div>
                </div>
                <div>
                  <div className="eyebrow" style={{ marginBottom: 3 }}>Submitted</div>
                  <div style={{ fontSize: 18, fontWeight: 800 }}>{c.submitted}</div>
                </div>
                <div>
                  <div className="eyebrow" style={{ marginBottom: 3 }}>Win rate</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: c.winRate !== null && c.winRate >= 40 ? 'var(--bf-good)' : 'var(--bf-text)' }}>{c.winRate !== null ? `${c.winRate}%` : '—'}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
                <Icon name="user" size={14} style={{ color: 'var(--bf-text-faint)' }} />
                <span style={{ fontSize: 13, color: 'var(--bf-text-2)' }}>{c.contact}</span>
              </div>

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {c.wins > 0 && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: 'var(--bf-good-soft)', color: 'var(--bf-good)', fontWeight: 600 }}>{c.wins}W</span>}
                {c.losses > 0 && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: 'var(--bf-danger-soft)', color: 'var(--bf-danger)', fontWeight: 600 }}>{c.losses}L</span>}
                {c.live > 0 && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: t.bg, color: t.fg, fontWeight: 600 }}>{c.live} live</span>}
                <button className="bf-btn bf-btn-sm bf-btn-ghost" style={{ marginLeft: 'auto', fontSize: 11 }} onClick={() => router.push(`/opportunities?client=${c.id}`)}>
                  View {c.co.length} opps <Icon name="arrowRight" size={12} />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
