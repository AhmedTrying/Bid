import { NextResponse } from 'next/server'
import { prisma, dbEnabled } from '@/lib/db'
import { dbToSavedView, savedViewToDbData, type SavedViewRow } from '@/lib/db-map'
import type { SavedView } from '@/lib/types'

export const dynamic = 'force-dynamic'

// GET /api/saved-views — list saved views (DB when configured, else empty)
export async function GET() {
  if (dbEnabled && prisma) {
    const rows = await prisma.savedView.findMany({ orderBy: { order: 'asc' } })
    return NextResponse.json({ source: 'db', views: rows.map(r => dbToSavedView(r as unknown as SavedViewRow)) })
  }
  return NextResponse.json({ source: 'seed', views: [] })
}

// POST /api/saved-views — create one
export async function POST(req: Request) {
  const v = (await req.json()) as SavedView
  if (dbEnabled && prisma) {
    const row = await prisma.savedView.create({ data: savedViewToDbData(v) })
    return NextResponse.json({ source: 'db', view: dbToSavedView(row as unknown as SavedViewRow) })
  }
  return NextResponse.json({ source: 'seed', view: v })
}
