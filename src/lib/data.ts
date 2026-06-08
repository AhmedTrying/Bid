// BidFlow Tracker — Seed data (ported from app/data.js)
// "Today" anchor = 2026-06-04 for deadline math stability

import type {
  StatusKey, Stage, StatusMeta, PriorityMeta,
  TeamMember, Client, Opportunity, ListOption, ReminderType,
} from './types'

export const TODAY = '2026-06-04'

export const STATUS: Record<StatusKey, StatusMeta> = {
  'New Lead':        { hue: 250, stage: 'New Lead' },
  'To Qualify':      { hue: 290, stage: 'To Qualify' },
  'Live PQQ':        { hue: 230, stage: 'Live PQQ/RFQ' },
  'Live RFQ':        { hue: 205, stage: 'Live PQQ/RFQ' },
  'Live Bid':        { hue: 46,  stage: 'Live Bid' },
  'Bid in Progress': { hue: 60,  stage: 'Live Bid' },
  'Submitted':       { hue: 175, stage: 'Submitted' },
  'Negotiation':     { hue: 300, stage: 'Negotiation' },
  'Awarded':         { hue: 152, stage: 'Awarded' },
  'Closed Lost':     { hue: 25,  stage: 'Closed / Lost' },
  'Cancelled':       { hue: 20,  stage: 'Closed / Lost' },
  'Postponed':       { hue: 80,  stage: 'Postponed' },
  'No-Go':           { hue: 12,  stage: 'Closed / Lost' },
}

export const STAGES: Stage[] = [
  'New Lead', 'To Qualify', 'Live PQQ/RFQ', 'Live Bid',
  'Submitted', 'Negotiation', 'Awarded', 'Closed / Lost', 'Postponed',
]

export const PRIORITY: Record<string, PriorityMeta> = {
  Low:      { hue: 230, rank: 1 },
  Medium:   { hue: 205, rank: 2 },
  High:     { hue: 60,  rank: 3 },
  Critical: { hue: 25,  rank: 4 },
}

export const TEAM: TeamMember[] = [
  { id: 'lh', name: 'Layla Haddad',  role: 'BD Manager',          init: 'LH', hue: 8 },
  { id: 'ok', name: 'Omar Khalil',   role: 'Proposal Manager',    init: 'OK', hue: 250 },
  { id: 'sn', name: 'Sara Nasser',   role: 'Tender Coordinator',  init: 'SN', hue: 175 },
  { id: 'dr', name: 'Daniel Roa',    role: 'Document Controller', init: 'DR', hue: 300 },
  { id: 'pm', name: 'Priya Menon',   role: 'Estimation Lead',     init: 'PM', hue: 152 },
  { id: 'ka', name: 'Khalid Aziz',   role: 'Commercial',          init: 'KA', hue: 46 },
  { id: 'ep', name: 'Elena Petrova', role: 'Director / Reviewer', init: 'EP', hue: 205 },
]

export const CLIENTS: Client[] = [
  { id: 'rta',  name: 'Roads & Transport Authority',  portal: 'In-Tend',     contact: 'M. Al Suwaidi',   sector: 'Transport',     wins: 4, losses: 3 },
  { id: 'neom', name: 'NEOM Infrastructure',          portal: 'Ariba (SAP)', contact: 'Procurement Desk',sector: 'Giga-project',  wins: 2, losses: 1 },
  { id: 'moh',  name: 'Ministry of Housing',          portal: 'Etimad',      contact: 'A. Qahtani',      sector: 'Buildings',     wins: 1, losses: 4 },
  { id: 'aldar',name: 'Aldar Properties',             portal: 'In-Tend',     contact: 'R. Fernandes',    sector: 'Real estate',   wins: 3, losses: 2 },
  { id: 'rail', name: 'Etihad Rail',                  portal: 'Tejari',      contact: 'Tender Office',   sector: 'Rail',          wins: 1, losses: 1 },
  { id: 'sec',  name: 'Saudi Electricity Company',    portal: 'Etimad',      contact: 'F. Otaibi',       sector: 'Utilities',     wins: 2, losses: 2 },
  { id: 'rsg',  name: 'Red Sea Global',               portal: 'Ariba (SAP)', contact: 'Supply Chain',    sector: 'Tourism dev',   wins: 1, losses: 0 },
  { id: 'dm',   name: 'Dubai Municipality',           portal: 'Local Portal',contact: 'Contracts Dept',  sector: 'Government',    wins: 2, losses: 3 },
  { id: 'qe',   name: 'Qatar Energy',                 portal: 'Ariba (SAP)', contact: 'Sourcing',        sector: 'Energy',        wins: 0, losses: 2 },
  { id: 'kaec', name: 'King Abdullah Economic City',  portal: 'Email / Direct',contact: 'PMO',           sector: 'Economic city', wins: 1, losses: 1 },
]

export const CLASSES = [
  'Civil Works', 'MEP', 'Infrastructure', 'Roads & Bridges',
  'Buildings', 'Water & Utilities', 'Marine Works', 'Fit-out',
]

export const PROCUREMENT = [
  'Open Tender', 'Selective', 'Negotiated', 'Framework', 'Two-Stage',
]

export const PORTALS = [
  'In-Tend', 'Etimad', 'Ariba (SAP)', 'Tejari', 'Local Portal', 'Email / Direct',
]

export const DOC_TEMPLATE = [
  'Company Profile', 'Trade Licenses', 'Financial Statements', 'Project References',
  'HSE Documents', 'QA/QC Documents', 'Key CVs', 'ISO Certificates',
]

// Document-link category labels (Documents & Links section).
export const DOC_LABELS = [
  'RFP Documents', 'Technical Proposal', 'Financial Proposal',
  'BOQ', 'Clarifications', 'Submitted Package', 'Other',
]

export const PARTNERS = [
  'JV Partner', 'Specialist Subcontractor', 'Technology Provider',
]

export const SITE_VISIT_PRESETS = ['Date', 'TBC', 'Not Required']

export const BOND_VALIDITY_PRESETS = ['90 days', '120 days', '180 days', '1 year']

export const OPP_TYPES = ['Bid', 'PQQ', 'RFQ', 'EOI', 'NDA', 'Tender']

// ── Editable option lists (seed source + demo-mode fallback) ──────────────────
// Category → labels. The live UI reads the editable copies from the Zustand
// store / DB; these seed both.
export const OPTION_SEED: Record<string, string[]> = {
  portal:        PORTALS,
  classification:CLASSES,
  procurement:   PROCUREMENT,
  partner:       PARTNERS,
  site_visit:    SITE_VISIT_PRESETS,
  bond_validity: BOND_VALIDITY_PRESETS,
  opp_type:      OPP_TYPES,
}

export function buildOptionSeed(): ListOption[] {
  const out: ListOption[] = []
  for (const [category, labels] of Object.entries(OPTION_SEED)) {
    labels.forEach((label, i) => out.push({ id: `${category}:${label}`, category, label, order: i }))
  }
  return out
}

export const OPTIONS: ListOption[] = buildOptionSeed()

// ── Calendar reminder types (label + colour hue) ──────────────────────────────
export const REMINDER_TYPES: { value: ReminderType; label: string; hue: number }[] = [
  { value: 'bid_due',           label: 'Bid due date',      hue: 46 },
  { value: 'question_deadline', label: 'Question deadline', hue: 60 },
  { value: 'site_visit',        label: 'Site visit',        hue: 175 },
  { value: 'internal_review',   label: 'Internal review',   hue: 250 },
  { value: 'commercial_review', label: 'Commercial review', hue: 300 },
  { value: 'bond_expiry',       label: 'Bid bond expiry',   hue: 80 },
  { value: 'follow_up',         label: 'Follow-up reminder',hue: 230 },
  { value: 'custom',            label: 'Custom reminder',   hue: 205 },
]

export const reminderMeta = (t: string) =>
  REMINDER_TYPES.find(r => r.value === t) ?? { value: 'custom' as ReminderType, label: 'Custom', hue: 205 }

// Raw opportunity data. New Excel-parity fields (rfpNumber, partner*, etc.) are
// filled with defaults by `withDefaults` so this table stays readable.
type RawOpp = Omit<Opportunity,
  | 'followUps' | 'documents' | 'activity'
  | 'rfpNumber' | 'partnerInvolved' | 'partnerName' | 'contractDuration'
  | 'siteVisitMode' | 'qDeadlineTime' | 'bidDueTime' | 'bondValidityDays'>

const RAW_OPPS: RawOpp[] = [
  { id:'o1',  ref:'SATCO-2026-0142', title:'Al Wasl Interchange — Civil & Structural Works',        client:'rta',  portal:'In-Tend',     type:'Bid', cls:'Roads & Bridges',  proc:'Open Tender',  status:'Live Bid',        priority:'Critical', owner:'lh', reviewer:'ep', rfpReceived:'2026-05-12', siteVisit:'2026-05-26', qDeadline:'2026-06-02', bidDue:'2026-06-06', submission:'', followUp:'', bondPct:2,   bondValidity:'2026-12-06', bondReq:true,  result:'', value:48500000, updated:'2026-06-03', notes:'Heavy civil package. Pricing for piling sub-contractor still pending from Priya. Client confirmed 90-day bond validity.', checklist:null },
  { id:'o2',  ref:'SATCO-2026-0138', title:'NEOM Spine — MEP Systems Package 4',                    client:'neom', portal:'Ariba (SAP)', type:'Bid', cls:'MEP',               proc:'Two-Stage',    status:'Bid in Progress', priority:'High',     owner:'ka', reviewer:'ep', rfpReceived:'2026-05-18', siteVisit:'2026-06-01', qDeadline:'2026-06-08', bidDue:'2026-06-15', submission:'', followUp:'', bondPct:1.5, bondValidity:'2026-11-15', bondReq:true,  result:'', value:72000000, updated:'2026-06-02', notes:'Stage 1 technical accepted. Awaiting BOQ rev C before commercial build-up.', checklist:null },
  { id:'o3',  ref:'SATCO-2026-0151', title:'Etihad Rail Stage 2 — Drainage & Earthworks',           client:'rail', portal:'Tejari',      type:'Bid', cls:'Infrastructure',   proc:'Selective',    status:'Live Bid',        priority:'High',     owner:'pm', reviewer:'lh', rfpReceived:'2026-05-20', siteVisit:'2026-05-29', qDeadline:'2026-06-05', bidDue:'2026-06-09', submission:'', followUp:'', bondPct:2,   bondValidity:'2026-12-09', bondReq:true,  result:'', value:31200000, updated:'2026-06-03', notes:'Question deadline tomorrow. Two RFIs raised on geotech baseline.', checklist:null },
  { id:'o4',  ref:'SATCO-2026-0129', title:'Aldar Yas Bay — Tower Fit-out Lots 2–3',                client:'aldar',portal:'In-Tend',     type:'Bid', cls:'Fit-out',           proc:'Open Tender',  status:'Live Bid',        priority:'Medium',   owner:'ok', reviewer:'ep', rfpReceived:'2026-05-08', siteVisit:'2026-05-19', qDeadline:'2026-05-27', bidDue:'2026-06-11', submission:'', followUp:'', bondPct:1,   bondValidity:'2026-10-11', bondReq:true,  result:'', value:14800000, updated:'2026-06-01', notes:'Joinery long-lead items flagged. Awaiting vendor quote.', checklist:null },
  { id:'o5',  ref:'SATCO-2026-0156', title:'SEC 380kV Substation — Balance of Plant',               client:'sec',  portal:'Etimad',      type:'PQQ', cls:'Water & Utilities', proc:'Open Tender',  status:'Live PQQ',        priority:'High',     owner:'sn', reviewer:'lh', rfpReceived:'2026-05-25', siteVisit:'',           qDeadline:'2026-06-07', bidDue:'2026-06-12', submission:'', followUp:'', bondPct:0,   bondValidity:'',           bondReq:false, result:'', value:0,        updated:'2026-06-03', notes:'Prequalification only. Financials and ISO certs being compiled.', checklist:{ 'Company Profile':true,'Trade Licenses':true,'Financial Statements':false,'Project References':true,'HSE Documents':true,'QA/QC Documents':false,'Key CVs':false,'ISO Certificates':false } },
  { id:'o6',  ref:'SATCO-2026-0149', title:'Red Sea Coastal Village — Marine Jetty Works',          client:'rsg',  portal:'Ariba (SAP)', type:'RFQ', cls:'Marine Works',      proc:'Selective',    status:'Live RFQ',        priority:'Medium',   owner:'pm', reviewer:'ep', rfpReceived:'2026-05-22', siteVisit:'2026-06-09', qDeadline:'2026-06-10', bidDue:'2026-06-18', submission:'', followUp:'', bondPct:2,   bondValidity:'2026-12-18', bondReq:true,  result:'', value:26400000, updated:'2026-05-31', notes:'Marine spread availability to confirm with operations.', checklist:null },
  { id:'o7',  ref:'SATCO-2026-0118', title:'Ministry of Housing — Affordable Housing Phase 5',      client:'moh',  portal:'Etimad',      type:'Bid', cls:'Buildings',         proc:'Open Tender',  status:'Submitted',       priority:'High',     owner:'lh', reviewer:'ep', rfpReceived:'2026-04-10', siteVisit:'2026-04-22', qDeadline:'2026-04-30', bidDue:'2026-05-20', submission:'2026-05-19', followUp:'2026-06-09', bondPct:1.5, bondValidity:'2026-11-19', bondReq:true,  result:'', value:58900000, updated:'2026-05-28', notes:'Submitted ahead of deadline. Awaiting technical opening notice.', checklist:null },
  { id:'o8',  ref:'SATCO-2026-0112', title:'Dubai Municipality — Stormwater Network Upgrade',       client:'dm',   portal:'Local Portal',type:'Bid', cls:'Water & Utilities', proc:'Open Tender',  status:'Submitted',       priority:'Medium',   owner:'ka', reviewer:'lh', rfpReceived:'2026-04-02', siteVisit:'2026-04-15', qDeadline:'2026-04-24', bidDue:'2026-05-12', submission:'2026-05-11', followUp:'2026-06-05', bondPct:2,   bondValidity:'2026-11-12', bondReq:true,  result:'', value:22700000, updated:'2026-05-30', notes:'Commercial clarification received — re-pricing 2 line items.', checklist:null },
  { id:'o9',  ref:'SATCO-2026-0101', title:'KAEC Industrial Valley — Roads & Utilities Pkg 1',      client:'kaec', portal:'Email / Direct',type:'Bid',cls:'Infrastructure',  proc:'Negotiated',   status:'Negotiation',     priority:'High',     owner:'lh', reviewer:'ep', rfpReceived:'2026-03-05', siteVisit:'2026-03-18', qDeadline:'2026-03-28', bidDue:'2026-04-20', submission:'2026-04-18', followUp:'2026-06-08', bondPct:2,   bondValidity:'2026-10-20', bondReq:true,  result:'', value:41300000, updated:'2026-06-02', notes:'Shortlisted. BAFO requested — final negotiation meeting 12 Jun.', checklist:null },
  { id:'o10', ref:'SATCO-2026-0094', title:'Qatar Energy — Pipeline Corridor Civil Works',           client:'qe',   portal:'Ariba (SAP)', type:'Bid', cls:'Civil Works',       proc:'Selective',    status:'Negotiation',     priority:'Critical', owner:'ka', reviewer:'ep', rfpReceived:'2026-02-20', siteVisit:'2026-03-04', qDeadline:'2026-03-12', bidDue:'2026-04-02', submission:'2026-04-01', followUp:'2026-06-06', bondPct:2.5, bondValidity:'2026-10-02', bondReq:true,  result:'', value:88600000, updated:'2026-06-01', notes:'Technical clarification closed. Commercial alignment ongoing — bond validity extension may be required.', checklist:null },
  { id:'o11', ref:'SATCO-2026-0071', title:'RTA Blue Line Depot — Buildings & Workshops',           client:'rta',  portal:'In-Tend',     type:'Bid', cls:'Buildings',         proc:'Open Tender',  status:'Awarded',         priority:'High',     owner:'lh', reviewer:'ep', rfpReceived:'2025-12-10', siteVisit:'2025-12-22', qDeadline:'2026-01-08', bidDue:'2026-02-02', submission:'2026-01-31', followUp:'',           bondPct:2,   bondValidity:'2026-08-02', bondReq:true,  result:'Awarded', value:64200000, updated:'2026-05-20', notes:'Letter of Award received. Handover to operations in progress, kickoff 18 Jun.', checklist:null },
  { id:'o12', ref:'SATCO-2026-0066', title:'Aldar Saadiyat — District Cooling Network',             client:'aldar',portal:'In-Tend',     type:'Bid', cls:'MEP',               proc:'Selective',    status:'Awarded',         priority:'Medium',   owner:'ka', reviewer:'ep', rfpReceived:'2025-11-18', siteVisit:'2025-12-01', qDeadline:'2025-12-12', bidDue:'2026-01-15', submission:'2026-01-13', followUp:'',           bondPct:1.5, bondValidity:'2026-07-15', bondReq:true,  result:'Awarded', value:37800000, updated:'2026-04-28', notes:'Contract signed. Mobilisation underway.', checklist:null },
  { id:'o13', ref:'SATCO-2026-0058', title:'SEC Western Region — Overhead Lines Refurb',            client:'sec',  portal:'Etimad',      type:'Bid', cls:'Water & Utilities', proc:'Open Tender',  status:'Closed Lost',     priority:'Medium',   owner:'sn', reviewer:'lh', rfpReceived:'2025-11-02', siteVisit:'2025-11-14', qDeadline:'2025-11-24', bidDue:'2025-12-18', submission:'2025-12-16', followUp:'',           bondPct:2,   bondValidity:'',           bondReq:true,  result:'Lost',    value:19200000, updated:'2026-02-10', notes:'Lost on price — 7% above L1. Competitor: regional incumbent.', checklist:null },
  { id:'o14', ref:'SATCO-2026-0052', title:'Dubai Municipality — Park Landscaping Bundle',          client:'dm',   portal:'Local Portal',type:'Bid', cls:'Civil Works',       proc:'Open Tender',  status:'Closed Lost',     priority:'Low',      owner:'ok', reviewer:'lh', rfpReceived:'2025-10-20', siteVisit:'',           qDeadline:'2025-11-03', bidDue:'2025-11-28', submission:'2025-11-26', followUp:'',           bondPct:1,   bondValidity:'',           bondReq:false, result:'Lost',    value:6400000,  updated:'2026-01-15', notes:'Technical non-compliance on irrigation spec. Lessons logged.', checklist:null },
  { id:'o15', ref:'SATCO-2026-0160', title:'NEOM The Line — Logistics Yard Enabling Works',         client:'neom', portal:'Ariba (SAP)', type:'EOI', cls:'Infrastructure',   proc:'Selective',    status:'To Qualify',      priority:'Medium',   owner:'lh', reviewer:'',   rfpReceived:'2026-06-01', siteVisit:'',           qDeadline:'',           bidDue:'2026-06-20', submission:'', followUp:'', bondPct:0,   bondValidity:'',           bondReq:false, result:'', value:0,        updated:'2026-06-03', notes:'EOI under review. Go/No-Go gate scheduled this week.', checklist:null },
  { id:'o16', ref:'SATCO-2026-0162', title:'RTA Smart Parking — Civil & Ducting',                   client:'rta',  portal:'In-Tend',     type:'RFQ', cls:'Roads & Bridges',  proc:'Open Tender',  status:'New Lead',        priority:'Low',      owner:'',   reviewer:'',   rfpReceived:'2026-06-03', siteVisit:'',           qDeadline:'',           bidDue:'2026-06-24', submission:'', followUp:'', bondPct:0,   bondValidity:'',           bondReq:false, result:'', value:0,        updated:'2026-06-03', notes:'New lead from portal alert. Needs owner assignment.', checklist:null },
  { id:'o17', ref:'SATCO-2026-0158', title:'KAEC Marina — Breakwater & Quay Wall',                  client:'kaec', portal:'Email / Direct',type:'NDA',cls:'Marine Works',     proc:'Negotiated',   status:'New Lead',        priority:'Medium',   owner:'lh', reviewer:'',   rfpReceived:'2026-06-02', siteVisit:'',           qDeadline:'',           bidDue:'',           submission:'', followUp:'', bondPct:0,   bondValidity:'',           bondReq:false, result:'', value:0,        updated:'2026-06-02', notes:'NDA signature pending before package release.', checklist:null },
  { id:'o18', ref:'SATCO-2026-0146', title:'Etihad Rail — Signalling Buildings MEP',                client:'rail', portal:'Tejari',      type:'PQQ', cls:'MEP',               proc:'Selective',    status:'Live PQQ',        priority:'Medium',   owner:'sn', reviewer:'ep', rfpReceived:'2026-05-21', siteVisit:'',           qDeadline:'2026-06-06', bidDue:'2026-06-13', submission:'', followUp:'', bondPct:0,   bondValidity:'',           bondReq:false, result:'', value:0,        updated:'2026-06-02', notes:'CVs and ISO certificates outstanding.', checklist:{ 'Company Profile':true,'Trade Licenses':true,'Financial Statements':true,'Project References':true,'HSE Documents':false,'QA/QC Documents':true,'Key CVs':false,'ISO Certificates':false } },
  { id:'o19', ref:'SATCO-2026-0133', title:'Red Sea Airport — Apron & Taxiway Civil',               client:'rsg',  portal:'Ariba (SAP)', type:'Bid', cls:'Infrastructure',   proc:'Two-Stage',    status:'Postponed',       priority:'Medium',   owner:'pm', reviewer:'lh', rfpReceived:'2026-04-28', siteVisit:'2026-05-10', qDeadline:'2026-05-18', bidDue:'2026-06-30', submission:'', followUp:'2026-06-25', bondPct:2,   bondValidity:'2026-12-30', bondReq:true,  result:'', value:53100000, updated:'2026-05-29', notes:'Client postponed submission by 4 weeks pending design freeze. Re-open reminder set.', checklist:null },
  { id:'o20', ref:'SATCO-2026-0089', title:'Qatar Energy — Tank Farm Firewater System',             client:'qe',   portal:'Ariba (SAP)', type:'Bid', cls:'MEP',               proc:'Selective',    status:'Submitted',       priority:'High',     owner:'ka', reviewer:'ep', rfpReceived:'2026-03-28', siteVisit:'2026-04-09', qDeadline:'2026-04-18', bidDue:'2026-05-15', submission:'2026-05-14', followUp:'2026-06-10', bondPct:2,   bondValidity:'2026-11-15', bondReq:true,  result:'', value:29900000, updated:'2026-05-26', notes:'Technical clarification round 1 answered. Awaiting commercial opening.', checklist:null },
  { id:'o21', ref:'SATCO-2026-0125', title:'Ministry of Housing — School Buildings Batch C',        client:'moh',  portal:'Etimad',      type:'Bid', cls:'Buildings',         proc:'Open Tender',  status:'Live Bid',        priority:'Medium',   owner:'ok', reviewer:'lh', rfpReceived:'2026-05-14', siteVisit:'2026-05-28', qDeadline:'2026-06-04', bidDue:'2026-06-13', submission:'', followUp:'', bondPct:1.5, bondValidity:'2026-11-13', bondReq:true,  result:'', value:33500000, updated:'2026-06-03', notes:'Question deadline is today. Awaiting structural addendum.', checklist:null },
  { id:'o22', ref:'SATCO-2026-0083', title:'Aldar Reem — Podium & Basement Structure',              client:'aldar',portal:'In-Tend',     type:'Bid', cls:'Civil Works',       proc:'Open Tender',  status:'Cancelled',       priority:'Low',      owner:'pm', reviewer:'lh', rfpReceived:'2026-02-15', siteVisit:'2026-02-26', qDeadline:'2026-03-06', bidDue:'2026-03-25', submission:'', followUp:'', bondPct:0,   bondValidity:'',           bondReq:false, result:'Cancelled', value:0,  updated:'2026-03-20', notes:'Tender cancelled by client — scope under redesign.', checklist:null },
]

// Follow-ups, documents and activity are presentation content derived from an
// opportunity's core fields. Kept as a shared function so the seed data and the
// database-read path (src/lib/db-map.ts) produce identical detail-page content.
export function synthExtras(o: Pick<Opportunity,
  'id' | 'status' | 'submission' | 'bidDue' | 'followUp' | 'bondReq' | 'owner' | 'rfpReceived'
>): Pick<Opportunity, 'followUps' | 'documents' | 'activity'> {
  const followUps: Opportunity['followUps'] = []
  if (['Submitted', 'Negotiation', 'Awarded'].includes(o.status)) {
    followUps.push({ n: 1, date: o.submission || o.bidDue, label: 'Submission confirmed', done: true })
    followUps.push({ n: 2, date: '2026-05-25', label: 'Acknowledgement received', done: true })
    if (o.status === 'Negotiation' || o.status === 'Awarded')
      followUps.push({ n: 3, date: '2026-06-02', label: o.status === 'Awarded' ? 'Letter of Award' : 'Clarification meeting', done: true })
    followUps.push({ n: 4, date: o.followUp || '', label: o.status === 'Awarded' ? 'Handover to operations' : 'Next follow-up due', done: o.status === 'Awarded' })
  }

  const documents: Opportunity['documents'] = [
    { id: `${o.id}-d1`, label: 'RFP Documents',      name: 'RFP / Tender Package', url: '', type: 'folder', meta: '12 files · SharePoint' },
    { id: `${o.id}-d2`, label: 'BOQ',                name: 'Drawings & BOQ',       url: '', type: 'sheet',  meta: 'updated 2 days ago' },
    { id: `${o.id}-d3`, label: 'Financial Proposal', name: 'Commercial Build-up',  url: '', type: 'sheet',  meta: o.bondReq ? 'draft' : '—' },
    { id: `${o.id}-d4`, label: 'Submitted Package',  name: 'Submission Pack',      url: '', type: 'pdf',    meta: o.submission ? 'final' : 'not started' },
  ]

  const activity: Opportunity['activity'] = [
    { who: 'sn', verb: 'updated the Bid Due date',          when: '2 days ago' },
    { who: o.owner || 'lh', verb: `changed status to ${o.status}`, when: '3 days ago' },
    { who: 'dr', verb: 'linked the tender package folder',  when: '5 days ago' },
    { who: 'lh', verb: 'created this opportunity',          when: o.rfpReceived },
  ]

  return { followUps, documents, activity }
}

// Fill the new Excel-parity fields with sensible defaults.
function withDefaults(o: RawOpp): Omit<Opportunity, 'followUps' | 'documents' | 'activity'> {
  return {
    rfpNumber: '',
    partnerInvolved: false,
    partnerName: '',
    contractDuration: '',
    siteVisitMode: 'date',
    qDeadlineTime: '',
    bidDueTime: '',
    bondValidityDays: null,
    ...o,
  }
}

function buildOpps(): Opportunity[] {
  return RAW_OPPS.map(o => {
    const full = withDefaults(o)
    return { ...full, ...synthExtras(full) }
  })
}

export const OPPS: Opportunity[] = buildOpps()
// Core scalar rows (with defaults, no synthesized extras) — used by the DB seed.
export const SEED_OPPS = RAW_OPPS.map(withDefaults)

export const byId = (id: string) => TEAM.find(t => t.id === id)

// Live client registry: defaults to the seed, but the Zustand store keeps it in
// sync (via setClientRegistry) so byClient() reflects added/edited/deleted
// clients without every page having to read the store directly.
let _clients: Client[] = CLIENTS
export const setClientRegistry = (clients: Client[]) => { _clients = clients }
export const byClient = (id: string) => _clients.find(c => c.id === id)
