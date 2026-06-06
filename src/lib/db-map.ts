// Mapping between Prisma DB rows and the app's Opportunity type.
//
// The Opportunity type uses 'YYYY-MM-DD' date strings, client/owner ids, and a
// status label; the DB uses DateTime, foreign keys, and a StatusConfig row.

import type { Opportunity, OppType, Priority, Result, StatusKey } from './types'
import { synthExtras } from './data'

/** 'YYYY-MM-DD' → Date (UTC midnight) | null */
export function strToDate(s: string | null | undefined): Date | null {
  if (!s) return null
  return new Date(s + 'T00:00:00.000Z')
}

/** Date → 'YYYY-MM-DD' | '' */
export function dateToStr(d: Date | null | undefined): string {
  if (!d) return ''
  return d.toISOString().slice(0, 10)
}

/** Scalar columns of the Opportunity table (shape Prisma create/update accept). */
export interface OppRow {
  id: string
  ref: string
  title: string
  clientId: string
  portal: string
  type: string
  classification: string
  procurement: string
  statusId: string
  priority: string
  ownerId: string | null
  reviewerId: string | null
  rfpReceived: Date | null
  siteVisit: Date | null
  questionDeadline: Date | null
  bidDue: Date | null
  submission: Date | null
  followUp: Date | null
  bondRequired: boolean
  bondPct: number
  bondValidity: Date | null
  result: string
  estValue: number
  notes: string
  checklist: string | null
  updatedAt: Date
}

/** DB row (scalars) → Opportunity (extras are synthesized to match seed data). */
export function dbToOpp(r: OppRow): Opportunity {
  const base = {
    id: r.id,
    ref: r.ref,
    title: r.title,
    client: r.clientId,
    portal: r.portal,
    type: r.type as OppType,
    cls: r.classification,
    proc: r.procurement,
    status: r.statusId as StatusKey,
    priority: r.priority as Priority,
    owner: r.ownerId ?? '',
    reviewer: r.reviewerId ?? '',
    rfpReceived: dateToStr(r.rfpReceived),
    siteVisit: dateToStr(r.siteVisit),
    qDeadline: dateToStr(r.questionDeadline),
    bidDue: dateToStr(r.bidDue),
    submission: dateToStr(r.submission),
    followUp: dateToStr(r.followUp),
    bondPct: r.bondPct,
    bondValidity: dateToStr(r.bondValidity),
    bondReq: r.bondRequired,
    result: r.result as Result,
    value: r.estValue,
    updated: dateToStr(r.updatedAt),
    notes: r.notes,
    checklist: r.checklist ? (JSON.parse(r.checklist) as Record<string, boolean>) : null,
  }
  return { ...base, ...synthExtras(base) }
}

/** Opportunity scalar fields → Prisma create/update data (only present keys). */
export function oppToDbData(o: Partial<Opportunity>) {
  const d: Record<string, unknown> = {}
  if (o.ref         !== undefined) d.ref = o.ref
  if (o.title       !== undefined) d.title = o.title
  if (o.client      !== undefined) d.clientId = o.client
  if (o.portal      !== undefined) d.portal = o.portal
  if (o.type        !== undefined) d.type = o.type
  if (o.cls         !== undefined) d.classification = o.cls
  if (o.proc        !== undefined) d.procurement = o.proc
  if (o.status      !== undefined) d.statusId = o.status
  if (o.priority    !== undefined) d.priority = o.priority
  if (o.owner       !== undefined) d.ownerId = o.owner || null
  if (o.reviewer    !== undefined) d.reviewerId = o.reviewer || null
  if (o.rfpReceived !== undefined) d.rfpReceived = strToDate(o.rfpReceived)
  if (o.siteVisit   !== undefined) d.siteVisit = strToDate(o.siteVisit)
  if (o.qDeadline   !== undefined) d.questionDeadline = strToDate(o.qDeadline)
  if (o.bidDue      !== undefined) d.bidDue = strToDate(o.bidDue)
  if (o.submission  !== undefined) d.submission = strToDate(o.submission)
  if (o.followUp    !== undefined) d.followUp = strToDate(o.followUp)
  if (o.bondPct     !== undefined) d.bondPct = o.bondPct
  if (o.bondValidity!== undefined) d.bondValidity = strToDate(o.bondValidity)
  if (o.bondReq     !== undefined) d.bondRequired = o.bondReq
  if (o.result      !== undefined) d.result = o.result
  if (o.value       !== undefined) d.estValue = o.value
  if (o.notes       !== undefined) d.notes = o.notes
  if (o.checklist   !== undefined) d.checklist = o.checklist ? JSON.stringify(o.checklist) : null
  return d
}
