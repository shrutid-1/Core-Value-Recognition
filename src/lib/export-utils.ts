import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { format } from 'date-fns'

/** Export data as CSV file */
export function exportCSV(
  data: Record<string, unknown>[],
  filename: string
): void {
  if (data.length === 0) return

  const headers = Object.keys(data[0])
  const rows = data.map(row =>
    headers.map(h => {
      const val = row[h]
      if (val === null || val === undefined) return ''
      const str = String(val)
      // Escape quotes and wrap in quotes if contains comma/newline/quote
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }).join(',')
  )

  const csv = [headers.join(','), ...rows].join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  saveAs(blob, `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`)
}

/** Export data as XLSX file */
export function exportXLSX(
  sheets: Array<{ name: string; data: Record<string, unknown>[] }>,
  filename: string
): void {
  const workbook = XLSX.utils.book_new()

  sheets.forEach(({ name, data }) => {
    const worksheet = XLSX.utils.json_to_sheet(data)
    XLSX.utils.book_append_sheet(workbook, worksheet, name.slice(0, 31)) // Excel 31-char limit
  })

  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  saveAs(blob, `${filename}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`)
}
