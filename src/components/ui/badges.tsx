'use client'

import { toneStyle } from '@/lib/helpers'
import { PRIORITY, STATUS } from '@/lib/data'
import type { Theme } from '@/lib/types'
import { Icon } from './icon'

interface StatusBadgeProps {
  status: string
  theme: Theme
  sq?: boolean
  dot?: boolean
}

export function StatusBadge({ status, theme, sq, dot = true }: StatusBadgeProps) {
  const meta = STATUS[status as keyof typeof STATUS] ?? { hue: 60 }
  const t = toneStyle(meta.hue, theme)
  return (
    <span
      className={'inline-flex items-center gap-[5px] h-[22px] px-[9px] rounded-full text-xs font-semibold tracking-tight whitespace-nowrap border' + (sq ? ' rounded-[6px]' : '')}
      style={{ background: t.bg, color: t.fg, borderColor: t.bd }}
    >
      {dot && (
        <span className="w-[6px] h-[6px] rounded-full" style={{ background: t.solid }} />
      )}
      {status}
    </span>
  )
}

interface PriorityBadgeProps {
  priority: string
  theme: Theme
}

export function PriorityBadge({ priority, theme }: PriorityBadgeProps) {
  const meta = PRIORITY[priority] ?? { hue: 230, rank: 1 }
  const t = toneStyle(meta.hue, theme)
  return (
    <span
      className="inline-flex items-center gap-1 h-[22px] pl-[6px] pr-[9px] rounded-[6px] text-xs font-semibold border"
      style={{ background: 'transparent', color: t.fg, borderColor: t.bd }}
    >
      <span className="inline-flex gap-[2px]">
        {[1, 2, 3, 4].map(i => (
          <span
            key={i}
            style={{
              width: 3, height: 9, borderRadius: 1,
              background: i <= meta.rank ? t.solid : 'var(--bf-border-strong)',
            }}
          />
        ))}
      </span>
      {priority}
    </span>
  )
}

interface TypePillProps { type: string }

export function TypePill({ type }: TypePillProps) {
  const map: Record<string, string> = { Bid: 'bid', PQQ: 'pqq', RFQ: 'pqq', EOI: 'file', NDA: 'shield', Tender: 'bid' }
  return (
    <span
      className="inline-flex items-center gap-[5px] h-[22px] px-[9px] rounded-[6px] text-xs font-semibold border"
      style={{ background: 'var(--bf-surface-3)', color: 'var(--bf-text-2)', borderColor: 'var(--bf-border)' }}
    >
      <Icon name={map[type] ?? 'file'} size={12} strokeWidth={2} />
      {type}
    </span>
  )
}
