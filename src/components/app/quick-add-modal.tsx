'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { CLIENTS, PORTALS, CLASSES, STATUS } from '@/lib/data'
import { Icon } from '@/components/ui/icon'

interface QuickAddModalProps { onClose: () => void }

export function QuickAddModal({ onClose }: QuickAddModalProps) {
  const router = useRouter()
  const addOpp = useStore(s => s.addOpp)
  const flash  = useStore(s => s.flash)

  const [f, setF] = useState({
    title: '', client: 'rta', type: 'Bid', cls: 'Civil Works',
    portal: 'In-Tend', priority: 'Medium', status: 'New Lead',
    bidDue: '', owner: 'lh', value: '',
  })
  const set = (k: string, v: string) => setF(p => ({ ...p, [k]: v }))

  const submit = () => {
    if (!f.title.trim()) return
    const o = addOpp({ ...f, value: Number(f.value) || 0 } as Parameters<typeof addOpp>[0])
    flash('Opportunity created · ' + o.ref)
    onClose()
    router.push(`/opportunities/${o.id}`)
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'oklch(0.2 0.01 60 / 0.42)',
        backdropFilter: 'blur(3px)',
        zIndex: 80, display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '7vh 20px',
        animation: 'bf-fade .16s ease',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bf-surface)', border: '1px solid var(--bf-border)',
          borderRadius: 20, boxShadow: 'var(--bf-shadow-pop)',
          width: '100%', maxWidth: 560,
          animation: 'bf-pop .18s cubic-bezier(.2,.8,.2,1)', overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--bf-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--bf-accent-soft)', color: 'var(--bf-accent-text)', display: 'grid', placeItems: 'center' }}>
              <Icon name="plus" size={17} strokeWidth={2.2} />
            </div>
            <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.02em' }}>New opportunity</span>
          </div>
          <button className="bf-btn bf-btn-icon bf-btn-ghost" onClick={onClose}>
            <Icon name="x" size={17} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 20, display: 'grid', gap: 14 }}>
          <label className="bf-field">
            <span>Opportunity title</span>
            <input
              className="bf-input"
              autoFocus
              value={f.title}
              onChange={e => set('title', e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              placeholder="e.g. Al Rayan Interchange — Civil Works"
            />
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label className="bf-field">
              <span>Client</span>
              <select className="bf-select" value={f.client} onChange={e => set('client', e.target.value)}>
                {CLIENTS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label className="bf-field">
              <span>Portal</span>
              <select className="bf-select" value={f.portal} onChange={e => set('portal', e.target.value)}>
                {PORTALS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>
            <label className="bf-field">
              <span>Type</span>
              <select className="bf-select" value={f.type} onChange={e => set('type', e.target.value)}>
                {['Bid','PQQ','RFQ','EOI','NDA','Tender'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>
            <label className="bf-field">
              <span>Classification</span>
              <select className="bf-select" value={f.cls} onChange={e => set('cls', e.target.value)}>
                {CLASSES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>
            <label className="bf-field">
              <span>Priority</span>
              <select className="bf-select" value={f.priority} onChange={e => set('priority', e.target.value)}>
                {['Low','Medium','High','Critical'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>
            <label className="bf-field">
              <span>Status</span>
              <select className="bf-select" value={f.status} onChange={e => set('status', e.target.value)}>
                {Object.keys(STATUS).map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>
            <label className="bf-field">
              <span>Bid due date</span>
              <input className="bf-input" type="date" value={f.bidDue} onChange={e => set('bidDue', e.target.value)} />
            </label>
            <label className="bf-field">
              <span>Est. value (AED)</span>
              <input className="bf-input" type="number" value={f.value} onChange={e => set('value', e.target.value)} placeholder="0" />
            </label>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderTop: '1px solid var(--bf-border)', background: 'var(--bf-surface-2)' }}>
          <span style={{ fontSize: 12, color: 'var(--bf-text-faint)' }}>
            Saved to <strong style={{ color: 'var(--bf-text)' }}>Opportunities</strong> · fill details later
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="bf-btn" onClick={onClose}>Cancel</button>
            <button className="bf-btn bf-btn-primary" onClick={submit} disabled={!f.title.trim()}>
              <Icon name="check" size={16} strokeWidth={2.2} />Create
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
