// BidFlow Tracker — Excel import parsing (Feature 1, server-only)
//
// Reads an uploaded tracker workbook into raw rows (per sheet). Normalisation,
// diffing and applying happen on the client (Excel Sync page) against the live
// store, so this stays a pure parser.

import ExcelJS from 'exceljs'
import type { Opportunity } from './types'
import {
  SHEET_NAMES, HEADER_FIELD_MAP, normalizeHeader, DATE_FIELDS, type RawRow,
} from './excelTemplate'

export interface ImportError { sheet: string; row: number; message: string }
export interface ParsedSheet { sheet: string; rows: RawRow[] }
export interface ParseResult { sheets: ParsedSheet[]; errors: ImportError[]; totalRows: number }

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

function cellToString(cell: ExcelJS.Cell, isDate: boolean): string | number | null {
  const v = cell.value
  if (v == null) return null
  if (isDate) {
    if (v instanceof Date) return v.toISOString().slice(0, 10)
    const t = cell.text?.trim()
    return t || null
  }
  if (typeof v === 'number') return v
  if (typeof v === 'object') {
    // rich text / formula result → use display text
    const t = cell.text
    return t ? t.trim() : null
  }
  return String(v).trim()
}

export async function parseWorkbook(buffer: Buffer): Promise<ParseResult> {
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.load(buffer as unknown as ArrayBuffer)

  const sheets: ParsedSheet[] = []
  const errors: ImportError[] = []
  let totalRows = 0

  for (const sheetName of SHEET_NAMES) {
    const ws = wb.getWorksheet(sheetName)
    if (!ws) continue
    const { headerRow, colMap } = detectColumns(ws)
    if (headerRow < 0) continue
    const fields = Object.keys(colMap) as (keyof Opportunity)[]
    const refCol = colMap.ref
    if (!refCol) continue

    const rows: RawRow[] = []
    const dataStart = headerRow + 1
    let gap = 0
    for (let r = dataStart; r <= dataStart + 5000; r++) {
      const ref = String(ws.getRow(r).getCell(refCol).text ?? '').trim()
      if (!ref) { if (++gap > 30) break; else continue }
      gap = 0
      const raw: RawRow = {}
      for (const f of fields) {
        raw[f] = cellToString(ws.getRow(r).getCell(colMap[f]!), DATE_FIELDS.has(f))
      }
      if (!raw.title || !String(raw.title).trim()) {
        errors.push({ sheet: sheetName, row: r, message: `Row ${r}: missing proposal title (ref ${ref})` })
      }
      rows.push(raw)
      totalRows++
    }
    sheets.push({ sheet: sheetName, rows })
  }

  return { sheets, errors, totalRows }
}
