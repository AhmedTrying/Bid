import { NextResponse } from 'next/server'
import { prisma, dbEnabled } from '@/lib/db'
import { docToDbData, dbToDoc, type DocRow } from '@/lib/db-map'
import type { Document } from '@/lib/types'

export const dynamic = 'force-dynamic'

// POST /api/documents — add a document link to an opportunity
export async function POST(req: Request) {
  const body = (await req.json()) as Document & { oppId: string }
  if (dbEnabled && prisma) {
    const row = await prisma.document.create({
      data: { id: body.id, oppId: body.oppId, ...docToDbData(body) } as never,
    })
    return NextResponse.json({ source: 'db', document: dbToDoc(row as unknown as DocRow) })
  }
  return NextResponse.json({ source: 'seed', document: body })
}
