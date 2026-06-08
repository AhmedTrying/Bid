import { NextResponse } from 'next/server'
import { prisma, dbEnabled } from '@/lib/db'
import { dbToChange, changeToDbData, type ChangeRow } from '@/lib/db-map'
import { SEED_CHANGES } from '@/lib/data'
import type { ChangeEvent } from '@/lib/types'

export const dynamic = 'force-dynamic'

// GET /api/change-history — list recent change events (DB when configured, else seed)
export async function GET() {
  if (dbEnabled && prisma) {
    const rows = await prisma.changeEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: 500,
    })
    return NextResponse.json({ source: 'db', changes: rows.map(r => dbToChange(r as unknown as ChangeRow)) })
  }
  return NextResponse.json({ source: 'seed', changes: SEED_CHANGES })
}

// POST /api/change-history — record one (or many) change events
export async function POST(req: Request) {
  const body = (await req.json()) as ChangeEvent | { changes: ChangeEvent[] }
  const list = Array.isArray((body as { changes?: ChangeEvent[] }).changes)
    ? (body as { changes: ChangeEvent[] }).changes
    : [body as ChangeEvent]
  if (dbEnabled && prisma) {
    await prisma.changeEvent.createMany({ data: list.map(changeToDbData) as never })
    return NextResponse.json({ source: 'db', count: list.length })
  }
  // No DB: nothing to persist; the optimistic client store already holds them.
  return NextResponse.json({ source: 'seed', count: list.length })
}
