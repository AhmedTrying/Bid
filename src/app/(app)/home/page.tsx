'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useStore } from '@/lib/store'
import { daysUntil, money, toneStyle, fmtDate } from '@/lib/helpers'
import { byClient, TODAY, STAGES, STATUS } from '@/lib/data'
import { Icon } from '@/components/ui/icon'
import type { Opportunity } from '@/lib/types'

export default function HomePage() {
  const opps   = useStore(s => s.opps)
  const theme  = useStore(s => s.theme)
  const flash  = useStore(s => s.flash)
  const me     = useStore(s => s.currentUser)
  const firstName = (me.name || 'there').split(' ')[0]

  const m = useMemo(() => {
    const inMonth  = (s: string) => s && s.slice(0, 7) === '2026-06'
    const thisYear = (s: string) => s && s.slice(0, 4) === '2026'
    let live = 0, pqq = 0, dueWeek = 0, overdueFollow = 0
    let submittedMonth = 0, awardedYear = 0, closed = 0
    let wins = 0, decided = 0, pipelineValue = 0
    opps.forEach(o => {
      const st = o.status
      if (['Live Bid', 'Bid in Progress'].includes(st)) { live++; pipelineValue += o.value || 0 }
      if (['Live PQQ', 'Live RFQ'].includes(st)) pqq++
      const du = daysUntil(o.bidDue)
      if (du !== null && du >= 0 && du <= 7 && !o.submission) dueWeek++
      const fu = daysUntil(o.followUp)
      if (fu !== null && fu < 0 && ['Submitted', 'Negotiation'].includes(st)) overdueFollow++
      if (inMonth(o.submission)) submittedMonth++
      if (st === 'Awarded' && thisYear(o.updated)) awardedYear++
      if (['Closed Lost', 'Cancelled', 'No-Go'].includes(st)) closed++
      if (st === 'Awarded') { wins++; decided++ }
      if (['Closed Lost', 'No-Go'].includes(st)) decided++
    })
    return { live, pqq, dueWeek, overdueFollow, submittedMonth, awardedYear, closed, winRate: decided ? Math.round((wins / decided) * 100) : 0, pipelineValue }
  }, [opps])

  const focus = useMemo(() => {
    const dueSoon: { o: Opportunity; d: number }[] = []
    const siteVisits: { o: Opportunity; d: number }[] = []
    const questions: { o: Opportunity; d: number }[] = []
    const followUps: { o: Opportunity; d: number }[] = []
    const bondExpiry: { o: Opportunity; d: number }[] = []
    opps.forEach(o => {
      const du = daysUntil(o.bidDue)
      if (du !== null && du >= 0 && du <= 4 && !o.submission && !['Awarded','Closed Lost','Cancelled','Postponed','No-Go'].includes(o.status)) dueSoon.push({ o, d: du })
      const sv = daysUntil(o.siteVisit)
      if (sv !== null && sv >= 0 && sv <= 2) siteVisits.push({ o, d: sv })
      const qv = daysUntil(o.qDeadline)
      if (qv !== null && qv >= 0 && qv <= 2) questions.push({ o, d: qv })
      const fv = daysUntil(o.followUp)
      if (fv !== null && fv >= -3 && fv <= 3 && ['Submitted', 'Negotiation'].includes(o.status)) followUps.push({ o, d: fv })
      const bv = daysUntil(o.bondValidity)
      if (o.bondReq && bv !== null && bv >= 0 && bv <= 60) bondExpiry.push({ o, d: bv })
    })
    const sortD = (a: { d: number }, b: { d: number }) => a.d - b.d
    return {
      dueSoon: dueSoon.sort(sortD), siteVisits: siteVisits.sort(sortD),
      questions: questions.sort(sortD), followUps: followUps.sort(sortD), bondExpiry: bondExpiry.sort(sortD),
    }
  }, [opps])

  const KPIS = [
    { k: 'Live Bids', v: m.live, icon: 'bid', hue: 46, to: '/live-bids', sub: money(m.pipelineValue, true) + ' in play' },
    { k: 'Live PQQ / RFQ', v: m.pqq, icon: 'pqq', hue: 230, to: '/pqq', sub: 'qualifications open' },
    { k: 'Due this week', v: m.dueWeek, icon: 'clock', hue: 25, to: '/live-bids', sub: 'submissions pending', alert: m.dueWeek > 0 },
    { k: 'Overdue follow-ups', v: m.overdueFollow, icon: 'alert', hue: 25, to: '/submitted', sub: 'need chasing', alert: m.overdueFollow > 0 },
    { k: 'Submitted this month', v: m.submittedMonth, icon: 'sent', hue: 175, to: '/submitted', sub: 'June 2026' },
    { k: 'Awarded this year', v: m.awardedYear, icon: 'trophy', hue: 152, to: '/awarded', sub: '2026 to date' },
    { k: 'Closed / Lost', v: m.closed, icon: 'closed', hue: 20, to: '/closed', sub: 'archived' },
    { k: 'Win rate', v: m.winRate + '%', icon: 'target', hue: 152, to: '/reports', sub: 'won vs decided' },
  ]

  const h = new Date().getHours()
  const greeting = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="bf-canvas-pad" style={{ animation: 'bf-rise-up .4s cubic-bezier(.2,.8,.2,1)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 6 }}>{fmtDate(TODAY, { year: true })} · Thursday</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.025em', margin: 0 }}>{greeting}, {firstName} 👋</h1>
          <p style={{ margin: '6px 0 0', fontSize: 14, color: 'var(--bf-text-2)' }}>
            You have <strong style={{ color: 'var(--bf-text)' }}>{m.dueWeek} submissions</strong> due this week and{' '}
            <strong style={{ color: m.overdueFollow ? 'var(--bf-danger)' : 'var(--bf-text)' }}>{m.overdueFollow} follow-ups</strong> to chase.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="bf-btn bf-btn-primary" onClick={() => document.dispatchEvent(new CustomEvent('bf:quickadd'))}>
            <Icon name="plus" size={16} strokeWidth={2.2} />Add Opportunity
          </button>
          <button className="bf-btn" onClick={() => flash('Follow-up scheduler — demo')}>
            <Icon name="calendarPlus" size={16} />Add Follow-up
          </button>
          <Link href="/reports" className="bf-btn" style={{ textDecoration: 'none' }}><Icon name="reports" size={16} />Weekly Report</Link>
          <button className="bf-btn" onClick={() => flash('Excel import — see Settings')}><Icon name="upload" size={16} />Import Excel</button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 22 }}>
        {KPIS.map(kp => {
          const t = toneStyle(kp.hue, theme)
          return (
            <Link key={kp.k} href={kp.to} className="bf-card bf-hoverlift"
              style={{ padding: 16, textDecoration: 'none', display: 'block', overflow: 'hidden', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ width: 34, height: 34, borderRadius: 9, display: 'grid', placeItems: 'center', background: t.bg, color: t.fg }}>
                  <Icon name={kp.icon} size={18} />
                </span>
                {(kp as { alert?: boolean }).alert && (
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: 'var(--bf-danger-soft)', color: 'var(--bf-danger)' }}>action</span>
                )}
              </div>
              <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1, color: 'var(--bf-text)' }}>{kp.v}</div>
              <div style={{ fontWeight: 650, fontSize: 13, marginTop: 7, color: 'var(--bf-text)' }}>{kp.k}</div>
              <div style={{ fontSize: 11.5, marginTop: 2, color: 'var(--bf-text-faint)' }}>{kp.sub}</div>
            </Link>
          )
        })}
      </div>

      {/* Two-column */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.55fr 1fr', gap: 18, alignItems: 'start' }}>
        <div className="bf-card" style={{ overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px 18px', borderBottom: '1px solid var(--bf-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <Icon name="target" size={18} style={{ color: 'var(--bf-accent)' }} />
              <span style={{ fontWeight: 700, fontSize: 15 }}>Today&apos;s Focus</span>
            </div>
            <span style={{ fontSize: 12, color: 'var(--bf-text-faint)' }}>next 48–96 hours</span>
          </div>
          <div style={{ padding: '6px 10px 12px' }}>
            <FocusGroup title="Bids due soon" icon="clock" tone="danger" items={focus.dueSoon} empty="No imminent bid deadlines" />
            <FocusGroup title="Last day for questions" icon="pqq" tone="warn" items={focus.questions} empty="No question deadlines today/tomorrow" />
            <FocusGroup title="Site visits" icon="pin" tone="info" items={focus.siteVisits} empty="No site visits scheduled" />
            <FocusGroup title="Follow-ups due" icon="sent" tone="accent" items={focus.followUps} empty="No follow-ups due" />
            <FocusGroup title="Bid bond expiry alerts" icon="shield" tone="warn" items={focus.bondExpiry} empty="No bonds expiring within 60 days" last />
          </div>
        </div>

        <div style={{ display: 'grid', gap: 18 }}>
          <PipelineSnapshot opps={opps} theme={theme} />
          <div className="bf-card bf-card-pad">
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 6 }}>
              <Icon name="inbox" size={17} style={{ color: 'var(--bf-text-3)' }} />
              <span style={{ fontWeight: 700, fontSize: 15 }}>About this workspace</span>
            </div>
            <p style={{ fontSize: 12.5, lineHeight: 1.55, margin: '4px 0 12px', color: 'var(--bf-text-2)' }}>
              BidFlow is a <strong style={{ color: 'var(--bf-text)' }}>tracking &amp; workflow</strong> tool — it organises opportunities, deadlines and links. Documents live in your existing folders and are linked here.
            </p>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Coming later · optional AI</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {['Tender summary','Weekly report','Duplicate check'].map(label => (
                <button key={label} className="bf-chip"
                  style={{ borderStyle: 'dashed', color: 'var(--bf-accent-text)', borderColor: 'var(--bf-accent-soft-bd)', background: 'transparent' }}
                  onClick={() => flash(`AI ${label} — planned`)}>
                  <Icon name="sparkles" size={13} strokeWidth={1.8} />{label}<span className="bf-kbd" style={{ marginLeft: 2 }}>soon</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function FocusGroup({ title, icon, tone, items, empty, last }: {
  title: string; icon: string; tone: string;
  items: { o: Opportunity; d: number }[]; empty: string; last?: boolean
}) {
  const c = { danger: 'var(--bf-danger)', warn: 'var(--bf-warn)', info: 'var(--bf-info)', accent: 'var(--bf-accent)' }[tone] ?? 'var(--bf-text-2)'
  return (
    <div style={{ padding: '10px 8px', borderBottom: last ? 'none' : '1px solid var(--bf-border-2)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: items.length ? 8 : 0 }}>
        <span style={{ color: c }}><Icon name={icon} size={15} /></span>
        <span style={{ fontWeight: 650, fontSize: 12.5, whiteSpace: 'nowrap' }}>{title}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--bf-text-faint)' }}>{items.length}</span>
      </div>
      {items.length === 0
        ? <div style={{ fontSize: 12, color: 'var(--bf-text-faint)', paddingLeft: 23 }}>{empty}</div>
        : <div style={{ display: 'grid', gap: 5 }}>
          {items.slice(0, 4).map(({ o, d }) => (
            <Link key={o.id} href={`/opportunities/${o.id}`}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 9px 7px 23px', borderRadius: 8, background: 'transparent', textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bf-surface-2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <span style={{ flex: 1, minWidth: 0, fontWeight: 550, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--bf-text)' }}>{o.title}</span>
              <span style={{ fontSize: 11, color: 'var(--bf-text-faint)' }}>{byClient(o.client)?.name?.split(' ')[0]}</span>
              <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 99, border: `1px solid ${c}`, color: c }}>{d === 0 ? 'today' : d < 0 ? `${Math.abs(d)}d ago` : `${d}d`}</span>
            </Link>
          ))}
        </div>
      }
    </div>
  )
}

function PipelineSnapshot({ opps, theme }: { opps: Opportunity[]; theme: 'light'|'dark' }) {
  const stages = STAGES.filter(s => s !== 'Postponed')
  const counts = stages.map(s => ({ s, n: opps.filter(o => (STATUS[o.status] ?? {}).stage === s).length }))
  const max = Math.max(...counts.map(c => c.n), 1)
  const hueFor = (s: string) => Object.values(STATUS).find(v => v.stage === s)?.hue ?? 60
  return (
    <div className="bf-card bf-card-pad">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <Icon name="command" size={17} style={{ color: 'var(--bf-accent)' }} />
          <span style={{ fontWeight: 700, fontSize: 15 }}>Pipeline snapshot</span>
        </div>
        <Link href="/command" className="bf-btn bf-btn-sm bf-btn-ghost" style={{ textDecoration: 'none' }}>Open<Icon name="arrowRight" size={14} /></Link>
      </div>
      <div style={{ display: 'grid', gap: 9 }}>
        {counts.map(c => {
          const t = toneStyle(hueFor(c.s), theme)
          return (
            <div key={c.s} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 118, fontSize: 12, fontWeight: 600, color: 'var(--bf-text-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.s}</span>
              <div style={{ flex: 1, height: 8, borderRadius: 99, background: 'var(--bf-surface-3)', overflow: 'hidden' }}>
                <div style={{ width: `${(c.n / max) * 100}%`, height: '100%', background: t.solid, borderRadius: 99, minWidth: c.n ? 6 : 0, transition: 'width .5s' }} />
              </div>
              <span className="mono" style={{ width: 20, textAlign: 'right', fontSize: 12, fontWeight: 700, color: 'var(--bf-text-2)' }}>{c.n}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
