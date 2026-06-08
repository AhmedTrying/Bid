'use client'

import { useState } from 'react'
import { useStore } from '@/lib/store'
import { DOC_LABELS } from '@/lib/data'
import { Icon } from '@/components/ui/icon'
import type { Opportunity, Document } from '@/lib/types'

const iconForLabel = (label: string): string => {
  if (/rfp|tender/i.test(label)) return 'folder'
  if (/boq|financial|commercial/i.test(label)) return 'sheet'
  return 'file'
}

// Real document-link CRUD for an opportunity (add / edit / delete, multiple).
export function DocumentsSection({ opp }: { opp: Opportunity }) {
  const addDocument    = useStore(s => s.addDocument)
  const updateDocument = useStore(s => s.updateDocument)
  const deleteDocument = useStore(s => s.deleteDocument)
  const flash          = useStore(s => s.flash)

  const [adding, setAdding] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {opp.documents.map(d =>
        editId === d.id ? (
          <DocForm
            key={d.id}
            initial={d}
            onCancel={() => setEditId(null)}
            onSave={(data) => { updateDocument(opp.id, d.id, data); setEditId(null); flash('Document updated') }}
          />
        ) : (
          <div key={d.id} className="bf-hoverlift"
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 13px', border: '1px solid var(--bf-border)', borderRadius: 11, background: 'var(--bf-surface)' }}>
            <span style={{ width: 32, height: 32, borderRadius: 8, display: 'grid', placeItems: 'center', background: 'var(--bf-surface-3)', color: 'var(--bf-text-2)', flexShrink: 0 }}>
              <Icon name={iconForLabel(d.label)} size={17} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.name || d.label}</span>
                <span style={{ fontSize: 10.5, padding: '1px 7px', borderRadius: 99, background: 'var(--bf-accent-soft)', color: 'var(--bf-accent-text)', fontWeight: 600, flexShrink: 0 }}>{d.label}</span>
              </div>
              {d.url
                ? <a href={d.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11.5, color: 'var(--bf-text-faint)', textDecoration: 'none', wordBreak: 'break-all' }} onClick={e => e.stopPropagation()}>{d.url}</a>
                : <span style={{ fontSize: 11.5, color: 'var(--bf-text-faint)' }}>{d.meta || 'No link yet'}</span>}
            </div>
            {d.url && (
              <a href={d.url} target="_blank" rel="noopener noreferrer" className="bf-btn bf-btn-icon bf-btn-ghost" title="Open" style={{ padding: 5, textDecoration: 'none' }}>
                <Icon name="ext" size={15} />
              </a>
            )}
            <button className="bf-btn bf-btn-icon bf-btn-ghost" style={{ padding: 5 }} title="Edit" onClick={() => setEditId(d.id)}>
              <Icon name="edit" size={14} />
            </button>
            <button className="bf-btn bf-btn-icon bf-btn-ghost" style={{ padding: 5, color: 'var(--bf-danger)' }} title="Delete"
              onClick={() => { deleteDocument(opp.id, d.id); flash('Document removed') }}>
              <Icon name="trash" size={14} />
            </button>
          </div>
        )
      )}

      {adding ? (
        <DocForm
          onCancel={() => setAdding(false)}
          onSave={(data) => { addDocument(opp.id, data); setAdding(false); flash('Document link added') }}
        />
      ) : (
        <button className="bf-btn bf-btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => setAdding(true)}>
          <Icon name="link" size={14} />Add document link
        </button>
      )}
    </div>
  )
}

// Inline add/edit form for one document link.
function DocForm({ initial, onSave, onCancel }: {
  initial?: Document
  onSave: (data: Partial<Document>) => void
  onCancel: () => void
}) {
  const [label, setLabel] = useState(initial?.label ?? DOC_LABELS[0])
  const [name, setName]   = useState(initial?.name ?? '')
  const [url, setUrl]     = useState(initial?.url ?? '')

  const save = () => {
    if (!name.trim() && !url.trim()) return
    onSave({ label, name: name.trim(), url: url.trim() })
  }

  return (
    <div style={{ border: '1px solid var(--bf-accent-soft-bd)', borderRadius: 11, padding: 12, background: 'var(--bf-surface-2)', display: 'grid', gap: 9 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 9 }}>
        <select className="bf-select" value={label} onChange={e => setLabel(e.target.value)} style={{ height: 34, fontSize: 13 }}>
          {DOC_LABELS.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <input className="bf-input" value={name} onChange={e => setName(e.target.value)} placeholder="Title (e.g. Technical Proposal v2)" style={{ height: 34, fontSize: 13 }} />
      </div>
      <input className="bf-input" value={url} onChange={e => setUrl(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && save()}
        placeholder="https://… (SharePoint, Drive, etc.)" style={{ height: 34, fontSize: 13 }} />
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button className="bf-btn bf-btn-sm" onClick={onCancel}>Cancel</button>
        <button className="bf-btn bf-btn-sm bf-btn-primary" onClick={save} disabled={!name.trim() && !url.trim()}>
          <Icon name="check" size={14} />Save
        </button>
      </div>
    </div>
  )
}
