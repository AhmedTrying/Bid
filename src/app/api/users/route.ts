import { NextResponse } from 'next/server'
import { prisma, dbEnabled } from '@/lib/db'
import { toAuthUser, hashPassword, type DbUser } from '@/lib/authService'
import { demoUsers } from '@/lib/userService'
import { roleLabel } from '@/lib/roleService'
import type { RoleKey, TeamGroup } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/users — list users
export async function GET() {
  if (dbEnabled && prisma) {
    const rows = await prisma.user.findMany({ orderBy: { createdAt: 'asc' } })
    return NextResponse.json({ source: 'db', users: rows.map(r => toAuthUser(r as unknown as DbUser)) })
  }
  return NextResponse.json({ source: 'seed', users: demoUsers() })
}

// POST /api/users — create a user with a temporary password
export async function POST(req: Request) {
  const b = (await req.json()) as {
    name: string; email: string; roleKey: RoleKey; group?: TeamGroup; password?: string
  }
  if (dbEnabled && prisma) {
    const initials = (b.name || '?').split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase()
    const user = await prisma.user.create({
      data: {
        name: b.name, email: b.email, roleTitle: roleLabel(b.roleKey),
        role: b.roleKey, group: b.group ?? '', initials,
        passwordHash: hashPassword(b.password || 'bidflow123'), active: true,
      },
    })
    return NextResponse.json({ source: 'db', user: toAuthUser(user as unknown as DbUser) })
  }
  return NextResponse.json({ source: 'seed', ok: true })
}
