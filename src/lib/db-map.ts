// Mapping between Prisma DB rows and the app's Opportunity type.
//
// The Opportunity type uses 'YYYY-MM-DD' date strings, client/owner ids, and a
// status label; the DB uses DateTime, foreign keys, and a StatusConfig row.

import type {
  Opportunity, OppType, Priority, Result, StatusKey,
  SiteVisitMode, Document, CalendarItem, ChangeEvent, ChangeSource,
  ChangeImportance, EmailStatus, ExcelStatus,
} from './types'
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

/** Document row (scalar columns of the Document table). */
export interface DocRow {
  id: string
  label: string
  name: string
  url: string
  kind: string
  meta: string
}

/** Reminder row (scalar columns of the Reminder table). */
export interface ReminderRow {
  id: string
  oppId: string | null
  type: string
  title: string
  date: Date
  time: string
  notes: string
  done: boolean
}

/** Scalar columns of the Opportunity table (shape Prisma create/update accept). */
export interface OppRow {
  id: string
  ref: string
  rfpNumber: string | null
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
  partnerInvolved: boolean
  partnerName: string
  contractDuration: string
  rfpReceived: Date | null
  siteVisit: Date | null
  siteVisitMode: string
  questionDeadline: Date | null
  qDeadlineTime: string
  bidDue: Date | null
  bidDueTime: string
  submission: Date | null
  followUp: Date | null
  bondRequired: boolean
  bondPct: number
  bondValidity: Date | null
  bondValidityDays: number | null
  result: string
  estValue: number
  notes: string
  closedReasonCategory: string | null
  closedReasonNotes: string
  closedById: string | null
  closedAt: Date | null
  archivedAt: Date | null
  followUpTwo: Date | null
  checklist: string | null
  updatedAt: Date
  documents?: DocRow[]   // present when the query includes the relation
}

/** Document DB row → app Document. */
export function dbToDoc(r: DocRow): Document {
  return {
    id: r.id,
    label: r.label,
    name: r.name,
    url: r.url,
    type: (r.kind as Document['type']) || 'file',
    meta: r.meta,
  }
}

/** Reminder DB row → app CalendarItem. */
export function dbToReminder(r: ReminderRow): CalendarItem {
  return {
    id: r.id,
    oppId: r.oppId,
    type: r.type as CalendarItem['type'],
    title: r.title,
    date: dateToStr(r.date),
    time: r.time,
    notes: r.notes,
    done: r.done,
  }
}

/** DB row (scalars) → Opportunity. followUps/activity are synthesized; documents
 *  use the real relation when present, else fall back to synthesized demo docs. */
export function dbToOpp(r: OppRow): Opportunity {
  const base = {
    id: r.id,
    ref: r.ref,
    rfpNumber: r.rfpNumber ?? '',
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
    partnerInvolved: r.partnerInvolved,
    partnerName: r.partnerName,
    contractDuration: r.contractDuration,
    rfpReceived: dateToStr(r.rfpReceived),
    siteVisit: dateToStr(r.siteVisit),
    siteVisitMode: (r.siteVisitMode as SiteVisitMode) || 'date',
    qDeadline: dateToStr(r.questionDeadline),
    qDeadlineTime: r.qDeadlineTime ?? '',
    bidDue: dateToStr(r.bidDue),
    bidDueTime: r.bidDueTime ?? '',
    submission: dateToStr(r.submission),
    followUp: dateToStr(r.followUp),
    bondPct: r.bondPct,
    bondValidity: dateToStr(r.bondValidity),
    bondValidityDays: r.bondValidityDays,
    bondReq: r.bondRequired,
    result: r.result as Result,
    value: r.estValue,
    updated: dateToStr(r.updatedAt),
    notes: r.notes,
    closedReasonCategory: r.closedReasonCategory ?? '',
    closedReasonNotes: r.closedReasonNotes ?? '',
    closedBy: r.closedById ?? '',
    closedAt: dateToStr(r.closedAt),
    archivedAt: dateToStr(r.archivedAt),
    followUpTwo: dateToStr(r.followUpTwo),
    checklist: r.checklist ? (JSON.parse(r.checklist) as Record<string, boolean>) : null,
  }
  const extras = synthExtras(base)
  const documents = r.documents ? r.documents.map(dbToDoc) : extras.documents
  return { ...base, ...extras, documents }
}

/** Opportunity scalar fields → Prisma create/update data (only present keys). */
export function oppToDbData(o: Partial<Opportunity>) {
  const d: Record<string, unknown> = {}
  if (o.ref             !== undefined) d.ref = o.ref
  if (o.rfpNumber       !== undefined) d.rfpNumber = o.rfpNumber || null
  if (o.title           !== undefined) d.title = o.title
  if (o.client          !== undefined) d.clientId = o.client
  if (o.portal          !== undefined) d.portal = o.portal
  if (o.type            !== undefined) d.type = o.type
  if (o.cls             !== undefined) d.classification = o.cls
  if (o.proc            !== undefined) d.procurement = o.proc
  if (o.status          !== undefined) d.statusId = o.status
  if (o.priority        !== undefined) d.priority = o.priority
  if (o.owner           !== undefined) d.ownerId = o.owner || null
  if (o.reviewer        !== undefined) d.reviewerId = o.reviewer || null
  if (o.partnerInvolved !== undefined) d.partnerInvolved = o.partnerInvolved
  if (o.partnerName     !== undefined) d.partnerName = o.partnerName
  if (o.contractDuration!== undefined) d.contractDuration = o.contractDuration
  if (o.rfpReceived     !== undefined) d.rfpReceived = strToDate(o.rfpReceived)
  if (o.siteVisit       !== undefined) d.siteVisit = strToDate(o.siteVisit)
  if (o.siteVisitMode   !== undefined) d.siteVisitMode = o.siteVisitMode
  if (o.qDeadline       !== undefined) d.questionDeadline = strToDate(o.qDeadline)
  if (o.qDeadlineTime   !== undefined) d.qDeadlineTime = o.qDeadlineTime
  if (o.bidDue          !== undefined) d.bidDue = strToDate(o.bidDue)
  if (o.bidDueTime      !== undefined) d.bidDueTime = o.bidDueTime
  if (o.submission      !== undefined) d.submission = strToDate(o.submission)
  if (o.followUp        !== undefined) d.followUp = strToDate(o.followUp)
  if (o.bondPct         !== undefined) d.bondPct = o.bondPct
  if (o.bondValidity    !== undefined) d.bondValidity = strToDate(o.bondValidity)
  if (o.bondValidityDays!== undefined) d.bondValidityDays = o.bondValidityDays
  if (o.bondReq         !== undefined) d.bondRequired = o.bondReq
  if (o.result          !== undefined) d.result = o.result
  if (o.value           !== undefined) d.estValue = o.value
  if (o.notes           !== undefined) d.notes = o.notes
  if (o.closedReasonCategory !== undefined) d.closedReasonCategory = o.closedReasonCategory || null
  if (o.closedReasonNotes    !== undefined) d.closedReasonNotes = o.closedReasonNotes
  if (o.closedBy        !== undefined) d.closedById = o.closedBy || null
  if (o.closedAt        !== undefined) d.closedAt = strToDate(o.closedAt)
  if (o.archivedAt      !== undefined) d.archivedAt = strToDate(o.archivedAt)
  if (o.followUpTwo     !== undefined) d.followUpTwo = strToDate(o.followUpTwo)
  if (o.checklist       !== undefined) d.checklist = o.checklist ? JSON.stringify(o.checklist) : null
  return d
}

/** App Document fields → Prisma Document create/update data (only present keys). */
export function docToDbData(doc: Partial<Document>) {
  const d: Record<string, unknown> = {}
  if (doc.label !== undefined) d.label = doc.label
  if (doc.name  !== undefined) d.name = doc.name
  if (doc.url   !== undefined) d.url = doc.url
  if (doc.type  !== undefined) d.kind = doc.type
  if (doc.meta  !== undefined) d.meta = doc.meta
  return d
}

// ── Change History (Feature 2) ────────────────────────────────────────────────

/** Scalar columns of the ChangeEvent table. */
export interface ChangeRow {
  id: string
  userId: string
  userName: string
  userInitials: string
  actionType: string
  oppId: string | null
  oppRef: string
  oppTitle: string
  fieldChanged: string
  oldValue: string
  newValue: string
  source: string
  importance: string
  excelStatus: string
  emailStatus: string
  recipients: string
  recipientsSummary: string
  userNote: string
  readableSummary: string
  createdAt: Date
}

/** ChangeEvent DB row → app ChangeEvent. */
export function dbToChange(r: ChangeRow): ChangeEvent {
  let recipients: string[] = []
  try { recipients = r.recipients ? (JSON.parse(r.recipients) as string[]) : [] } catch { recipients = [] }
  return {
    id: r.id,
    userId: r.userId,
    userName: r.userName,
    userInitials: r.userInitials,
    actionType: r.actionType,
    oppId: r.oppId,
    oppRef: r.oppRef,
    oppTitle: r.oppTitle,
    fieldChanged: r.fieldChanged,
    oldValue: r.oldValue,
    newValue: r.newValue,
    source: r.source as ChangeSource,
    importance: r.importance as ChangeImportance,
    excelStatus: r.excelStatus as ExcelStatus,
    emailStatus: r.emailStatus as EmailStatus,
    recipients,
    recipientsSummary: r.recipientsSummary,
    userNote: r.userNote,
    readableSummary: r.readableSummary,
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
  }
}

/** App ChangeEvent → Prisma ChangeEvent create data. */
export function changeToDbData(c: ChangeEvent) {
  return {
    id: c.id,
    userId: c.userId,
    userName: c.userName,
    userInitials: c.userInitials,
    actionType: c.actionType,
    oppId: c.oppId,
    oppRef: c.oppRef,
    oppTitle: c.oppTitle,
    fieldChanged: c.fieldChanged,
    oldValue: c.oldValue,
    newValue: c.newValue,
    source: c.source,
    importance: c.importance,
    excelStatus: c.excelStatus,
    emailStatus: c.emailStatus,
    recipients: JSON.stringify(c.recipients ?? []),
    recipientsSummary: c.recipientsSummary,
    userNote: c.userNote,
    readableSummary: c.readableSummary,
    createdAt: new Date(c.createdAt),
  }
}

/** App CalendarItem fields → Prisma Reminder create/update data (only present keys). */
export function reminderToDbData(c: Partial<CalendarItem>) {
  const d: Record<string, unknown> = {}
  if (c.oppId !== undefined) d.oppId = c.oppId || null
  if (c.type  !== undefined) d.type = c.type
  if (c.title !== undefined) d.title = c.title
  if (c.date  !== undefined) d.date = strToDate(c.date)
  if (c.time  !== undefined) d.time = c.time
  if (c.notes !== undefined) d.notes = c.notes
  if (c.done  !== undefined) d.done = c.done
  return d
}
