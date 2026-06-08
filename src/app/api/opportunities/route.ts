import { NextResponse } from 'next/server'
import { prisma, dbEnabled } from '@/lib/db'
import { dbToOpp, oppToDbData, type OppRow } from '@/lib/db-map'
import { OPPS } from '@/lib/data'
import type { Opportunity } from '@/lib/types'

export const dynamic = 'force-dynamic'

// GET /api/opportunities — list all (DB when configured, else seed data)
export async function GET() {
  if (dbEnabled && prisma) {
    const rows = await prisma.opportunity.findMany({
      orderBy: { bidDue: 'asc' },
      include: { documents: true },
    })
    return NextResponse.json({ source: 'db', opps: rows.map(r => dbToOpp(r as unknown as OppRow)) })
  }
  return NextResponse.json({ source: 'seed', opps: OPPS })
}

// POST /api/opportunities — create one
export async function POST(req: Request) {
  const o = (await req.json()) as Opportunity
  if (dbEnabled && prisma) {
    const data = oppToDbData(o)
    const row = await prisma.opportunity.create({ data: { id: o.id, ...data } as never })
    return NextResponse.json({ source: 'db', opp: dbToOpp(row as unknown as OppRow) })
  }
  // No DB: nothing to persist; echo back so the optimistic client stays in sync.
  return NextResponse.json({ source: 'seed', opp: o })
}
