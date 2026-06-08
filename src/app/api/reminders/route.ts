import { NextResponse } from 'next/server'
import { prisma, dbEnabled } from '@/lib/db'
import { reminderToDbData, dbToReminder, type ReminderRow } from '@/lib/db-map'
import type { CalendarItem } from '@/lib/types'

export const dynamic = 'force-dynamic'

// GET /api/reminders?oppId=...  (oppId optional → all)
export async function GET(req: Request) {
  const oppId = new URL(req.url).searchParams.get('oppId') ?? undefined
  if (dbEnabled && prisma) {
    const rows = await prisma.reminder.findMany({
      where: oppId ? { oppId } : undefined,
      orderBy: { date: 'asc' },
    })
    return NextResponse.json({ source: 'db', reminders: rows.map(r => dbToReminder(r as unknown as ReminderRow)) })
  }
  // No DB: reminders live only in the client store.
  return NextResponse.json({ source: 'seed', reminders: [] })
}

// POST /api/reminders — create one
export async function POST(req: Request) {
  const c = (await req.json()) as CalendarItem
  if (dbEnabled && prisma) {
    const row = await prisma.reminder.create({ data: { id: c.id, ...reminderToDbData(c) } as never })
    return NextResponse.json({ source: 'db', reminder: dbToReminder(row as unknown as ReminderRow) })
  }
  return NextResponse.json({ source: 'seed', reminder: c })
}
