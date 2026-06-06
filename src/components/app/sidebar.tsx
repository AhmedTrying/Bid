'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useStore } from '@/lib/store'
import { Icon } from '@/components/ui/icon'
import { Avatar } from '@/components/ui/avatar'
import { useMemo } from 'react'
import { STATUS } from '@/lib/data'

const NAV = [
  { sec: 'Workspace', items: [
    { id: 'home',      label: 'Home',                   icon: 'home',     href: '/home' },
    { id: 'command',   label: 'Command Center',          icon: 'command',  href: '/command' },
    { id: 'opps',      label: 'Opportunities',           icon: 'opps',     href: '/opportunities' },
  ]},
  { sec: 'Pipeline', items: [
    { id: 'livebids',  label: 'Live Bids',               icon: 'bid',      href: '/live-bids' },
    { id: 'pqq',       label: 'Live PQQ / RFQ',          icon: 'pqq',      href: '/pqq' },
    { id: 'submitted', label: 'Submitted & Negotiation', icon: 'sent',     href: '/submitted' },
    { id: 'awarded',   label: 'Awarded',                 icon: 'trophy',   href: '/awarded' },
    { id: 'closed',    label: 'Closed / Lost',           icon: 'closed',   href: '/closed' },
  ]},
  { sec: 'Organize', items: [
    { id: 'calendar',  label: 'Calendar',                icon: 'calendar', href: '/calendar' },
    { id: 'clients',   label: 'Clients & Portals',       icon: 'clients',  href: '/clients' },
    { id: 'reports',   label: 'Reports',                 icon: 'reports',  href: '/reports' },
    { id: 'settings',  label: 'Settings',                icon: 'settings', href: '/settings' },
  ]},
]

export function Sidebar() {
  const opps      = useStore(s => s.opps)
  const collapsed = useStore(s => s.sidebarCollapsed)
  const setCollapsed = useStore(s => s.setSidebarCollapsed)
  const theme     = useStore(s => s.theme)
  const pathname  = usePathname()

  const counts = useMemo(() => {
    let live = 0, pqq = 0, submitted = 0, awarded = 0, closed = 0
    opps.forEach(o => {
      const st = o.status
      if (['Live Bid', 'Bid in Progress'].includes(st)) live++
      if (['Live PQQ', 'Live RFQ'].includes(st)) pqq++
      if (['Submitted', 'Negotiation'].includes(st)) submitted++
      if (st === 'Awarded') awarded++
      if (['Closed Lost', 'Cancelled', 'No-Go'].includes(st)) closed++
    })
    return { livebids: live, pqq, submitted, awarded, closed }
  }, [opps])

  const isActive = (href: string) => {
    if (href === '/home') return pathname === '/' || pathname.startsWith('/home')
    return pathname.startsWith(href)
  }

  const w = collapsed ? 64 : 248

  return (
    <aside
      style={{
        width: w, background: 'var(--bf-sidebar)',
        borderRight: '1px solid var(--bf-border)',
        display: 'flex', flexDirection: 'column',
        height: '100%', flexShrink: 0,
        transition: 'width .2s ease', overflow: 'hidden',
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 14px 14px', minHeight: 60 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 9, background: 'var(--bf-accent)',
          display: 'grid', placeItems: 'center', flexShrink: 0,
          boxShadow: 'var(--bf-shadow-sm)',
        }}>
          <Icon name="zap" size={17} strokeWidth={2.2} style={{ color: 'var(--bf-on-accent)' }} />
        </div>
        {!collapsed && (
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 800, letterSpacing: '-0.03em', fontSize: 15.5, lineHeight: 1 }}>BidFlow</div>
            <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.04em', marginTop: 2, color: 'var(--bf-text-faint)' }}>
              TENDER COMMAND CENTER
            </div>
          </div>
        )}
      </div>

      {/* Search trigger */}
      <div style={{ padding: '2px 10px 8px' }}>
        <button
          className="bf-btn"
          style={{
            width: '100%',
            justifyContent: collapsed ? 'center' : 'flex-start',
            color: 'var(--bf-text-3)',
            background: 'var(--bf-surface-2)',
          }}
          onClick={() => document.dispatchEvent(new CustomEvent('bf:palette'))}
        >
          <Icon name="search" size={15} />
          {!collapsed && (
            <>
              <span style={{ flex: 1, textAlign: 'left', fontWeight: 500 }}>Search…</span>
              <span className="bf-kbd">⌘K</span>
            </>
          )}
        </button>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '4px 10px 10px' }}>
        {NAV.map(group => (
          <div key={group.sec} style={{ marginBottom: 14 }}>
            {!collapsed && (
              <div className="eyebrow" style={{ padding: '4px 8px', fontSize: 10.5 }}>{group.sec}</div>
            )}
            {group.items.map(item => {
              const active = isActive(item.href)
              const cnt = counts[item.id as keyof typeof counts]
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: collapsed ? '9px' : '7px 9px', marginBottom: 1,
                    border: 'none', borderRadius: 8, cursor: 'pointer',
                    fontFamily: 'inherit', fontSize: 13.5,
                    fontWeight: active ? 650 : 500,
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    background: active ? 'var(--bf-accent-soft)' : 'transparent',
                    color: active ? 'var(--bf-accent-text)' : 'var(--bf-text-2)',
                    transition: 'background .12s',
                    textDecoration: 'none',
                  }}
                  onMouseEnter={e => {
                    if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--bf-surface-3)'
                  }}
                  onMouseLeave={e => {
                    if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'
                  }}
                >
                  <Icon name={item.icon} size={17} strokeWidth={active ? 2 : 1.8} style={{ flexShrink: 0 }} />
                  {!collapsed && (
                    <span style={{ flex: 1, textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>
                      {item.label}
                    </span>
                  )}
                  {!collapsed && cnt > 0 && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: active ? 'var(--bf-accent-text)' : 'var(--bf-text-faint)', minWidth: 18, textAlign: 'right' }}>
                      {cnt}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* User card */}
      <div style={{ borderTop: '1px solid var(--bf-border)', padding: 10 }}>
        {!collapsed ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <Avatar person="lh" size={30} theme={theme} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontWeight: 650, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Layla Haddad</div>
              <div style={{ fontSize: 11, color: 'var(--bf-text-faint)' }}>BD Manager</div>
            </div>
            <button
              className="bf-btn bf-btn-icon bf-btn-ghost"
              onClick={() => setCollapsed(true)}
              title="Collapse sidebar"
            >
              <Icon name="panelLeft" size={16} />
            </button>
          </div>
        ) : (
          <button
            className="bf-btn bf-btn-icon bf-btn-ghost"
            onClick={() => setCollapsed(false)}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            <Icon name="panelLeft" size={16} />
          </button>
        )}
      </div>
    </aside>
  )
}
