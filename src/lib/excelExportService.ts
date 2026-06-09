// BidFlow Tracker — Excel export service (Feature 1, server-only)
//
// Populates the real styled SATCO tracker template with Neon data, preserving the
// template's styling, headers, colours, borders, formats and dropdowns (we only
// set cell *values*, never rebuild the workbook). Routes each opportunity to its
// sheet via excelTemplate.sheetForOpp.

import ExcelJS from 'exceljs'
import path from 'node:path'
import type { Opportunity } from './types'
import {
  SHEET_NAMES, HEADER_FIELD_MAP, normalizeHeader, sheetForOpp, exportCellValue,
} from './excelTemplate'

const TEMPLATE_PATH = path.join(process.cwd(), 'excel-template', 'proposal-tracker-template.xlsx')

interface ColInfo { headerRow: number; colMap: Partial<Record<keyof Opportunity, number>> }

function detectColumns(ws: ExcelJS.Worksheet): ColInfo {
  for (let r = 1; r <= 14; r++) {
    const row = ws.getRow(r)
    let hasRef = false
    const colMap: Partial<Record<keyof Opportunity, number>> = {}
    row.eachCell({ includeEmpty: false }, (cell, col) => {
      const norm = normalizeHeader(cell.text)
      if (norm === 'SATCO REFERENCE') hasRef = true
      const field = HEADER_FIELD_MAP[norm]
      if (field && colMap[field] === undefined) colMap[field] = col
    })
    if (hasRef) return { headerRow: r, colMap }
  }
  return { headerRow: -1, colMap: {} }
}

export async function buildExportWorkbook(
  opps: Opportunity[],
  clientNameById: Record<string, string>,
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.readFile(TEMPLATE_PATH)

  // group by target sheet
  const bySheet = new Map<string, Opportunity[]>()
  for (const o of opps) {
    const sheet = sheetForOpp(o)
    const arr = bySheet.get(sheet) ?? []
    arr.push(o)
    bySheet.set(sheet, arr)
  }

  for (const sheetName of SHEET_NAMES) {
    const ws = wb.getWorksheet(sheetName)
    if (!ws) continue
    const { headerRow, colMap } = detectColumns(ws)
    if (headerRow < 0) continue
    const fields = Object.keys(colMap) as (keyof Opportunity)[]
    const dataStart = headerRow + 1
    const rows = bySheet.get(sheetName) ?? []

    // find last existing data row (by the reference column), tolerate small gaps
    const refCol = colMap.ref
    let lastRow = dataStart - 1
    if (refCol) {
      let gap = 0
      for (let r = dataStart; r <= dataStart + 2000; r++) {
        const t = String(ws.getRow(r).getCell(refCol).text ?? '').trim()
        if (t) { lastRow = r; gap = 0 } else if (++gap > 30) break
      }
    }

    // clear old data (mapped columns only — leaves formula/decoration columns)
    for (let r = dataStart; r <= lastRow; r++) {
      const row = ws.getRow(r)
      for (const f of fields) row.getCell(colMap[f]!).value = null
    }

    // write current opportunities
    rows.forEach((o, i) => {
      const row = ws.getRow(dataStart + i)
      for (const f of fields) {
        row.getCell(colMap[f]!).value = exportCellValue(f, o, clientNameById)
      }
      row.commit?.()
    })
  }

  const buf = await wb.xlsx.writeBuffer()
  return Buffer.from(buf as ArrayBuffer)
}
