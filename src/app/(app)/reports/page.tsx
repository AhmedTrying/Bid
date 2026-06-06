'use client'

import { useMemo } from 'react'
import { useStore } from '@/lib/store'
import { money, toneStyle } from '@/lib/helpers'
import { CLIENTS, TEAM, STATUS, PRIORITY } from '@/lib/data'
import { Icon } from '@/components/ui/icon'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from 'recharts'

export default function ReportsPage() {
  const opps  = useStore(s => s.opps)
  const theme = useStore(s => s.theme)

  const stats = useMemo(() => {
    const wins    = opps.filter(o => o.status === 'Awarded').length
    const losses  = opps.filter(o => ['Closed Lost','No-Go'].includes(o.status)).length
    const decided = wins + losses
    const winRate = decided ? Math.round((wins / decided) * 100) : 0
    const pipeline = opps.filter(o => ['Live Bid','Bid in Progress','Live PQQ','Live RFQ'].includes(o.status)).reduce((s, o) => s + (o.value || 0), 0)
    const awarded  = opps.filter(o => o.status === 'Awarded').reduce((s, o) => s + (o.value || 0), 0)

    const byStage = Object.entries(
      Object.fromEntries(
        ['New Lead','To Qualify','Live PQQ/RFQ','Live Bid','Submitted','Negotiation','Awarded','Closed / Lost','Postponed'].map(s => [s, 0])
      )
    ).map(([k]) => {
      const count = opps.filter(o => (STATUS[o.status]?.stage ?? '') === k).length
      return { name: k.length > 14 ? k.slice(0, 12) + '…' : k, count }
    })

    const byPriority = ['Critical','High','Medium','Low'].map(p => ({
      name: p, count: opps.filter(o => o.priority === p).length, hue: PRIORITY[p]?.hue ?? 230,
    }))

    const byOwner = TEAM.map(t => ({
      name: t.name.split(' ')[0], count: opps.filter(o => o.owner === t.id).length, hue: t.hue,
    })).filter(x => x.count > 0)

    return { wins, losses, decided, winRate, pipeline, awarded, byStage, byPriority, byOwner }
  }, [opps])

  const accentT = toneStyle(46, theme)
  const BAR_COLOR = accentT.solid

  return (
    <div className="bf-canvas-pad" style={{ animation: 'bf-rise-up .4s cubic-bezier(.2,.8,.2,1)' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.025em', margin: 0 }}>Reports & Analytics</h1>
        <p style={{ margin: '5px 0 0', fontSize: 13.5, color: 'var(--bf-text-2)' }}>Pipeline performance — June 2026 snapshot.</p>
      </div>

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Win rate',       value: stats.winRate + '%',        sub: `${stats.wins}W / ${stats.losses}L`, hue: 152 },
          { label: 'Pipeline value', value: money(stats.pipeline, true), sub: 'active bids',                      hue: 46  },
          { label: 'Awarded value',  value: money(stats.awarded, true),  sub: 'won this year',                    hue: 175 },
          { label: 'Total opps',     value: String(opps.length),         sub: 'in workspace',                     hue: 230 },
        ].map(kp => {
          const t = toneStyle(kp.hue, theme)
          return (
            <div key={kp.label} className="bf-card bf-card-pad">
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--bf-text-faint)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>{kp.label}</div>
              <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', color: t.fg }}>{kp.value}</div>
              <div style={{ fontSize: 12, color: 'var(--bf-text-faint)', marginTop: 4 }}>{kp.sub}</div>
            </div>
          )
        })}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 18, marginBottom: 18 }}>
        {/* pipeline by stage bar chart */}
        <div className="bf-card bf-card-pad">
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 18 }}>
            <Icon name="command" size={16} style={{ color: 'var(--bf-accent)' }} />
            <span style={{ fontWeight: 700, fontSize: 15 }}>Pipeline by stage</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.byStage} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--bf-text-faint)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--bf-text-faint)' }} />
              <Tooltip
                contentStyle={{ background: 'var(--bf-surface)', border: '1px solid var(--bf-border)', borderRadius: 10, fontSize: 12 }}
                labelStyle={{ fontWeight: 700 }}
              />
              <Bar dataKey="count" radius={[5,5,0,0]} fill={BAR_COLOR} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* priority distribution pie */}
        <div className="bf-card bf-card-pad">
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 18 }}>
            <Icon name="target" size={16} style={{ color: 'var(--bf-accent)' }} />
            <span style={{ fontWeight: 700, fontSize: 15 }}>By priority</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={stats.byPriority} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={false} labelLine={false}>
                {stats.byPriority.map((entry, index) => (
                  <Cell key={index} fill={toneStyle(entry.hue, theme).solid} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: 'var(--bf-surface)', border: '1px solid var(--bf-border)', borderRadius: 10, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* workload by owner */}
      <div className="bf-card bf-card-pad">
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 18 }}>
          <Icon name="clients" size={16} style={{ color: 'var(--bf-accent)' }} />
          <span style={{ fontWeight: 700, fontSize: 15 }}>Workload by owner</span>
        </div>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={stats.byOwner} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: 40 }}>
            <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--bf-text-faint)' }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: 'var(--bf-text-2)' }} width={60} />
            <Tooltip contentStyle={{ background: 'var(--bf-surface)', border: '1px solid var(--bf-border)', borderRadius: 10, fontSize: 12 }} />
            <Bar dataKey="count" radius={[0,5,5,0]}>
              {stats.byOwner.map((entry, index) => (
                <Cell key={index} fill={toneStyle(entry.hue, theme).solid} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
