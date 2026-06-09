// BidFlow Tracker — User mapping helpers (Fix 2, client-safe)

import { TEAM } from './data'
import type { AuthUser, TeamMember, RoleKey, TeamGroup } from './types'

export function memberToAuthUser(t: TeamMember): AuthUser {
  return {
    id: t.id, name: t.name, email: t.email ?? `${t.id}@satco.example`,
    roleTitle: t.role, roleKey: (t.roleKey ?? 'bd_manager') as RoleKey,
    group: (t.group ?? '') as TeamGroup | '', init: t.init, hue: t.hue, active: true,
  }
}

export function authUserToMember(u: AuthUser): TeamMember {
  return {
    id: u.id, name: u.name, role: u.roleTitle, init: u.init, hue: u.hue,
    email: u.email, group: u.group || undefined, roleKey: u.roleKey,
    permissions: u.permissions ?? null,
  }
}

export const DEMO_USER = (): AuthUser => memberToAuthUser(TEAM[0])

export function findMemberByEmail(email: string): TeamMember | undefined {
  return TEAM.find(t => (t.email ?? `${t.id}@satco.example`).toLowerCase() === email.toLowerCase())
}

// Demo-mode user list (when no DB is configured).
export const demoUsers = (): AuthUser[] => TEAM.map(memberToAuthUser)
