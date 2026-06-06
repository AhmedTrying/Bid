'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useStore } from '@/lib/store'
import { relDue, fmtDate, money, toneStyle, computeHealth, daysUntil } from '@/lib/helpers'
import { TODAY } from '@/lib/data'
import { byClient, byId, STATUS } from '@/lib/data'
import { Icon } from '@/components/ui/icon'
import { Avatar } from '@/components/ui/avatar'
import { StatusBadge, PriorityBadge, TypePill } from '@/components/ui/badges'
import type { Opportunity } from '@/lib/types'

// ── Donut chart ───────────────────────────────────────────────────────────────
function Donut({ score, theme }: { score: number; theme: 'light'|'dark' }) {
  const size = 84, thickness = 11
  const r = (size - thickness) / 2
  const C = 2 * Math.PI * r
  const color = score >= 75 ? 'var(--bf-good)' : score >= 50 ? 'var(--bf-warn)' : 'var(--bf-danger)'
  const filled = (score / 100) * C
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--bf-surface-3)" strokeWidth={thickness} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={thickness}
          strokeDasharray={`${filled} ${C - filled}`} strokeLinecap="butt" />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
        <div style={{ fontSize: 21, fontWeight: 800, letterSpacing: '-0.03em' }}>{score}</div>
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────
function MetaItem({ icon, label }: { icon: string; label: string }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: 'var(--bf-text-2)' }}>
      <Icon name={icon} size={15} style={{ color: 'var(--bf-text-faint)' }} />{label}
    </span>
  )
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="eyebrow" style={{ marginBottom: 4 }}>{label}</div>
      <div className={mono ? 'mono' : ''} style={{ fontSize: 13.5, fontWeight: 600 }}>{value}</div>
    </div>
  )
}

function Section({ icon, title, hint, children, last }: {
  icon: string; title: string; hint?: string; children: React.ReactNode; last?: boolean
}) {
  return (
    <div style={{ marginBottom: last ? 0 : 26 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 13, paddingBottom: 9, borderBottom: '1px solid var(--bf-border)' }}>
        <Icon name={icon} size={16} style={{ color: 'var(--bf-accent)' }} />
        <span style={{ fontWeight: 700, fontSize: 14.5 }}>{title}</span>
        {hint && <span style={{ fontSize: 11.5, marginLeft: 'auto', fontWeight: 500, color: 'var(--bf-text-faint)' }}>{hint}</span>}
      </div>
      {children}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function OpportunityDetailPage() {
  const params    = useParams()
  const id        = params.id as string
  const opps      = useStore(s => s.opps)
  const theme     = useStore(s => s.theme)
  const updateOpp = useStore(s => s.updateOpp)
  const flash     = useStore(s => s.flash)

  const o = opps.find(x => x.id === id)

  const [noteDraft, setNoteDraft] = useState(o?.notes ?? '')
  useEffect(() => { if (o) setNoteDraft(o.notes ?? '') }, [o?.id])

  if (!o) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, color: 'var(--bf-text-faint)' }}>
      <Icon name="inbox" size={32} style={{ opacity: 0.4 }} />
      <div style={{ fontWeight: 700, fontSize: 15 }}>Opportunity not found</div>
      <Link href="/opportunities" className="bf-btn" style={{ textDecoration: 'none' }}>← Back to list</Link>
    </div>
  )

  const client = byClient(o.client)
  const due    = relDue(o.bidDue)
  const health = computeHealth(o)
  const bondT  = toneStyle(80, theme)

  const setStatus = (status: string) => { updateOpp(o.id, { status } as Parameters<typeof updateOpp>[1]); flash('Status → ' + status) }

  type OppPatch = Parameters<typeof updateOpp>[1]
  const quickActions = [
    { label: 'Mark Submitted',       icon: 'sent',    on: () => { updateOpp(o.id, { status: 'Submitted', submission: TODAY } as OppPatch); flash('Marked as Submitted') } },
    { label: 'Move to Negotiation',  icon: 'refresh', on: () => setStatus('Negotiation') },
    { label: 'Mark Awarded',         icon: 'trophy',  on: () => { updateOpp(o.id, { status: 'Awarded', result: 'Awarded' } as OppPatch); flash('Marked as Awarded') } },
    { label: 'Mark Closed / Lost',   icon: 'closed',  on: () => { updateOpp(o.id, { status: 'Closed Lost', result: 'Lost' } as OppPatch); flash('Marked as Closed / Lost') } },
  ]

  const reminders = [
    { l: 'Bid due',          k: 'bidDue',      ic: 'clock' },
    { l: 'Question deadline',k: 'qDeadline',   ic: 'pqq' },
    { l: 'Site visit',       k: 'siteVisit',   ic: 'pin' },
    { l: 'Bond expiry',      k: 'bondValidity',ic: 'shield' },
    { l: 'Follow-up',        k: 'followUp',    ic: 'sent' },
  ].map(r => ({ ...r, d: daysUntil((o as unknown as Record<string,unknown>)[r.k] as string), date: (o as unknown as Record<string,unknown>)[r.k] as string }))
   .filter(r => r.date && r.d !== null && r.d >= -2)
   .sort((a, b) => (a.d ?? 0) - (b.d ?? 0))

  const risks: string[] = []
  if (!o.owner)                                                  risks.push('No owner assigned')
  if (daysUntil(o.bidDue) !== null && (daysUntil(o.bidDue) ?? 99) < 3 && !o.submission) risks.push('Submission deadline imminent')
  if (o.bondReq && !o.bondValidity)                              risks.push('Bond validity not recorded')
  if (o.priority === 'Critical')                                 risks.push('Critical priority bid')
  if (!o.reviewer)                                               risks.push('No reviewer assigned')

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', height: '100%', overflow: 'hidden' }}>
      {/* ── main column ── */}
      <div style={{ overflowY: 'auto' }}>
        {/* breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '14px 30px 0', fontSize: 12.5 }}>
          <Link href="/opportunities" className="bf-btn bf-btn-sm bf-btn-ghost" style={{ textDecoration: 'none' }}>
            <Icon name="arrowLeft" size={14} />Opportunities
          </Link>
          <Icon name="chevRight" size={13} style={{ color: 'var(--bf-text-faint)' }} />
          <span className="mono" style={{ color: 'var(--bf-text-faint)' }}>{o.ref}</span>
        </div>

        <div style={{ padding: '14px 30px 40px', maxWidth: 780 }}>
          {/* title block */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
            <TypePill type={o.type} />
            <StatusBadge status={o.status} theme={theme} />
            <PriorityBadge priority={o.priority} theme={theme} />
            {o.bondReq && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 9px', borderRadius: 99, background: bondT.bg, color: bondT.fg, fontSize: 12, fontWeight: 600 }}>
                <Icon name="shield" size={12} />Bond {o.bondPct}%
              </span>
            )}
          </div>
          <h1 style={{ fontSize: 25, fontWeight: 800, letterSpacing: '-0.025em', margin: '0 0 12px', lineHeight: 1.2 }}>{o.title}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap', marginBottom: 22 }}>
            <MetaItem icon="building" label={client?.name ?? '—'} />
            <MetaItem icon="inbox" label={o.portal} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ fontSize: 12.5, color: 'var(--bf-text-faint)' }}>Owner</span>
              <Avatar person={o.owner} size={22} theme={theme} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>{byId(o.owner)?.name ?? 'Unassigned'}</span>
            </div>
            {o.bidDue && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                height: 24, padding: '0 10px', borderRadius: 99, fontSize: 12.5, fontWeight: 600,
                background: due.tone === 'danger' ? 'var(--bf-danger-soft)' : due.tone === 'warn' ? 'var(--bf-warn-soft)' : 'var(--bf-surface-3)',
                color:      due.tone === 'danger' ? 'var(--bf-danger)' : due.tone === 'warn' ? 'var(--bf-warn)' : 'var(--bf-text-2)',
              }}>
                <Icon name="clock" size={13} />{due.label}
              </span>
            )}
          </div>

          <Section icon="opps" title="Overview">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
              <Field label="Classification" value={o.cls} />
              <Field label="Procurement" value={o.proc} />
              <Field label="Reviewer" value={byId(o.reviewer)?.name ?? '—'} />
              <Field label="Est. value" value={money(o.value)} mono />
              <Field label="Result" value={o.result || 'In progress'} />
              <Field label="Last updated" value={fmtDate(o.updated, { year: true })} />
            </div>
          </Section>

          <Section icon="calendar" title="Dates & Deadlines">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 0 }}>
              {([
                ['RFP received',     'rfpReceived'],
                ['Site visit',       'siteVisit'],
                ['Question deadline','qDeadline'],
                ['Bid due',          'bidDue'],
                ['Submission',       'submission'],
                ['Next follow-up',   'followUp'],
              ] as [string, string][]).map(([l, k], i) => {
                const dv = (o as unknown as Record<string,unknown>)[k] as string
                const dr = relDue(dv)
                return (
                  <div key={k} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 4px', borderBottom: i < 4 ? '1px solid var(--bf-border-2)' : 'none' }}>
                    <span style={{ fontSize: 13, color: 'var(--bf-text-2)' }}>{l}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="mono" style={{ fontSize: 12.5, fontWeight: 500 }}>{dv ? fmtDate(dv, { year: true }) : '—'}</span>
                      {dv && k !== 'rfpReceived' && k !== 'submission' && dr.tone !== 'none' && (
                        <span style={{
                          fontSize: 10.5, padding: '2px 7px', borderRadius: 99, height: 19,
                          background: 'transparent',
                          border: `1px solid ${dr.tone === 'danger' ? 'var(--bf-danger)' : 'var(--bf-warn)'}`,
                          color: dr.tone === 'danger' ? 'var(--bf-danger)' : 'var(--bf-warn)',
                        }}>{dr.label}</span>
                      )}
                    </span>
                  </div>
                )
              })}
            </div>
          </Section>

          <Section icon="shield" title="Commercial & Bid Bond">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
              <Field label="Bond required" value={o.bondReq ? 'Yes' : 'No'} />
              <Field label="Bond %" value={o.bondPct ? o.bondPct + '%' : '—'} mono />
              <Field label="Bond validity" value={o.bondValidity ? fmtDate(o.bondValidity, { year: true }) : '—'} mono />
              <Field label="Est. value" value={money(o.value, true)} mono />
            </div>
          </Section>

          {o.checklist && (
            <Section icon="pqq" title="Required Documents">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 18px' }}>
                {Object.entries(o.checklist).map(([doc, ok]) => (
                  <button key={doc}
                    onClick={() => updateOpp(o.id, { checklist: { ...o.checklist, [doc]: !ok } })}
                    style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 6px', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', borderBottom: '1px solid var(--bf-border-2)' }}>
                    <span style={{ width: 18, height: 18, borderRadius: 6, display: 'grid', placeItems: 'center', flexShrink: 0, background: ok ? 'var(--bf-good)' : 'var(--bf-surface-3)', color: '#fff', border: ok ? 'none' : '1px solid var(--bf-border-strong)' }}>
                      {ok && <Icon name="check" size={13} strokeWidth={3} />}
                    </span>
                    <span style={{ fontSize: 13, color: ok ? 'var(--bf-text-2)' : 'var(--bf-text)', textDecoration: ok ? 'line-through' : 'none' }}>{doc}</span>
                  </button>
                ))}
              </div>
            </Section>
          )}

          <Section icon="sent" title="Follow-up Timeline">
            {o.followUps.length === 0
              ? <div style={{ fontSize: 13, color: 'var(--bf-text-2)' }}>No follow-ups yet — this opportunity hasn&apos;t been submitted.</div>
              : (
                <div style={{ position: 'relative', paddingLeft: 8 }}>
                  {o.followUps.map((f, i) => (
                    <div key={i} style={{ display: 'flex', gap: 13, paddingBottom: i < o.followUps.length - 1 ? 18 : 0, position: 'relative' }}>
                      {i < o.followUps.length - 1 && (
                        <span style={{ position: 'absolute', left: 8, top: 18, bottom: 0, width: 2, background: 'var(--bf-border)' }} />
                      )}
                      <span style={{ width: 18, height: 18, borderRadius: 99, flexShrink: 0, zIndex: 1, display: 'grid', placeItems: 'center', background: f.done ? 'var(--bf-good)' : 'var(--bf-surface)', border: `2px solid ${f.done ? 'var(--bf-good)' : 'var(--bf-border-strong)'}`, color: '#fff' }}>
                        {f.done && <Icon name="check" size={11} strokeWidth={3.5} />}
                      </span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 650, fontSize: 13 }}>Follow-up {f.n}: {f.label}</span>
                          {!f.done && <span style={{ fontSize: 10.5, padding: '2px 7px', borderRadius: 99, background: 'var(--bf-warn-soft)', color: 'var(--bf-warn)' }}>pending</span>}
                        </div>
                        <span className="mono" style={{ fontSize: 11.5, color: 'var(--bf-text-faint)' }}>{f.date ? fmtDate(f.date, { year: true }) : 'date TBD'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )
            }
          </Section>

          <Section icon="folder" title="Documents & Links" hint="links only — files stay in your folders">
            <div style={{ display: 'grid', gap: 8 }}>
              {o.documents.map((d, i) => {
                const iconName = d.type === 'folder' ? 'folder' : d.type === 'sheet' ? 'sheet' : 'file'
                return (
                  <button key={i} onClick={() => flash('Opens linked document (demo)')} className="bf-hoverlift"
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 13px', border: '1px solid var(--bf-border)', borderRadius: 11, background: 'var(--bf-surface)', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
                    <span style={{ width: 32, height: 32, borderRadius: 8, display: 'grid', placeItems: 'center', background: 'var(--bf-surface-3)', color: 'var(--bf-text-2)', flexShrink: 0 }}>
                      <Icon name={iconName} size={17} />
                    </span>
                    <span style={{ flex: 1 }}>
                      <span style={{ display: 'block', fontWeight: 600, fontSize: 13 }}>{d.name}</span>
                      <span style={{ fontSize: 11.5, color: 'var(--bf-text-faint)' }}>{d.meta}</span>
                    </span>
                    <Icon name="ext" size={15} style={{ color: 'var(--bf-text-faint)' }} />
                  </button>
                )
              })}
              <button className="bf-btn bf-btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => flash('Add document link (demo)')}>
                <Icon name="link" size={14} />Add document link
              </button>
            </div>
          </Section>

          <Section icon="edit" title="Notes">
            <textarea className="bf-input" value={noteDraft} onChange={e => setNoteDraft(e.target.value)}
              onBlur={() => { if (noteDraft !== o.notes) { updateOpp(o.id, { notes: noteDraft }); flash('Notes saved') } }}
              rows={4} style={{ resize: 'vertical', lineHeight: 1.5, fontFamily: 'inherit', width: '100%' }}
              placeholder="Add internal notes, risks, decisions…" />
            <div style={{ marginTop: 8 }}>
              <button className="bf-chip" onClick={() => flash('AI tender summary — planned')}
                style={{ borderStyle: 'dashed', color: 'var(--bf-accent-text)', borderColor: 'var(--bf-accent-soft-bd)', background: 'transparent' }}>
                <Icon name="sparkles" size={13} strokeWidth={1.8} />Summarise this tender<span className="bf-kbd" style={{ marginLeft: 2 }}>soon</span>
              </button>
            </div>
          </Section>

          <Section icon="clock" title="Activity Log" last>
            <div style={{ display: 'grid', gap: 1 }}>
              {o.activity.map((a, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 4px', borderBottom: i < o.activity.length - 1 ? '1px solid var(--bf-border-2)' : 'none' }}>
                  <Avatar person={a.who} size={22} theme={theme} />
                  <span style={{ fontSize: 13 }}>
                    <strong style={{ fontWeight: 650 }}>{byId(a.who)?.name ?? 'System'}</strong>{' '}
                    <span style={{ color: 'var(--bf-text-2)' }}>{a.verb}</span>
                  </span>
                  <span style={{ fontSize: 11.5, color: 'var(--bf-text-faint)', marginLeft: 'auto' }}>{a.when}</span>
                </div>
              ))}
            </div>
          </Section>
        </div>
      </div>

      {/* ── right rail ── */}
      <aside style={{ borderLeft: '1px solid var(--bf-border)', background: 'var(--bf-surface-2)', overflowY: 'auto', padding: '20px 18px' }}>
        {/* health */}
        <div className="bf-card bf-card-pad" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>Health score</span>
            <span style={{
              fontSize: 11.5, fontWeight: 700, padding: '2px 9px', borderRadius: 99,
              background: health.score >= 75 ? 'var(--bf-good-soft)' : health.score >= 50 ? 'var(--bf-warn-soft)' : 'var(--bf-danger-soft)',
              color:      health.score >= 75 ? 'var(--bf-good)' : health.score >= 50 ? 'var(--bf-warn)' : 'var(--bf-danger)',
            }}>
              {health.score >= 75 ? 'Healthy' : health.score >= 50 ? 'At risk' : 'Critical'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Donut score={health.score} theme={theme} />
            <div style={{ flex: 1 }}>
              {health.missing.length === 0
                ? <span style={{ fontSize: 12.5, color: 'var(--bf-text-2)' }}>All key fields complete.</span>
                : (
                  <div>
                    <div className="eyebrow" style={{ marginBottom: 6 }}>Missing fields</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {health.missing.map(m => (
                        <span key={m} style={{ fontSize: 11, padding: '2px 7px', borderRadius: 99, background: 'var(--bf-danger-soft)', color: 'var(--bf-danger)' }}>{m}</span>
                      ))}
                    </div>
                  </div>
                )
              }
            </div>
          </div>
        </div>

        {/* quick actions */}
        <div style={{ marginBottom: 16 }}>
          <div className="eyebrow" style={{ marginBottom: 9 }}>Quick actions</div>
          <div style={{ display: 'grid', gap: 7 }}>
            {quickActions.map(a => (
              <button key={a.label} className="bf-btn" onClick={a.on} style={{ justifyContent: 'flex-start', width: '100%' }}>
                <Icon name={a.icon} size={16} />{a.label}
              </button>
            ))}
            <button className="bf-btn" onClick={() => flash('Add follow-up (demo)')} style={{ justifyContent: 'flex-start' }}>
              <Icon name="calendarPlus" size={16} />Add Follow-up
            </button>
          </div>
        </div>

        {/* upcoming reminders */}
        <div className="bf-card bf-card-pad" style={{ marginBottom: 16 }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Upcoming reminders</div>
          {reminders.length
            ? reminders.map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 0' }}>
                <Icon name={r.ic} size={15} style={{ color: 'var(--bf-text-3)' }} />
                <span style={{ fontSize: 12.5, flex: 1 }}>{r.l}</span>
                <span className="mono" style={{ fontSize: 11.5, fontWeight: 600, color: (r.d ?? 0) < 0 ? 'var(--bf-danger)' : (r.d ?? 0) <= 3 ? 'var(--bf-warn)' : 'var(--bf-text-3)' }}>
                  {(r.d ?? 0) < 0 ? `${Math.abs(r.d ?? 0)}d ago` : r.d === 0 ? 'today' : `in ${r.d}d`}
                </span>
              </div>
            ))
            : <span style={{ fontSize: 12.5, color: 'var(--bf-text-2)' }}>No upcoming dates.</span>
          }
        </div>

        {/* risk indicators */}
        <div className="bf-card bf-card-pad">
          <div className="eyebrow" style={{ marginBottom: 10 }}>Risk indicators</div>
          {risks.length
            ? (
              <div style={{ display: 'grid', gap: 7 }}>
                {risks.map((r, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--bf-text-2)' }}>
                    <Icon name="alert" size={14} style={{ color: 'var(--bf-warn)', flexShrink: 0 }} />{r}
                  </div>
                ))}
              </div>
            )
            : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--bf-good)' }}>
                <Icon name="checkCircle" size={15} />No active risks flagged.
              </div>
            )
          }
          <div style={{ marginTop: 12 }}>
            <button className="bf-chip" onClick={() => flash('AI risk summary — planned')}
              style={{ borderStyle: 'dashed', color: 'var(--bf-accent-text)', borderColor: 'var(--bf-accent-soft-bd)', background: 'transparent' }}>
              <Icon name="sparkles" size={13} strokeWidth={1.8} />AI risk summary<span className="bf-kbd" style={{ marginLeft: 2 }}>soon</span>
            </button>
          </div>
        </div>
      </aside>
    </div>
  )
}
