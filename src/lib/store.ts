'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  Opportunity, Theme, Accent, Density, CardStyle, StatusKey, Stage,
  Client, ListOption, CalendarItem, Document,
} from './types'
import { OPPS, STATUS, TODAY, CLIENTS, OPTIONS, setClientRegistry } from './data'

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
  // toast
  toast: string | null
  // appearance actions
  setTheme: (t: Theme) => void
  setAccent: (a: Accent) => void
  setDensity: (d: Density) => void
  setCardStyle: (c: CardStyle) => void
  setSidebarCollapsed: (v: boolean) => void
  // opportunity actions
  updateOpp: (id: string, patch: Partial<Opportunity>) => void
  moveStage: (id: string, stage: Stage) => void
  addOpp: (data: Partial<Opportunity>) => Opportunity
  deleteOpp: (id: string) => void
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
      toast: null,

      setTheme: (theme) => set({ theme }),
      setAccent: (accent) => set({ accent }),
      setDensity: (density) => set({ density }),
      setCardStyle: (cardStyle) => set({ cardStyle }),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),

      // ── Opportunities ─────────────────────────────────────────────────────
      updateOpp: (id, patch) => {
        set(state => ({
          opps: state.opps.map(o =>
            o.id === id ? { ...o, ...patch, updated: TODAY } : o
          ),
        }))
        api(`/api/opportunities/${id}`, 'PATCH', patch)
      },

      moveStage: (id, stage) => {
        const current = get().opps.find(o => o.id === id)
        if (!current) return
        const keepStatus = STATUS[current.status] && STATUS[current.status].stage === stage
        const status = keepStatus ? current.status : STAGE_STATUS[stage]
        set(state => ({
          opps: state.opps.map(o => o.id === id ? { ...o, status, updated: TODAY } : o),
        }))
        if (status !== current.status) api(`/api/opportunities/${id}`, 'PATCH', { status })
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
          result: '', value: 0, updated: TODAY, notes: '', checklist: null,
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
        return o
      },

      deleteOpp: (id) => {
        set(state => ({
          opps: state.opps.filter(o => o.id !== id),
          reminders: state.reminders.filter(r => r.oppId !== id),
        }))
        api(`/api/opportunities/${id}`, 'DELETE')
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
          const [oppsRes, clientsRes, optionsRes, remindersRes] = await Promise.all([
            fetch('/api/opportunities'),
            fetch('/api/clients'),
            fetch('/api/options'),
            fetch('/api/reminders'),
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
