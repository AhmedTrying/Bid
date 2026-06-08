'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useStore, optionLabels } from '@/lib/store'
import { STATUS } from '@/lib/data'
import { TEAM } from '@/lib/data'
import { Icon } from '@/components/ui/icon'
import type { Opportunity } from '@/lib/types'

interface QuickAddModalProps { onClose: () => void }

// Parse a bond-validity preset label ("180 days", "1 year") into a day count.
function daysFromLabel(l: string): number {
  const n = parseInt(l, 10)
  if (/year/i.test(l)) return (n || 1) * 365
  return n || 0
}

export function QuickAddModal({ onClose }: QuickAddModalProps) {
  const router  = useRouter()
  const addOpp  = useStore(s => s.addOpp)
  const flash   = useStore(s => s.flash)
  const clients = useStore(s => s.clients)
  const options = useStore(s => s.options)

  const portals     = optionLabels(options, 'portal')
  const classes     = optionLabels(options, 'classification')
  const procurement = optionLabels(options, 'procurement')
  const oppTypes    = optionLabels(options, 'opp_type')
  const partners    = optionLabels(options, 'partner')
  const bondPresets = optionLabels(options, 'bond_validity')

  const [f, setF] = useState({
    title: '', client: clients[0]?.id ?? 'rta', ref: '', rfpNumber: '',
    type: oppTypes[0] ?? 'Bid', cls: classes[0] ?? 'Civil Works',
    proc: procurement[0] ?? 'Open Tender', portal: portals[0] ?? 'In-Tend',
    partnerInvolved: false, partnerName: '', contractDuration: '',
    siteVisitMode: 'date', siteVisit: '',
    qDeadline: '', qDeadlineTime: '', bidDue: '', bidDueTime: '',
    bondReq: false, bondPct: '', bondValidityDays: '',
    priority: 'Medium', status: 'New Lead', owner: 'lh', value: '', notes: '',
  })
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF(p => ({ ...p, [k]: v }))

  const submit = () => {
    if (!f.title.trim()) return
    const payload: Partial<Opportunity> = {
      title: f.title, client: f.client, ref: f.ref, rfpNumber: f.rfpNumber,
      type: f.type as Opportunity['type'], cls: f.cls, proc: f.proc, portal: f.portal,
      partnerInvolved: f.partnerInvolved,
      partnerName: f.partnerInvolved ? f.partnerName : '',
      contractDuration: f.contractDuration,
      siteVisitMode: f.siteVisitMode as Opportunity['siteVisitMode'],
      siteVisit: f.siteVisitMode === 'date' ? f.siteVisit : '',
      qDeadline: f.qDeadline, qDeadlineTime: f.qDeadlineTime,
      bidDue: f.bidDue, bidDueTime: f.bidDueTime,
      bondReq: f.bondReq,
      bondPct: f.bondReq ? Number(f.bondPct) || 0 : 0,
      bondValidityDays: f.bondReq && f.bondValidityDays ? Number(f.bondValidityDays) || null : null,
      priority: f.priority as Opportunity['priority'],
      status: f.status as Opportunity['status'],
      owner: f.owner, value: Number(f.value) || 0, notes: f.notes,
    }
    const o = addOpp(payload)
    flash('Opportunity created · ' + o.ref)
    onClose()
    router.push(`/opportunities/${o.id}`)
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'oklch(0.2 0.01 60 / 0.42)', backdropFilter: 'blur(3px)',
        zIndex: 80, display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '6vh 20px', animation: 'bf-fade .16s ease',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bf-surface)', border: '1px solid var(--bf-border)',
          borderRadius: 20, boxShadow: 'var(--bf-shadow-pop)',
          width: '100%', maxWidth: 640, maxHeight: '88vh',
          display: 'flex', flexDirection: 'column',
          animation: 'bf-pop .18s cubic-bezier(.2,.8,.2,1)', overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--bf-border)', flexShrink: 0 }}>
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

        {/* Body (scrollable) */}
        <div style={{ padding: 20, display: 'grid', gap: 20, overflowY: 'auto' }}>
          <Group title="Opportunity">
            <label className="bf-field" style={{ gridColumn: '1 / -1' }}>
              <span>Opportunity title *</span>
              <input className="bf-input" autoFocus value={f.title}
                onChange={e => set('title', e.target.value)}
                placeholder="e.g. Al Rayan Interchange — Civil Works" />
            </label>
            <Select label="Client" value={f.client} onChange={v => set('client', v)}
              options={clients.map(c => ({ value: c.id, label: c.name }))} />
            <Select label="Type" value={f.type} onChange={v => set('type', v)}
              options={oppTypes.map(t => ({ value: t, label: t }))} />
            <label className="bf-field">
              <span>Reference number <Hint>blank = auto</Hint></span>
              <input className="bf-input" value={f.ref} onChange={e => set('ref', e.target.value)} placeholder="Auto-generated" />
            </label>
            <label className="bf-field">
              <span>RFP number <Hint>optional</Hint></span>
              <input className="bf-input" value={f.rfpNumber} onChange={e => set('rfpNumber', e.target.value)} placeholder="—" />
            </label>
            <Select label="Classification" value={f.cls} onChange={v => set('cls', v)}
              options={classes.map(c => ({ value: c, label: c }))} />
            <Select label="Procurement method" value={f.proc} onChange={v => set('proc', v)}
              options={procurement.map(p => ({ value: p, label: p }))} />
            <Select label="Portal" value={f.portal} onChange={v => set('portal', v)}
              options={portals.map(p => ({ value: p, label: p }))} />
          </Group>

          <Group title="Partner & contract">
            <Toggle label="Partner involved?" value={f.partnerInvolved} onChange={v => set('partnerInvolved', v)} />
            {f.partnerInvolved && (
              <label className="bf-field">
                <span>Partner name</span>
                <input className="bf-input" list="partner-list" value={f.partnerName}
                  onChange={e => set('partnerName', e.target.value)} placeholder="Type or pick…" />
                <datalist id="partner-list">{partners.map(p => <option key={p} value={p} />)}</datalist>
              </label>
            )}
            <label className="bf-field">
              <span>Contract duration</span>
              <input className="bf-input" value={f.contractDuration}
                onChange={e => set('contractDuration', e.target.value)} placeholder="e.g. 26 months" />
            </label>
          </Group>

          <Group title="Dates & deadlines">
            <Select label="Site visit" value={f.siteVisitMode} onChange={v => set('siteVisitMode', v)}
              options={[{ value: 'date', label: 'Date' }, { value: 'tbc', label: 'TBC' }, { value: 'not_required', label: 'Not required' }]} />
            {f.siteVisitMode === 'date' && (
              <label className="bf-field">
                <span>Site visit date</span>
                <input className="bf-input" type="date" value={f.siteVisit} onChange={e => set('siteVisit', e.target.value)} />
              </label>
            )}
            <label className="bf-field">
              <span>Question deadline</span>
              <input className="bf-input" type="date" value={f.qDeadline} onChange={e => set('qDeadline', e.target.value)} />
            </label>
            <label className="bf-field">
              <span>Question deadline time</span>
              <input className="bf-input" type="time" value={f.qDeadlineTime} onChange={e => set('qDeadlineTime', e.target.value)} />
            </label>
            <label className="bf-field">
              <span>Bid due date</span>
              <input className="bf-input" type="date" value={f.bidDue} onChange={e => set('bidDue', e.target.value)} />
            </label>
            <label className="bf-field">
              <span>Bid due time</span>
              <input className="bf-input" type="time" value={f.bidDueTime} onChange={e => set('bidDueTime', e.target.value)} />
            </label>
          </Group>

          <Group title="Bid bond">
            <Toggle label="Bid bond required?" value={f.bondReq} onChange={v => set('bondReq', v)} />
            {f.bondReq && (
              <>
                <label className="bf-field">
                  <span>Bond percentage</span>
                  <input className="bf-input" type="number" step="0.1" value={f.bondPct}
                    onChange={e => set('bondPct', e.target.value)} placeholder="e.g. 2" />
                </label>
                <label className="bf-field">
                  <span>Bond validity (days)</span>
                  <input className="bf-input" type="number" list="bond-list" value={f.bondValidityDays}
                    onChange={e => set('bondValidityDays', e.target.value)} placeholder="e.g. 180" />
                  <datalist id="bond-list">{bondPresets.map(p => <option key={p} value={daysFromLabel(p)}>{p}</option>)}</datalist>
                </label>
              </>
            )}
          </Group>

          <Group title="Assignment">
            <Select label="Priority" value={f.priority} onChange={v => set('priority', v)}
              options={['Low', 'Medium', 'High', 'Critical'].map(p => ({ value: p, label: p }))} />
            <Select label="Status" value={f.status} onChange={v => set('status', v)}
              options={Object.keys(STATUS).map(s => ({ value: s, label: s }))} />
            <Select label="Owner" value={f.owner} onChange={v => set('owner', v)}
              options={TEAM.map(t => ({ value: t.id, label: t.name }))} />
            <label className="bf-field">
              <span>Est. value (AED)</span>
              <input className="bf-input" type="number" value={f.value} onChange={e => set('value', e.target.value)} placeholder="0" />
            </label>
            <label className="bf-field" style={{ gridColumn: '1 / -1' }}>
              <span>Notes</span>
              <textarea className="bf-input" value={f.notes} onChange={e => set('notes', e.target.value)}
                rows={3} style={{ resize: 'vertical', fontFamily: 'inherit' }} placeholder="Internal notes…" />
            </label>
          </Group>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderTop: '1px solid var(--bf-border)', background: 'var(--bf-surface-2)', flexShrink: 0 }}>
          <span style={{ fontSize: 12, color: 'var(--bf-text-faint)' }}>
            Saved to <strong style={{ color: 'var(--bf-text)' }}>Opportunities</strong> · edit anytime
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

// ── Local field helpers ─────────────────────────────────────────────────────
function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="eyebrow" style={{ marginBottom: 10 }}>{title}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>{children}</div>
    </div>
  )
}

function Hint({ children }: { children: React.ReactNode }) {
  return <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--bf-text-faint)', marginLeft: 6 }}>{children}</span>
}

function Select({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]
}) {
  return (
    <label className="bf-field">
      <span>{label}</span>
      <select className="bf-select" value={value} onChange={e => onChange(e.target.value)}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  )
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="bf-field">
      <span>{label}</span>
      <div style={{ display: 'flex', gap: 6 }}>
        {[['Yes', true], ['No', false]].map(([l, v]) => (
          <button key={l as string} type="button" className="bf-btn" onClick={() => onChange(v as boolean)}
            style={{ flex: 1, fontWeight: 600, background: value === v ? 'var(--bf-accent)' : undefined, color: value === v ? 'var(--bf-on-accent)' : undefined }}>
            {l as string}
          </button>
        ))}
      </div>
    </label>
  )
}
