'use client'

import { useEffect, useState } from 'react'

export type FieldType = 'text' | 'number' | 'date' | 'time' | 'textarea' | 'select'

export interface SelectOption { value: string; label: string }

// A label + click-to-edit value, styled for the opportunity detail page.
// `value` is always a string; the caller parses on commit (e.g. Number(v)).
export function EditableField({
  label, value, display, type = 'text', options, onCommit,
  placeholder, mono, hint,
}: {
  label: string
  value: string
  display?: React.ReactNode        // optional formatted read view (overrides plain value)
  type?: FieldType
  options?: SelectOption[]
  onCommit: (v: string) => void
  placeholder?: string
  mono?: boolean
  hint?: string
}) {
  const [edit, setEdit] = useState(false)
  const [draft, setDraft] = useState(value)
  const [hover, setHover] = useState(false)

  useEffect(() => { setDraft(value) }, [value])

  const commit = () => { setEdit(false); if (draft !== value) onCommit(draft) }
  const cancel = () => { setEdit(false); setDraft(value) }
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && type !== 'textarea') { e.preventDefault(); commit() }
    if (e.key === 'Escape') cancel()
  }

  const labelEl = label ? (
    <div className="eyebrow" style={{ marginBottom: 4 }}>
      {label}
      {hint && <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--bf-text-faint)', marginLeft: 7 }}>{hint}</span>}
    </div>
  ) : null

  if (!edit) {
    return (
      <div>
        {labelEl}
        <button
          onClick={() => setEdit(true)}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          className={mono ? 'mono' : ''}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, width: '100%',
            textAlign: 'left', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600,
            color: value ? 'var(--bf-text)' : 'var(--bf-text-faint)',
            background: hover ? 'var(--bf-surface-2)' : 'transparent',
            border: '1px solid transparent', borderRadius: 7,
            padding: '5px 7px', margin: '-5px -7px', cursor: 'text',
            minHeight: 30, transition: 'background .1s',
          }}
        >
          <span style={{ flex: 1, whiteSpace: type === 'textarea' ? 'pre-wrap' : 'normal' }}>
            {display ?? (value || placeholder || '—')}
          </span>
        </button>
      </div>
    )
  }

  const shared = {
    autoFocus: true,
    value: draft,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setDraft(e.target.value),
    onBlur: commit,
    onKeyDown: onKey,
  }

  return (
    <div>
      {labelEl}
      {type === 'select' ? (
        <select className="bf-select" {...shared} style={{ height: 34, fontSize: 13, width: '100%' }}>
          {options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : type === 'textarea' ? (
        <textarea className="bf-input" {...shared} rows={4}
          style={{ resize: 'vertical', lineHeight: 1.5, fontFamily: 'inherit', width: '100%', fontSize: 13 }} />
      ) : (
        <input className="bf-input"
          type={type === 'number' ? 'number' : type === 'date' ? 'date' : type === 'time' ? 'time' : 'text'}
          {...shared} style={{ height: 34, fontSize: 13, width: '100%' }} />
      )}
    </div>
  )
}
