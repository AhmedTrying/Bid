'use client'

import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { money, fmtDate, toneStyle } from '@/lib/helpers'
import { byClient } from '@/lib/data'
import { Icon } from '@/components/ui/icon'
import { Avatar } from '@/components/ui/avatar'

export default function AwardedPage() {
  const opps   = useStore(s => s.opps)
  const theme  = useStore(s => s.theme)
  const router = useRouter()

  const items = opps.filter(o => o.status === 'Awarded')
  const total = items.reduce((s, o) => s + (o.value || 0), 0)
  const t     = toneStyle(152, theme)

  return (
    <div className="bf-canvas-pad" style={{ animation: 'bf-rise-up .4s cubic-bezier(.2,.8,.2,1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.025em', margin: 0 }}>Awarded</h1>
            <span style={{ fontSize: 11.5, fontWeight: 700, padding: '2px 9px', borderRadius: 99, background: 'var(--bf-surface-3)', color: 'var(--bf-text-2)', height: 24, display: 'inline-flex', alignItems: 'center' }}>{items.length}</span>
          </div>
          <p style={{ margin: '5px 0 0', fontSize: 13.5, color: 'var(--bf-text-2)' }}>Won projects — handover to operations and contract status.</p>
        </div>
        <div className="bf-card" style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Icon name="trophy" size={20} style={{ color: t.fg }} />
          <div>
            <div className="eyebrow">Total awarded value</div>
            <div className="mono" style={{ fontSize: 18, fontWeight: 800 }}>{money(total, true)}</div>
          </div>
        </div>
      </div>

      {items.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--bf-text-faint)' }}>
          <Icon name="trophy" size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
          <div style={{ fontWeight: 700, fontSize: 15 }}>No awards yet</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Winning bids will be celebrated here.</div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(380px,1fr))', gap: 14 }}>
        {items.map(o => {
          const client = byClient(o.client)
          return (
            <div key={o.id} className="bf-card bf-hoverlift" style={{ padding: 0, cursor: 'pointer', overflow: 'hidden' }} onClick={() => router.push(`/opportunities/${o.id}`)}>
              <div style={{ height: 5, background: t.solid }} />
              <div style={{ padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 12, padding: '2px 9px', borderRadius: 99, display: 'inline-flex', alignItems: 'center', gap: 5, background: 'var(--bf-good-soft)', color: 'var(--bf-good)', fontWeight: 600 }}>
                    <Icon name="trophy" size={12} />Awarded
                  </span>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--bf-text-faint)' }}>{o.ref}</span>
                </div>
                <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.3, marginBottom: 6 }}>{o.title}</div>
                <div style={{ fontSize: 12.5, color: 'var(--bf-text-2)', marginBottom: 14 }}>{client?.name}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                  <div><div className="eyebrow" style={{ marginBottom: 2 }}>Project value</div><div className="mono" style={{ fontWeight: 700, fontSize: 13.5 }}>{money(o.value, true)}</div></div>
                  <div><div className="eyebrow" style={{ marginBottom: 2 }}>Awarded</div><div style={{ fontWeight: 600, fontSize: 13.5 }}>{fmtDate(o.updated, { year: true })}</div></div>
                  <div><div className="eyebrow" style={{ marginBottom: 2 }}>Contract</div><div style={{ fontSize: 13 }}>{o.id === 'o12' ? 'Signed' : 'Letter of Award'}</div></div>
                  <div><div className="eyebrow" style={{ marginBottom: 2 }}>Kickoff</div><div style={{ fontSize: 13 }}>18 Jun 2026</div></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid var(--bf-border-2)' }}>
                  <span style={{ fontSize: 11.5, padding: '2px 9px', borderRadius: 99, display: 'inline-flex', alignItems: 'center', gap: 5, background: 'var(--bf-warn-soft)', color: 'var(--bf-warn)', fontWeight: 600 }}>
                    <Icon name="refresh" size={12} />Handover in progress
                  </span>
                  <Avatar person={o.owner} size={24} theme={theme} />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
