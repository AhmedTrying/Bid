// BidFlow Tracker — Excel template mapping (Feature 1)
//
// Pure, shared logic (no exceljs, no server-only imports): the sheet names, the
// header→field map, sheet-routing rules, and value normalization used by both the
// server export/import services and the client Excel Sync page. Easy to adjust.

import type { Opportunity, Client, StatusKey, OppType } from './types'
import { STATUS, byId } from './data'

// The tracker sheets we read/write (must match the template tab names).
export const SHEET_NAMES = [
  'Live Bids', 'Live PQQ', 'Submitted Bid-Negotiation',
  'Closed Bids', 'Awarded Bids', 'Submitted PQQs and RFQs',
] as const

// Normalise a header label: upper-case, strip punctuation to single spaces.
export function normalizeHeader(s: string): string {
  return String(s ?? '').toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim()
}

// Normalised template header → Opportunity field key.
export const HEADER_FIELD_MAP: Record<string, keyof Opportunity> = {
  'SATCO REFERENCE': 'ref',
  'CLASSIFICATION': 'cls',
  'PORTAL': 'portal',
  'BID STATUS': 'status', 'STATUS': 'status',
  'PROCUREMENT METHOD': 'proc',
  'CLIENT': 'client',
  'PROPOSAL TITLE': 'title', 'TITLE': 'title',
  'RFP NO': 'rfpNumber', 'RFP NUMBER': 'rfpNumber',
  'CONTRACT DURATION MONTHS': 'contractDuration', 'CONTRACT DURATION': 'contractDuration',
  'PARTNER': 'partnerName',
  'LAST DATE SENDING QUESTION': 'qDeadline', 'QUESTION DEADLINE': 'qDeadline',
  'SITE VISIT DATE': 'siteVisit', 'SITE VISIT': 'siteVisit',
  'BID DUE DATE': 'bidDue', 'BID DUE': 'bidDue',
  'SUBMITTAL TIME': 'bidDueTime',
  'SUBMISSION DATE': 'submission', 'SUBMITTED': 'submission', 'SUBMISSION': 'submission',
  'BID BOND PERCENTAGE': 'bondPct', 'BID BOND PERCENT': 'bondPct', 'BOND PERCENTAGE': 'bondPct',
  'BID BOND VALIDITY': 'bondValidityDays', 'BOND VALIDITY': 'bondValidityDays',
  'DATE RECEIVED RFP': 'rfpReceived', 'RFP RECEIVED DATE': 'rfpReceived', 'DATE RECEIVED': 'rfpReceived',
  'FOLLOW UP DATE TWO': 'followUp', 'FOLLOW UP DATE': 'followUp', 'FOLLOW UP': 'followUp',
  'FOLLOW UP DATE THREE': 'followUpTwo',
  'OWNER': 'owner',
  'REVIEWER': 'reviewer',
  'PRIORITY': 'priority',
  'NOTES': 'notes',
  'RESULT': 'result',
  'ESTIMATED VALUE': 'value', 'EST VALUE': 'value', 'VALUE': 'value',
  'AWARD VALUE': 'value', 'CONTRACT VALUE': 'value',
  'REASON': 'closedReasonCategory', 'CLOSED REASON': 'closedReasonCategory',
  'LOST REASON': 'closedReasonCategory', 'REASON FOR LOSS': 'closedReasonCategory',
  'CLOSED LOST REASON': 'closedReasonCategory',
}

export const DATE_FIELDS = new Set<keyof Opportunity>([
  'rfpReceived', 'siteVisit', 'qDeadline', 'bidDue', 'submission', 'followUp', 'followUpTwo',
])
const NUMBER_FIELDS = new Set<keyof Opportunity>(['bondPct', 'value', 'bondValidityDays'])
const NAME_FIELDS = new Set<keyof Opportunity>(['owner', 'reviewer'])

// ── Sheet routing rules (easy to adjust) ──────────────────────────────────────
const PQQ_TYPES: OppType[] = ['PQQ', 'RFQ', 'EOI', 'NDA']

export function sheetForOpp(o: Pick<Opportunity, 'status' | 'type'>): typeof SHEET_NAMES[number] {
  const s = o.status
  if (s === 'Awarded') return 'Awarded Bids'
  if (s === 'Closed Lost' || s === 'Cancelled' || s === 'No-Go' || s === 'Postponed') return 'Closed Bids'
  if (s === 'Submitted' || s === 'Negotiation') {
    return PQQ_TYPES.includes(o.type) ? 'Submitted PQQs and RFQs' : 'Submitted Bid-Negotiation'
  }
  if (s === 'Live PQQ' || s === 'Live RFQ') return 'Live PQQ'
  // Live Bid / Bid in Progress / New Lead / To Qualify → working bids sheet
  return 'Live Bids'
}

// ── Export: Opportunity field → cell value ────────────────────────────────────
export function exportCellValue(
  field: keyof Opportunity,
  o: Opportunity,
  clientNameById: Record<string, string>,
): string | number | Date | null {
  if (field === 'client') return clientNameById[o.client] ?? o.client ?? ''
  if (NAME_FIELDS.has(field)) return byId(o[field] as string)?.name ?? ''
  if (DATE_FIELDS.has(field)) {
    const v = o[field] as string
    return v ? new Date(v + 'T00:00:00') : null
  }
  if (NUMBER_FIELDS.has(field)) {
    const n = o[field] as number | null
    return n != null && n !== 0 ? Number(n) : (field === 'value' || field === 'bondPct' ? null : (n ?? null))
  }
  const v = o[field]
  return v == null ? '' : String(v)
}

// ── Import: lenient parsers (status text, client name, dates) ─────────────────
const STATUS_BY_NORM: Record<string, StatusKey> = (() => {
  const m: Record<string, StatusKey> = {}
  for (const k of Object.keys(STATUS) as StatusKey[]) m[normalizeHeader(k)] = k
  // common template aliases
  Object.assign(m, {
    'CLOSED': 'Closed Lost', 'LOST': 'Closed Lost', 'CLOSED LOST': 'Closed Lost',
    'WON': 'Awarded', 'AWARD': 'Awarded',
    'BID IN PROGRESS': 'Bid in Progress', 'LIVE': 'Live Bid', 'IN PROGRESS': 'Bid in Progress',
    'NO GO': 'No-Go', 'CANCELED': 'Cancelled',
  } as Record<string, StatusKey>)
  return m
})()

export function parseStatus(text: string): StatusKey | null {
  return STATUS_BY_NORM[normalizeHeader(text)] ?? null
}

export function matchClientId(name: string, clients: Client[]): string | null {
  const n = normalizeHeader(name)
  if (!n) return null
  const exact = clients.find(c => normalizeHeader(c.name) === n)
  if (exact) return exact.id
  const partial = clients.find(c => normalizeHeader(c.name).includes(n) || n.includes(normalizeHeader(c.name)))
  return partial?.id ?? null
}

// A raw row parsed from the workbook (values as strings/numbers/dates).
export type RawRow = Partial<Record<keyof Opportunity, string | number | null>>

export interface NormalizedRow {
  ref: string
  patch: Partial<Opportunity>
  warnings: string[]
}

// Turn a raw imported row into an Opportunity patch + warnings (client-side: needs
// the live client list + statuses).
export function normalizeImportedRow(raw: RawRow, clients: Client[]): NormalizedRow {
  const warnings: string[] = []
  const patch: Partial<Opportunity> = {}
  const ref = String(raw.ref ?? '').trim()

  if (raw.title != null && String(raw.title).trim()) patch.title = String(raw.title).trim()
  else warnings.push('Missing proposal title')

  if (raw.client != null && String(raw.client).trim()) {
    const id = matchClientId(String(raw.client), clients)
    if (id) patch.client = id
    else warnings.push(`Unknown client "${String(raw.client).trim()}"`)
  }

  if (raw.status != null && String(raw.status).trim()) {
    const st = parseStatus(String(raw.status))
    if (st) patch.status = st
    else warnings.push(`Unrecognised status "${String(raw.status).trim()}"`)
  }

  for (const field of ['cls', 'portal', 'proc', 'title', 'rfpNumber', 'contractDuration',
    'partnerName', 'notes', 'priority', 'result', 'bidDueTime', 'closedReasonCategory'] as (keyof Opportunity)[]) {
    if (field === 'title') continue
    const v = raw[field]
    if (v != null && String(v).trim()) (patch as Record<string, unknown>)[field] = String(v).trim()
  }

  for (const field of DATE_FIELDS) {
    const v = raw[field]
    if (v != null && String(v).trim()) (patch as Record<string, unknown>)[field] = String(v).slice(0, 10)
  }
  for (const field of NUMBER_FIELDS) {
    const v = raw[field]
    if (v != null && String(v).trim() !== '') {
      const n = Number(String(v).replace(/[^0-9.\-]/g, ''))
      if (!isNaN(n)) (patch as Record<string, unknown>)[field] = n
    }
  }

  return { ref, patch, warnings }
}
