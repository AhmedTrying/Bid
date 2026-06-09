'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useStore, optionLabels } from '@/lib/store'
import { daysUntil, fmtDate, money } from '@/lib/helpers'
import { STATUS, TEAM, CLASSES, PROCUREMENT, PORTALS, byClient, byId } from '@/lib/data'
import { Icon } from '@/components/ui/icon'
import { Avatar } from '@/components/ui/avatar'
import { StatusBadge, PriorityBadge, TypePill } from '@/components/ui/badges'
import { SavedViews } from '@/components/app/saved-views'
import type { Opportunity, SavedViewConfig } from '@/lib/types'

// ── Column definitions ────────────────────────────────────────────────────────
const COLS = [
  { key: 'ref',         label: 'SATCO Ref',     w: 128, type: 'ref' },
  { key: 'title',       label: 'Title',         w: 280, type: 'text',   pin: true },
  { key: 'rfpNumber',   label: 'RFP No.',       w: 120, type: 'text' },
  { key: 'client',      label: 'Client',        w: 170, type: 'client' },
  { key: 'portal',      label: 'Portal',        w: 120, type: 'select', opts: () => PORTALS },
  { key: 'type',        label: 'Type',          w: 84,  type: 'select', opts: () => ['Bid','PQQ','RFQ','EOI','NDA','Tender'] },
  { key: 'cls',         label: 'Classification',w: 148, type: 'select', opts: () => CLASSES },
  { key: 'proc',        label: 'Procurement',   w: 128, type: 'select', opts: () => PROCUREMENT },
  { key: 'partnerName', label: 'Partner',       w: 140, type: 'text' },
  { key: 'contractDuration', label: 'Duration', w: 110, type: 'text' },
  { key: 'status',      label: 'Status',        w: 140, type: 'status' },
  { key: 'priority',    label: 'Priority',      w: 120, type: 'priority' },
  { key: 'owner',       label: 'Owner',         w: 120, type: 'person' },
  { key: 'reviewer',    label: 'Reviewer',      w: 120, type: 'person' },
  { key: 'rfpReceived', label: 'RFP Received',  w: 116, type: 'date' },
  { key: 'siteVisit',   label: 'Site Visit',    w: 112, type: 'date' },
  { key: 'qDeadline',   label: 'Q. Deadline',   w: 116, type: 'date' },
  { key: 'bidDue',      label: 'Bid Due',       w: 120, type: 'date',   due: true },
  { key: 'submission',  label: 'Submitted',     w: 112, type: 'date' },
  { key: 'followUp',    label: 'Follow-up',     w: 112, type: 'date' },
  { key: 'bondPct',     label: 'Bond %',        w: 84,  type: 'num' },
  { key: 'bondValidity',label: 'Bond Valid',    w: 112, type: 'date' },
  { key: 'result',      label: 'Result',        w: 96,  type: 'text' },
  { key: 'value',       label: 'Est. Value',    w: 124, type: 'money' },
  { key: 'updated',     label: 'Updated',       w: 108, type: 'date' },
] as const

type ColKey = typeof COLS[number]['key']

// ── View tabs ─────────────────────────────────────────────────────────────────
const VIEWS = [
  { id: 'all',  label: 'All',           icon: 'list',  f: (_o: Opportunity) => true },
  { id: 'live', label: 'Live bids',     icon: 'bid',   f: (o: Opportunity) => ['Live Bid','Bid in Progress'].includes(o.status) },
  { id: 'due',  label: 'Due this week', icon: 'clock', f: (o: Opportunity) => { const d = daysUntil(o.bidDue); return d !== null && d >= 0 && d <= 7 && !o.submission } },
  { id: 'pqq',  label: 'PQQ / RFQ',    icon: 'pqq',   f: (o: Opportunity) => ['Live PQQ','Live RFQ'].includes(o.status) },
  { id: 'sub',  label: 'Submitted',     icon: 'sent',  f: (o: Opportunity) => ['Submitted','Negotiation'].includes(o.status) },
  { id: 'mine', label: 'My work',       icon: 'user',  f: (o: Opportunity) => o.owner === 'lh' },
]

// ── Inline cell ───────────────────────────────────────────────────────────────
function Cell({ o, colKey, colType, colOpts, isDue, theme, overdue, updateOpp, onOpen }: {
  o: Opportunity; colKey: string; colType: string; colOpts?: (() => string[]) | undefined
  isDue?: boolean; theme: 'light'|'dark'; overdue: boolean; updateOpp: (id: string, p: Partial<Opportunity>) => void
  onOpen: () => void
}) {
  const [edit, setEdit] = useState(false)
  const v = (o as unknown as Record<string, unknown>)[colKey] as string | number | undefined

  const commit = (val: string | number) => { updateOpp(o.id, { [colKey]: val }); setEdit(false) }

  if (colType === 'ref') return (
    <div className="cell">
      <button onClick={onOpen} className="mono"
        style={{ fontSize: 11.5, color: 'var(--bf-accent-text)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
        {v as string}
      </button>
    </div>
  )

  if (colType === 'text' && (colKey === 'title')) return (
    <div className="cell">
      <button onClick={onOpen}
        style={{ fontWeight: 600, fontSize: 13, color: 'var(--bf-text)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 260 }}
        title={v as string}>
        {v as string}
      </button>
    </div>
  )

  if (colType === 'client') {
    const cl = byClient(v as string)
    return (
      <div className="cell">
        <Icon name="building" size={13} style={{ color: 'var(--bf-text-faint)' }} />
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--bf-text-2)', fontSize: 13 }}>{cl?.name ?? '—'}</span>
      </div>
    )
  }

  if (colType === 'status') return edit
    ? <select className="bf-select" autoFocus value={v as string} onChange={e => commit(e.target.value)} onBlur={() => setEdit(false)} style={{ height: 34, fontSize: 12 }}>
        {Object.keys(STATUS).map(s => <option key={s} value={s}>{s}</option>)}
      </select>
    : <div className="cell" onClick={() => setEdit(true)} style={{ cursor: 'pointer' }}>
        <StatusBadge status={v as string} theme={theme} />
      </div>

  if (colType === 'priority') return edit
    ? <select className="bf-select" autoFocus value={v as string} onChange={e => commit(e.target.value)} onBlur={() => setEdit(false)} style={{ height: 34, fontSize: 12 }}>
        {['Low','Medium','High','Critical'].map(s => <option key={s} value={s}>{s}</option>)}
      </select>
    : <div className="cell" onClick={() => setEdit(true)} style={{ cursor: 'pointer' }}>
        <PriorityBadge priority={v as string} theme={theme} />
      </div>

  if (colType === 'person') return edit
    ? <select className="bf-select" autoFocus value={(v as string) || ''} onChange={e => commit(e.target.value)} onBlur={() => setEdit(false)} style={{ height: 34, fontSize: 12 }}>
        <option value="">Unassigned</option>
        {TEAM.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
      </select>
    : <div className="cell" onClick={() => setEdit(true)} style={{ cursor: 'pointer', gap: 7 }}>
        <Avatar person={v as string} size={22} theme={theme} />
        <span style={{ fontSize: 12.5, color: 'var(--bf-text-2)', whiteSpace: 'nowrap' }}>{byId(v as string)?.name?.split(' ')[0] ?? '—'}</span>
      </div>

  if (colType === 'select') return edit
    ? <select className="bf-select" autoFocus value={(v as string) || ''} onChange={e => commit(e.target.value)} onBlur={() => setEdit(false)} style={{ height: 34, fontSize: 12 }}>
        {colOpts?.().map(s => <option key={s} value={s}>{s}</option>)}
      </select>
    : colKey === 'type'
      ? <div className="cell" onClick={() => setEdit(true)} style={{ cursor: 'pointer' }}><TypePill type={v as string} /></div>
      : <div className="cell" onClick={() => setEdit(true)} style={{ cursor: 'pointer', color: 'var(--bf-text-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{(v as string) || '—'}</div>

  if (colType === 'date') return edit
    ? <input type="date" autoFocus className="bf-input" defaultValue={v as string} onBlur={e => commit(e.target.value)} onKeyDown={e => e.key === 'Enter' && commit((e.target as HTMLInputElement).value)} style={{ height: 34, fontSize: 12 }} />
    : <div className="cell" onClick={() => setEdit(true)} style={{ cursor: 'pointer' }}>
        {v
          ? <span className="mono" style={{ fontSize: 12, color: isDue && overdue ? 'var(--bf-danger)' : 'var(--bf-text-2)', fontWeight: isDue && overdue ? 700 : 400 }}>
              {fmtDate(v as string)}{isDue && overdue && ' ⚠'}
            </span>
          : <span style={{ color: 'var(--bf-text-faint)' }}>—</span>}
      </div>

  if (colType === 'num') return edit
    ? <input type="number" autoFocus className="bf-input" defaultValue={v as number} onBlur={e => commit(Number((e.target as HTMLInputElement).value) || 0)} style={{ height: 34, fontSize: 12 }} />
    : <div className="cell" onClick={() => setEdit(true)} style={{ cursor: 'pointer' }}>
        <span className="mono" style={{ fontSize: 12, color: 'var(--bf-text-2)' }}>{v ? `${v}%` : '—'}</span>
      </div>

  if (colType === 'money') return edit
    ? <input type="number" autoFocus className="bf-input" defaultValue={o.value} onBlur={e => commit(Number((e.target as HTMLInputElement).value) || 0)} style={{ height: 34, fontSize: 12 }} />
    : <div className="cell" onClick={() => setEdit(true)} style={{ cursor: 'pointer' }}>
        <span className="mono" style={{ fontSize: 12, fontWeight: o.value ? 600 : 400, color: o.value ? 'var(--bf-text)' : 'var(--bf-text-faint)' }}>{money(o.value, true)}</span>
      </div>

  // generic text
  return edit
    ? <input autoFocus className="bf-input" defaultValue={v as string} onBlur={e => commit((e.target as HTMLInputElement).value)} onKeyDown={e => e.key === 'Enter' && commit((e.target as HTMLInputElement).value)} style={{ height: 34, fontSize: 12 }} />
    : <div className="cell" onClick={() => setEdit(true)} style={{ cursor: 'pointer', color: v ? 'var(--bf-text-2)' : 'var(--bf-text-faint)', whiteSpace: 'nowrap' }}>{(v as string) || '—'}</div>
}

// ── Column visibility menu ────────────────────────────────────────────────────
function ColumnMenu({ hidden, setHidden, onClose }: {
  hidden: Record<string, boolean>; setHidden: (f: (p: Record<string, boolean>) => Record<string, boolean>) => void; onClose: () => void
}) {
  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 48 }} onClick={onClose} />
      <div className="bf-card" style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, width: 220, zIndex: 50, padding: 8, maxHeight: 360, overflowY: 'auto', animation: 'bf-fade .15s' }}>
        <div className="eyebrow" style={{ padding: '6px 8px' }}>Toggle columns</div>
        {COLS.map(c => (
          <label key={c.key}
            style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 8px', borderRadius: 7, cursor: 'pointer', fontSize: 13 }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bf-surface-2)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            <input type="checkbox" checked={!hidden[c.key]}
              onChange={() => setHidden(p => ({ ...p, [c.key]: !p[c.key] }))}
              disabled={'pin' in c && c.pin} />
            <span style={{ color: 'pin' in c && c.pin ? 'var(--bf-text-faint)' : 'var(--bf-text)' }}>{c.label}</span>
          </label>
        ))}
      </div>
    </>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function OpportunitiesPage() {
  const opps       = useStore(s => s.opps)
  const theme      = useStore(s => s.theme)
  const updateOpp  = useStore(s => s.updateOpp)
  const flash      = useStore(s => s.flash)
  const me         = useStore(s => s.currentUser)
  const router     = useRouter()
  // "My work" filters by the signed-in user (not a hardcoded id).
  const vf = (v: typeof VIEWS[number]) => v.id === 'mine' ? (o: Opportunity) => o.owner === me.id : v.f

  const [view,         setView]         = useState('all')
  const [q,            setQ]            = useState('')
  const [groupBy,      setGroupBy]      = useState('none')
  const [sortKey,      setSortKey]      = useState<ColKey>('bidDue')
  const [sortDir,      setSortDir]      = useState<'asc'|'desc'>('asc')
  const [statusFilter, setStatusFilter] = useState('all')
  const [colMenu,      setColMenu]      = useState(false)
  const [hidden,       setHidden]       = useState<Record<string, boolean>>({ rfpNumber: true, proc: true, partnerName: true, contractDuration: true, reviewer: true, bondValidity: true, updated: true })
  const options = useStore(s => s.options)
  // Live option sources for editable select columns (reflect Settings → Lists).
  const liveOpts: Record<string, () => string[]> = {
    portal: () => optionLabels(options, 'portal'),
    cls:    () => optionLabels(options, 'classification'),
    proc:   () => optionLabels(options, 'procurement'),
    type:   () => optionLabels(options, 'opp_type'),
  }

  const activeView = VIEWS.find(v => v.id === view)!
  const visibleCols = COLS.filter(c => !hidden[c.key])

  const rows = useMemo(() => {
    let r = opps.filter(vf(activeView)).filter(o => {
      if (statusFilter !== 'all' && o.status !== statusFilter) return false
      if (q) {
        const s = q.toLowerCase()
        return o.title.toLowerCase().includes(s) || o.ref.toLowerCase().includes(s) || (byClient(o.client)?.name?.toLowerCase().includes(s) ?? false)
      }
      return true
    })
    r = [...r].sort((a, b) => {
      const av = (a as unknown as Record<string, unknown>)[sortKey]
      const bv = (b as unknown as Record<string, unknown>)[sortKey]
      if (sortKey === 'value' || sortKey === 'bondPct') {
        const an = (av as number) || 0, bn = (bv as number) || 0
        return sortDir === 'asc' ? an - bn : bn - an
      }
      const as = (av as string) || 'zzz', bs = (bv as string) || 'zzz'
      return sortDir === 'asc' ? (as > bs ? 1 : -1) : (as < bs ? 1 : -1)
    })
    return r
  }, [opps, activeView, statusFilter, q, sortKey, sortDir])

  const groups = useMemo(() => {
    if (groupBy === 'none') return [{ key: null as string | null, rows }]
    const map: Record<string, Opportunity[]> = {}
    rows.forEach(o => {
      let k: string
      if (groupBy === 'client')      k = byClient(o.client)?.name ?? '—'
      else if (groupBy === 'owner')  k = byId(o.owner)?.name ?? 'Unassigned'
      else                           k = (o as unknown as Record<string, unknown>)[groupBy] as string || '—'
      ;(map[k] = map[k] || []).push(o)
    })
    return Object.entries(map).map(([key, rows]) => ({ key, rows }))
  }, [rows, groupBy])

  const toggleSort = (k: ColKey) => {
    if (sortKey === k) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(k); setSortDir('asc') }
  }

  // ── Saved views (Fix 1) ───────────────────────────────────────────────────
  const currentViewConfig: SavedViewConfig = { view, q, statusFilter, groupBy, sortKey, sortDir, hidden }
  const applyView = (c: SavedViewConfig) => {
    if (c.view !== undefined) setView(c.view)
    if (c.q !== undefined) setQ(c.q)
    if (c.statusFilter !== undefined) setStatusFilter(c.statusFilter)
    if (c.groupBy !== undefined) setGroupBy(c.groupBy)
    if (c.sortKey !== undefined) setSortKey(c.sortKey as ColKey)
    if (c.sortDir !== undefined) setSortDir(c.sortDir)
    if (c.hidden !== undefined) setHidden(c.hidden as Record<string, boolean>)
  }

  const exportCSV = () => {
    const heads = visibleCols.map(c => c.label)
    const lines = [heads.join(',')]
    rows.forEach(o => {
      lines.push(visibleCols.map(c => {
        let v: string | number | undefined = (o as unknown as Record<string, unknown>)[c.key] as string | number
        if (c.type === 'client') v = byClient(o.client)?.name ?? ''
        if (c.type === 'person') v = byId((o as unknown as Record<string, unknown>)[c.key] as string)?.name ?? ''
        if (c.type === 'money') v = o.value || ''
        return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"'
      }).join(','))
    })
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob); a.download = 'BidFlow_Opportunities.csv'; a.click()
    flash(`Exported ${rows.length} rows to CSV`)
  }

  const isOverdue = (o: Opportunity) => {
    const d = daysUntil(o.bidDue)
    return d !== null && d < 0 && !o.submission && !['Awarded','Closed Lost','Cancelled','Postponed','No-Go'].includes(o.status)
  }

  const minW = visibleCols.reduce((s, c) => s + c.w, 50)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* view tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '10px 20px 0', borderBottom: '1px solid var(--bf-border)', flexShrink: 0, overflowX: 'auto' }}>
        {VIEWS.map(v => (
          <button key={v.id} onClick={() => setView(v.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '9px 13px',
              border: 'none', borderBottom: `2px solid ${view === v.id ? 'var(--bf-accent)' : 'transparent'}`,
              background: 'transparent', cursor: 'pointer', fontFamily: 'inherit',
              fontSize: 13, fontWeight: view === v.id ? 650 : 550,
              color: view === v.id ? 'var(--bf-text)' : 'var(--bf-text-3)', whiteSpace: 'nowrap',
            }}>
            <Icon name={v.icon} size={15} />{v.label}
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--bf-text-faint)' }}>{opps.filter(vf(v)).length}</span>
          </button>
        ))}
        <div style={{ marginLeft: 4 }}>
          <SavedViews route="/opportunities" current={currentViewConfig} onApply={applyView} />
        </div>
      </div>

      {/* toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 20px', borderBottom: '1px solid var(--bf-border)', flexWrap: 'wrap', gap: 10, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Icon name="search" size={15} style={{ position: 'absolute', left: 10, color: 'var(--bf-text-faint)' }} />
            <input className="bf-input" value={q} onChange={e => setQ(e.target.value)} placeholder="Search…" style={{ width: 200, paddingLeft: 31, height: 34 }} />
          </div>
          <select className="bf-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ height: 34 }}>
            <option value="all">All statuses</option>
            {Object.keys(STATUS).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="bf-select" value={groupBy} onChange={e => setGroupBy(e.target.value)} style={{ height: 34 }}>
            <option value="none">No grouping</option>
            <option value="status">Group by status</option>
            <option value="client">Group by client</option>
            <option value="owner">Group by owner</option>
            <option value="cls">Group by classification</option>
          </select>
          <Link href="/command" className="bf-btn bf-btn-sm" style={{ textDecoration: 'none' }}>
            <Icon name="command" size={15} />Board view
          </Link>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12.5, color: 'var(--bf-text-faint)' }}>{rows.length} of {opps.length}</span>
          <div style={{ position: 'relative' }}>
            <button className="bf-btn bf-btn-sm" onClick={() => setColMenu(!colMenu)}>
              <Icon name="columns" size={15} />Columns
            </button>
            {colMenu && <ColumnMenu hidden={hidden} setHidden={setHidden} onClose={() => setColMenu(false)} />}
          </div>
          <Link href="/excel-sync" className="bf-btn bf-btn-sm" style={{ textDecoration: 'none' }}>
            <Icon name="download" size={15} />Export Excel
          </Link>
          <button className="bf-btn bf-btn-sm bf-btn-ghost" onClick={exportCSV}>
            CSV
          </button>
        </div>
      </div>

      {/* table */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <table className="bf-tbl" style={{ minWidth: minW }}>
          <thead>
            <tr>
              <th style={{ width: 34, paddingLeft: 18 }} />
              {visibleCols.map(c => (
                <th key={c.key}
                  style={{
                    width: c.w,
                    position: 'sticky', top: 0,
                    left: 'pin' in c && c.pin ? 34 : undefined,
                    zIndex: 'pin' in c && c.pin ? 3 : 2,
                    background: 'var(--bf-surface)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                  onClick={() => toggleSort(c.key as ColKey)}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    {c.label}
                    {sortKey === c.key && (
                      <Icon name={sortDir === 'asc' ? 'chevDown' : 'chevDown'} size={12}
                        style={{ transform: sortDir === 'desc' ? 'rotate(180deg)' : undefined }} />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groups.flatMap((g, gi) => {
              const dataRows = g.rows.map(o => {
                const overdue = isOverdue(o)
                return (
                  <tr key={o.id} style={{ background: overdue ? 'var(--bf-danger-soft)' : undefined }}>
                    <td style={{ paddingLeft: 18 }}>
                      <span style={{ width: 7, height: 7, borderRadius: 99, background: overdue ? 'var(--bf-danger)' : 'transparent', display: 'inline-block' }} />
                    </td>
                    {visibleCols.map(c => (
                      <td key={c.key}
                        style={'pin' in c && c.pin ? { position: 'sticky', left: 34, zIndex: 1, background: overdue ? 'var(--bf-danger-soft)' : 'var(--bf-surface)', boxShadow: '1px 0 0 var(--bf-border-2)' } : undefined}>
                        <Cell
                          o={o} colKey={c.key} colType={c.type}
                          colOpts={liveOpts[c.key] ?? ('opts' in c ? c.opts as () => string[] : undefined)}
                          isDue={'due' in c ? (c as { due?: boolean }).due : false}
                          theme={theme} overdue={overdue}
                          updateOpp={updateOpp}
                          onOpen={() => router.push(`/opportunities/${o.id}`)}
                        />
                      </td>
                    ))}
                  </tr>
                )
              })
              if (g.key === null) return dataRows
              return [
                <tr key={`g-${gi}`} style={{ background: 'var(--bf-surface-2)' }}>
                  <td colSpan={visibleCols.length + 1}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 18px', fontWeight: 700, fontSize: 12.5 }}>
                      <Icon name="chevDown" size={14} />{g.key}
                      <span style={{ fontWeight: 600, color: 'var(--bf-text-faint)' }}>{g.rows.length}</span>
                    </div>
                  </td>
                </tr>,
                ...dataRows,
              ]
            })}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--bf-text-faint)' }}>
            <Icon name="inbox" size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>No opportunities match</div>
            <div style={{ fontSize: 13 }}>Try clearing filters or switching views.</div>
          </div>
        )}
      </div>
    </div>
  )
}
