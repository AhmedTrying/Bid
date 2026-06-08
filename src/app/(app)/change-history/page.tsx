'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { TEAM, TODAY } from '@/lib/data'
import { toneStyle } from '@/lib/helpers'
import { Icon } from '@/components/ui/icon'
import { Avatar } from '@/components/ui/avatar'
import type { ChangeEvent } from '@/lib/types'

// Action badge metadata (label + colour hue).
const ACTION_META: Record<string, { label: string; hue: number }> = {
  status_changed:            { label: 'Status',         hue: 175 },
  field_edited:              { label: 'Edit',           hue: 230 },
  due_date_changed:          { label: 'Bid due',        hue: 46  },
  question_deadline_changed: { label: 'Q. deadline',    hue: 60  },
  site_visit_changed:        { label: 'Site visit',     hue: 175 },
  follow_up_changed:         { label: 'Follow-up',      hue: 205 },
  submission_changed:        { label: 'Submission',     hue: 175 },
  owner_changed:             { label: 'Owner',          hue: 250 },
  reviewer_changed:          { label: 'Reviewer',       hue: 250 },
  priority_changed:          { label: 'Priority',       hue: 25  },
  bond_pct_changed:          { label: 'Bond %',         hue: 80  },
  bond_validity_changed:     { label: 'Bond validity',  hue: 80  },
  result_changed:            { label: 'Result',         hue: 152 },
  closed_reason_changed:     { label: 'Closed reason',  hue: 25  },
  notes_updated:             { label: 'Notes',          hue: 230 },
  created:                   { label: 'Created',        hue: 152 },
  deleted:                   { label: 'Deleted',        hue: 12  },
  archived:                  { label: 'Archived',       hue: 80  },
  excel_import:              { label: 'Excel import',   hue: 205 },
  excel_export:              { label: 'Excel export',   hue: 175 },
  import_failed:             { label: 'Import failed',  hue: 25  },
  export_failed:             { label: 'Export failed',  hue: 25  },
  email_sent:                { label: 'Email',          hue: 250 },
  reminder_completed:        { label: 'Reminder',       hue: 152 },
  comment_added:             { label: 'Comment',        hue: 230 },
}
const actionMeta = (t: string) => ACTION_META[t] ?? { label: t.replace(/_/g, ' '), hue: 230 }

const isFailed = (c: ChangeEvent) =>
  c.emailStatus === 'failed' || c.excelStatus === 'failed' || c.actionType.endsWith('_failed')
const isExcel = (c: ChangeEvent) =>
  c.source === 'excel_import' || c.source === 'excel_export' ||
  c.actionType === 'excel_import' || c.actionType === 'excel_export'
const isEmail = (c: ChangeEvent) => c.emailStatus === 'sent' || c.emailStatus === 'sent_demo'
const DEADLINE_ACTIONS = new Set([
  'due_date_changed', 'question_deadline_changed', 'site_visit_changed',
  'follow_up_changed', 'submission_changed',
])

// Saved views (predefined filters). Persisted per-user views land in Phase 5.
type ViewDef = { id: string; label: string; f: (c: ChangeEvent, me: string) => boolean }
const VIEWS: ViewDef[] = [
  { id: 'all',      label: 'All changes',     f: () => true },
  { id: 'mine',     label: 'My changes',      f: (c, me) => c.userId === me },
  { id: 'important', label: 'Important',      f: c => c.importance === 'major' },
  { id: 'status',   label: 'Status changes',  f: c => c.actionType === 'status_changed' },
  { id: 'deadline', label: 'Deadline changes', f: c => DEADLINE_ACTIONS.has(c.actionType) },
  { id: 'excel',    label: 'Excel activity',  f: c => isExcel(c) },
  { id: 'emails',   label: 'Emails sent',     f: c => isEmail(c) },
  { id: 'failed',   label: 'Failed actions',  f: c => isFailed(c) },
  { id: 'removed',  label: 'Deleted / archived', f: c => c.actionType === 'deleted' || c.actionType === 'archived' },
]

function fmtWhen(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${d.getDate()} ${months[d.getMonth()]} · ${hh}:${mm}`
}

function Pill({ tone, children }: { tone: { bg: string; fg: string }; children: React.ReactNode }) {
  return (
    <span style={{ fontSize: 11, fontWeight: 650, padding: '2px 8px', borderRadius: 99, background: tone.bg, color: tone.fg, whiteSpace: 'nowrap' }}>
      {children}
    </span>
  )
}

export default function ChangeHistoryPage() {
  const changes = useStore(s => s.changes)
  const theme   = useStore(s => s.theme)
  const me      = useStore(s => s.currentUser)
  const router  = useRouter()

  const [view,       setView]       = useState('all')
  const [q,          setQ]          = useState('')
  const [userF,      setUserF]      = useState('all')
  const [actionF,    setActionF]    = useState('all')
  const [importF,    setImportF]    = useState('all')
  const [sourceF,    setSourceF]    = useState('all')
  const [expanded,   setExpanded]   = useState<string | null>(null)

  const activeView = VIEWS.find(v => v.id === view) ?? VIEWS[0]

  const sorted = useMemo(
    () => [...changes].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    [changes],
  )

  const rows = useMemo(() => sorted.filter(c => {
    if (!activeView.f(c, me.id)) return false
    if (userF !== 'all' && c.userId !== userF) return false
    if (actionF !== 'all' && c.actionType !== actionF) return false
    if (importF !== 'all' && c.importance !== importF) return false
    if (sourceF !== 'all' && c.source !== sourceF) return false
    if (q) {
      const s = q.toLowerCase()
      return (
        c.readableSummary.toLowerCase().includes(s) ||
        c.oppRef.toLowerCase().includes(s) ||
        c.oppTitle.toLowerCase().includes(s) ||
        c.userName.toLowerCase().includes(s)
      )
    }
    return true
  }), [sorted, activeView, me.id, userF, actionF, importF, sourceF, q])

  const cards = useMemo(() => {
    const today = changes.filter(c => c.createdAt.slice(0, 10) === TODAY)
    return {
      today: today.length,
      important: changes.filter(c => c.importance === 'major').length,
      emails: changes.filter(isEmail).length,
      imports: changes.filter(c => c.actionType === 'excel_import').length,
      exports: changes.filter(c => c.actionType === 'excel_export').length,
      failed: changes.filter(isFailed).length,
    }
  }, [changes])

  const actionTypes = useMemo(
    () => Array.from(new Set(changes.map(c => c.actionType))).sort(),
    [changes],
  )

  return (
    <div className="bf-canvas-pad" style={{ animation: 'bf-rise-up .4s cubic-bezier(.2,.8,.2,1)' }}>
      {/* header */}
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.025em', margin: 0 }}>Change History</h1>
        <p style={{ margin: '5px 0 0', fontSize: 13.5, color: 'var(--bf-text-2)' }}>
          Who changed what, when — across every opportunity. Clear and readable, not technical logs.
        </p>
      </div>

      {/* summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 18 }}>
        {[
          { label: 'Changes today',   value: cards.today,     icon: 'clock'  },
          { label: 'Important',       value: cards.important, icon: 'alert'  },
          { label: 'Emails sent',     value: cards.emails,    icon: 'sent'   },
          { label: 'Excel imports',   value: cards.imports,   icon: 'upload' },
          { label: 'Excel exports',   value: cards.exports,   icon: 'download' },
          { label: 'Failed',          value: cards.failed,    icon: 'alert'  },
        ].map(c => (
          <div key={c.label} className="bf-card bf-card-pad" style={{ padding: '12px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'var(--bf-text-faint)', marginBottom: 6 }}>
              <Icon name={c.icon} size={14} />
              <span className="eyebrow" style={{ fontSize: 10.5 }}>{c.label}</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em' }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* saved views */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 12, flexWrap: 'wrap' }}>
        {VIEWS.map(v => (
          <button key={v.id} onClick={() => setView(v.id)}
            className="bf-btn bf-btn-sm"
            style={{
              fontWeight: view === v.id ? 650 : 550,
              background: view === v.id ? 'var(--bf-accent-soft)' : undefined,
              color: view === v.id ? 'var(--bf-accent-text)' : 'var(--bf-text-2)',
              border: view === v.id ? '1px solid var(--bf-accent-soft-bd)' : undefined,
            }}>
            {v.label}
          </button>
        ))}
      </div>

      {/* filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Icon name="search" size={15} style={{ position: 'absolute', left: 10, color: 'var(--bf-text-faint)' }} />
          <input className="bf-input" value={q} onChange={e => setQ(e.target.value)} placeholder="Search changes…" style={{ width: 220, paddingLeft: 31, height: 34 }} />
        </div>
        <select className="bf-select" value={userF} onChange={e => setUserF(e.target.value)} style={{ height: 34 }}>
          <option value="all">All users</option>
          {TEAM.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select className="bf-select" value={actionF} onChange={e => setActionF(e.target.value)} style={{ height: 34 }}>
          <option value="all">All actions</option>
          {actionTypes.map(a => <option key={a} value={a}>{actionMeta(a).label}</option>)}
        </select>
        <select className="bf-select" value={importF} onChange={e => setImportF(e.target.value)} style={{ height: 34 }}>
          <option value="all">All importance</option>
          <option value="major">Important only</option>
          <option value="normal">Normal only</option>
        </select>
        <select className="bf-select" value={sourceF} onChange={e => setSourceF(e.target.value)} style={{ height: 34 }}>
          <option value="all">All sources</option>
          <option value="dashboard">Dashboard</option>
          <option value="excel_import">Excel import</option>
          <option value="excel_export">Excel export</option>
          <option value="system">System</option>
        </select>
        <span style={{ fontSize: 12.5, color: 'var(--bf-text-faint)', marginLeft: 'auto' }}>{rows.length} of {changes.length}</span>
      </div>

      {/* records */}
      <div style={{ display: 'grid', gap: 8 }}>
        {rows.map(c => {
          const am = actionMeta(c.actionType)
          const aTone = toneStyle(am.hue, theme)
          const open = expanded === c.id
          return (
            <div key={c.id} className="bf-card" style={{ padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <Avatar person={c.userId} size={28} theme={theme} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
                    <Pill tone={aTone}>{am.label}</Pill>
                    {c.importance === 'major' && <Pill tone={toneStyle(25, theme)}>Important</Pill>}
                    {c.oppRef && (
                      <button className="mono" onClick={() => c.oppId && router.push(`/opportunities/${c.oppId}`)}
                        style={{ fontSize: 11.5, color: 'var(--bf-accent-text)', fontWeight: 600, background: 'none', border: 'none', cursor: c.oppId ? 'pointer' : 'default', padding: 0 }}>
                        {c.oppRef}
                      </button>
                    )}
                    <span style={{ fontSize: 11.5, color: 'var(--bf-text-faint)', marginLeft: 'auto' }}>{fmtWhen(c.createdAt)}</span>
                  </div>
                  <div style={{ fontSize: 13.5, color: 'var(--bf-text)' }}>{c.readableSummary}</div>

                  {/* old → new + status badges */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 7, flexWrap: 'wrap' }}>
                    {c.fieldChanged && (c.oldValue || c.newValue) && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                        <span className="mono" style={{ color: 'var(--bf-text-faint)', textDecoration: 'line-through' }}>{c.oldValue || '—'}</span>
                        <Icon name="chevRight" size={12} style={{ color: 'var(--bf-text-faint)' }} />
                        <span className="mono" style={{ color: 'var(--bf-text)', fontWeight: 600 }}>{c.newValue || '—'}</span>
                      </span>
                    )}
                    {c.excelStatus && (
                      <Pill tone={toneStyle(c.excelStatus === 'failed' ? 25 : c.excelStatus === 'exported' ? 152 : 46, theme)}>
                        {c.excelStatus === 'exported' ? 'Exported' : c.excelStatus === 'failed' ? 'Export failed' : 'Ready for export'}
                      </Pill>
                    )}
                    {isEmail(c) && (
                      <Pill tone={toneStyle(152, theme)}>
                        <Icon name="sent" size={11} style={{ marginRight: 3, verticalAlign: '-1px' }} />
                        {c.emailStatus === 'sent_demo' ? 'Email sent (demo)' : 'Email sent'}
                      </Pill>
                    )}
                    {c.emailStatus === 'failed' && <Pill tone={toneStyle(25, theme)}>Email failed</Pill>}
                    <button className="bf-btn bf-btn-sm bf-btn-ghost" style={{ marginLeft: 'auto' }}
                      onClick={() => setExpanded(open ? null : c.id)}>
                      Details<Icon name="chevDown" size={13} style={{ transform: open ? 'rotate(180deg)' : undefined }} />
                    </button>
                  </div>

                  {open && (
                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--bf-border-2)', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '7px 18px', fontSize: 12.5 }}>
                      <Detail label="User" value={c.userName} />
                      <Detail label="Source" value={c.source.replace(/_/g, ' ')} />
                      {c.oppTitle && <Detail label="Opportunity" value={c.oppTitle} />}
                      {c.fieldChanged && <Detail label="Field" value={c.fieldChanged} />}
                      {c.recipientsSummary && <Detail label="Notified" value={c.recipientsSummary} />}
                      {c.userNote && <Detail label="Note" value={c.userNote} />}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {rows.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--bf-text-faint)' }}>
            <Icon name="clock" size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>No changes match</div>
            <div style={{ fontSize: 13 }}>Try a different view or clear the filters.</div>
          </div>
        )}
      </div>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="eyebrow" style={{ marginRight: 7 }}>{label}</span>
      <span style={{ color: 'var(--bf-text-2)' }}>{value}</span>
    </div>
  )
}
