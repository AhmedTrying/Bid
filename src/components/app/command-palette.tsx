'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { byClient } from '@/lib/data'
import { Icon } from '@/components/ui/icon'
import { StatusBadge } from '@/components/ui/badges'

const NAV_ITEMS = [
  { id: 'home',      label: 'Home',                   icon: 'home',     href: '/home' },
  { id: 'command',   label: 'Command Center',          icon: 'command',  href: '/command' },
  { id: 'opps',      label: 'Opportunities',           icon: 'opps',     href: '/opportunities' },
  { id: 'livebids',  label: 'Live Bids',               icon: 'bid',      href: '/live-bids' },
  { id: 'pqq',       label: 'Live PQQ / RFQ',          icon: 'pqq',      href: '/pqq' },
  { id: 'submitted', label: 'Submitted & Negotiation', icon: 'sent',     href: '/submitted' },
  { id: 'awarded',   label: 'Awarded',                 icon: 'trophy',   href: '/awarded' },
  { id: 'closed',    label: 'Closed / Lost',           icon: 'closed',   href: '/closed' },
  { id: 'calendar',  label: 'Calendar',                icon: 'calendar', href: '/calendar' },
  { id: 'clients',   label: 'Clients & Portals',       icon: 'clients',  href: '/clients' },
  { id: 'reports',   label: 'Reports',                 icon: 'reports',  href: '/reports' },
  { id: 'settings',  label: 'Settings',                icon: 'settings', href: '/settings' },
]

interface CommandPaletteProps { onClose: () => void }

export function CommandPalette({ onClose }: CommandPaletteProps) {
  const router = useRouter()
  const opps   = useStore(s => s.opps)
  const theme  = useStore(s => s.theme)
  const [q, setQ] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const oppMatches = useMemo(() => {
    const s = q.toLowerCase()
    return opps.filter(o =>
      !s ||
      o.title.toLowerCase().includes(s) ||
      o.ref.toLowerCase().includes(s) ||
      (byClient(o.client)?.name ?? '').toLowerCase().includes(s)
    ).slice(0, 7)
  }, [q, opps])

  const navMatches = NAV_ITEMS.filter(n => !q || n.label.toLowerCase().includes(q.toLowerCase()))

  const ROW_STYLE: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 11,
    width: '100%', padding: '9px 11px', border: 'none',
    borderRadius: 9, background: 'transparent', cursor: 'pointer',
    fontFamily: 'inherit', textAlign: 'left',
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'oklch(0.2 0.01 60 / 0.42)',
        backdropFilter: 'blur(3px)',
        zIndex: 80, display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '7vh 20px',
        animation: 'bf-fade .16s ease',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bf-surface)', border: '1px solid var(--bf-border)',
          borderRadius: 20, boxShadow: 'var(--bf-shadow-pop)',
          width: '100%', maxWidth: 600,
          animation: 'bf-pop .18s cubic-bezier(.2,.8,.2,1)', overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderBottom: '1px solid var(--bf-border)' }}>
          <Icon name="search" size={18} style={{ color: 'var(--bf-text-3)' }} />
          <input
            ref={inputRef}
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search opportunities, clients, or jump to a screen…"
            style={{
              flex: 1, border: 'none', outline: 'none', fontSize: 15,
              background: 'transparent', color: 'var(--bf-text)', fontFamily: 'inherit',
            }}
          />
          <span className="bf-kbd">esc</span>
        </div>

        <div style={{ maxHeight: '52vh', overflowY: 'auto', padding: 8 }}>
          {oppMatches.length > 0 && (
            <div className="eyebrow" style={{ padding: '8px 10px 4px' }}>Opportunities</div>
          )}
          {oppMatches.map(o => (
            <button
              key={o.id}
              style={ROW_STYLE}
              onClick={() => { router.push(`/opportunities/${o.id}`); onClose() }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bf-surface-2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <Icon name="opps" size={16} style={{ color: 'var(--bf-text-3)' }} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontWeight: 600, fontSize: 13.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{o.title}</span>
                <span className="mono" style={{ fontSize: 11, color: 'var(--bf-text-faint)' }}>{o.ref} · {byClient(o.client)?.name}</span>
              </span>
              <StatusBadge status={o.status} theme={theme} dot={false} />
            </button>
          ))}

          {navMatches.length > 0 && (
            <div className="eyebrow" style={{ padding: '10px 10px 4px' }}>Go to</div>
          )}
          {navMatches.map(n => (
            <button
              key={n.id}
              style={ROW_STYLE}
              onClick={() => { router.push(n.href); onClose() }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bf-surface-2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <Icon name={n.icon} size={16} style={{ color: 'var(--bf-text-3)' }} />
              <span style={{ flex: 1, fontWeight: 600, fontSize: 13.5 }}>{n.label}</span>
              <Icon name="arrowRight" size={15} style={{ color: 'var(--bf-text-faint)' }} />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
