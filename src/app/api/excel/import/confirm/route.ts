import { NextResponse } from 'next/server'
import { prisma, dbEnabled } from '@/lib/db'

export const dynamic = 'force-dynamic'

// POST /api/excel/import/confirm — log an import run (the opportunities themselves
// persist via the store's write-through when applied on the client).
export async function POST(req: Request) {
  const b = (await req.json()) as {
    fileName?: string; added?: number; updated?: number; warnings?: number
    failed?: number; errors?: { sheet: string; row: number; message: string }[]
  }
  if (dbEnabled && prisma) {
    try {
      await prisma.excelImport.create({
        data: {
          fileName: b.fileName ?? '',
          rowsAdded: b.added ?? 0,
          rowsUpdated: b.updated ?? 0,
          warnings: b.warnings ?? 0,
          failed: b.failed ?? 0,
          status: (b.failed ?? 0) > 0 ? 'needs_review' : 'completed',
          errors: JSON.stringify(b.errors ?? []),
        },
      })
    } catch { /* non-fatal */ }
  }
  return NextResponse.json({ ok: true })
}
