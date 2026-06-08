import { NextResponse } from 'next/server'
import { prisma, dbEnabled } from '@/lib/db'
import { dbToOpp, oppToDbData, type OppRow } from '@/lib/db-map'
import type { Opportunity } from '@/lib/types'

export const dynamic = 'force-dynamic'

// GET /api/opportunities/[id] — single (DB only; demo reads from the store)
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (dbEnabled && prisma) {
    const row = await prisma.opportunity.findUnique({ where: { id }, include: { documents: true } })
    if (!row) return NextResponse.json({ error: 'not found' }, { status: 404 })
    return NextResponse.json({ source: 'db', opp: dbToOpp(row as unknown as OppRow) })
  }
  return NextResponse.json({ source: 'seed', id })
}

// PATCH /api/opportunities/[id] — partial update
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const patch = (await req.json()) as Partial<Opportunity>
  if (dbEnabled && prisma) {
    const row = await prisma.opportunity.update({
      where: { id },
      data: oppToDbData(patch),
      include: { documents: true },
    })
    return NextResponse.json({ source: 'db', opp: dbToOpp(row as unknown as OppRow) })
  }
  return NextResponse.json({ source: 'seed', id, patch })
}

// DELETE /api/opportunities/[id]
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (dbEnabled && prisma) {
    await prisma.opportunity.delete({ where: { id } })
    return NextResponse.json({ source: 'db', id })
  }
  return NextResponse.json({ source: 'seed', id })
}
