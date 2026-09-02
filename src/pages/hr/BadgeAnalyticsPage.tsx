import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { PageHeader } from '@/components/shared/PageHeader'
import { MetricCardSkeleton, ChartSkeleton } from '@/components/shared/SkeletonLoader'
import { EmptyState } from '@/components/shared/EmptyState'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { BADGE_LEVEL_NAMES } from '@/lib/constants'
import { currentAnnualPeriod } from '@/lib/date-utils'
import { Zap } from 'lucide-react'

interface BadgeDist {
  core_value_name: string; slug: string
  b1: number; b2: number; b3: number; b4: number; b5: number
}
interface Summary {
  total_with_badge: number
  b1: number; b2: number; b3: number; b4: number; b5: number
}
type BadgeLevelKey = 'b1' | 'b2' | 'b3' | 'b4' | 'b5'

// Accent-family bar colours — monochromatic steel-blue
const BADGE_COLORS = ['#94bce3', '#749dc4', '#5980a6', '#416180', '#2c455d'] as const
const AXIS_TICK    = { fontSize: 11, fill: '#7a7a7d' } as const
const TOOLTIP_STYLE = { fontSize: 12, borderRadius: 0, border: '1px solid rgba(29,31,32,0.16)', boxShadow: 'none', background: '#f2f2f3' } as const

interface MetricTileProps { label: string; value: number; accent?: string }
function MetricTile({ label, value, accent = 'var(--color-accent)' }: MetricTileProps) {
  return (
    <div className="vs-card" style={{ padding: 14 }}>
      <p
        className="font-condensed"
        style={{ fontSize: 34, fontWeight: 600, lineHeight: 1, color: accent, fontVariantNumeric: 'tabular-nums' }}
      >
        {value}
      </p>
      <p style={{ fontSize: 12, color: 'var(--color-neutral-600)', marginTop: 5, lineHeight: 1.35 }}>{label}</p>
    </div>
  )
}

export default function BadgeAnalyticsPage() {
  const [dist, setDist]       = useState<BadgeDist[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { start } = currentAnnualPeriod()
      const { data: rawBadges } = await supabase
        .from('employee_value_badges')
        .select('badge_level, core_values:core_value_id(name, slug)')
        .eq('period_type', 'annual')
        .gte('period_start', start)
        .not('badge_level', 'is', null)

      const badges = rawBadges as Array<{ badge_level: number | null; core_values: { name: string; slug: string } | null }> | null
      const cvMap: Record<string, BadgeDist> = {}
      const s: Summary = { total_with_badge: 0, b1: 0, b2: 0, b3: 0, b4: 0, b5: 0 }
      for (const b of badges ?? []) {
        const cv = b.core_values as { name: string; slug: string } | null
        if (!cv || !b.badge_level) continue
        if (!cvMap[cv.name]) cvMap[cv.name] = { core_value_name: cv.name, slug: cv.slug, b1: 0, b2: 0, b3: 0, b4: 0, b5: 0 }
        const key = `b${b.badge_level}` as BadgeLevelKey

cvMap[cv.name][key] += 1

const sKey = `b${b.badge_level}` as BadgeLevelKey

s[sKey] += 1

s.total_with_badge += 1
      }
      setDist(Object.values(cvMap))
      setSummary(s)
      setLoading(false)
    }
    load()
  }, [])

  const summaryItems = summary
    ? [
        { label: 'Employees with a Badge', value: summary.total_with_badge, accent: 'var(--color-accent)' },
        ...([1, 2, 3, 4, 5] as const).map((l, i) => ({
          label: BADGE_LEVEL_NAMES[l],
          value: summary[`b${l}` as keyof Summary] as number,
          accent: BADGE_COLORS[i],
        })),
      ]
    : []

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        kicker="HR Analytics"
        title="Badge Analytics"
        subtitle="Annual badge distribution across Core Values for the current period."
      />

      {loading ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
            {[...Array(6)].map((_, i) => <MetricCardSkeleton key={i} />)}
          </div>
          <div className="vs-card" style={{ padding: 16 }}><ChartSkeleton height={280} /></div>
        </>
      ) : (
        <>
          {/* Summary tiles */}
          {summary && (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
              {summaryItems.map((m, i) => (
                <MetricTile key={i} label={m.label} value={m.value} accent={m.accent} />
              ))}
            </div>
          )}

          {/* Distribution chart */}
          <div className="vs-card">
            <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid var(--color-divider)' }}>
              <h3 className="font-condensed" style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>
                Badge Distribution by Core Value
              </h3>
            </div>
            <div style={{ padding: '12px 16px 16px' }}>
              {dist.length === 0 ? (
                <EmptyState icon={<Zap size={36} />} title="No badges earned yet" description="Badge distribution will appear here once employees receive enough recognitions." className="py-10" />
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={dist} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(29,31,32,0.1)" vertical={false} />
                    <XAxis dataKey="core_value_name" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                    <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Legend iconType="square" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                    {([1, 2, 3, 4, 5] as const).map((l, i) => (
                      <Bar key={l} dataKey={`b${l}`} name={BADGE_LEVEL_NAMES[l]} stackId="badges" fill={BADGE_COLORS[i]} radius={[0, 0, 0, 0]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
