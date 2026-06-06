import { NextResponse } from 'next/server'
import { prisma, dbEnabled } from '@/lib/db'
import { dbToOpp, oppToDbData, type OppRow } from '@/lib/db-map'
import type { Opportunity } from '@/lib/types'

export const dynamic = 'force-dynamic'

// PATCH /api/opportunities/[id] — partial update
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const patch = (await req.json()) as Partial<Opportunity>
  if (dbEnabled && prisma) {
    const row = await prisma.opportunity.update({ where: { id }, data: oppToDbData(patch) })
    return NextResponse.json({ source: 'db', opp: dbToOpp(row as unknown as OppRow) })
  }
  return NextResponse.json({ source: 'seed', id, patch })
}
