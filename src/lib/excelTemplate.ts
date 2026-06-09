// BidFlow Tracker — Excel template mapping (Feature 1)
//
// Pure, shared logic (no exceljs, no server-only imports): the sheet names, the
// header→field map, sheet-routing rules, and value normalization used by both the
// server export/import services and the client Excel Sync page. Easy to adjust.

import type { Opportunity, Client, StatusKey, OppType } from './types'
import { STATUS, byId, TEAM } from './data'

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
  'TYPE': 'type',
  'NOTES': 'notes',
  'RESULT': 'result',
  'CLOSED LOST NOTES': 'closedReasonNotes', 'CLOSED REASON NOTES': 'closedReasonNotes',
  'ESTIMATED VALUE SAR': 'value',
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

export function matchMemberId(name: string): string | null {
  const n = normalizeHeader(name)
  if (!n) return null
  const exact = TEAM.find(t => normalizeHeader(t.name) === n)
  if (exact) return exact.id
  const partial = TEAM.find(t => normalizeHeader(t.name).includes(n))
  return partial?.id ?? null
}

// ── CSV (Feature 1, stable plain-text alternative to .xlsx) ───────────────────
// A single flat sheet with one row per opportunity. Headers reuse HEADER_FIELD_MAP
// (via normalizeHeader) so the same importer handles CSV and Excel.
export const CSV_COLUMNS: { header: string; field: keyof Opportunity }[] = [
  { header: 'SATCO Reference', field: 'ref' },
  { header: 'Proposal Title', field: 'title' },
  { header: 'Client', field: 'client' },
  { header: 'Portal', field: 'portal' },
  { header: 'Type', field: 'type' },
  { header: 'Classification', field: 'cls' },
  { header: 'Procurement Method', field: 'proc' },
  { header: 'Status', field: 'status' },
  { header: 'Priority', field: 'priority' },
  { header: 'Owner', field: 'owner' },
  { header: 'Reviewer', field: 'reviewer' },
  { header: 'RFP No.', field: 'rfpNumber' },
  { header: 'Partner', field: 'partnerName' },
  { header: 'Contract Duration', field: 'contractDuration' },
  { header: 'RFP Received Date', field: 'rfpReceived' },
  { header: 'Site Visit Date', field: 'siteVisit' },
  { header: 'Question Deadline', field: 'qDeadline' },
  { header: 'Bid Due Date', field: 'bidDue' },
  { header: 'Submittal Time', field: 'bidDueTime' },
  { header: 'Submission Date', field: 'submission' },
  { header: 'Follow-up Date', field: 'followUp' },
  { header: 'Bid Bond Percentage', field: 'bondPct' },
  { header: 'Bid Bond Validity', field: 'bondValidityDays' },
  { header: 'Result', field: 'result' },
  { header: 'Estimated Value (SAR)', field: 'value' },
  { header: 'Closed/Lost Reason', field: 'closedReasonCategory' },
  { header: 'Closed/Lost Notes', field: 'closedReasonNotes' },
  { header: 'Notes', field: 'notes' },
]

export function rowsToCSV(rows: (string | number)[][]): string {
  return rows.map(r => r.map(cell => {
    const s = String(cell ?? '')
    return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
  }).join(',')).join('\r\n')
}

export function parseCSV(text: string): string[][] {
  const s = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (inQuotes) {
      if (c === '"') {
        if (s[i + 1] === '"') { field += '"'; i++ } else inQuotes = false
      } else field += c
    } else if (c === '"') inQuotes = true
    else if (c === ',') { row.push(field); field = '' }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = '' }
    else field += c
  }
  if (field.length || row.length) { row.push(field); rows.push(row) }
  return rows.filter(r => r.some(c => c.trim() !== ''))
}

// Build raw rows from CSV text, mapping headers to fields (client-side import).
export function csvToRawRows(text: string): { rows: RawRow[]; errors: { sheet: string; row: number; message: string }[] } {
  const matrix = parseCSV(text)
  const errors: { sheet: string; row: number; message: string }[] = []
  if (matrix.length < 2) return { rows: [], errors }
  const fields = matrix[0].map(h => HEADER_FIELD_MAP[normalizeHeader(h)] ?? null)
  const rows: RawRow[] = []
  for (let r = 1; r < matrix.length; r++) {
    const cells = matrix[r]
    const raw: RawRow = {}
    fields.forEach((f, ci) => { if (f) raw[f] = (cells[ci] ?? '').trim() })
    if (!raw.ref && !raw.title) continue
    if (!raw.title || !String(raw.title).trim()) {
      errors.push({ sheet: 'CSV', row: r + 1, message: `Row ${r + 1}: missing proposal title` })
    }
    rows.push(raw)
  }
  return { rows, errors }
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

  for (const field of ['cls', 'portal', 'proc', 'title', 'type', 'rfpNumber', 'contractDuration',
    'partnerName', 'notes', 'priority', 'result', 'bidDueTime',
    'closedReasonCategory', 'closedReasonNotes'] as (keyof Opportunity)[]) {
    if (field === 'title') continue
    const v = raw[field]
    if (v != null && String(v).trim()) (patch as Record<string, unknown>)[field] = String(v).trim()
  }

  // Owner / reviewer come in as names → match to a team member id.
  for (const field of ['owner', 'reviewer'] as (keyof Opportunity)[]) {
    const v = raw[field]
    if (v != null && String(v).trim()) {
      const mid = matchMemberId(String(v))
      if (mid) (patch as Record<string, unknown>)[field] = mid
      else warnings.push(`Unknown ${field} "${String(v).trim()}"`)
    }
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
