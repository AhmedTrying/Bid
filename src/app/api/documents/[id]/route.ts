import { NextResponse } from 'next/server'
import { prisma, dbEnabled } from '@/lib/db'
import { docToDbData, dbToDoc, type DocRow } from '@/lib/db-map'
import type { Document } from '@/lib/types'

export const dynamic = 'force-dynamic'

// PATCH /api/documents/[id] — edit a document link
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const patch = (await req.json()) as Partial<Document>
  if (dbEnabled && prisma) {
    const row = await prisma.document.update({ where: { id }, data: docToDbData(patch) })
    return NextResponse.json({ source: 'db', document: dbToDoc(row as unknown as DocRow) })
  }
  return NextResponse.json({ source: 'seed', id, patch })
}

// DELETE /api/documents/[id]
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (dbEnabled && prisma) {
    await prisma.document.delete({ where: { id } })
    return NextResponse.json({ source: 'db', id })
  }
  return NextResponse.json({ source: 'seed', id })
}
