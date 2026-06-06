'use client'

import { useStore } from '@/lib/store'
import { Icon } from '@/components/ui/icon'

export function Toast() {
  const toast = useStore(s => s.toast)
  if (!toast) return null
  return (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      zIndex: 120, background: 'var(--bf-text)', color: 'var(--bf-bg)',
      padding: '10px 16px', borderRadius: 10, fontWeight: 600, fontSize: 13,
      boxShadow: 'var(--bf-shadow-pop)', display: 'flex', alignItems: 'center', gap: 8,
      animation: 'bf-rise-up .25s ease', pointerEvents: 'none',
    }}>
      <Icon name="checkCircle" size={16} />{toast}
    </div>
  )
}
