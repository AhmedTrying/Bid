'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  Opportunity, Theme, Accent, Density, CardStyle, StatusKey, Stage,
  Client, ListOption, CalendarItem, Document, TeamMember, ChangeEvent,
  NotificationRule, EmailStatus,
} from './types'
import {
  OPPS, STATUS, TODAY, CLIENTS, OPTIONS, TEAM, SEED_CHANGES,
  CLOSING_STATUSES, setClientRegistry,
} from './data'
import {
  diffOpp, recordCreated, recordDeleted, majorChangesIn, type MajorChange,
} from './changeHistoryService'
import { DEFAULT_NOTIFICATION_RULES, ruleMajorPredicate } from './notificationRulesService'
import { sendMajorChangeEmail } from './notificationService'

// Email metadata attached to the recorded major change(s).
interface EmailMeta { status: EmailStatus; recipients: string[]; recipientsSummary: string; note: string }
// Options the modal passes when confirming a major change.
interface ConfirmMajorOpts {
  sendEmail: boolean
  recipientIds: string[]
  recipientEmails: string[]
  recipientsSummary: string
  note: string
}

// Map stage → default status when dragging into it
const STAGE_STATUS: Record<Stage, StatusKey> = {
  'New Lead':      'New Lead',
  'To Qualify':    'To Qualify',
  'Live PQQ/RFQ':  'Live PQQ',
  'Live Bid':      'Live Bid',
  'Submitted':     'Submitted',
  'Negotiation':   'Negotiation',
  'Awarded':       'Awarded',
  'Closed / Lost': 'Closed Lost',
  'Postponed':     'Postponed',
}

interface AppState {
  // appearance
  theme: Theme
  accent: Accent
  density: Density
  cardStyle: CardStyle
  sidebarCollapsed: boolean
  // data
  opps: Opportunity[]
  clients: Client[]
  options: ListOption[]
  reminders: CalendarItem[]
  // current signed-in user (Phase 6 replaces the seeded default via /api/auth/me)
  currentUser: TeamMember
  // change history / audit trail (Feature 2)
  changes: ChangeEvent[]
  // a status change into a closing status, paused until a reason is captured (Fix 3)
  pendingClose: { id: string; patch: Partial<Opportunity> } | null
  // a major change, paused until the editor confirms notification (Feature 3)
  pendingMajor: { id: string; patch: Partial<Opportunity>; majors: MajorChange[] } | null
  // notification rules (Feature 3)
  notificationRules: NotificationRule[]
  // toast
  toast: string | null
  // session actions
  setCurrentUser: (u: TeamMember) => void
  // appearance actions
  setTheme: (t: Theme) => void
  setAccent: (a: Accent) => void
  setDensity: (d: Density) => void
  setCardStyle: (c: CardStyle) => void
  setSidebarCollapsed: (v: boolean) => void
  // opportunity actions
  applyOpp: (id: string, patch: Partial<Opportunity>, opts?: { email?: EmailMeta }) => void  // internal: commit + record
  updateOpp: (id: string, patch: Partial<Opportunity>) => void
  moveStage: (id: string, stage: Stage) => void
  addOpp: (data: Partial<Opportunity>) => Opportunity
  deleteOpp: (id: string) => void
  // closed/lost reason flow (Fix 3)
  confirmClose: (category: string, notes: string) => void
  cancelClose: () => void
  // major-change notification flow (Feature 3)
  commitOrPromptMajor: (id: string, patch: Partial<Opportunity>) => void // internal
  confirmMajor: (opts: ConfirmMajorOpts) => Promise<EmailStatus | null>
  cancelMajor: () => void
  setNotificationRule: (id: string, patch: Partial<NotificationRule>) => void
  // change history (Feature 2)
  recordChange: (e: ChangeEvent | ChangeEvent[]) => void
  // client actions
  addClient: (data: Partial<Client>) => Client
  updateClient: (id: string, patch: Partial<Client>) => void
  deleteClient: (id: string) => void
  // option-list actions
  addOption: (category: string, label: string) => ListOption
  updateOption: (id: string, patch: Partial<ListOption>) => void
  deleteOption: (id: string) => void
  // document actions (nested on an opportunity)
  addDocument: (oppId: string, doc: Partial<Document>) => Document
  updateDocument: (oppId: string, docId: string, patch: Partial<Document>) => void
  deleteDocument: (oppId: string, docId: string) => void
  // reminder / calendar actions
  addReminder: (data: Partial<CalendarItem>) => CalendarItem
  updateReminder: (id: string, patch: Partial<CalendarItem>) => void
  deleteReminder: (id: string) => void
  // lifecycle
  hydrate: () => Promise<void>
  flash: (msg: string) => void
  clearToast: () => void
}

let toastTimer: ReturnType<typeof setTimeout> | null = null

// Monotonic-ish client id generator (collision-safe within a session).
let _seq = 0
const uid = (prefix: string) => `${prefix}${Date.now().toString(36)}${(_seq++).toString(36)}`

// ── Write-through helper (fire-and-forget; no-op on the server) ───────────────
// When a Postgres DB is configured the API persists; otherwise it's a harmless
// no-op and the optimistic Zustand update is the only state.
function api(path: string, method: string, body?: unknown) {
  if (typeof window === 'undefined') return
  fetch(path, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  }).catch(() => {})
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      accent: 'amber',
      density: 'balanced',
      cardStyle: 'soft',
      sidebarCollapsed: false,
      opps: OPPS.map(o => ({ ...o })),
      clients: CLIENTS.map(c => ({ ...c })),
      options: OPTIONS.map(o => ({ ...o })),
      reminders: [],
      currentUser: TEAM[0], // seeded default (Layla Haddad) until login wires a real user
      changes: SEED_CHANGES.map(c => ({ ...c })),
      pendingClose: null,
      pendingMajor: null,
      notificationRules: DEFAULT_NOTIFICATION_RULES.map(r => ({ ...r })),
      toast: null,

      setCurrentUser: (currentUser) => set({ currentUser }),

      setTheme: (theme) => set({ theme }),
      setAccent: (accent) => set({ accent }),
      setDensity: (density) => set({ density }),
      setCardStyle: (cardStyle) => set({ cardStyle }),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),

      // ── Change history (Feature 2) ────────────────────────────────────────
      recordChange: (e) => {
        const list = Array.isArray(e) ? e : [e]
        if (!list.length) return
        set(state => ({ changes: [...list, ...state.changes] }))
        api('/api/change-history', 'POST', list.length === 1 ? list[0] : { changes: list })
      },

      // ── Opportunities ─────────────────────────────────────────────────────
      // Commit a patch to an opportunity, persist it, and record the diff in
      // change history. (Internal — `updateOpp` may pause for a reason first.)
      applyOpp: (id, patch, opts) => {
        const prev = get().opps.find(o => o.id === id)
        set(state => ({
          opps: state.opps.map(o => o.id === id ? { ...o, ...patch, updated: TODAY } : o),
        }))
        api(`/api/opportunities/${id}`, 'PATCH', patch)
        if (prev) {
          const u = get().currentUser
          const events = diffOpp(prev, patch, { user: u })
          const email = opts?.email
          if (email) {
            for (const ev of events) {
              if (ev.importance === 'major') {
                ev.emailStatus = email.status
                ev.recipients = email.recipients
                ev.recipientsSummary = email.recipientsSummary
                ev.userNote = email.note
                ev.excelStatus = 'pending'
              }
            }
          }
          get().recordChange(events)
        }
      },

      updateOpp: (id, patch) => {
        const prev = get().opps.find(o => o.id === id)
        // Closed/Lost reason gate (Fix 3): a status change into a closing status
        // pauses until the user supplies a reason — unless one is already set or
        // the patch itself carries the reason.
        if (
          prev && patch.status && CLOSING_STATUSES.includes(patch.status as StatusKey) &&
          patch.status !== prev.status &&
          !patch.closedReasonCategory && !prev.closedReasonCategory
        ) {
          set({ pendingClose: { id, patch } })
          if (typeof window !== 'undefined') document.dispatchEvent(new CustomEvent('bf:closereason'))
          return
        }
        get().commitOrPromptMajor(id, patch)
      },

      moveStage: (id, stage) => {
        const current = get().opps.find(o => o.id === id)
        if (!current) return
        const keepStatus = STATUS[current.status] && STATUS[current.status].stage === stage
        const status = keepStatus ? current.status : STAGE_STATUS[stage]
        if (status === current.status) return
        // Route through updateOpp so the closed-reason + major-change gates apply.
        get().updateOpp(id, { status })
      },

      // ── Closed/Lost reason flow (Fix 3) ───────────────────────────────────
      confirmClose: (category, notes) => {
        const pending = get().pendingClose
        if (!pending) return
        const u = get().currentUser
        const fullPatch: Partial<Opportunity> = {
          ...pending.patch,
          closedReasonCategory: category,
          closedReasonNotes: notes,
          closedBy: u.id,
          closedAt: TODAY,
        }
        set({ pendingClose: null })
        // Closing is a major change → chain into the notification modal.
        get().commitOrPromptMajor(pending.id, fullPatch)
      },
      cancelClose: () => set({ pendingClose: null }),

      // ── Major-change notification flow (Feature 3) ────────────────────────
      commitOrPromptMajor: (id, patch) => {
        const prev = get().opps.find(o => o.id === id)
        if (!prev) { get().applyOpp(id, patch); return }
        const predicate = ruleMajorPredicate(get().notificationRules)
        const majors = majorChangesIn(prev, patch, predicate)
        if (majors.length && typeof window !== 'undefined') {
          set({ pendingMajor: { id, patch, majors } })
          document.dispatchEvent(new CustomEvent('bf:majorchange'))
          return
        }
        get().applyOpp(id, patch)
      },

      confirmMajor: async (opts) => {
        const pending = get().pendingMajor
        if (!pending) return null
        set({ pendingMajor: null })
        let status: EmailStatus = 'skipped'
        if (opts.sendEmail) {
          const opp = get().opps.find(o => o.id === pending.id)
          const res = await sendMajorChangeEmail({
            oppRef: opp?.ref ?? '', oppTitle: opp?.title ?? '',
            changes: pending.majors.map(m => ({ label: m.label, oldValue: m.oldValue, newValue: m.newValue })),
            userName: get().currentUser.name, note: opts.note,
            recipientEmails: opts.recipientEmails, recipientsSummary: opts.recipientsSummary,
          })
          status = res.status
        }
        get().applyOpp(pending.id, pending.patch, {
          email: {
            status,
            recipients: opts.recipientIds,
            recipientsSummary: opts.sendEmail ? opts.recipientsSummary : 'No email sent',
            note: opts.note,
          },
        })
        return status
      },
      cancelMajor: () => set({ pendingMajor: null }),

      setNotificationRule: (id, patch) => {
        set(state => ({ notificationRules: state.notificationRules.map(r => r.id === id ? { ...r, ...patch } : r) }))
        api('/api/notification-rules', 'POST', { rules: get().notificationRules })
      },

      addOpp: (data) => {
        const id = uid('o')
        const autoRef = 'SATCO-2026-0' + (160 + Math.floor(Math.random() * 40))
        const defaults: Opportunity = {
          id, ref: autoRef, rfpNumber: '',
          title: '', client: get().clients[0]?.id || 'rta', portal: 'In-Tend',
          type: 'Bid', cls: 'Civil Works', proc: 'Open Tender',
          status: 'New Lead', priority: 'Medium', owner: 'lh', reviewer: '',
          partnerInvolved: false, partnerName: '', contractDuration: '',
          rfpReceived: TODAY, siteVisit: '', siteVisitMode: 'date',
          qDeadline: '', qDeadlineTime: '', bidDue: '', bidDueTime: '',
          submission: '', followUp: '',
          bondPct: 0, bondValidity: '', bondValidityDays: null, bondReq: false,
          result: '', value: 0, updated: TODAY, notes: '',
          closedReasonCategory: '', closedReasonNotes: '', closedBy: '', closedAt: '',
          archivedAt: '', followUpTwo: '',
          checklist: null,
          followUps: [], documents: [],
          activity: [{ who: 'lh', verb: 'created this opportunity', when: 'just now' }],
        }
        const o: Opportunity = {
          ...defaults,
          ...data,
          id,
          ref: (data.ref && data.ref.trim()) ? data.ref : autoRef,
          updated: TODAY,
        }
        set(state => ({ opps: [o, ...state.opps] }))
        api('/api/opportunities', 'POST', o)
        get().recordChange(recordCreated(o, { user: get().currentUser }))
        return o
      },

      deleteOpp: (id) => {
        const prev = get().opps.find(o => o.id === id)
        set(state => ({
          opps: state.opps.filter(o => o.id !== id),
          reminders: state.reminders.filter(r => r.oppId !== id),
        }))
        api(`/api/opportunities/${id}`, 'DELETE')
        if (prev) get().recordChange(recordDeleted(prev, { user: get().currentUser }))
      },

      // ── Clients ───────────────────────────────────────────────────────────
      addClient: (data) => {
        const id = data.id || uid('cl')
        const c: Client = {
          id, name: data.name || '', portal: data.portal || '',
          contact: data.contact || '', sector: data.sector || '',
          wins: data.wins ?? 0, losses: data.losses ?? 0,
        }
        set(state => ({ clients: [...state.clients, c] }))
        setClientRegistry(get().clients)
        api('/api/clients', 'POST', c)
        return c
      },
      updateClient: (id, patch) => {
        set(state => ({ clients: state.clients.map(c => c.id === id ? { ...c, ...patch } : c) }))
        setClientRegistry(get().clients)
        api(`/api/clients/${id}`, 'PATCH', patch)
      },
      deleteClient: (id) => {
        set(state => ({ clients: state.clients.filter(c => c.id !== id) }))
        setClientRegistry(get().clients)
        api(`/api/clients/${id}`, 'DELETE')
      },

      // ── Option lists ──────────────────────────────────────────────────────
      addOption: (category, label) => {
        const order = get().options.filter(o => o.category === category).length
        const opt: ListOption = { id: uid('opt'), category, label, order }
        set(state => ({ options: [...state.options, opt] }))
        api('/api/options', 'POST', opt)
        return opt
      },
      updateOption: (id, patch) => {
        set(state => ({ options: state.options.map(o => o.id === id ? { ...o, ...patch } : o) }))
        api(`/api/options/${id}`, 'PATCH', patch)
      },
      deleteOption: (id) => {
        set(state => ({ options: state.options.filter(o => o.id !== id) }))
        api(`/api/options/${id}`, 'DELETE')
      },

      // ── Documents (nested on an opportunity) ──────────────────────────────
      addDocument: (oppId, doc) => {
        const full: Document = {
          id: uid('doc'), label: doc.label || 'Other',
          name: doc.name || '', url: doc.url || '',
          type: doc.type, meta: doc.meta,
        }
        set(state => ({
          opps: state.opps.map(o => o.id === oppId ? { ...o, documents: [...o.documents, full] } : o),
        }))
        api('/api/documents', 'POST', { oppId, ...full })
        return full
      },
      updateDocument: (oppId, docId, patch) => {
        set(state => ({
          opps: state.opps.map(o => o.id === oppId
            ? { ...o, documents: o.documents.map(d => d.id === docId ? { ...d, ...patch } : d) }
            : o),
        }))
        api(`/api/documents/${docId}`, 'PATCH', patch)
      },
      deleteDocument: (oppId, docId) => {
        set(state => ({
          opps: state.opps.map(o => o.id === oppId
            ? { ...o, documents: o.documents.filter(d => d.id !== docId) }
            : o),
        }))
        api(`/api/documents/${docId}`, 'DELETE')
      },

      // ── Reminders / calendar ──────────────────────────────────────────────
      addReminder: (data) => {
        const r: CalendarItem = {
          id: uid('rem'), oppId: data.oppId ?? null, type: data.type || 'custom',
          title: data.title || '', date: data.date || TODAY, time: data.time || '',
          notes: data.notes || '', done: data.done || false,
        }
        set(state => ({ reminders: [...state.reminders, r] }))
        api('/api/reminders', 'POST', r)
        return r
      },
      updateReminder: (id, patch) => {
        set(state => ({ reminders: state.reminders.map(r => r.id === id ? { ...r, ...patch } : r) }))
        api(`/api/reminders/${id}`, 'PATCH', patch)
      },
      deleteReminder: (id) => {
        set(state => ({ reminders: state.reminders.filter(r => r.id !== id) }))
        api(`/api/reminders/${id}`, 'DELETE')
      },

      // ── Lifecycle ─────────────────────────────────────────────────────────
      hydrate: async () => {
        if (typeof window === 'undefined') return
        try {
          const [oppsRes, clientsRes, optionsRes, remindersRes, changesRes, rulesRes] = await Promise.all([
            fetch('/api/opportunities'),
            fetch('/api/clients'),
            fetch('/api/options'),
            fetch('/api/reminders'),
            fetch('/api/change-history'),
            fetch('/api/notification-rules'),
          ])
          if (oppsRes.ok) {
            const j = await oppsRes.json() as { opps?: Opportunity[] }
            if (j.opps && j.opps.length) set({ opps: j.opps })
          }
          if (clientsRes.ok) {
            const j = await clientsRes.json() as { clients?: Client[] }
            if (j.clients && j.clients.length) { set({ clients: j.clients }); setClientRegistry(j.clients) }
          }
          if (optionsRes.ok) {
            const j = await optionsRes.json() as { options?: ListOption[] }
            if (j.options && j.options.length) set({ options: j.options })
          }
          if (remindersRes.ok) {
            const j = await remindersRes.json() as { reminders?: CalendarItem[] }
            if (j.reminders && j.reminders.length) set({ reminders: j.reminders })
          }
          if (changesRes.ok) {
            const j = await changesRes.json() as { changes?: ChangeEvent[] }
            if (j.changes && j.changes.length) set({ changes: j.changes })
          }
          if (rulesRes.ok) {
            const j = await rulesRes.json() as { rules?: NotificationRule[] }
            if (j.rules && j.rules.length) set({ notificationRules: j.rules })
          }
        } catch {
          /* offline / no API — keep seeded data */
        }
      },

      flash: (msg) => {
        if (toastTimer) clearTimeout(toastTimer)
        set({ toast: msg })
        toastTimer = setTimeout(() => set({ toast: null }), 2400)
      },

      clearToast: () => set({ toast: null }),
    }),
    {
      name: 'bidflow-state',
      // only persist preferences, not data (data is seeded then hydrated)
      partialize: (state) => ({
        theme: state.theme,
        accent: state.accent,
        density: state.density,
        cardStyle: state.cardStyle,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
)

// ── Selectors ─────────────────────────────────────────────────────────────────
/** Sorted option labels for a category. */
export const optionLabels = (options: ListOption[], category: string): string[] =>
  options.filter(o => o.category === category).sort((a, b) => a.order - b.order).map(o => o.label)

/** Sorted option objects for a category. */
export const optionsFor = (options: ListOption[], category: string): ListOption[] =>
  options.filter(o => o.category === category).sort((a, b) => a.order - b.order)
