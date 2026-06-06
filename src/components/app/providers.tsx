'use client'

import { useEffect } from 'react'
import { useStore } from '@/lib/store'
import { ACCENTS } from '@/lib/helpers'

// Syncs Zustand state to CSS custom properties on <html>
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme  = useStore(s => s.theme)
  const accent = useStore(s => s.accent)
  const density = useStore(s => s.density)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    const a = ACCENTS[accent]
    const root = document.documentElement.style
    const L = theme === 'dark'
      ? { base: 0.68, hov: 0.73, press: 0.63, soft: 0.34, softbd: 0.42, text: 0.78, on: 0.18 }
      : { base: 0.56, hov: 0.50, press: 0.45, soft: 0.95, softbd: 0.88, text: 0.46, on: 0.99 }
    root.setProperty('--bf-accent',          `oklch(${L.base}  0.13  ${a.h})`)
    root.setProperty('--bf-accent-hover',    `oklch(${L.hov}   0.135 ${a.h})`)
    root.setProperty('--bf-accent-press',    `oklch(${L.press} 0.13  ${a.h})`)
    root.setProperty('--bf-accent-soft',     `oklch(${L.soft}  ${theme === 'dark' ? 0.05 : 0.032} ${a.h})`)
    root.setProperty('--bf-accent-soft-bd',  `oklch(${L.softbd} ${theme === 'dark' ? 0.06 : 0.05} ${a.h})`)
    root.setProperty('--bf-accent-text',     `oklch(${L.text}  0.12  ${a.h})`)
    root.setProperty('--bf-on-accent',       `oklch(${L.on}    0.02  ${a.h})`)
  }, [accent, theme])

  useEffect(() => {
    document.documentElement.setAttribute('data-density', density)
  }, [density])

  return <>{children}</>
}
