import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { PageHeader } from '@/components/shared/PageHeader'
import { MetricCardSkeleton } from '@/components/shared/SkeletonLoader'
import { EmptyState } from '@/components/shared/EmptyState'
import { EmployeeAvatar } from '@/components/shared/EmployeeAvatar'
import { CoreValueBadge } from '@/components/shared/CoreValueBadge'
import { BADGE_LEVEL_NAMES } from '@/lib/constants'
import type { CoreValueSlug } from '@/lib/constants'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { currentAnnualPeriod, getQuarterBounds } from '@/lib/date-utils'
import { Users } from 'lucide-react'

interface Leader {
  employee_id: string; employee_name: string; avatar_url: string | null
  recognition_count: number; unique_recognizer_count: number
  badge_level: number | null; is_joint: boolean
}
interface CVLeaders { core_value_id: string; core_value_name: string; slug: string; leaders: Leader[] }
type Tab = 'monthly' | 'quarterly' | 'annual'

const QUARTERS = ['Q1 (Apr–Jun)', 'Q2 (Jul–Sep)', 'Q3 (Oct–Dec)', 'Q4 (Jan–Mar)']

function LeaderCardSkeleton() {
  return (
    <div className="vs-card" style={{ padding: 0 }}>
      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--color-divider)' }}>
        <MetricCardSkeleton />
      </div>
      <div style={{ padding: 14 }}>
        {[0, 1].map(i => (
          <div key={i} className="flex items-center gap-3" style={{ marginBottom: i === 0 ? 12 : 0 }}>
            <div style={{ width: 36, height: 36, background: 'var(--color-neutral-200)' }} />
            <div>
              <div style={{ height: 12, width: 120, background: 'var(--color-neutral-200)', marginBottom: 5 }} />
              <div style={{ height: 10, width: 160, background: 'var(--color-neutral-200)' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  const [tab, setTab]               = useState<Tab>('monthly')
  const [leaderData, setLeaderData] = useState<CVLeaders[]>([])
  const [loading, setLoading]       = useState(true)
  const [selectedMonth, setSelectedMonth]     = useState(format(new Date(), 'yyyy-MM'))
  const [selectedQuarter, setSelectedQuarter] = useState(1)
  const [selectedYear, setSelectedYear]       = useState(new Date().getFullYear())

  useEffect(() => {
    async function load() {
      setLoading(true)
      let start: string, end: string
      if (tab === 'monthly') {
        const d = new Date(`${selectedMonth}-01`)
        start = startOfMonth(d).toISOString().split('T')[0]
        end   = endOfMonth(d).toISOString().split('T')[0]
      } else if (tab === 'quarterly') {
        const b = getQuarterBounds(selectedQuarter, selectedYear)
        start = b.start; end = b.end
      } else {
        const b = currentAnnualPeriod(); start = b.start; end = b.end
      }
      const { data: coreValues } = await supabase.from('core_values').select('id, name, slug').eq('is_active', true).order('display_order')
      const cvList = coreValues ?? []
      const results: CVLeaders[] = []
      for (const cv of cvList) {
        const { data: noms } = await supabase.from('nominations').select('nominee_id, nominator_id').eq('core_value_id', cv.id).eq('status', 'approved').gte('approved_at', `${start}T00:00:00Z`).lte('approved_at', `${end}T23:59:59Z`)
        const empMap: Record<string, { count: number; uniqueNominators: Set<string> }> = {}
        for (const n of noms ?? []) {
          if (!empMap[n.nominee_id]) empMap[n.nominee_id] = { count: 0, uniqueNominators: new Set() }
          empMap[n.nominee_id].count++
          empMap[n.nominee_id].uniqueNominators.add(n.nominator_id)
        }
        if (Object.keys(empMap).length === 0) { results.push({ core_value_id: cv.id, core_value_name: cv.name, slug: cv.slug, leaders: [] }); continue }
        const sorted = Object.entries(empMap).sort(([, a], [, b]) => b.count !== a.count ? b.count - a.count : b.uniqueNominators.size - a.uniqueNominators.size)
        const topCount = sorted[0][1].count
        const topUnique = sorted[0][1].uniqueNominators.size
        const topEntries = sorted.filter(([, v]) => v.count === topCount && v.uniqueNominators.size === topUnique)
        const isJoint = topEntries.length > 1
        const empIds = topEntries.map(([id]) => id)
        const { data: empData } = await supabase.from('employees').select('id, full_name, avatar_url').in('id', empIds)
        const { data: badgeData } = await supabase.from('employee_value_badges').select('employee_id, badge_level').in('employee_id', empIds).eq('core_value_id', cv.id).eq('period_type', 'annual')
        const badgeMap = new Map((badgeData ?? []).map(b => [b.employee_id, b.badge_level]))
        const leaders: Leader[] = topEntries.map(([id, v]) => {
          const emp = (empData ?? []).find(e => e.id === id)
          return { employee_id: id, employee_name: emp?.full_name ?? id, avatar_url: emp?.avatar_url ?? null, recognition_count: v.count, unique_recognizer_count: v.uniqueNominators.size, badge_level: badgeMap.get(id) ?? null, is_joint: isJoint }
        })
        results.push({ core_value_id: cv.id, core_value_name: cv.name, slug: cv.slug, leaders })
      }
      setLeaderData(results)
      setLoading(false)
    }
    load()
  }, [tab, selectedMonth, selectedQuarter, selectedYear])

  const allEmpty = !loading && leaderData.every(cv => cv.leaders.length === 0)

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        kicker="HR Analytics"
        title="Recognition Leaders"
        subtitle="Who is being most recognized for each Core Value across your selected period."
      />

      {/* Period controls */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Segmented tab */}
        <div className="vs-seg" style={{ width: 'fit-content' }}>
          {(['monthly', 'quarterly', 'annual'] as Tab[]).map(t => (
            <button
              key={t}
              style={{
                padding: '6px 16px', fontSize: 13,
                fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 600,
                border: 'none', borderRight: '1px solid var(--color-divider)',
                background: tab === t ? 'var(--color-accent)' : 'transparent',
                color: tab === t ? 'var(--color-bg)' : 'var(--color-neutral-600)',
                cursor: 'pointer', transition: 'background 120ms, color 120ms',
                textTransform: 'capitalize',
              }}
              onClick={() => setTab(t)}
              aria-pressed={tab === t}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Period pickers */}
        <div className="flex flex-wrap items-center gap-2">
          {tab === 'monthly' && (
            <input
              type="month"
              className="vs-input"
              style={{ height: 32, fontSize: 13 }}
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              aria-label="Select month"
            />
          )}
          {tab === 'quarterly' && (
            <>
              <select
                className="vs-input"
                style={{ height: 32, fontSize: 13 }}
                value={selectedQuarter}
                onChange={e => setSelectedQuarter(Number(e.target.value))}
                aria-label="Select quarter"
              >
                {QUARTERS.map((q, i) => <option key={i + 1} value={i + 1}>{q}</option>)}
              </select>
              <input
                type="number" min={2020} max={2099}
                className="vs-input"
                style={{ height: 32, fontSize: 13, width: 80 }}
                value={selectedYear}
                onChange={e => setSelectedYear(Number(e.target.value))}
                aria-label="Select year"
              />
            </>
          )}
          {tab === 'annual' && (
            <input
              type="number" min={2020} max={2099}
              className="vs-input"
              style={{ height: 32, fontSize: 13, width: 80 }}
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              aria-label="Select year"
            />
          )}
        </div>
      </div>

      {/* Leader cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {[...Array(5)].map((_, i) => <LeaderCardSkeleton key={i} />)}
        </div>
      ) : allEmpty ? (
        <EmptyState icon={<Users size={36} />} title="No recognition data for this period" description="Try a different date range to see recognition leaders." className="py-16" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {leaderData.map(cv => (
            <div key={cv.core_value_id} className="vs-card">
              {/* Card header */}
              <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--color-divider)' }}>
                <CoreValueBadge name={cv.core_value_name} slug={cv.slug as CoreValueSlug} size="md" />
              </div>

              {/* Leaders */}
              <div style={{ padding: '12px 14px' }}>
                {cv.leaders.length === 0 ? (
                  <p style={{ fontSize: 13, color: 'var(--color-neutral-600)' }}>No recognitions this period.</p>
                ) : (
                  <div>
                    {cv.leaders.map((l, i) => (
                      <div
                        key={l.employee_id}
                        className="flex items-center gap-3"
                        style={{
                          paddingTop: i > 0 ? 12 : 0,
                          marginTop: i > 0 ? 12 : 0,
                          borderTop: i > 0 ? '1px solid var(--color-divider)' : 'none',
                        }}
                      >
                        <EmployeeAvatar name={l.employee_name} avatarUrl={l.avatar_url} size="md" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="font-condensed" style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>
                              {l.employee_name}
                            </p>
                            {l.is_joint && (
                              <span className="vs-tag vs-tag-neutral" style={{ fontSize: 10, padding: '1px 6px' }}>Joint</span>
                            )}
                          </div>
                          <p style={{ fontSize: 12, color: 'var(--color-neutral-600)', marginTop: 2 }}>
                            {l.recognition_count} recognition{l.recognition_count !== 1 ? 's' : ''}
                            {' · '}{l.unique_recognizer_count} unique
                            {l.badge_level ? ` · ${BADGE_LEVEL_NAMES[l.badge_level]}` : ''}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
