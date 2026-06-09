'use client'

import { useState } from 'react'
import { useStore } from '@/lib/store'
import { viewsForRoute } from '@/lib/savedViewService'
import { Icon } from '@/components/ui/icon'
import type { SavedViewConfig } from '@/lib/types'

// Reusable saved-views picker (Fix 1). Persists per user + page route via the store.
// `current` is the page's live view config; `onApply` restores a saved one.
export function SavedViews({ route, current, onApply }: {
  route: string
  current: SavedViewConfig
  onApply: (config: SavedViewConfig) => void
}) {
  const savedViews    = useStore(s => s.savedViews)
  const me            = useStore(s => s.currentUser)
  const addSavedView  = useStore(s => s.addSavedView)
  const deleteSavedView = useStore(s => s.deleteSavedView)
  const flash         = useStore(s => s.flash)

  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')

  const views = viewsForRoute(savedViews, route, me.id)

  const save = () => {
    const n = name.trim()
    if (!n) return
    addSavedView(n, route, current)
    setName('')
    flash(`View “${n}” saved`)
  }

  return (
    <div style={{ position: 'relative' }}>
      <button className="bf-btn bf-btn-sm bf-btn-ghost" onClick={() => setOpen(o => !o)}>
        <Icon name="star" size={14} />Saved views
        {views.length > 0 && <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--bf-text-faint)' }}>{views.length}</span>}
      </button>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 48 }} onClick={() => setOpen(false)} />
          <div className="bf-card" style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, width: 260, zIndex: 50, padding: 8, animation: 'bf-fade .15s' }}>
            <div className="eyebrow" style={{ padding: '6px 8px' }}>Saved views</div>
            {views.length === 0 && (
              <div style={{ padding: '4px 8px 8px', fontSize: 12.5, color: 'var(--bf-text-faint)' }}>No saved views yet. Save your current filters below.</div>
            )}
            {views.map(v => (
              <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 6px', borderRadius: 7 }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bf-surface-2)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <button onClick={() => { onApply(v.config); setOpen(false); flash(`View “${v.name}” applied`) }}
                  style={{ flex: 1, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, color: 'var(--bf-text)', padding: '2px 0' }}>
                  <Icon name="star" size={13} style={{ marginRight: 7, color: 'var(--bf-accent)' }} />{v.name}
                </button>
                <button className="bf-btn bf-btn-icon bf-btn-ghost" title="Delete view"
                  onClick={() => { deleteSavedView(v.id); flash('View deleted') }}>
                  <Icon name="trash" size={13} />
                </button>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 6, padding: '8px 6px 4px', borderTop: '1px solid var(--bf-border-2)', marginTop: 4 }}>
              <input className="bf-input" value={name} onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && save()}
                placeholder="Save current view as…" style={{ height: 32, fontSize: 12.5 }} />
              <button className="bf-btn bf-btn-sm bf-btn-primary" onClick={save} disabled={!name.trim()}>Save</button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
