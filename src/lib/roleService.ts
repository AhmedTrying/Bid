// BidFlow Tracker — Roles (Fix 2)

import type { RoleKey } from './types'

export const ROLE_LABELS: Record<RoleKey, string> = {
  admin: 'Admin',
  bd_manager: 'BD Manager',
  proposal_manager: 'Proposal Manager',
  tender_coordinator: 'Tender Coordinator',
  document_controller: 'Document Controller',
  commercial_manager: 'Commercial Manager',
  finance: 'Finance',
  management_viewer: 'Management Viewer',
  reviewer: 'Reviewer',
}

export const ROLE_KEYS = Object.keys(ROLE_LABELS) as RoleKey[]

export const roleLabel = (k: string): string => ROLE_LABELS[k as RoleKey] ?? k
