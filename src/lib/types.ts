// BidFlow Tracker — Core TypeScript types

export type Theme = 'light' | 'dark'
export type Accent = 'amber' | 'teal' | 'blue' | 'violet'
export type Density = 'airy' | 'balanced' | 'compact'
export type CardStyle = 'soft' | 'accent' | 'minimal'

export type OppType = 'Bid' | 'PQQ' | 'RFQ' | 'EOI' | 'NDA' | 'Tender'
export type Priority = 'Low' | 'Medium' | 'High' | 'Critical'
export type Result = '' | 'Awarded' | 'Lost' | 'Cancelled'

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

export interface Document {
  name: string
  type: 'folder' | 'sheet' | 'pdf' | 'file'
  meta: string
  url?: string
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
  rfpReceived: string
  siteVisit: string
  qDeadline: string
  bidDue: string
  submission: string
  followUp: string
  bondPct: number
  bondValidity: string
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
