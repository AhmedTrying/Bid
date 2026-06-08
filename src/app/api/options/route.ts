import { NextResponse } from 'next/server'
import { prisma, dbEnabled } from '@/lib/db'
import { OPTIONS } from '@/lib/data'
import type { ListOption } from '@/lib/types'

export const dynamic = 'force-dynamic'

// GET /api/options?category=portal  (category optional → all)
export async function GET(req: Request) {
  const category = new URL(req.url).searchParams.get('category') ?? undefined
  if (dbEnabled && prisma) {
    const rows = await prisma.listOption.findMany({
      where: category ? { category } : undefined,
      orderBy: [{ category: 'asc' }, { order: 'asc' }],
    })
    return NextResponse.json({ source: 'db', options: rows })
  }
  const options = category ? OPTIONS.filter(o => o.category === category) : OPTIONS
  return NextResponse.json({ source: 'seed', options })
}

// POST /api/options — create one
export async function POST(req: Request) {
  const o = (await req.json()) as ListOption
  if (dbEnabled && prisma) {
    const row = await prisma.listOption.create({
      data: { id: o.id, category: o.category, label: o.label, order: o.order ?? 0 },
    })
    return NextResponse.json({ source: 'db', option: row })
  }
  return NextResponse.json({ source: 'seed', option: o })
}
