import { NextResponse } from 'next/server'
import { prisma, dbEnabled } from '@/lib/db'
import type { ListOption } from '@/lib/types'

export const dynamic = 'force-dynamic'

// PATCH /api/options/[id] — rename / reorder
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const patch = (await req.json()) as Partial<ListOption>
  if (dbEnabled && prisma) {
    const data: Record<string, unknown> = {}
    if (patch.label !== undefined) data.label = patch.label
    if (patch.order !== undefined) data.order = patch.order
    const row = await prisma.listOption.update({ where: { id }, data })
    return NextResponse.json({ source: 'db', option: row })
  }
  return NextResponse.json({ source: 'seed', id, patch })
}

// DELETE /api/options/[id]
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (dbEnabled && prisma) {
    await prisma.listOption.delete({ where: { id } })
    return NextResponse.json({ source: 'db', id })
  }
  return NextResponse.json({ source: 'seed', id })
}
