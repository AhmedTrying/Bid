'use client'

import { byId } from '@/lib/data'
import type { Theme } from '@/lib/types'
import { Icon } from './icon'

interface AvatarProps {
  person?: string | null
  size?: number
  theme?: Theme
  ring?: boolean
}

export function Avatar({ person, size = 26, theme = 'light', ring }: AvatarProps) {
  if (!person) {
    return (
      <span
        className="inline-flex items-center justify-center rounded-full font-bold flex-shrink-0"
        style={{
          width: size, height: size,
          fontSize: size * 0.4,
          background: 'var(--bf-surface-3)',
          color: 'var(--bf-text-faint)',
          boxShadow: 'inset 0 0 0 1px var(--bf-border)',
        }}
        title="Unassigned"
      >
        <Icon name="user" size={size * 0.55} strokeWidth={2} />
      </span>
    )
  }

  const p = typeof person === 'string' ? byId(person) : person
  if (!p) return null

  return (
    <span
      className="inline-flex items-center justify-center rounded-full font-bold flex-shrink-0"
      title={`${p.name} · ${p.role}`}
      style={{
        width: size, height: size,
        fontSize: size * 0.4,
        letterSpacing: '-0.02em',
        color: '#fff',
        background: `oklch(${theme === 'dark' ? 0.62 : 0.58} 0.13 ${p.hue})`,
        boxShadow: ring
          ? `0 0 0 2px var(--bf-surface), 0 0 0 3.5px oklch(0.6 0.1 ${p.hue})`
          : 'inset 0 0 0 1px rgba(255,255,255,0.12)',
      }}
    >
      {p.init}
    </span>
  )
}

interface AvatarStackProps {
  ids: string[]
  size?: number
  theme?: Theme
  max?: number
}

export function AvatarStack({ ids, size = 24, theme = 'light', max = 4 }: AvatarStackProps) {
  const list = ids.slice(0, max)
  return (
    <span className="inline-flex">
      {list.map((id, i) => (
        <span
          key={id}
          style={{
            marginLeft: i ? -8 : 0,
            position: 'relative',
            zIndex: list.length - i,
            borderRadius: 99,
            boxShadow: '0 0 0 2px var(--bf-surface)',
          }}
        >
          <Avatar person={id} size={size} theme={theme} />
        </span>
      ))}
    </span>
  )
}
