import { NextResponse } from 'next/server'
import { prisma, dbEnabled } from '@/lib/db'
import { DEFAULT_NOTIFICATION_RULES } from '@/lib/notificationRulesService'
import type { NotificationRule } from '@/lib/types'

export const dynamic = 'force-dynamic'

interface RuleRow { id: string; field: string; label: string; isMajor: boolean; allowSkipEmail: boolean }
const toRule = (r: RuleRow): NotificationRule => ({
  id: r.id, field: r.field, label: r.label, isMajor: r.isMajor, allowSkipEmail: r.allowSkipEmail,
})

// GET /api/notification-rules — list (DB when configured, else defaults)
export async function GET() {
  if (dbEnabled && prisma) {
    const rows = await prisma.notificationRule.findMany({ orderBy: { createdAt: 'asc' } })
    const rules = rows.length ? rows.map(r => toRule(r as unknown as RuleRow)) : DEFAULT_NOTIFICATION_RULES
    return NextResponse.json({ source: 'db', rules })
  }
  return NextResponse.json({ source: 'seed', rules: DEFAULT_NOTIFICATION_RULES })
}

// POST /api/notification-rules — upsert the full rule set
export async function POST(req: Request) {
  const body = (await req.json()) as { rules: NotificationRule[] }
  const rules = body.rules ?? []
  if (dbEnabled && prisma) {
    for (const r of rules) {
      await prisma.notificationRule.upsert({
        where: { id: r.id },
        update: { field: r.field, label: r.label, isMajor: r.isMajor, allowSkipEmail: r.allowSkipEmail },
        create: { id: r.id, field: r.field, label: r.label, isMajor: r.isMajor, allowSkipEmail: r.allowSkipEmail },
      })
    }
    return NextResponse.json({ source: 'db', count: rules.length })
  }
  return NextResponse.json({ source: 'seed', count: rules.length })
}
