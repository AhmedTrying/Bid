'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Opportunity, Theme, Accent, Density, CardStyle, StatusKey, Stage } from './types'
import { OPPS, STATUS, TODAY } from './data'

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
  // toast
  toast: string | null
  // actions
  setTheme: (t: Theme) => void
  setAccent: (a: Accent) => void
  setDensity: (d: Density) => void
  setCardStyle: (c: CardStyle) => void
  setSidebarCollapsed: (v: boolean) => void
  updateOpp: (id: string, patch: Partial<Opportunity>) => void
  moveStage: (id: string, stage: Stage) => void
  addOpp: (data: Partial<Opportunity>) => Opportunity
  flash: (msg: string) => void
  clearToast: () => void
}

let toastTimer: ReturnType<typeof setTimeout> | null = null

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      accent: 'amber',
      density: 'balanced',
      cardStyle: 'soft',
      sidebarCollapsed: false,
      opps: OPPS.map(o => ({ ...o })),
      toast: null,

      setTheme: (theme) => set({ theme }),
      setAccent: (accent) => set({ accent }),
      setDensity: (density) => set({ density }),
      setCardStyle: (cardStyle) => set({ cardStyle }),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),

      updateOpp: (id, patch) =>
        set(state => ({
          opps: state.opps.map(o =>
            o.id === id ? { ...o, ...patch, updated: TODAY } : o
          ),
        })),

      moveStage: (id, stage) =>
        set(state => ({
          opps: state.opps.map(o => {
            if (o.id !== id) return o
            const keepStatus = STATUS[o.status] && STATUS[o.status].stage === stage
            return {
              ...o,
              status: keepStatus ? o.status : STAGE_STATUS[stage],
              updated: TODAY,
            }
          }),
        })),

      addOpp: (data) => {
        const id = 'o' + Date.now()
        const ref = 'SATCO-2026-0' + (160 + Math.floor(Math.random() * 40))
        const o: Opportunity = {
          id, ref,
          title: data.title || '',
          client: data.client || 'rta',
          portal: data.portal || 'In-Tend',
          type: data.type || 'Bid',
          cls: data.cls || 'Civil Works',
          proc: 'Open Tender',
          status: data.status || 'New Lead',
          priority: data.priority || 'Medium',
          owner: data.owner || 'lh',
          reviewer: '',
          rfpReceived: TODAY,
          siteVisit: '',
          qDeadline: '',
          bidDue: data.bidDue || '',
          submission: '',
          followUp: '',
          bondPct: 0,
          bondValidity: '',
          bondReq: false,
          result: '',
          value: data.value || 0,
          updated: TODAY,
          notes: data.notes || '',
          checklist: null,
          followUps: [],
          documents: [],
          activity: [{ who: 'lh', verb: 'created this opportunity', when: 'just now' }],
          ...data,
        }
        set(state => ({ opps: [o, ...state.opps] }))
        return o
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
      // only persist preferences, not data (data is seeded each time)
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
