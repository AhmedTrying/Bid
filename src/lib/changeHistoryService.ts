// BidFlow Tracker — Change History / audit-trail service (Feature 2)
//
// Pure logic (UI-agnostic): turns opportunity edits into readable ChangeEvents.
// The store calls diffOpp() on every updateOpp and records the results; the
// /change-history page and the opportunity detail timeline read them back.

import type {
  ChangeEvent, ChangeSource, Opportunity, TeamMember,
} from './types'
import { byId, byClient } from './data'
import { fmtDate, money } from './helpers'

// ── Field labels (opportunity field key → human label) ────────────────────────
export const FIELD_LABELS: Record<string, string> = {
  ref: 'Reference', rfpNumber: 'RFP number', title: 'Title', client: 'Client',
  portal: 'Portal', type: 'Type', cls: 'Classification', proc: 'Procurement method',
  status: 'Status', priority: 'Priority', owner: 'Owner', reviewer: 'Reviewer',
  partnerInvolved: 'Partner involved', partnerName: 'Partner',
  contractDuration: 'Contract duration', rfpReceived: 'RFP received date',
  siteVisit: 'Site visit date', siteVisitMode: 'Site visit',
  qDeadline: 'Question deadline', qDeadlineTime: 'Question deadline time',
  bidDue: 'Bid due date', bidDueTime: 'Bid due time', submission: 'Submission date',
  followUp: 'Follow-up date', followUpTwo: 'Second follow-up date',
  bondReq: 'Bond required', bondPct: 'Bid bond percentage',
  bondValidity: 'Bond expiry date', bondValidityDays: 'Bid bond validity',
  result: 'Result', value: 'Estimated value', notes: 'Notes',
  closedReasonCategory: 'Closed/Lost reason', closedReasonNotes: 'Closed/Lost reason notes',
  checklist: 'Document checklist', archivedAt: 'Archived',
}

// Fields whose change is always "major" (triggers the notification modal in Phase 3).
export const MAJOR_FIELDS = new Set<string>([
  'bidDue', 'qDeadline', 'result', 'closedReasonCategory',
  'bondPct', 'bondValidity', 'bondValidityDays',
])

// Statuses whose arrival is treated as a major change.
const MAJOR_STATUSES = new Set([
  'Submitted', 'Awarded', 'Closed Lost', 'Cancelled', 'No-Go', 'Postponed',
])

// Date-valued fields (formatted as dates in summaries).
const DATE_FIELDS = new Set([
  'rfpReceived', 'siteVisit', 'qDeadline', 'bidDue', 'submission',
  'followUp', 'followUpTwo', 'bondValidity', 'closedAt', 'archivedAt',
])
const PERSON_FIELDS = new Set(['owner', 'reviewer', 'closedBy'])

// ── Importance + action-type classification ───────────────────────────────────
export function isMajorChange(field: string, newValue: unknown): boolean {
  if (MAJOR_FIELDS.has(field)) return true
  if (field === 'status' && MAJOR_STATUSES.has(String(newValue))) return true
  if (field === 'owner' && !newValue) return true // owner unassigned
  return false
}

export function actionTypeFor(field: string): string {
  switch (field) {
    case 'status':               return 'status_changed'
    case 'owner':                return 'owner_changed'
    case 'reviewer':             return 'reviewer_changed'
    case 'priority':             return 'priority_changed'
    case 'bidDue':               return 'due_date_changed'
    case 'qDeadline':            return 'question_deadline_changed'
    case 'siteVisit':            return 'site_visit_changed'
    case 'followUp':
    case 'followUpTwo':          return 'follow_up_changed'
    case 'submission':           return 'submission_changed'
    case 'bondPct':              return 'bond_pct_changed'
    case 'bondValidity':
    case 'bondValidityDays':     return 'bond_validity_changed'
    case 'result':               return 'result_changed'
    case 'closedReasonCategory': return 'closed_reason_changed'
    case 'closedReasonNotes':    return 'closed_reason_changed'
    case 'notes':                return 'notes_updated'
    default:                     return 'field_edited'
  }
}

// ── Value formatting (raw field value → display string) ───────────────────────
export function formatValue(field: string, raw: unknown): string {
  if (raw === null || raw === undefined || raw === '') return '—'
  if (DATE_FIELDS.has(field)) return fmtDate(String(raw), { year: true })
  if (PERSON_FIELDS.has(field)) return byId(String(raw))?.name ?? String(raw)
  if (field === 'client') return byClient(String(raw))?.name ?? String(raw)
  if (field === 'value') return money(Number(raw))
  if (field === 'bondPct') return `${raw}%`
  if (field === 'bondValidityDays') return `${raw} days`
  if (field === 'partnerInvolved' || field === 'bondReq') return raw ? 'Yes' : 'No'
  if (field === 'checklist') return 'updated'
  return String(raw)
}

// ── Readable summaries ────────────────────────────────────────────────────────
function fieldSummary(userName: string, label: string, oldDisp: string, newDisp: string, oppRef: string): string {
  if (oldDisp === '—' && newDisp !== '—') return `${userName} set ${label} to ${newDisp} for ${oppRef}.`
  if (newDisp === '—' && oldDisp !== '—') return `${userName} cleared ${label} for ${oppRef}.`
  return `${userName} changed ${label} from ${oldDisp} to ${newDisp} for ${oppRef}.`
}

// ── Event builder ─────────────────────────────────────────────────────────────
let _cseq = 0
const cuid = () => `ce${Date.now().toString(36)}${(_cseq++).toString(36)}`

export interface RecordCtx {
  user: Pick<TeamMember, 'id' | 'name' | 'init'>
  source?: ChangeSource
}

function baseEvent(ctx: RecordCtx, opp: Pick<Opportunity, 'id' | 'ref' | 'title'> | null): ChangeEvent {
  return {
    id: cuid(),
    userId: ctx.user.id,
    userName: ctx.user.name,
    userInitials: ctx.user.init,
    actionType: 'field_edited',
    oppId: opp?.id ?? null,
    oppRef: opp?.ref ?? '',
    oppTitle: opp?.title ?? '',
    fieldChanged: '',
    oldValue: '',
    newValue: '',
    source: ctx.source ?? 'dashboard',
    importance: 'normal',
    excelStatus: '',
    emailStatus: '',
    recipients: [],
    recipientsSummary: '',
    userNote: '',
    readableSummary: '',
    createdAt: new Date().toISOString(),
  }
}

/** One ChangeEvent per changed field between `prev` and `patch`. */
export function diffOpp(prev: Opportunity, patch: Partial<Opportunity>, ctx: RecordCtx): ChangeEvent[] {
  const events: ChangeEvent[] = []
  for (const key of Object.keys(patch) as (keyof Opportunity)[]) {
    if (key === 'updated' || key === 'activity' || key === 'followUps' || key === 'documents') continue
    if (!(key in FIELD_LABELS)) continue
    const oldRaw = prev[key]
    const newRaw = patch[key]
    if (String(oldRaw ?? '') === String(newRaw ?? '')) continue
    const label = FIELD_LABELS[key]
    const oldDisp = formatValue(key, oldRaw)
    const newDisp = formatValue(key, newRaw)
    const ev = baseEvent(ctx, prev)
    ev.actionType = actionTypeFor(key)
    ev.fieldChanged = label
    ev.oldValue = oldDisp
    ev.newValue = newDisp
    ev.importance = isMajorChange(key, newRaw) ? 'major' : 'normal'
    ev.readableSummary = fieldSummary(ctx.user.name, label, oldDisp, newDisp, prev.ref)
    events.push(ev)
  }
  return events
}

/** A "created opportunity" event. */
export function recordCreated(opp: Opportunity, ctx: RecordCtx): ChangeEvent {
  const ev = baseEvent(ctx, opp)
  ev.actionType = 'created'
  ev.importance = 'normal'
  ev.excelStatus = 'pending'
  ev.readableSummary = `${ctx.user.name} created opportunity ${opp.ref} — ${opp.title}.`
  return ev
}

/** A "deleted opportunity" event. */
export function recordDeleted(opp: Pick<Opportunity, 'id' | 'ref' | 'title'>, ctx: RecordCtx): ChangeEvent {
  const ev = baseEvent(ctx, opp)
  ev.actionType = 'deleted'
  ev.importance = 'major'
  ev.readableSummary = `${ctx.user.name} deleted opportunity ${opp.ref}.`
  return ev
}

/** A free-form system/excel/email event (used by later phases). */
export function recordSystem(
  ctx: RecordCtx,
  partial: Partial<ChangeEvent> & { actionType: string; readableSummary: string },
): ChangeEvent {
  return { ...baseEvent(ctx, null), ...partial }
}
