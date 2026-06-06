'use client'

import { usePathname } from 'next/navigation'
import { useStore } from '@/lib/store'
import { Icon } from '@/components/ui/icon'
import { ACCENTS } from '@/lib/helpers'
import { daysUntil } from '@/lib/helpers'
import { useMemo, useState } from 'react'
import Link from 'next/link'

const TITLES: Record<string, string> = {
  '/':              'Home',
  '/home':          'Home',
  '/command':       'Command Center',
  '/opportunities': 'Opportunities',
  '/live-bids':     'Live Bids',
  '/pqq':           'Live PQQ / RFQ',
  '/submitted':     'Submitted & Negotiation',
  '/awarded':       'Awarded',
  '/closed':        'Closed / Lost',
  '/calendar':      'Calendar',
  '/clients':       'Clients & Portals',
  '/reports':       'Reports',
  '/settings':      'Settings',
}

export function Topbar({ onOpenQuickAdd }: { onOpenQuickAdd: () => void }) {
  const pathname = usePathname()
  const theme    = useStore(s => s.theme)
  const accent   = useStore(s => s.accent)
  const density  = useStore(s => s.density)
  const cardStyle= useStore(s => s.cardStyle)
  const opps     = useStore(s => s.opps)
  const flash    = useStore(s => s.flash)
  const setTheme = useStore(s => s.setTheme)
  const setAccent= useStore(s => s.setAccent)
  const setDensity=useStore(s => s.setDensity)
  const setCardStyle=useStore(s=>s.setCardStyle)

  const [notifOpen,   setNotifOpen]   = useState(false)
  const [appearOpen,  setAppearOpen]  = useState(false)

  // derive screen title from pathname
  const title = useMemo(() => {
    const base = '/' + pathname.split('/')[1]
    return TITLES[pathname] ?? TITLES[base] ?? 'Opportunities'
  }, [pathname])

  const reminders = useMemo(() => {
    const list: Array<{ id: string; title: string; msg: string; tone: 'danger'|'warn'|'soft'; date: string; kind: string }> = []
    const open = (o: typeof opps[0]) => !['Closed Lost','Cancelled','Postponed','Awarded','No-Go'].includes(o.status)
    opps.forEach(o => {
      // bid due ≤3d & not submitted
      const du = daysUntil(o.bidDue)
      if (du !== null && du >= 0 && du <= 3 && !o.submission)
        list.push({ id: o.id, kind: 'due', title: o.title, msg: du === 0 ? 'Bid due today' : `Bid due in ${du}d`, tone: du <= 1 ? 'danger' : 'warn', date: o.bidDue })
      // overdue & still open
      if (du !== null && du < 0 && !o.submission && open(o))
        list.push({ id: o.id, kind: 'overdue', title: o.title, msg: `${Math.abs(du)} days overdue`, tone: 'danger', date: o.bidDue })
      // question deadline ≤2d
      const qv = daysUntil(o.qDeadline)
      if (qv !== null && qv >= 0 && qv <= 2)
        list.push({ id: o.id, kind: 'q', title: o.title, msg: qv === 0 ? 'Questions close today' : `Questions close in ${qv}d`, tone: 'warn', date: o.qDeadline })
      // site visit ≤2d
      const sv = daysUntil(o.siteVisit)
      if (sv !== null && sv >= 0 && sv <= 2)
        list.push({ id: o.id, kind: 'site', title: o.title, msg: sv === 0 ? 'Site visit today' : `Site visit in ${sv}d`, tone: 'soft', date: o.siteVisit })
      // follow-up due (submitted/negotiation)
      const fv = daysUntil(o.followUp)
      if (fv !== null && fv <= 1 && ['Submitted','Negotiation'].includes(o.status))
        list.push({ id: o.id, kind: 'follow', title: o.title, msg: fv < 0 ? `Follow-up ${Math.abs(fv)}d overdue` : fv === 0 ? 'Follow-up due today' : 'Follow-up due tomorrow', tone: fv < 0 ? 'danger' : 'warn', date: o.followUp })
      // bond expiry ≤60d
      const bv = daysUntil(o.bondValidity)
      if (o.bondReq && bv !== null && bv >= 0 && bv <= 60 && open(o))
        list.push({ id: o.id, kind: 'bond', title: o.title, msg: `Bond expires in ${bv}d`, tone: bv <= 14 ? 'warn' : 'soft', date: o.bondValidity })
    })
    return list.sort((a, b) => a.date > b.date ? 1 : -1).slice(0, 12)
  }, [opps])

  const toneColor = { danger: 'var(--bf-danger)', warn: 'var(--bf-warn)', soft: 'var(--bf-info)' }
  const iconFor: Record<string, string> = { due: 'clock', overdue: 'alert', q: 'pqq', site: 'pin', follow: 'sent', bond: 'shield' }

  return (
    <header style={{
      height: 60, borderBottom: '1px solid var(--bf-border)',
      display: 'flex', alignItems: 'center', gap: 12, padding: '0 20px',
      background: 'color-mix(in oklch, var(--bf-bg) 80%, transparent)',
      backdropFilter: 'blur(8px)', position: 'sticky', top: 0, zIndex: 40, flexShrink: 0,
    }}>
      <span style={{ fontWeight: 750, fontSize: 15.5, letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
        {title}
      </span>
      <div style={{ flex: 1 }} />

      {/* Search */}
      <button
        className="bf-btn bf-btn-sm"
        style={{ color: 'var(--bf-text-3)' }}
        onClick={() => document.dispatchEvent(new CustomEvent('bf:palette'))}
      >
        <Icon name="search" size={15} /><span className="bf-kbd">⌘K</span>
      </button>

      {/* AI pill */}
      <button
        className="bf-chip"
        style={{ borderStyle: 'dashed', color: 'var(--bf-accent-text)', borderColor: 'var(--bf-accent-soft-bd)', background: 'transparent' }}
        onClick={() => flash('AI features arrive in a later release')}
      >
        <Icon name="sparkles" size={13} strokeWidth={1.8} />AI Assist<span className="bf-kbd" style={{ marginLeft: 2 }}>soon</span>
      </button>

      {/* Reminders bell */}
      <div style={{ position: 'relative' }}>
        <button
          className="bf-btn bf-btn-icon bf-btn-ghost"
          onClick={() => { setNotifOpen(p => !p); setAppearOpen(false) }}
          title="Reminders"
          style={{ position: 'relative' }}
        >
          <Icon name="bell" size={18} />
          {reminders.length > 0 && (
            <span style={{ position: 'absolute', top: 5, right: 6, width: 7, height: 7, borderRadius: 99, background: 'var(--bf-danger)', boxShadow: '0 0 0 2px var(--bf-bg)' }} />
          )}
        </button>
        {notifOpen && (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 48 }} onClick={() => setNotifOpen(false)} />
            <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 340, zIndex: 50 }}
              className="bf-card bf-fade-in">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 15px', borderBottom: '1px solid var(--bf-border)' }}>
                <span style={{ fontWeight: 700, fontSize: 15 }}>Reminders</span>
                <span style={{ fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: 'var(--bf-danger-soft)', color: 'var(--bf-danger)' }}>
                  {reminders.length} active
                </span>
              </div>
              <div style={{ maxHeight: 380, overflowY: 'auto' }}>
                {reminders.length === 0
                  ? <div style={{ padding: '30px 16px', textAlign: 'center', color: 'var(--bf-text-3)' }}>You&apos;re all caught up 🎉</div>
                  : reminders.map((r, i) => (
                    <Link
                      key={i}
                      href={`/opportunities/${r.id}`}
                      onClick={() => setNotifOpen(false)}
                      style={{
                        display: 'flex', gap: 11, padding: '11px 15px',
                        width: '100%', borderBottom: '1px solid var(--bf-border-2)',
                        textDecoration: 'none',
                      }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bf-surface-2)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                    >
                      <span style={{ marginTop: 1, color: toneColor[r.tone] }}><Icon name={iconFor[r.kind] ?? 'bell'} size={16} /></span>
                      <span style={{ minWidth: 0, flex: 1 }}>
                        <span style={{ display: 'block', fontWeight: 600, fontSize: 12.5, color: toneColor[r.tone] }}>{r.msg}</span>
                        <span style={{ display: 'block', fontSize: 12.5, color: 'var(--bf-text-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.title}</span>
                      </span>
                    </Link>
                  ))
                }
              </div>
            </div>
          </>
        )}
      </div>

      {/* Appearance */}
      <div style={{ position: 'relative' }}>
        <button
          className="bf-btn bf-btn-icon bf-btn-ghost"
          onClick={() => { setAppearOpen(p => !p); setNotifOpen(false) }}
          title="Appearance"
        >
          <Icon name={theme === 'dark' ? 'moon' : 'sun'} size={18} />
        </button>
        {appearOpen && (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 48 }} onClick={() => setAppearOpen(false)} />
            <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 280, zIndex: 50, padding: 16 }}
              className="bf-card bf-fade-in">
              <div className="eyebrow" style={{ marginBottom: 8 }}>Theme</div>
              <SegControl value={theme} set={setTheme as (v: string) => void} opts={[{ v: 'light', l: '☀ Light' }, { v: 'dark', l: '☾ Dark' }]} />
              <div className="eyebrow" style={{ margin: '16px 0 8px' }}>Accent</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {Object.entries(ACCENTS).map(([k, a]) => (
                  <button
                    key={k}
                    onClick={() => setAccent(k as typeof accent)}
                    title={a.name}
                    style={{
                      flex: 1, height: 32, borderRadius: 8, cursor: 'pointer',
                      background: `oklch(${theme === 'dark' ? 0.68 : 0.56} 0.13 ${a.h})`,
                      border: accent === k ? '2px solid var(--bf-text)' : '2px solid transparent',
                      boxShadow: 'var(--bf-shadow-sm)',
                    }}
                  />
                ))}
              </div>
              <div className="eyebrow" style={{ margin: '16px 0 8px' }}>Density</div>
              <SegControl value={density} set={setDensity as (v: string) => void} opts={[{ v: 'airy', l: 'Airy' }, { v: 'balanced', l: 'Balanced' }, { v: 'compact', l: 'Compact' }]} />
              <div className="eyebrow" style={{ margin: '16px 0 8px' }}>Pipeline cards</div>
              <SegControl value={cardStyle} set={setCardStyle as (v: string) => void} opts={[{ v: 'soft', l: 'Soft' }, { v: 'accent', l: 'Accent bar' }, { v: 'minimal', l: 'Minimal' }]} />
            </div>
          </>
        )}
      </div>

      {/* New opportunity */}
      <button className="bf-btn bf-btn-primary bf-btn-sm" onClick={onOpenQuickAdd}>
        <Icon name="plus" size={16} strokeWidth={2.2} />New opportunity
      </button>
    </header>
  )
}

function SegControl({ value, set, opts }: { value: string; set: (v: string) => void; opts: { v: string; l: string }[] }) {
  return (
    <div style={{ display: 'flex', gap: 4, background: 'var(--bf-surface-2)', padding: 3, borderRadius: 9, border: '1px solid var(--bf-border)' }}>
      {opts.map(o => (
        <button
          key={o.v}
          onClick={() => set(o.v)}
          style={{
            flex: 1, padding: '6px 8px', border: 'none', borderRadius: 6, cursor: 'pointer',
            fontFamily: 'inherit', fontSize: 12, fontWeight: 600,
            background: value === o.v ? 'var(--bf-surface)' : 'transparent',
            color: value === o.v ? 'var(--bf-text)' : 'var(--bf-text-3)',
            boxShadow: value === o.v ? 'var(--bf-shadow-sm)' : 'none',
          }}
        >
          {o.l}
        </button>
      ))}
    </div>
  )
}
