import { NextResponse } from 'next/server'
import { buildExportWorkbook } from '@/lib/excelExportService'
import { prisma, dbEnabled } from '@/lib/db'
import type { Opportunity, Client } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs' // exceljs + fs need the Node runtime

// POST /api/excel/export — body { opps, clients } → styled .xlsx download.
// The client posts its live opportunities so the export reflects unsaved edits in
// both demo and DB mode.
export async function POST(req: Request) {
  const { opps, clients } = (await req.json()) as { opps: Opportunity[]; clients: Client[] }
  const clientNameById: Record<string, string> = {}
  for (const c of clients ?? []) clientNameById[c.id] = c.name

  const buf = await buildExportWorkbook(opps ?? [], clientNameById)

  if (dbEnabled && prisma) {
    try {
      await prisma.excelExport.create({
        data: { fileName: 'BidFlow_Tracker.xlsx', rows: (opps ?? []).length, status: 'exported' },
      })
    } catch { /* non-fatal */ }
  }

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="BidFlow_Tracker.xlsx"',
      'Cache-Control': 'no-store',
    },
  })
}
