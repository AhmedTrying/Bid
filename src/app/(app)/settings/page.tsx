'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useStore } from '@/lib/store'
import { ACCENTS } from '@/lib/helpers'
import { TEAM } from '@/lib/data'
import { roleLabel } from '@/lib/roleService'
import { Icon } from '@/components/ui/icon'
import { Avatar } from '@/components/ui/avatar'
import { EditableList } from '@/components/app/editable-list'
import type { AuthUser } from '@/lib/types'

const TABS = [
  { id: 'general',    label: 'General',    icon: 'settings' },
  { id: 'appearance', label: 'Appearance', icon: 'sun' },
  { id: 'lists',      label: 'Lists',      icon: 'list' },
  { id: 'team',       label: 'Team',       icon: 'clients' },
  { id: 'portals',    label: 'Portals',    icon: 'inbox' },
  { id: 'data',       label: 'Data',       icon: 'table' },
]

export default function SettingsPage() {
  const [tab, setTab] = useState('general')
  const theme      = useStore(s => s.theme)
  const accent     = useStore(s => s.accent)
  const density    = useStore(s => s.density)
  const cardStyle  = useStore(s => s.cardStyle)
  const setTheme   = useStore(s => s.setTheme)
  const setAccent  = useStore(s => s.setAccent)
  const setDensity = useStore(s => s.setDensity)
  const setCardStyle = useStore(s => s.setCardStyle)
  const flash      = useStore(s => s.flash)
  const opps       = useStore(s => s.opps)
  const clients    = useStore(s => s.clients)

  // Live users (so roles match Manage Users, not the static seed)
  const [users, setUsers] = useState<AuthUser[]>([])
  useEffect(() => {
    fetch('/api/users').then(r => r.json()).then(j => setUsers(j.users ?? [])).catch(() => {})
  }, [])
  const teamRows = users.length
    ? users.map(u => ({ id: u.id, name: u.name, roleText: roleLabel(u.roleKey), active: u.active }))
    : TEAM.map(t => ({ id: t.id, name: t.name, roleText: roleLabel(t.roleKey ?? 'bd_manager'), active: true }))

  return (
    <div className="bf-canvas-pad" style={{ animation: 'bf-rise-up .4s cubic-bezier(.2,.8,.2,1)', maxWidth: 900 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.025em', margin: 0 }}>Settings</h1>
        <p style={{ margin: '5px 0 0', fontSize: 13.5, color: 'var(--bf-text-2)' }}>Workspace preferences and configuration.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 24 }}>
        {/* tab nav */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px', border: 'none', borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: tab === t.id ? 650 : 500, background: tab === t.id ? 'var(--bf-surface-2)' : 'transparent', color: tab === t.id ? 'var(--bf-text)' : 'var(--bf-text-3)', textAlign: 'left' }}>
              <Icon name={t.icon} size={16} />{t.label}
            </button>
          ))}
        </nav>

        {/* content */}
        <div>
          {tab === 'general' && (
            <div style={{ display: 'grid', gap: 24 }}>
              <Section title="Workspace">
                <Field label="Company name"><input className="bf-input" defaultValue="SATCO" style={{ maxWidth: 320 }} onBlur={e => flash('Company name saved')} /></Field>
                <Field label="Base currency"><input className="bf-input" defaultValue="SAR" style={{ maxWidth: 120 }} readOnly /></Field>
                <Field label="Today anchor" hint="Fixed for demo stability">
                  <input className="bf-input" defaultValue="2026-06-04" style={{ maxWidth: 180 }} readOnly />
                </Field>
              </Section>
              <Section title="Notifications">
                {[
                  ['Bid due in 3 days',    true],
                  ['Questions closing',    true],
                  ['Bond expiry (60 days)',true],
                  ['Overdue follow-ups',   false],
                ].map(([l, on]) => (
                  <label key={l as string} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--bf-border-2)', cursor: 'pointer' }}>
                    <input type="checkbox" defaultChecked={on as boolean} onChange={() => flash(`${l} notification preference saved`)} />
                    <span style={{ fontSize: 13, fontWeight: 550 }}>{l as string}</span>
                  </label>
                ))}
                <Link href="/settings/notification-rules" className="bf-btn bf-btn-sm" style={{ textDecoration: 'none', alignSelf: 'flex-start', marginTop: 6 }}>
                  <Icon name="alert" size={14} />Configure major-change notification rules
                </Link>
              </Section>
            </div>
          )}

          {tab === 'appearance' && (
            <div style={{ display: 'grid', gap: 24 }}>
              <Section title="Theme">
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['light','dark'] as const).map(t => (
                    <button key={t} onClick={() => setTheme(t)} className="bf-btn"
                      style={{ fontWeight: 600, background: theme === t ? 'var(--bf-accent)' : undefined, color: theme === t ? 'var(--bf-on-accent)' : undefined }}>
                      <Icon name={t === 'light' ? 'sun' : 'moon'} size={16} />{t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              </Section>
              <Section title="Accent colour">
                <div style={{ display: 'flex', gap: 10 }}>
                  {(Object.entries(ACCENTS) as [string, { h: number; name: string }][]).map(([k, v]) => (
                    <button key={k} onClick={() => setAccent(k as keyof typeof ACCENTS)}
                      style={{ width: 36, height: 36, borderRadius: 10, border: accent === k ? '2px solid var(--bf-text)' : '2px solid transparent', background: `oklch(0.60 0.14 ${v.h})`, cursor: 'pointer' }}
                      title={v.name} />
                  ))}
                </div>
              </Section>
              <Section title="Density">
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['compact','balanced','airy'] as const).map(d => (
                    <button key={d} onClick={() => setDensity(d)} className="bf-btn"
                      style={{ fontWeight: 600, background: density === d ? 'var(--bf-accent)' : undefined, color: density === d ? 'var(--bf-on-accent)' : undefined }}>
                      {d.charAt(0).toUpperCase() + d.slice(1)}
                    </button>
                  ))}
                </div>
              </Section>
              <Section title="Card style">
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['soft','accent','minimal'] as const).map(s => (
                    <button key={s} onClick={() => setCardStyle(s)} className="bf-btn"
                      style={{ fontWeight: 600, background: cardStyle === s ? 'var(--bf-accent)' : undefined, color: cardStyle === s ? 'var(--bf-on-accent)' : undefined }}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </Section>
            </div>
          )}

          {tab === 'lists' && (
            <div style={{ display: 'grid', gap: 28 }}>
              <p style={{ fontSize: 13.5, color: 'var(--bf-text-2)', margin: 0 }}>
                Edit the dropdown options used across the app. Changes appear immediately in the
                <strong style={{ color: 'var(--bf-text)' }}> Add Opportunity</strong> form and detail pages.
                Clients are managed on the <strong style={{ color: 'var(--bf-text)' }}>Clients &amp; Portals</strong> page.
              </p>
              <EditableList category="portal"         title="Portals" />
              <EditableList category="classification" title="Classifications" />
              <EditableList category="procurement"    title="Procurement methods" />
              <EditableList category="partner"        title="Partners" />
              <EditableList category="opp_type"       title="Opportunity types" />
              <EditableList category="site_visit"     title="Site-visit options" hint="Form uses Date / TBC / Not required; edit labels here." />
              <EditableList category="bond_validity"  title="Bond validity presets" hint="Used as quick-fill suggestions (e.g. “180 days”)." />
              <EditableList category="close_reason"   title="Closed / Lost reasons" hint="Shown when an opportunity is closed, cancelled, no-go or postponed." />
            </div>
          )}

          {tab === 'team' && (
            <Section title="Team members">
              <div style={{ display: 'grid', gap: 10 }}>
                {teamRows.map(t => (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '11px 0', borderBottom: '1px solid var(--bf-border-2)' }}>
                    <Avatar person={t.id} size={36} theme={theme} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 650, fontSize: 14 }}>{t.name}{!t.active && <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--bf-text-faint)' }}>(disabled)</span>}</div>
                      <div style={{ fontSize: 12, color: 'var(--bf-text-2)' }}>{t.roleText}</div>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--bf-text-2)' }}>{opps.filter(o => o.owner === t.id).length} opps</span>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <Link href="/settings/users" className="bf-btn bf-btn-sm" style={{ textDecoration: 'none' }}>
                    <Icon name="clients" size={14} />Manage users
                  </Link>
                  <Link href="/settings/roles" className="bf-btn bf-btn-sm" style={{ textDecoration: 'none' }}>
                    <Icon name="shield" size={14} />Roles &amp; permissions
                  </Link>
                </div>
              </div>
            </Section>
          )}

          {tab === 'portals' && (
            <Section title="Tender portals">
              <p style={{ fontSize: 13.5, color: 'var(--bf-text-2)', marginBottom: 16 }}>Portal credentials are stored in your browser only — BidFlow never sends them to a server.</p>
              {clients.map(c => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0', borderBottom: '1px solid var(--bf-border-2)' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--bf-text-faint)' }}>{c.portal}</div>
                  </div>
                  <button className="bf-btn bf-btn-sm bf-btn-ghost" onClick={() => flash(`Open ${c.portal} — demo`)}>
                    <Icon name="ext" size={13} />Open portal
                  </button>
                </div>
              ))}
            </Section>
          )}

          {tab === 'data' && (
            <div style={{ display: 'grid', gap: 20 }}>
              <Section title="Excel import / export">
                <p style={{ fontSize: 13.5, color: 'var(--bf-text-2)', marginBottom: 14 }}>
                  Import an updated tracker or export a ready-to-use styled Excel file from your {opps.length} opportunities.
                  Excel is an import/export output — your dashboard stays the source of truth.
                </p>
                <Link href="/excel-sync" className="bf-btn" style={{ textDecoration: 'none', alignSelf: 'flex-start' }}>
                  <Icon name="table" size={15} />Open Excel Sync
                </Link>
              </Section>
              <Section title="Reset">
                <p style={{ fontSize: 13.5, color: 'var(--bf-text-2)', marginBottom: 14 }}>Reset workspace to demo data. All changes will be lost.</p>
                <button className="bf-btn" style={{ color: 'var(--bf-danger)', borderColor: 'var(--bf-danger)' }} onClick={() => flash('Data reset — reload page')}>
                  <Icon name="refresh" size={15} />Reset to demo data
                </button>
              </Section>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14, paddingBottom: 9, borderBottom: '1px solid var(--bf-border)' }}>{title}</div>
      <div style={{ display: 'grid', gap: 12 }}>{children}</div>
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="eyebrow" style={{ marginBottom: 6 }}>{label}{hint && <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--bf-text-faint)', marginLeft: 7 }}>{hint}</span>}</div>
      {children}
    </div>
  )
}
