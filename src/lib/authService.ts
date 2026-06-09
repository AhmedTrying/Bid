// BidFlow Tracker — Auth service (Fix 2, SERVER-ONLY)
//
// Custom email+password auth backed by Neon. Passwords are hashed with scrypt;
// sessions are rows in the Session table referenced by an httpOnly cookie.
// Never import this from a client component (it uses node:crypto + prisma).

import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { prisma, dbEnabled } from './db'
import type { AuthUser, RoleKey, TeamGroup, Permission } from './types'

export const SESSION_COOKIE = 'bf_session'
const SESSION_DAYS = 7

// ── Password hashing ──────────────────────────────────────────────────────────
export function hashPassword(pw: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(pw, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(pw: string, stored: string): boolean {
  if (!stored || !stored.includes(':')) return false
  const [salt, hash] = stored.split(':')
  const expected = Buffer.from(hash, 'hex')
  const actual = scryptSync(pw, salt, 64)
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

// ── DB user shape ─────────────────────────────────────────────────────────────
export interface DbUser {
  id: string; name: string; email: string; roleTitle: string
  role: string; group: string; passwordHash: string; active: boolean
  avatarHue: number; initials: string; permissions: string | null
}

export function toAuthUser(u: DbUser): AuthUser {
  let permissions: Permission[] | null = null
  try { if (u.permissions) permissions = JSON.parse(u.permissions) as Permission[] } catch { permissions = null }
  return {
    id: u.id, name: u.name, email: u.email, roleTitle: u.roleTitle,
    roleKey: (u.role as RoleKey) || 'bd_manager', group: (u.group as TeamGroup) || '',
    init: u.initials, hue: u.avatarHue, active: u.active, permissions,
  }
}

// ── Sessions ──────────────────────────────────────────────────────────────────
export async function createSession(userId: string): Promise<string | null> {
  if (!dbEnabled || !prisma) return null
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400000)
  const s = await prisma.session.create({ data: { userId, expiresAt } })
  return s.id
}

export async function getUserBySession(sessionId: string | undefined): Promise<DbUser | null> {
  if (!sessionId || !dbEnabled || !prisma) return null
  const s = await prisma.session.findUnique({ where: { id: sessionId }, include: { user: true } })
  if (!s || !s.user || s.expiresAt < new Date()) return null
  return s.user as unknown as DbUser
}

export async function destroySession(sessionId: string | undefined): Promise<void> {
  if (!sessionId || !dbEnabled || !prisma) return
  await prisma.session.delete({ where: { id: sessionId } }).catch(() => {})
}

export async function authenticate(email: string, password: string): Promise<DbUser | null> {
  if (!dbEnabled || !prisma) return null
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !user.active) return null
  if (!verifyPassword(password, (user as unknown as DbUser).passwordHash)) return null
  await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } }).catch(() => {})
  return user as unknown as DbUser
}
