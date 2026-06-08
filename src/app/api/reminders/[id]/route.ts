import { NextResponse } from 'next/server'
import { prisma, dbEnabled } from '@/lib/db'
import { reminderToDbData, dbToReminder, type ReminderRow } from '@/lib/db-map'
import type { CalendarItem } from '@/lib/types'

export const dynamic = 'force-dynamic'

// PATCH /api/reminders/[id] — edit / toggle done
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const patch = (await req.json()) as Partial<CalendarItem>
  if (dbEnabled && prisma) {
    const row = await prisma.reminder.update({ where: { id }, data: reminderToDbData(patch) })
    return NextResponse.json({ source: 'db', reminder: dbToReminder(row as unknown as ReminderRow) })
  }
  return NextResponse.json({ source: 'seed', id, patch })
}

// DELETE /api/reminders/[id]
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (dbEnabled && prisma) {
    await prisma.reminder.delete({ where: { id } })
    return NextResponse.json({ source: 'db', id })
  }
  return NextResponse.json({ source: 'seed', id })
}
