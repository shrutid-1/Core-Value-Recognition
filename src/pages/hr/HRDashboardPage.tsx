import React, { useEffect, useState } from 'react'
import { Award, Users, BarChart3, Clock, Star, ArrowLeftRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { PageHeader } from '@/components/shared/PageHeader'
import { MetricCardSkeleton, CardSkeleton, ChartSkeleton } from '@/components/shared/SkeletonLoader'
import { RecognitionCard } from '@/components/recognition/RecognitionCard'
import { CoreValueBadge } from '@/components/shared/CoreValueBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line,
} from 'recharts'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import type { RecognitionFeedItem } from '@/types'
import type { CoreValueSlug } from '@/lib/constants'
import { todayIST } from '@/lib/date-utils'

interface Metrics {
  totalRecognitions: number
  employeesRecognized: number
  activeEmployees: number
  pendingApprovals: number
  mostRecognizedValue: string | null
  crossTeamCount: number
  crossTeamPct: number
  coverage: number
}

interface DailyLeader { core_value_name: string; employee_name: string; count: number }
interface CVDist { name: string; count: number; color: string }
interface TrendPoint { month: string; count: number }

const AXIS_TICK        = { fontSize: 11, fill: '#7a7a7d' } as const
const TOOLTIP_STYLE    = { fontSize: 12, borderRadius: 0, border: '1px solid rgba(29,31,32,0.16)', boxShadow: 'none', background: '#f2f2f3' } as const
const CHART_MARGIN     = { top: 4, right: 8, left: -20, bottom: 0 } as const
const ACCENT           = '#5980a6'

interface MetricTileProps {
  label: string; value: number | string; icon: React.ReactNode
  highlight?: boolean; isText?: boolean
}
function MetricTile({ label, value, icon, highlight = false, isText }: MetricTileProps) {
  return (
    <div
      className="vs-card"
      style={{
        padding: 16,
        borderLeft: highlight ? '3px solid var(--color-accent)' : undefined,
      }}
    >
      <div
        style={{
          width: 28, height: 28,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'color-mix(in srgb, var(--color-accent) 12%, transparent)',
          color: 'var(--color-accent-700)',
          marginBottom: 8,
        }}
        aria-hidden="true"
      >
        {icon}
      </div>
      <p
        className="font-condensed"
        style={{
          fontSize: isText ? 16 : 34, fontWeight: 600, lineHeight: 1,
          color: 'var(--color-text)', fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </p>
      <p style={{ fontSize: 12, color: 'var(--color-neutral-600)', marginTop: 5, lineHeight: 1.35 }}>{label}</p>
    </div>
  )
}

function SectionCard({ title, children, loading, skeletonHeight = 192 }: { title: string; children: React.ReactNode; loading: boolean; skeletonHeight?: number }) {
  return (
    <div className="vs-card">
      <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid var(--color-divider)' }}>
        <h3 className="font-condensed" style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>{title}</h3>
      </div>
      <div style={{ padding: '12px 16px 16px' }}>
        {loading ? <ChartSkeleton height={skeletonHeight} /> : children}
      </div>
    </div>
  )
}

export default function HRDashboardPage() {
  const [metrics, setMetrics]         = useState<Metrics | null>(null)
  const [dailyLeaders, setDailyLeaders] = useState<DailyLeader[]>([])
  const [cvDist, setCvDist]           = useState<CVDist[]>([])
  const [trend, setTrend]             = useState<TrendPoint[]>([])
  const [recentFeed, setRecentFeed]   = useState<RecognitionFeedItem[]>([])
  const [loading, setLoading]         = useState(true)

  useEffect(() => {
    async function load() {
      const today = todayIST()
      const [totalRes, empRecRes, activeRes, pendingRes, cvDistRes, recentRes] = await Promise.all([
        supabase.from('nominations').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
        supabase.from('nominations').select('nominee_id').eq('status', 'approved'),
        supabase.from('employees').select('id', { count: 'exact' }).eq('is_active', true),
        supabase.from('nominations').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('nominations').select('core_value_id, core_values:core_value_id(name, slug, accent_color), snapshot_nominator_dept, snapshot_nominee_dept').eq('status', 'approved'),
        supabase.from('v_recognition_feed').select('*').order('approved_at', { ascending: false }).limit(6),
      ])
      const uniqueRecipients = new Set((empRecRes.data ?? []).map(n => n.nominee_id)).size
      const total = totalRes.count ?? 0
      const active = activeRes.count ?? 0
      const coverage = active > 0 ? Math.round((uniqueRecipients / active) * 100) : 0
      const crossTeam = (cvDistRes.data ?? []).filter(n => n.snapshot_nominator_dept && n.snapshot_nominee_dept && n.snapshot_nominator_dept !== n.snapshot_nominee_dept).length
      const crossTeamPct = total > 0 ? Math.round((crossTeam / total) * 100) : 0
      const cvCountMap: Record<string, { name: string; slug: string; color: string; count: number }> = {}
      ;(cvDistRes.data ?? []).forEach(n => {
        const cv = n.core_values as { name: string; slug: string; accent_color: string } | null
        if (!cv) return
        if (!cvCountMap[cv.name]) cvCountMap[cv.name] = { name: cv.name, slug: cv.slug, color: cv.accent_color, count: 0 }
        cvCountMap[cv.name].count++
      })
      const dist: CVDist[] = Object.values(cvCountMap)
      const topCV = dist.sort((a, b) => b.count - a.count)[0]?.name ?? null
      setCvDist(dist)
      setMetrics({ totalRecognitions: total, employeesRecognized: uniqueRecipients, activeEmployees: active, pendingApprovals: pendingRes.count ?? 0, mostRecognizedValue: topCV, crossTeamCount: crossTeam, crossTeamPct, coverage })
      const months: TrendPoint[] = []
      for (let i = 11; i >= 0; i--) {
        const d = subMonths(new Date(), i)
        const start = startOfMonth(d).toISOString()
        const end   = endOfMonth(d).toISOString()
        const { count } = await supabase.from('nominations').select('id', { count: 'exact', head: true }).eq('status', 'approved').gte('approved_at', start).lte('approved_at', end)
        months.push({ month: format(d, 'MMM yy'), count: count ?? 0 })
      }
      setTrend(months)
      const { data: todayNoms } = await supabase.from('nominations').select('nominee_id, core_value_id, nominee:nominee_id(full_name), core_values:core_value_id(name)').eq('status', 'approved').gte('approved_at', `${today}T00:00:00+00:00`).lte('approved_at', `${today}T23:59:59+00:00`)
      const leaderMap: Record<string, Record<string, { count: number; name: string; cvName: string }>> = {}
      ;(todayNoms ?? []).forEach(n => {
        const cv = n.core_values as { name: string } | null
        const emp = n.nominee as { full_name: string } | null
        if (!cv || !emp) return
        if (!leaderMap[cv.name]) leaderMap[cv.name] = {}
        if (!leaderMap[cv.name][n.nominee_id]) leaderMap[cv.name][n.nominee_id] = { count: 0, name: emp.full_name, cvName: cv.name }
        leaderMap[cv.name][n.nominee_id].count++
      })
      const leaders: DailyLeader[] = Object.entries(leaderMap).map(([cvName, empMap]) => {
        const top = Object.values(empMap).sort((a, b) => b.count - a.count)[0]
        return { core_value_name: cvName, employee_name: top.name, count: top.count }
      })
      setDailyLeaders(leaders)
      setRecentFeed(recentRes.data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        kicker="HR Analytics"
        title="Culture & Recognition"
        subtitle="How Touchcore's Core Values are being demonstrated across the organisation."
      />

      {/* Metric tiles */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
          {[...Array(6)].map((_, i) => <MetricCardSkeleton key={i} />)}
        </div>
      ) : metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
          <MetricTile label="Total Recognitions"   value={metrics.totalRecognitions}        icon={<Award size={15} />} />
          <MetricTile label="Employees Recognized" value={metrics.employeesRecognized}      icon={<Users size={15} />} />
          <MetricTile label="Recognition Coverage" value={`${metrics.coverage}%`}           icon={<BarChart3 size={15} />} />
          <MetricTile label="Pending Approvals"    value={metrics.pendingApprovals}         icon={<Clock size={15} />} highlight={metrics.pendingApprovals > 0} />
          <MetricTile label="Top Core Value"       value={metrics.mostRecognizedValue ?? '—'} icon={<Star size={15} />} isText />
          <MetricTile label="Cross-Team"           value={`${metrics.crossTeamPct}%`}       icon={<ArrowLeftRight size={15} />} />
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard title="Recognition Trend (12 months)" loading={loading}>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={trend} margin={CHART_MARGIN}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(29,31,32,0.1)" vertical={false} />
              <XAxis dataKey="month" tick={AXIS_TICK} axisLine={false} tickLine={false} />
              <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Line type="monotone" dataKey="count" stroke={ACCENT} strokeWidth={2} dot={false} name="Recognitions" />
            </LineChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title="Core Value Distribution" loading={loading}>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={cvDist} margin={CHART_MARGIN}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(29,31,32,0.1)" vertical={false} />
              <XAxis dataKey="name" tick={AXIS_TICK} axisLine={false} tickLine={false} />
              <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="count" fill={ACCENT} name="Recognitions" radius={[0, 0, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>
      </div>

      {/* Daily Leaders */}
      {!loading && dailyLeaders.length > 0 && (
        <div className="vs-card">
          <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid var(--color-divider)' }}>
            <h3 className="font-condensed" style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>Most Recognized Today</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3" style={{ padding: '12px 16px 16px' }}>
            {dailyLeaders.map(l => (
              <div
                key={l.core_value_name}
                style={{
                  padding: 12,
                  border: '1px solid var(--color-divider)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <CoreValueBadge name={l.core_value_name} slug={l.core_value_name.toLowerCase() as CoreValueSlug} size="sm" />
                <p className="font-condensed" style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>{l.employee_name}</p>
                <p style={{ fontSize: 12, color: 'var(--color-neutral-600)' }}>{l.count} recognition{l.count !== 1 ? 's' : ''} today</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Recognitions */}
      <div className="vs-card">
        <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid var(--color-divider)' }}>
          <h3 className="font-condensed" style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>Recent Recognitions</h3>
        </div>
        <div style={{ padding: '0 16px 16px' }}>
          {loading ? (
            <div className="space-y-3 pt-3">{[...Array(3)].map((_, i) => <CardSkeleton key={i} />)}</div>
          ) : recentFeed.length === 0 ? (
            <EmptyState icon={<Award size={32} />} title="No recognitions yet" description="Approved recognitions will appear here." className="py-8" />
          ) : (
            <div style={{ borderTop: '1px solid var(--color-divider)' }}>
              {recentFeed.map(item => <RecognitionCard key={item.id} item={item} compact />)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
