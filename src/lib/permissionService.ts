// BidFlow Tracker — Permissions (Fix 2)
//
// Code-defined role → permission matrix. `can()` is used in the UI to show/hide
// actions; server routes can use it too. Admin implicitly has everything.

import type { RoleKey, Permission } from './types'

export const PERMISSION_LABELS: Record<Permission, string> = {
  manage_users: 'Manage users',
  manage_roles: 'Manage roles',
  configure_notifications: 'Configure notification rules',
  import_export: 'Import / export Excel',
  delete_archive: 'Delete / archive opportunities',
  add_opportunities: 'Add opportunities',
  edit_opportunities: 'Edit opportunities',
  move_status: 'Move statuses',
  update_dates: 'Update dates & follow-ups',
  edit_commercial: 'Edit commercial / bond fields',
  add_notes_docs: 'Add notes & document links',
  review: 'Add review comments',
  view_reports: 'View reports',
  view_change_history: 'View change history',
}

export const ALL_PERMISSIONS = Object.keys(PERMISSION_LABELS) as Permission[]

export const ROLE_PERMISSIONS: Record<RoleKey, Permission[]> = {
  admin: ALL_PERMISSIONS,
  bd_manager: [
    'add_opportunities', 'edit_opportunities', 'move_status', 'update_dates',
    'import_export', 'add_notes_docs', 'view_reports', 'view_change_history',
  ],
  proposal_manager: [
    'edit_opportunities', 'move_status', 'update_dates', 'add_notes_docs', 'view_reports',
  ],
  tender_coordinator: [
    'add_opportunities', 'edit_opportunities', 'update_dates', 'add_notes_docs', 'import_export',
  ],
  document_controller: [
    'add_notes_docs', 'update_dates',
  ],
  commercial_manager: [
    'edit_opportunities', 'edit_commercial', 'move_status', 'view_reports',
  ],
  finance: [
    'edit_commercial', 'view_reports',
  ],
  management_viewer: [
    'view_reports', 'view_change_history',
  ],
  reviewer: [
    'review', 'add_notes_docs', 'view_change_history',
  ],
}

export function can(role: RoleKey | undefined | null, p: Permission): boolean {
  if (!role) return false
  if (role === 'admin') return true
  return (ROLE_PERMISSIONS[role] ?? []).includes(p)
}

export function permissionsFor(role: RoleKey): Permission[] {
  return role === 'admin' ? ALL_PERMISSIONS : (ROLE_PERMISSIONS[role] ?? [])
}
