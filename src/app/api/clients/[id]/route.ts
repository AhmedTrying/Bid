import { NextResponse } from 'next/server'
import { prisma, dbEnabled } from '@/lib/db'
import type { Client } from '@/lib/types'

export const dynamic = 'force-dynamic'

// PATCH /api/clients/[id] — partial update
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const patch = (await req.json()) as Partial<Client>
  if (dbEnabled && prisma) {
    const data: Record<string, unknown> = {}
    if (patch.name    !== undefined) data.name = patch.name
    if (patch.sector  !== undefined) data.sector = patch.sector
    if (patch.contact !== undefined) data.contact = patch.contact
    if (patch.portal  !== undefined) data.portal = patch.portal
    if (patch.wins    !== undefined) data.wins = patch.wins
    if (patch.losses  !== undefined) data.losses = patch.losses
    const row = await prisma.client.update({ where: { id }, data })
    return NextResponse.json({ source: 'db', client: row })
  }
  return NextResponse.json({ source: 'seed', id, patch })
}

// DELETE /api/clients/[id]
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (dbEnabled && prisma) {
    await prisma.client.delete({ where: { id } })
    return NextResponse.json({ source: 'db', id })
  }
  return NextResponse.json({ source: 'seed', id })
}
