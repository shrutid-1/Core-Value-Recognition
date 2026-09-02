import React, { useState } from 'react'
import { FileText, Download } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { PageHeader } from '@/components/shared/PageHeader'
import { exportCSV, exportXLSX } from '@/lib/export-utils'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { getQuarterBounds, currentAnnualPeriod } from '@/lib/date-utils'

type ReportType = 'monthly' | 'quarterly' | 'annual'

const STATUS_STYLE: Record<string, { label: string; cls: string }> = {
  approved:                { label: 'Approved',   cls: 'vs-tag-accent'   },
  rejected:                { label: 'Rejected',   cls: 'vs-tag-outline'  },
  pending:                 { label: 'Pending',    cls: 'vs-tag-neutral'  },
  clarification_requested: { label: 'Clarification', cls: 'vs-tag-neutral' },
  draft:                   { label: 'Draft',      cls: 'vs-tag-neutral'  },
}

export default function ReportsPage() {
  const [reportType, setReportType]     = useState<ReportType>('monthly')
  const [selectedMonth, setSelectedMonth]         = useState(format(new Date(), 'yyyy-MM'))
  const [selectedQuarter, setSelectedQuarter]     = useState(1)
  const [selectedYear, setSelectedYear]           = useState(new Date().getFullYear())
  const [generating, setGenerating]     = useState(false)
  const [reportData, setReportData]     = useState<Record<string, unknown>[] | null>(null)
  const [reportSummary, setReportSummary] = useState<{ total: number; approved: number; rejected: number; pending: number } | null>(null)

  const getPeriodBounds = () => {
    if (reportType === 'monthly') {
      const d = new Date(`${selectedMonth}-01`)
      return { start: startOfMonth(d).toISOString().split('T')[0], end: endOfMonth(d).toISOString().split('T')[0] }
    }
    if (reportType === 'quarterly') return getQuarterBounds(selectedQuarter, selectedYear)
    return currentAnnualPeriod()
  }

  const generateReport = async () => {
    setGenerating(true)
    const { start, end } = getPeriodBounds()
    const { data } = await supabase
      .from('nominations')
      .select(`id, status, submitted_at, approved_at, recognition_source, snapshot_core_value_name, snapshot_behaviour_name, snapshot_project_name, snapshot_nominator_dept, snapshot_nominee_dept, nominator:nominator_id(full_name, email), nominee:nominee_id(full_name, email), what_happened, what_impact`)
      .gte('submitted_at', `${start}T00:00:00Z`)
      .lte('submitted_at', `${end}T23:59:59Z`)
      .order('submitted_at', { ascending: false })

    const rows = (data ?? []).map(n => ({
      'Date':           n.submitted_at ? format(new Date(n.submitted_at), 'dd MMM yyyy') : '',
      'Status':         n.status,
      'Nominator':      (n.nominator as { full_name: string } | null)?.full_name ?? '',
      'Nominee':        (n.nominee   as { full_name: string } | null)?.full_name ?? '',
      'Core Value':     n.snapshot_core_value_name ?? '',
      'Behaviour':      n.snapshot_behaviour_name ?? '',
      'Project':        n.snapshot_project_name ?? '',
      'Nominator Dept': n.snapshot_nominator_dept ?? '',
      'Nominee Dept':   n.snapshot_nominee_dept ?? '',
      'Source':         n.recognition_source ?? '',
      'What Happened':  n.what_happened ?? '',
      'Impact':         n.what_impact ?? '',
    }))

    setReportData(rows)
    setReportSummary({
      total:    rows.length,
      approved: rows.filter(r => r['Status'] === 'approved').length,
      rejected: rows.filter(r => r['Status'] === 'rejected').length,
      pending:  rows.filter(r => r['Status'] === 'pending').length,
    })
    setGenerating(false)
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        kicker="HR Analytics"
        title="Reports"
        subtitle="Generate, filter and export recognition reports by period."
      />

      {/* Configuration card */}
      <div className="vs-card">
        <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid var(--color-divider)' }}>
          <h3 className="font-condensed" style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>Configure Report</h3>
        </div>
        <div style={{ padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Period type seg control */}
          <div className="vs-seg" style={{ width: 'fit-content' }}>
            {(['monthly', 'quarterly', 'annual'] as ReportType[]).map(t => (
              <button
                key={t}
                style={{
                  padding: '6px 16px', fontSize: 13,
                  fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 600,
                  border: 'none', borderRight: '1px solid var(--color-divider)',
                  background: reportType === t ? 'var(--color-accent)' : 'transparent',
                  color: reportType === t ? 'var(--color-bg)' : 'var(--color-neutral-600)',
                  cursor: 'pointer', transition: 'background 120ms, color 120ms',
                  textTransform: 'capitalize',
                }}
                onClick={() => { setReportType(t); setReportData(null) }}
                aria-pressed={reportType === t}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Period pickers + generate button */}
          <div className="flex flex-wrap items-end gap-3">
            {reportType === 'monthly' && (
              <div>
                <label htmlFor="rep-month" style={{ display: 'block', fontSize: 12, color: 'var(--color-neutral-600)', marginBottom: 4 }}>Month</label>
                <input id="rep-month" type="month" className="vs-input" style={{ height: 32, fontSize: 13 }} value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} />
              </div>
            )}
            {reportType === 'quarterly' && (
              <>
                <div>
                  <label htmlFor="rep-q" style={{ display: 'block', fontSize: 12, color: 'var(--color-neutral-600)', marginBottom: 4 }}>Quarter</label>
                  <select id="rep-q" className="vs-input" style={{ height: 32, fontSize: 13 }} value={selectedQuarter} onChange={e => setSelectedQuarter(Number(e.target.value))}>
                    <option value={1}>Q1 (Apr–Jun)</option><option value={2}>Q2 (Jul–Sep)</option>
                    <option value={3}>Q3 (Oct–Dec)</option><option value={4}>Q4 (Jan–Mar)</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="rep-year" style={{ display: 'block', fontSize: 12, color: 'var(--color-neutral-600)', marginBottom: 4 }}>Year</label>
                  <input id="rep-year" type="number" min={2020} max={2099} className="vs-input" style={{ height: 32, fontSize: 13, width: 80 }} value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} />
                </div>
              </>
            )}
            {reportType === 'annual' && (
              <div>
                <label htmlFor="rep-year2" style={{ display: 'block', fontSize: 12, color: 'var(--color-neutral-600)', marginBottom: 4 }}>Year</label>
                <input id="rep-year2" type="number" min={2020} max={2099} className="vs-input" style={{ height: 32, fontSize: 13, width: 80 }} value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} />
              </div>
            )}
            <button
              className="vs-btn vs-btn-primary relative"
              style={{ height: 32, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
              onClick={generateReport}
              disabled={generating}
              aria-busy={generating}
            >
              <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />
              <FileText size={13} aria-hidden="true" />
              {generating ? 'Generating…' : 'Generate Report'}
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {reportSummary && reportData && (
        <>
          {/* Summary metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Nominations', value: reportSummary.total },
              { label: 'Approved',           value: reportSummary.approved },
              { label: 'Rejected',           value: reportSummary.rejected },
              { label: 'Pending',            value: reportSummary.pending },
            ].map(m => (
              <div key={m.label} className="vs-card" style={{ padding: 14 }}>
                <p className="font-condensed" style={{ fontSize: 34, fontWeight: 600, lineHeight: 1, color: 'var(--color-text)', fontVariantNumeric: 'tabular-nums' }}>{m.value}</p>
                <p style={{ fontSize: 12, color: 'var(--color-neutral-600)', marginTop: 5 }}>{m.label}</p>
              </div>
            ))}
          </div>

          {/* Export actions */}
          <div className="flex gap-2 flex-wrap">
            <button
              className="vs-btn"
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
              onClick={() => exportCSV(reportData!, `valuespot-${reportType}-report`)}
            >
              <Download size={13} aria-hidden="true" /> Export CSV
            </button>
            <button
              className="vs-btn"
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
              onClick={() => exportXLSX([{ name: 'Recognitions', data: reportData! }], `valuespot-${reportType}-report`)}
            >
              <Download size={13} aria-hidden="true" /> Export XLSX
            </button>
          </div>

          {/* Preview table */}
          <div className="vs-card" style={{ overflow: 'hidden' }}>
            <div className="overflow-x-auto">
              <table className="vs-table w-full" style={{ minWidth: 620 }}>
                <thead>
                  <tr style={{ background: 'color-mix(in srgb, var(--color-neutral-300) 30%, transparent)' }}>
                    {['Date', 'Nominee', 'Nominator', 'Core Value', 'Status', 'Source'].map(h => (
                      <th key={h} style={{ whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reportData.slice(0, 25).map((r, i) => {
                    const statusInfo = STATUS_STYLE[r['Status'] as string] ?? { label: r['Status'] as string, cls: 'vs-tag-neutral' }
                    return (
                      <tr key={i}>
                        <td style={{ whiteSpace: 'nowrap', color: 'var(--color-neutral-600)', fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>{r['Date'] as string}</td>
                        <td style={{ fontWeight: 500, color: 'var(--color-text)' }}>{r['Nominee'] as string}</td>
                        <td style={{ color: 'var(--color-neutral-700)' }}>{r['Nominator'] as string}</td>
                        <td style={{ color: 'var(--color-neutral-700)' }}>{r['Core Value'] as string}</td>
                        <td><span className={`vs-tag ${statusInfo.cls}`}>{statusInfo.label}</span></td>
                        <td style={{ color: 'var(--color-neutral-700)', textTransform: 'capitalize' }}>{r['Source'] as string}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {reportData.length > 25 && (
              <div style={{ padding: '10px 12px', borderTop: '1px solid var(--color-divider)', background: 'color-mix(in srgb, var(--color-neutral-300) 20%, transparent)' }}>
                <p style={{ fontSize: 12, color: 'var(--color-neutral-600)' }}>
                  Showing first 25 of <strong style={{ color: 'var(--color-text)' }}>{reportData.length}</strong> rows — export to see all records.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
