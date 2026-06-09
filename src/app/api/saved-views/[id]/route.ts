import { NextResponse } from 'next/server'
import { prisma, dbEnabled } from '@/lib/db'
import type { SavedViewConfig } from '@/lib/types'

export const dynamic = 'force-dynamic'

// PATCH /api/saved-views/[id] — rename or update a saved view's config
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const patch = (await req.json()) as { name?: string; config?: SavedViewConfig; order?: number }
  if (dbEnabled && prisma) {
    const data: Record<string, unknown> = {}
    if (patch.name !== undefined) data.name = patch.name
    if (patch.order !== undefined) data.order = patch.order
    if (patch.config !== undefined) data.config = JSON.stringify(patch.config)
    await prisma.savedView.update({ where: { id }, data })
    return NextResponse.json({ source: 'db', ok: true })
  }
  return NextResponse.json({ source: 'seed', ok: true })
}

// DELETE /api/saved-views/[id]
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (dbEnabled && prisma) {
    await prisma.savedView.delete({ where: { id } }).catch(() => {})
    return NextResponse.json({ source: 'db', ok: true })
  }
  return NextResponse.json({ source: 'seed', ok: true })
}
