'use client'

import { useMemo, useRef, useState } from 'react'
import { useStore } from '@/lib/store'
import { normalizeImportedRow, type RawRow } from '@/lib/excelTemplate'
import { Icon } from '@/components/ui/icon'
import type { Opportunity } from '@/lib/types'

const TEMPLATE_NAME = 'SATCO Proposal Management Tracker.xlsx'

interface ParseResult {
  sheets: { sheet: string; rows: RawRow[] }[]
  errors: { sheet: string; row: number; message: string }[]
  totalRows: number
}
interface PreviewRow { ref: string; title: string; kind: 'new' | 'update'; warnings: string[]; patch: Partial<Opportunity> }

function fmtWhen(iso: string | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${d.getDate()} ${months[d.getMonth()]} · ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

export default function ExcelSyncPage() {
  const opps        = useStore(s => s.opps)
  const clients     = useStore(s => s.clients)
  const changes     = useStore(s => s.changes)
  const applyImport = useStore(s => s.applyImport)
  const recordExport = useStore(s => s.recordExport)
  const flash       = useStore(s => s.flash)

  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState<'' | 'export' | 'import'>('')
  const [parsed, setParsed] = useState<ParseResult | null>(null)
  const [fileName, setFileName] = useState('')
  const [showErrors, setShowErrors] = useState(false)

  // Excel activity from change history
  const excelEvents = useMemo(
    () => changes.filter(c => c.source === 'excel_import' || c.source === 'excel_export')
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    [changes],
  )
  const lastExport = excelEvents.find(c => c.source === 'excel_export')
  const lastImport = excelEvents.find(c => c.source === 'excel_import')
  const failedCount = changes.filter(c => c.excelStatus === 'failed' || c.actionType.endsWith('_failed')).length
  const pendingSinceExport = useMemo(() => {
    const since = lastExport?.createdAt ?? ''
    return changes.filter(c => c.source === 'dashboard' && (!since || c.createdAt > since)).length
  }, [changes, lastExport])

  // Compute the import preview (normalise + diff against the live store)
  const preview = useMemo<PreviewRow[]>(() => {
    if (!parsed) return []
    const out: PreviewRow[] = []
    for (const sh of parsed.sheets) {
      for (const raw of sh.rows) {
        const { ref, patch, warnings } = normalizeImportedRow(raw, clients)
        const existing = ref ? opps.find(o => o.ref === ref) : undefined
        out.push({
          ref,
          title: patch.title || existing?.title || ref || '(untitled)',
          kind: existing ? 'update' : 'new',
          warnings,
          patch,
        })
      }
    }
    return out
  }, [parsed, clients, opps])

  const counts = useMemo(() => ({
    added: preview.filter(p => p.kind === 'new').length,
    updated: preview.filter(p => p.kind === 'update').length,
    warnings: preview.reduce((n, p) => n + p.warnings.length, 0),
  }), [preview])

  // ── Actions ─────────────────────────────────────────────────────────────────
  const doExport = async () => {
    setBusy('export')
    try {
      const res = await fetch('/api/excel/export', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opps, clients }),
      })
      if (!res.ok) throw new Error('export failed')
      const blob = await res.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = 'BidFlow_Tracker.xlsx'
      a.click()
      URL.revokeObjectURL(a.href)
      recordExport(opps.length)
      flash('Exported successfully — your styled tracker is downloading')
    } catch {
      flash('Export failed — please try again')
    } finally { setBusy('') }
  }

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy('import'); setFileName(file.name)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/excel/import', { method: 'POST', body: form })
      if (!res.ok) throw new Error('parse failed')
      const j = (await res.json()) as ParseResult
      setParsed(j)
      flash(`Read ${j.totalRows} rows — review the changes below`)
    } catch {
      flash('Some rows need attention — could not read that file')
      setParsed(null)
    } finally { setBusy('') }
  }

  const confirmImport = async () => {
    if (!parsed) return
    const incoming = preview.map(p => ({ ref: p.ref, patch: p.patch }))
    const { added, updated } = applyImport(incoming)
    try {
      await fetch('/api/excel/import/confirm', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName, added, updated, warnings: counts.warnings, failed: parsed.errors.length, errors: parsed.errors }),
      })
    } catch { /* non-fatal */ }
    flash(`Import completed — ${added} added, ${updated} updated`)
    setParsed(null); setFileName('')
  }

  const cancelImport = () => { setParsed(null); setFileName(''); flash('Import cancelled') }

  return (
    <div className="bf-canvas-pad" style={{ animation: 'bf-rise-up .4s cubic-bezier(.2,.8,.2,1)' }}>
      <input ref={fileRef} type="file" accept=".xlsx" style={{ display: 'none' }} onChange={onPickFile} />

      <div style={{ marginBottom: 18 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.025em', margin: 0 }}>Excel Sync</h1>
        <p style={{ margin: '5px 0 0', fontSize: 13.5, color: 'var(--bf-text-2)' }}>
          Your dashboard is the working system. Export a ready-to-use styled tracker, or import an updated one — Excel is never the database.
        </p>
      </div>

      {/* status cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
        <Card label="Connected template" value={TEMPLATE_NAME} small icon="table" />
        <Card label="Rows in dashboard" value={String(opps.length)} icon="opps" />
        <Card label="Rows last exported" value={lastExport?.newValue || '—'} icon="download" />
        <Card label="Pending changes since export" value={String(pendingSinceExport)} icon="edit" />
        <Card label="Last export" value={fmtWhen(lastExport?.createdAt)} small icon="clock" />
        <Card label="Last import" value={fmtWhen(lastImport?.createdAt)} small icon="upload" />
        <Card label="Export status" value={lastExport ? 'Exported successfully' : 'Ready for export'} small icon="check" />
        <Card label="Failed imports / exports" value={String(failedCount)} icon="alert" />
      </div>

      {/* actions */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
        <button className="bf-btn bf-btn-primary" onClick={() => fileRef.current?.click()} disabled={busy !== ''}>
          <Icon name="upload" size={16} />Import Excel Tracker
        </button>
        <button className="bf-btn" onClick={doExport} disabled={busy !== ''}>
          <Icon name="download" size={16} />{busy === 'export' ? 'Preparing…' : 'Export Updated Excel'}
        </button>
        <button className="bf-btn" onClick={doExport} disabled={busy !== ''}>
          <Icon name="download" size={16} />Download Last Export
        </button>
        {parsed && parsed.errors.length > 0 && (
          <button className="bf-btn" onClick={() => setShowErrors(s => !s)} style={{ color: 'var(--bf-danger)', borderColor: 'var(--bf-danger)' }}>
            <Icon name="alert" size={16} />View Import Errors ({parsed.errors.length})
          </button>
        )}
      </div>

      {/* import preview */}
      {parsed && (
        <div className="bf-card" style={{ marginBottom: 18, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 16px', borderBottom: '1px solid var(--bf-border)' }}>
            <Icon name="upload" size={16} style={{ color: 'var(--bf-accent)' }} />
            <span style={{ fontWeight: 700, fontSize: 14.5 }}>Preview import changes</span>
            <span style={{ fontSize: 12.5, color: 'var(--bf-text-faint)' }}>{fileName}</span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 7 }}>
              <Tag tone="good">{counts.added} added</Tag>
              <Tag tone="accent">{counts.updated} updated</Tag>
              {counts.warnings > 0 && <Tag tone="warn">{counts.warnings} warnings</Tag>}
            </div>
          </div>
          <div style={{ maxHeight: 320, overflowY: 'auto' }}>
            <table className="bf-tbl" style={{ width: '100%' }}>
              <thead><tr>
                <th style={{ paddingLeft: 16 }}>Reference</th><th>Proposal</th><th>Change</th><th>Needs review</th>
              </tr></thead>
              <tbody>
                {preview.map((p, i) => (
                  <tr key={i}>
                    <td style={{ paddingLeft: 16 }}><span className="mono" style={{ fontSize: 12 }}>{p.ref || '—'}</span></td>
                    <td style={{ fontSize: 13, maxWidth: 320, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</td>
                    <td><Tag tone={p.kind === 'new' ? 'good' : 'accent'}>{p.kind === 'new' ? 'New' : 'Update'}</Tag></td>
                    <td style={{ fontSize: 12, color: p.warnings.length ? 'var(--bf-warn)' : 'var(--bf-text-faint)' }}>
                      {p.warnings.length ? p.warnings.join('; ') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '12px 16px', borderTop: '1px solid var(--bf-border)', background: 'var(--bf-surface-2)' }}>
            <button className="bf-btn" onClick={cancelImport}>Cancel</button>
            <button className="bf-btn bf-btn-primary" onClick={confirmImport}>
              <Icon name="check" size={16} />Apply import
            </button>
          </div>
        </div>
      )}

      {/* error table */}
      {parsed && showErrors && parsed.errors.length > 0 && (
        <div className="bf-card" style={{ marginBottom: 18, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--bf-border)', fontWeight: 700, fontSize: 14 }}>Some rows need attention</div>
          <table className="bf-tbl" style={{ width: '100%' }}>
            <thead><tr><th style={{ paddingLeft: 16 }}>Sheet</th><th>Row</th><th>Message</th></tr></thead>
            <tbody>
              {parsed.errors.map((e, i) => (
                <tr key={i}>
                  <td style={{ paddingLeft: 16, fontSize: 12.5 }}>{e.sheet}</td>
                  <td className="mono" style={{ fontSize: 12 }}>{e.row}</td>
                  <td style={{ fontSize: 12.5, color: 'var(--bf-text-2)' }}>{e.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* recent activity */}
      <div className="bf-card bf-card-pad">
        <div className="eyebrow" style={{ marginBottom: 10 }}>Recent Excel activity</div>
        {excelEvents.length === 0
          ? <div style={{ fontSize: 13, color: 'var(--bf-text-2)' }}>No imports or exports yet.</div>
          : (
            <div style={{ display: 'grid', gap: 1 }}>
              {excelEvents.slice(0, 8).map((c, i) => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 2px', borderBottom: i < Math.min(excelEvents.length, 8) - 1 ? '1px solid var(--bf-border-2)' : 'none' }}>
                  <Icon name={c.source === 'excel_export' ? 'download' : 'upload'} size={15} style={{ color: 'var(--bf-text-3)' }} />
                  <span style={{ fontSize: 13, flex: 1 }}>{c.readableSummary}</span>
                  <span style={{ fontSize: 11.5, color: 'var(--bf-text-faint)' }}>{fmtWhen(c.createdAt)}</span>
                </div>
              ))}
            </div>
          )
        }
      </div>
    </div>
  )
}

function Card({ label, value, icon, small }: { label: string; value: string; icon: string; small?: boolean }) {
  return (
    <div className="bf-card bf-card-pad" style={{ padding: '12px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'var(--bf-text-faint)', marginBottom: 6 }}>
        <Icon name={icon} size={14} />
        <span className="eyebrow" style={{ fontSize: 10.5 }}>{label}</span>
      </div>
      <div style={{ fontSize: small ? 13.5 : 20, fontWeight: small ? 600 : 800, letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</div>
    </div>
  )
}

function Tag({ tone, children }: { tone: 'good' | 'warn' | 'accent'; children: React.ReactNode }) {
  const map = {
    good:   { bg: 'var(--bf-good-soft)',  fg: 'var(--bf-good)' },
    warn:   { bg: 'var(--bf-warn-soft)',  fg: 'var(--bf-warn)' },
    accent: { bg: 'var(--bf-accent-soft)', fg: 'var(--bf-accent-text)' },
  }[tone]
  return <span style={{ fontSize: 11.5, fontWeight: 650, padding: '2px 9px', borderRadius: 99, background: map.bg, color: map.fg, whiteSpace: 'nowrap' }}>{children}</span>
}
