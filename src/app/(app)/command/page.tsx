'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  type DragStartEvent, type DragEndEvent,
} from '@dnd-kit/core'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import { useStore } from '@/lib/store'
import { toneStyle, relDue, fmtDate } from '@/lib/helpers'
import { STAGES, STATUS, PRIORITY, TEAM, byClient } from '@/lib/data'
import { Icon } from '@/components/ui/icon'
import { Avatar } from '@/components/ui/avatar'
import type { Opportunity, Stage } from '@/lib/types'

// ── helpers ──────────────────────────────────────────────────────────────────
const hueFor = (stage: Stage) => {
  const meta = Object.values(STATUS).find(v => v.stage === stage)
  return meta?.hue ?? 60
}

// ── Draggable card wrapper ────────────────────────────────────────────────────
function DraggableCard({ o, theme, cardStyle, hue, onClick }: {
  o: Opportunity; theme: 'light'|'dark'; cardStyle: string; hue: number; onClick: () => void
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: o.id })
  return (
    <div ref={setNodeRef} {...listeners} {...attributes} style={{ opacity: isDragging ? 0.4 : 1 }}>
      <PipeCardInner o={o} theme={theme} cardStyle={cardStyle} hue={hue} onClick={onClick} />
    </div>
  )
}

// ── Droppable column ──────────────────────────────────────────────────────────
function DroppableCol({ stage, isOver, children }: {
  stage: Stage; isOver: boolean; children: React.ReactNode
}) {
  const hue = hueFor(stage)
  const t = { bg: `oklch(0.955 0.035 ${hue})`, bd: `oklch(0.89 0.05 ${hue})` }
  const { setNodeRef } = useDroppable({ id: stage })
  return (
    <div ref={setNodeRef}
      style={{
        flex: '0 0 280px', display: 'flex', flexDirection: 'column',
        borderRadius: 14, minHeight: 0,
        background: isOver ? t.bg : 'var(--bf-surface-2)',
        border: `1px solid ${isOver ? t.bd : 'var(--bf-border)'}`,
        transition: 'background .15s, border-color .15s',
      }}>
      {children}
    </div>
  )
}

// ── PipeCard visual ───────────────────────────────────────────────────────────
function PipeCardInner({ o, theme, cardStyle, hue, onClick }: {
  o: Opportunity; theme: 'light'|'dark'; cardStyle: string; hue: number; onClick?: () => void
}) {
  const due = relDue(o.bidDue)
  const t = toneStyle(hue, theme)
  const pr = PRIORITY[o.priority] ?? {}
  const prT = toneStyle(pr.hue ?? 230, theme)
  const warn = due.tone === 'danger' || due.tone === 'warn'
  const client = byClient(o.client)
  const minimal = cardStyle === 'minimal'
  const accentBar = cardStyle === 'accent'

  return (
    <div onClick={onClick} className="bf-hoverlift"
      style={{
        background: 'var(--bf-surface)', border: `1px solid var(--bf-border)`,
        borderRadius: 12, padding: minimal ? '10px 12px' : '12px 13px',
        cursor: 'pointer', boxShadow: 'var(--bf-shadow-sm)',
        position: 'relative', overflow: 'hidden',
        borderLeft: accentBar ? `3px solid ${t.solid}` : '1px solid var(--bf-border)',
      }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7, gap: 8 }}>
        <span className="mono" style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--bf-text-faint)' }}>{o.ref}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          {o.bondReq && (
            <span title={`Bid bond ${o.bondPct}%`} style={{ color: toneStyle(80, theme).fg, display: 'inline-flex' }}>
              <Icon name="shield" size={13} />
            </span>
          )}
          {warn && (
            <span title={due.label}
              style={{ color: due.tone === 'danger' ? 'var(--bf-danger)' : 'var(--bf-warn)', display: 'inline-flex' }}>
              <Icon name="alert" size={13} />
            </span>
          )}
        </div>
      </div>
      <div style={{
        fontWeight: 650, fontSize: 13, lineHeight: 1.3, marginBottom: minimal ? 6 : 9,
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        color: 'var(--bf-text)',
      }}>{o.title}</div>
      {!minimal && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 9 }}>
          <Icon name="building" size={13} style={{ color: 'var(--bf-text-faint)' }} />
          <span style={{ fontSize: 12, color: 'var(--bf-text-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{client?.name}</span>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <Avatar person={o.owner} size={22} theme={theme} />
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            height: 19, fontSize: 10.5, padding: '0 5px', borderRadius: 99,
            border: `1px solid ${prT.bd}`, color: prT.fg, background: 'transparent',
          }}>
            {[1,2,3,4].map(i => (
              <span key={i} style={{
                width: 2.5, height: 7, borderRadius: 1,
                background: i <= (pr.rank ?? 0) ? prT.solid : 'var(--bf-border-strong)',
              }} />
            ))}
          </span>
        </div>
        {o.bidDue && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            height: 19, fontSize: 10.5, padding: '0 7px', borderRadius: 99,
            background: due.tone === 'danger' ? 'var(--bf-danger-soft)' : due.tone === 'warn' ? 'var(--bf-warn-soft)' : 'var(--bf-surface-3)',
            color: due.tone === 'danger' ? 'var(--bf-danger)' : due.tone === 'warn' ? 'var(--bf-warn)' : 'var(--bf-text-2)',
          }}>
            <Icon name="clock" size={11} />
            {due.n !== null && due.n < 0 ? `${Math.abs(due.n)}d late` : due.n === 0 ? 'today' : fmtDate(o.bidDue)}
          </span>
        )}
      </div>
    </div>
  )
}

// ── Board column ──────────────────────────────────────────────────────────────
function BoardColumn({ stage, items, theme, cardStyle, isOver, onOpenQuickAdd, onOpenDetail }: {
  stage: Stage; items: Opportunity[]; theme: 'light'|'dark'; cardStyle: string;
  isOver: boolean; onOpenQuickAdd: () => void; onOpenDetail: (id: string) => void
}) {
  const [collapsed, setCollapsed] = useState(false)
  const hue = hueFor(stage)
  const t = toneStyle(hue, theme)

  if (collapsed) {
    return (
      <div
        onClick={() => setCollapsed(false)}
        style={{
          width: 46, flexShrink: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: 8, padding: '8px 0', borderRadius: 12,
          background: 'var(--bf-surface-2)', border: '1px solid var(--bf-border)',
          cursor: 'pointer',
        }}>
        <span style={{ width: 8, height: 8, borderRadius: 99, background: t.solid, marginTop: 4 }} />
        <span style={{
          writingMode: 'vertical-rl', transform: 'rotate(180deg)',
          fontWeight: 650, fontSize: 12.5, color: 'var(--bf-text-2)',
        }}>{stage}</span>
        <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: 'var(--bf-text-faint)' }}>{items.length}</span>
      </div>
    )
  }

  return (
    <DroppableCol stage={stage} isOver={isOver}>
      {/* header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 13px 9px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
          <span style={{ width: 9, height: 9, borderRadius: 99, background: t.solid, flexShrink: 0 }} />
          <span style={{ fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{stage}</span>
          <span className="mono" style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--bf-text-faint)' }}>{items.length}</span>
        </div>
        <div style={{ display: 'flex', gap: 2 }}>
          <button className="bf-btn bf-btn-icon bf-btn-ghost" style={{ padding: 4 }} onClick={onOpenQuickAdd}>
            <Icon name="plus" size={15} />
          </button>
          <button className="bf-btn bf-btn-icon bf-btn-ghost" style={{ padding: 4 }} onClick={() => setCollapsed(true)}>
            <Icon name="chevLeft" size={15} />
          </button>
        </div>
      </div>

      {/* cards */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '2px 9px 12px', display: 'flex', flexDirection: 'column', gap: 9 }}>
        {items.length === 0 && (
          <div style={{
            border: '1.5px dashed var(--bf-border-strong)', borderRadius: 11,
            padding: '18px 10px', textAlign: 'center',
            color: 'var(--bf-text-faint)', fontSize: 12, margin: '4px 0',
          }}>
            {isOver ? 'Drop here' : 'Drag cards here'}
          </div>
        )}
        {items.map(o => (
          <DraggableCard
            key={o.id} o={o} theme={theme} cardStyle={cardStyle}
            hue={hue} onClick={() => onOpenDetail(o.id)}
          />
        ))}
      </div>
    </DroppableCol>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function CommandPage() {
  const opps      = useStore(s => s.opps)
  const theme     = useStore(s => s.theme)
  const cardStyle = useStore(s => s.cardStyle)
  const moveStage = useStore(s => s.moveStage)
  const flash     = useStore(s => s.flash)

  const [q, setQ]           = useState('')
  const [owner, setOwner]   = useState('all')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overId, setOverId]   = useState<string | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const filtered = useMemo(() => opps.filter(o => {
    if (owner !== 'all' && o.owner !== owner) return false
    if (q) {
      const s = q.toLowerCase()
      const cl = byClient(o.client)?.name?.toLowerCase() ?? ''
      return o.title.toLowerCase().includes(s) || o.ref.toLowerCase().includes(s) || cl.includes(s)
    }
    return true
  }), [opps, q, owner])

  const byStage = (stage: Stage) => filtered.filter(o => (STATUS[o.status] ?? {}).stage === stage)

  const activeOpp = useMemo(() => activeId ? opps.find(o => o.id === activeId) ?? null : null, [activeId, opps])
  const activeStage = activeOpp ? (STATUS[activeOpp.status]?.stage ?? null) : null

  function onDragStart(e: DragStartEvent) { setActiveId(String(e.active.id)) }

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null); setOverId(null)
    if (e.over && e.active.id !== e.over.id) {
      const stage = String(e.over.id) as Stage
      moveStage(String(e.active.id), stage)
      flash(`Moved to ${stage}`)
    }
  }

  function openDetail(id: string) {
    window.location.href = `/opportunities/${id}`
  }

  function openQuickAdd() {
    document.dispatchEvent(new CustomEvent('bf:quickadd'))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* toolbar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '14px 22px', borderBottom: '1px solid var(--bf-border)',
        flexWrap: 'wrap', gap: 12, flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h1 style={{ fontSize: 18, fontWeight: 750, letterSpacing: '-0.02em', margin: 0 }}>Tender Pipeline</h1>
          <span style={{
            fontSize: 11.5, fontWeight: 700, padding: '2px 9px', borderRadius: 99,
            background: 'var(--bf-surface-3)', color: 'var(--bf-text-2)',
          }}>{filtered.length} opportunities</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {/* search */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Icon name="search" size={15} style={{ position: 'absolute', left: 10, color: 'var(--bf-text-faint)' }} />
            <input
              className="bf-input" value={q} onChange={e => setQ(e.target.value)}
              placeholder="Filter board…"
              style={{ width: 200, paddingLeft: 31, height: 34 }}
            />
          </div>
          {/* owner filter */}
          <select className="bf-select" value={owner} onChange={e => setOwner(e.target.value)}
            style={{ height: 34 }}>
            <option value="all">All owners</option>
            {TEAM.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          {/* table view */}
          <Link href="/opportunities" className="bf-btn" style={{ textDecoration: 'none' }}>
            <Icon name="table" size={15} />Table view
          </Link>
        </div>
      </div>

      {/* board */}
      <DndContext
        sensors={sensors}
        onDragStart={onDragStart}
        onDragOver={e => setOverId(e.over ? String(e.over.id) : null)}
        onDragEnd={onDragEnd}
        onDragCancel={() => { setActiveId(null); setOverId(null) }}
      >
        <div style={{ flex: 1, overflowX: 'auto', overflowY: 'hidden', padding: '16px 22px 22px' }}>
          <div style={{ display: 'flex', gap: 14, height: '100%', minHeight: 0 }}>
            {STAGES.map(stage => (
              <BoardColumn
                key={stage}
                stage={stage}
                items={byStage(stage)}
                theme={theme}
                cardStyle={cardStyle}
                isOver={overId === stage}
                onOpenQuickAdd={openQuickAdd}
                onOpenDetail={openDetail}
              />
            ))}
          </div>
        </div>

        <DragOverlay>
          {activeOpp && activeStage && (
            <div style={{ width: 280, transform: 'rotate(2deg)', opacity: 0.95 }}>
              <PipeCardInner
                o={activeOpp} theme={theme} cardStyle={cardStyle}
                hue={hueFor(activeStage as Stage)}
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
