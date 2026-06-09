import { NextResponse } from 'next/server'
import { parseWorkbook } from '@/lib/excelImportService'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// POST /api/excel/import — multipart upload of a tracker workbook → parsed raw rows.
// Normalisation, diffing and applying happen on the client against the live store.
export async function POST(req: Request) {
  const form = await req.formData()
  const file = form.get('file')
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
  }
  const buf = Buffer.from(await file.arrayBuffer())
  try {
    const result = await parseWorkbook(buf)
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json(
      { error: 'Could not read this file. Make sure it is a .xlsx tracker.', detail: String(e) },
      { status: 422 },
    )
  }
}
