// BidFlow Tracker — Date, money, and tone helpers

import { TODAY } from './data'
import type { ToneStyle } from './types'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export function parseDate(s: string): Date | null {
  if (!s) return null
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function fmtDate(s: string, opts?: { year?: boolean }): string {
  const d = parseDate(s)
  if (!d) return '—'
  return `${d.getDate()} ${MONTHS[d.getMonth()]}${opts?.year ? ' ' + String(d.getFullYear()).slice(2) : ''}`
}

export function daysBetween(a: string, b: string): number | null {
  const A = parseDate(a), B = parseDate(b)
  if (!A || !B) return null
  return Math.round((B.getTime() - A.getTime()) / 86400000)
}

export function daysUntil(s: string): number | null {
  return daysBetween(TODAY, s)
}

export interface RelDue {
  n: number | null
  label: string
  tone: 'danger' | 'warn' | 'soft' | 'none'
}

export function relDue(s: string): RelDue {
  const n = daysUntil(s)
  if (n === null) return { n: null, label: 'No date', tone: 'none' }
  if (n < 0)  return { n, label: `${Math.abs(n)}d overdue`, tone: 'danger' }
  if (n === 0) return { n, label: 'Due today',              tone: 'danger' }
  if (n === 1) return { n, label: 'Due tomorrow',           tone: 'warn' }
  if (n <= 3)  return { n, label: `Due in ${n}d`,           tone: 'warn' }
  if (n <= 7)  return { n, label: `Due in ${n}d`,           tone: 'soft' }
  return { n, label: `Due in ${n}d`, tone: 'none' }
}

export function money(v: number, compact?: boolean): string {
  if (!v) return '—'
  if (compact) {
    if (v >= 1e6) return 'AED ' + (v / 1e6).toFixed(v >= 1e7 ? 0 : 1) + 'M'
    if (v >= 1e3) return 'AED ' + (v / 1e3).toFixed(0) + 'K'
  }
  return 'AED ' + v.toLocaleString('en-US')
}

export function toneStyle(hue: number, theme: 'light' | 'dark'): ToneStyle {
  const dark = theme === 'dark'
  if (dark) return {
    bg:    `oklch(0.34 0.055 ${hue} / 0.5)`,
    fg:    `oklch(0.84 0.10 ${hue})`,
    bd:    `oklch(0.46 0.06 ${hue} / 0.5)`,
    solid: `oklch(0.70 0.13 ${hue})`,
  }
  return {
    bg:    `oklch(0.955 0.035 ${hue})`,
    fg:    `oklch(0.46 0.13 ${hue})`,
    bd:    `oklch(0.89 0.05 ${hue})`,
    solid: `oklch(0.60 0.14 ${hue})`,
  }
}

export function computeHealth(o: {
  owner: string; reviewer: string; bondReq: boolean; bondValidity: string;
  bidDue: string; type: string; value: number; submission: string;
  status: string; qDeadline: string;
}): { score: number; missing: string[] } {
  let score = 100
  const missing: string[] = []
  if (!o.owner)      { score -= 18; missing.push('Owner') }
  if (!o.reviewer)   { score -= 10; missing.push('Reviewer') }
  if (o.bondReq && !o.bondValidity) { score -= 12; missing.push('Bond validity') }
  if (!o.bidDue)     { score -= 15; missing.push('Bid due date') }
  if (o.type === 'Bid' && !o.value) { score -= 8; missing.push('Estimated value') }
  const du = daysUntil(o.bidDue)
  if (du !== null && du < 0 && !o.submission)           { score -= 20 }
  else if (du !== null && du >= 0 && du <= 3 && !o.submission) { score -= 8 }
  if (!o.qDeadline && ['Live Bid', 'Bid in Progress'].includes(o.status)) {
    score -= 6; missing.push('Question deadline')
  }
  return { score: Math.max(8, Math.min(100, score)), missing }
}

export const ACCENTS = {
  amber:  { h: 46,  name: 'Amber' },
  teal:   { h: 175, name: 'Teal' },
  blue:   { h: 240, name: 'Blue' },
  violet: { h: 285, name: 'Violet' },
} as const
