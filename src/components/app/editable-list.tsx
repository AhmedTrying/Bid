'use client'

import { useState } from 'react'
import { useStore, optionsFor } from '@/lib/store'
import { Icon } from '@/components/ui/icon'

// Add / rename / delete / reorder for one option category (portals, partners…).
export function EditableList({ category, title, hint }: { category: string; title: string; hint?: string }) {
  const options      = useStore(s => s.options)
  const addOption    = useStore(s => s.addOption)
  const updateOption = useStore(s => s.updateOption)
  const deleteOption = useStore(s => s.deleteOption)
  const flash        = useStore(s => s.flash)

  const items = optionsFor(options, category)
  const [draft, setDraft]   = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [editVal, setEditVal] = useState('')

  const add = () => {
    const v = draft.trim()
    if (!v) return
    if (items.some(i => i.label.toLowerCase() === v.toLowerCase())) { flash('Already in the list'); return }
    addOption(category, v)
    setDraft('')
    flash(`Added “${v}”`)
  }
  const saveEdit = (id: string) => {
    const v = editVal.trim()
    if (v) updateOption(id, { label: v })
    setEditId(null)
  }
  const move = (idx: number, dir: -1 | 1) => {
    const a = items[idx], b = items[idx + dir]
    if (!a || !b) return
    updateOption(a.id, { order: b.order })
    updateOption(b.id, { order: a.order })
  }

  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{title}</div>
      {hint && <p style={{ fontSize: 12.5, color: 'var(--bf-text-2)', margin: '0 0 12px' }}>{hint}</p>}

      <div style={{ display: 'grid', gap: 6, marginBottom: 12 }}>
        {items.map((it, idx) => (
          <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', border: '1px solid var(--bf-border)', borderRadius: 9, background: 'var(--bf-surface)' }}>
            {editId === it.id ? (
              <input className="bf-input" autoFocus value={editVal}
                onChange={e => setEditVal(e.target.value)}
                onBlur={() => saveEdit(it.id)}
                onKeyDown={e => { if (e.key === 'Enter') saveEdit(it.id); if (e.key === 'Escape') setEditId(null) }}
                style={{ flex: 1, height: 30, fontSize: 13 }} />
            ) : (
              <span style={{ flex: 1, fontSize: 13, fontWeight: 550 }}>{it.label}</span>
            )}
            <button className="bf-btn bf-btn-icon bf-btn-ghost" title="Move up" disabled={idx === 0}
              style={{ padding: 4 }} onClick={() => move(idx, -1)}>
              <Icon name="chevDown" size={14} style={{ transform: 'rotate(180deg)' }} />
            </button>
            <button className="bf-btn bf-btn-icon bf-btn-ghost" title="Move down" disabled={idx === items.length - 1}
              style={{ padding: 4 }} onClick={() => move(idx, 1)}>
              <Icon name="chevDown" size={14} />
            </button>
            <button className="bf-btn bf-btn-icon bf-btn-ghost" title="Rename" style={{ padding: 4 }}
              onClick={() => { setEditId(it.id); setEditVal(it.label) }}>
              <Icon name="edit" size={14} />
            </button>
            <button className="bf-btn bf-btn-icon bf-btn-ghost" title="Delete" style={{ padding: 4, color: 'var(--bf-danger)' }}
              onClick={() => { deleteOption(it.id); flash(`Removed “${it.label}”`) }}>
              <Icon name="trash" size={14} />
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <div style={{ fontSize: 12.5, color: 'var(--bf-text-faint)', padding: '8px 2px' }}>No options yet — add one below.</div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <input className="bf-input" value={draft} onChange={e => setDraft(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()} placeholder={`Add ${title.toLowerCase().replace(/s$/, '')}…`}
          style={{ flex: 1, height: 34 }} />
        <button className="bf-btn bf-btn-primary" onClick={add} disabled={!draft.trim()}>
          <Icon name="plus" size={15} />Add
        </button>
      </div>
    </div>
  )
}
