'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useStore, optionLabels } from '@/lib/store'
import { toneStyle } from '@/lib/helpers'
import { Icon } from '@/components/ui/icon'
import type { Client } from '@/lib/types'

export default function ClientsPage() {
  const opps         = useStore(s => s.opps)
  const theme        = useStore(s => s.theme)
  const clients      = useStore(s => s.clients)
  const options      = useStore(s => s.options)
  const addClient    = useStore(s => s.addClient)
  const updateClient = useStore(s => s.updateClient)
  const deleteClient = useStore(s => s.deleteClient)
  const flash        = useStore(s => s.flash)
  const router = useRouter()

  const [editing, setEditing] = useState<Client | null>(null)
  const [adding, setAdding]   = useState(false)

  const clientStats = clients.map(c => {
    const co = opps.filter(o => o.client === c.id)
    const live = co.filter(o => ['Live Bid','Bid in Progress','Live PQQ','Live RFQ'].includes(o.status)).length
    const submitted = co.filter(o => ['Submitted','Negotiation'].includes(o.status)).length
    const total = c.wins + c.losses
    const winRate = total ? Math.round((c.wins / total) * 100) : null
    return { ...c, co, live, submitted, winRate }
  })

  const remove = (c: Client) => {
    const used = opps.filter(o => o.client === c.id).length
    if (used > 0) { flash(`Can’t delete — ${used} opportunit${used === 1 ? 'y' : 'ies'} use ${c.name}`); return }
    if (!confirm(`Delete ${c.name}?`)) return
    deleteClient(c.id)
    flash('Client deleted')
  }

  return (
    <div className="bf-canvas-pad" style={{ animation: 'bf-rise-up .4s cubic-bezier(.2,.8,.2,1)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.025em', margin: 0 }}>Clients & Portals</h1>
          <p style={{ margin: '5px 0 0', fontSize: 13.5, color: 'var(--bf-text-2)' }}>Client relationships, portal access, and win/loss track record.</p>
        </div>
        <button className="bf-btn bf-btn-primary" onClick={() => setAdding(true)}>
          <Icon name="plus" size={15} />New client
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: 14 }}>
        {clientStats.map(c => {
          const t = toneStyle(175, theme)
          return (
            <div key={c.id} className="bf-card bf-hoverlift" style={{ padding: 18, cursor: 'default' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 3 }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--bf-text-2)' }}>{c.sector || '—'}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 11.5, padding: '3px 10px', borderRadius: 99, background: 'var(--bf-surface-3)', color: 'var(--bf-text-2)', fontWeight: 600 }}>{c.portal || 'No portal'}</span>
                  <button className="bf-btn bf-btn-icon bf-btn-ghost" style={{ padding: 5 }} title="Edit" onClick={() => setEditing(c)}>
                    <Icon name="edit" size={14} />
                  </button>
                  <button className="bf-btn bf-btn-icon bf-btn-ghost" style={{ padding: 5, color: 'var(--bf-danger)' }} title="Delete" onClick={() => remove(c)}>
                    <Icon name="trash" size={14} />
                  </button>
                </div>
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
                <span style={{ fontSize: 13, color: 'var(--bf-text-2)' }}>{c.contact || '—'}</span>
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

      {(adding || editing) && (
        <ClientModal
          client={editing}
          portals={optionLabels(options, 'portal')}
          onClose={() => { setAdding(false); setEditing(null) }}
          onSave={(data) => {
            if (editing) { updateClient(editing.id, data); flash('Client updated') }
            else { addClient(data); flash('Client added') }
            setAdding(false); setEditing(null)
          }}
        />
      )}
    </div>
  )
}

// ── Add / edit client modal ─────────────────────────────────────────────────
function ClientModal({ client, portals, onClose, onSave }: {
  client: Client | null
  portals: string[]
  onClose: () => void
  onSave: (data: Partial<Client>) => void
}) {
  const [f, setF] = useState({
    name: client?.name ?? '', sector: client?.sector ?? '', contact: client?.contact ?? '',
    portal: client?.portal ?? (portals[0] ?? ''),
    wins: String(client?.wins ?? 0), losses: String(client?.losses ?? 0),
  })
  const set = (k: keyof typeof f, v: string) => setF(p => ({ ...p, [k]: v }))
  const save = () => {
    if (!f.name.trim()) return
    onSave({ name: f.name, sector: f.sector, contact: f.contact, portal: f.portal, wins: Number(f.wins) || 0, losses: Number(f.losses) || 0 })
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'oklch(0.2 0.01 60 / 0.42)', backdropFilter: 'blur(3px)', zIndex: 80, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '10vh 20px', animation: 'bf-fade .16s ease' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bf-surface)', border: '1px solid var(--bf-border)', borderRadius: 20, boxShadow: 'var(--bf-shadow-pop)', width: '100%', maxWidth: 520, overflow: 'hidden', animation: 'bf-pop .18s cubic-bezier(.2,.8,.2,1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--bf-border)' }}>
          <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.02em' }}>{client ? 'Edit client' : 'New client'}</span>
          <button className="bf-btn bf-btn-icon bf-btn-ghost" onClick={onClose}><Icon name="x" size={17} /></button>
        </div>
        <div style={{ padding: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label className="bf-field" style={{ gridColumn: '1 / -1' }}>
            <span>Client name *</span>
            <input className="bf-input" autoFocus value={f.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Roads & Transport Authority" />
          </label>
          <label className="bf-field">
            <span>Sector</span>
            <input className="bf-input" value={f.sector} onChange={e => set('sector', e.target.value)} placeholder="e.g. Transport" />
          </label>
          <label className="bf-field">
            <span>Contact</span>
            <input className="bf-input" value={f.contact} onChange={e => set('contact', e.target.value)} placeholder="Name / desk" />
          </label>
          <label className="bf-field">
            <span>Portal</span>
            <input className="bf-input" list="client-portal-list" value={f.portal} onChange={e => set('portal', e.target.value)} placeholder="Pick or type…" />
            <datalist id="client-portal-list">{portals.map(p => <option key={p} value={p} />)}</datalist>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label className="bf-field">
              <span>Wins</span>
              <input className="bf-input" type="number" value={f.wins} onChange={e => set('wins', e.target.value)} />
            </label>
            <label className="bf-field">
              <span>Losses</span>
              <input className="bf-input" type="number" value={f.losses} onChange={e => set('losses', e.target.value)} />
            </label>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '14px 20px', borderTop: '1px solid var(--bf-border)', background: 'var(--bf-surface-2)' }}>
          <button className="bf-btn" onClick={onClose}>Cancel</button>
          <button className="bf-btn bf-btn-primary" onClick={save} disabled={!f.name.trim()}>
            <Icon name="check" size={16} strokeWidth={2.2} />{client ? 'Save' : 'Add client'}
          </button>
        </div>
      </div>
    </div>
  )
}
