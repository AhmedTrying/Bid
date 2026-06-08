import { NextResponse } from 'next/server'
import { prisma, dbEnabled } from '@/lib/db'
import { CLIENTS } from '@/lib/data'
import type { Client } from '@/lib/types'

export const dynamic = 'force-dynamic'

interface ClientRow {
  id: string; name: string; sector: string; contact: string
  portal: string; wins: number; losses: number
}
const toClient = (r: ClientRow): Client => ({
  id: r.id, name: r.name, sector: r.sector, contact: r.contact,
  portal: r.portal, wins: r.wins, losses: r.losses,
})

// GET /api/clients
export async function GET() {
  if (dbEnabled && prisma) {
    const rows = await prisma.client.findMany({ orderBy: { name: 'asc' } })
    return NextResponse.json({ source: 'db', clients: rows.map(r => toClient(r as ClientRow)) })
  }
  return NextResponse.json({ source: 'seed', clients: CLIENTS })
}

// POST /api/clients — create one
export async function POST(req: Request) {
  const c = (await req.json()) as Client
  if (dbEnabled && prisma) {
    const row = await prisma.client.create({
      data: {
        id: c.id, name: c.name, sector: c.sector ?? '', contact: c.contact ?? '',
        portal: c.portal ?? '', wins: c.wins ?? 0, losses: c.losses ?? 0,
      },
    })
    return NextResponse.json({ source: 'db', client: toClient(row as ClientRow) })
  }
  return NextResponse.json({ source: 'seed', client: c })
}
