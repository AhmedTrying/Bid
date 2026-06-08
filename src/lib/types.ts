// BidFlow Tracker — Core TypeScript types

export type Theme = 'light' | 'dark'
export type Accent = 'amber' | 'teal' | 'blue' | 'violet'
export type Density = 'airy' | 'balanced' | 'compact'
export type CardStyle = 'soft' | 'accent' | 'minimal'

export type OppType = 'Bid' | 'PQQ' | 'RFQ' | 'EOI' | 'NDA' | 'Tender'
export type Priority = 'Low' | 'Medium' | 'High' | 'Critical'
export type Result = '' | 'Awarded' | 'Lost' | 'Cancelled'
export type SiteVisitMode = 'date' | 'tbc' | 'not_required'

export type StatusKey =
  | 'New Lead' | 'To Qualify'
  | 'Live PQQ' | 'Live RFQ'
  | 'Live Bid' | 'Bid in Progress'
  | 'Submitted' | 'Negotiation'
  | 'Awarded' | 'Closed Lost' | 'Cancelled' | 'Postponed' | 'No-Go'

export type Stage =
  | 'New Lead' | 'To Qualify' | 'Live PQQ/RFQ'
  | 'Live Bid' | 'Submitted' | 'Negotiation'
  | 'Awarded' | 'Closed / Lost' | 'Postponed'

export interface StatusMeta {
  hue: number
  stage: Stage
}

export interface PriorityMeta {
  hue: number
  rank: number
}

export interface TeamMember {
  id: string
  name: string
  role: string
  init: string
  hue: number
}

export interface Client {
  id: string
  name: string
  portal: string
  contact: string
  sector: string
  wins: number
  losses: number
}

// Editable dropdown list option (portals, classifications, partners, …).
export interface ListOption {
  id: string
  category: string
  label: string
  order: number
}

export interface Document {
  id: string
  label: string        // category, e.g. 'RFP Documents' | 'BOQ' | 'Other'
  name: string         // display title
  url: string          // the actual link
  type?: 'folder' | 'sheet' | 'pdf' | 'file'  // presentation icon hint (legacy/demo)
  meta?: string                                // presentation subtitle (legacy/demo)
}

export type ReminderType =
  | 'bid_due' | 'question_deadline' | 'site_visit'
  | 'internal_review' | 'commercial_review' | 'bond_expiry'
  | 'follow_up' | 'custom'

// Real calendar reminder, optionally linked to an opportunity.
export interface CalendarItem {
  id: string
  oppId: string | null
  type: ReminderType
  title: string
  date: string   // 'YYYY-MM-DD'
  time: string   // 'HH:mm'
  notes: string
  done: boolean
}

export interface FollowUp {
  n: number
  date: string
  label: string
  done: boolean
}

export interface ActivityEntry {
  who: string
  verb: string
  when: string
}

export interface Opportunity {
  id: string
  ref: string
  rfpNumber: string
  title: string
  client: string       // client id
  portal: string
  type: OppType
  cls: string
  proc: string
  status: StatusKey
  priority: Priority
  owner: string        // team member id
  reviewer: string
  partnerInvolved: boolean
  partnerName: string
  contractDuration: string
  rfpReceived: string
  siteVisit: string
  siteVisitMode: SiteVisitMode
  qDeadline: string
  qDeadlineTime: string   // 'HH:mm'
  bidDue: string
  bidDueTime: string      // 'HH:mm'
  submission: string
  followUp: string
  bondPct: number
  bondValidity: string
  bondValidityDays: number | null
  bondReq: boolean
  result: Result
  value: number
  updated: string
  notes: string
  checklist: Record<string, boolean> | null
  followUps: FollowUp[]
  documents: Document[]
  activity: ActivityEntry[]
}

export interface Reminder {
  id: string
  kind: 'due' | 'overdue' | 'q' | 'site' | 'follow' | 'bond'
  title: string
  msg: string
  tone: 'danger' | 'warn' | 'soft'
  date: string
}

export interface ToneStyle {
  bg: string
  fg: string
  bd: string
  solid: string
}

export interface NavCount {
  livebids: number
  pqq: number
  submitted: number
  awarded: number
  closed: number
}
