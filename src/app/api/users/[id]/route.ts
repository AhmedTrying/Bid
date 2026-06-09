import { NextResponse } from 'next/server'
import { prisma, dbEnabled } from '@/lib/db'
import { hashPassword } from '@/lib/authService'
import { roleLabel } from '@/lib/roleService'
import type { RoleKey, TeamGroup } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// PATCH /api/users/[id] — update role / active / name / group / reset password
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const b = (await req.json()) as {
    name?: string; roleKey?: RoleKey; group?: TeamGroup; active?: boolean; password?: string
  }
  if (dbEnabled && prisma) {
    const data: Record<string, unknown> = {}
    if (b.name !== undefined) data.name = b.name
    if (b.roleKey !== undefined) { data.role = b.roleKey; data.roleTitle = roleLabel(b.roleKey) }
    if (b.group !== undefined) data.group = b.group
    if (b.active !== undefined) data.active = b.active
    if (b.password) data.passwordHash = hashPassword(b.password)
    await prisma.user.update({ where: { id }, data })
    return NextResponse.json({ source: 'db', ok: true })
  }
  return NextResponse.json({ source: 'seed', ok: true })
}

// DELETE /api/users/[id]
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (dbEnabled && prisma) {
    await prisma.user.delete({ where: { id } }).catch(() => {})
    return NextResponse.json({ source: 'db', ok: true })
  }
  return NextResponse.json({ source: 'seed', ok: true })
}
