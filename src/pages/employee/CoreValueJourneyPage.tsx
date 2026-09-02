import React, { useEffect, useState } from 'react'
import { Star } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import type { BadgeSummary } from '@/types'
import { PageHeader } from '@/components/shared/PageHeader'
import { Skeleton } from '@/components/shared/SkeletonLoader'
import { EmptyState } from '@/components/shared/EmptyState'
import { currentAnnualPeriod } from '@/lib/date-utils'
import { CORE_VALUE_COLORS } from '@/lib/constants'
import type { CoreValueSlug } from '@/lib/constants'

function JourneyCardSkeleton() {
  return (
    <div className="vs-card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <Skeleton style={{ height: 12, width: 100 }} />
      <Skeleton style={{ height: 20, width: 120 }} />
      <Skeleton style={{ height: 11, width: 80 }} />
      <Skeleton style={{ height: 4, width: '100%' }} />
    </div>
  )
}

/** Additive badge SVG icons — blueprint stroke style, no fill */
function BadgeSVG({ level, color }: { level: number; color: string }) {
  return (
    <svg
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.4}
      aria-hidden="true"
      className="vs-badge-icon"
    >
      {/* L1: outer square */}
      <rect x={3} y={3} width={18} height={18} />
      {/* L2: inner square */}
      {level >= 2 && <rect x={7} y={7} width={10} height={10} />}
      {/* L3: crosshair lines */}
      {level >= 3 && <><line x1={12} y1={3} x2={12} y2={21} /><line x1={3} y1={12} x2={21} y2={12} /></>}
      {/* L4: diagonals */}
      {level >= 4 && <><line x1={3} y1={3} x2={21} y2={21} /><line x1={21} y1={3} x2={3} y2={21} /></>}
      {/* L5: filled core */}
      {level >= 5 && <rect x={9} y={9} width={6} height={6} fill={color} />}
    </svg>
  )
}

export default function CoreValueJourneyPage() {
  const { employee } = useAuth()
  const [badges, setBadges]   = useState<BadgeSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!employee) return
    const { start, end } = currentAnnualPeriod()

    Promise.all([
      supabase.from('employee_value_badges').select('*, core_values:core_value_id (id, name, slug, accent_color, icon)').eq('employee_id', employee.id).eq('period_type', 'annual'),
      supabase.from('badge_definitions').select('*').order('level'),
      supabase.from('core_values').select('id, name, slug, accent_color, icon').eq('is_active', true).order('display_order'),
    ]).then(([badgeRes, defRes, cvRes]) => {
      const defs = defRes.data ?? []
      const coreValues = cvRes.data ?? []
      const badgeMap = new Map((badgeRes.data ?? []).map(b => [b.core_value_id, b]))

      const result = coreValues.map(cv => {
        const b = badgeMap.get(cv.id)
        const level = b?.badge_level ?? null
        const count = b?.recognition_count ?? 0
        const uniqueCount = b?.unique_recognizer_count ?? 0
        const nextDef = defs.find(d => d.level === (level ? level + 1 : 1))
        const currentDef = defs.find(d => d.level === level)
        return {
          core_value_id: cv.id, core_value_name: cv.name, core_value_slug: cv.slug,
          core_value_color: cv.accent_color, core_value_icon: cv.icon,
          badge_level: level, badge_name: currentDef?.name ?? null,
          recognition_count: count, unique_recognizer_count: uniqueCount,
          next_threshold: nextDef?.minimum_count ?? null, next_badge_name: nextDef?.name ?? null,
          period_start: b?.period_start ?? start, period_end: b?.period_end ?? end,
        } satisfies BadgeSummary
      })
      setBadges(result)
      setLoading(false)
    })
  }, [employee])

  const allEmpty = !loading && badges.every(b => b.recognition_count === 0)

  return (
    <div className="animate-fade-in" style={{ maxWidth: 900, margin: '0 auto' }}>
      <PageHeader
        kicker="Annual Period"
        title="My Core Value Journey"
        subtitle="Your recognition progress for each of Touchcore's Core Values this year."
      />

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...Array(5)].map((_, i) => <JourneyCardSkeleton key={i} />)}
        </div>
      ) : allEmpty ? (
        <EmptyState
          icon={<Star size={36} />}
          title="Your journey starts here"
          description="When colleagues recognize you for a Core Value behaviour, your progress will appear here."
          className="py-12"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {badges.map(b => {
            const slug  = b.core_value_slug as CoreValueSlug
            const tone  = CORE_VALUE_COLORS[slug] ?? '#5980a6'
            const level = b.badge_level
            const count = b.recognition_count
            const next  = b.next_threshold
            const pct   = level === 5 ? 100 : next ? Math.min(100, Math.round((count / next) * 100)) : 0

            return (
              <div
                key={b.core_value_id}
                className="vs-card relative"
                style={{
                  padding: 16,
                  borderLeft: `3px solid ${tone}`,
                  overflow: 'visible',
                }}
              >
                <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />

                {/* Header */}
                <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
                  <p
                    className="vs-kicker"
                    style={{ color: tone, fontSize: 10 }}
                  >
                    {b.core_value_name}
                  </p>
                  {level !== null && <BadgeSVG level={level} color={tone} />}
                </div>

                {/* Badge name */}
                <p
                  className="font-condensed"
                  style={{
                    fontSize: 20,
                    fontWeight: 600,
                    color: level ? tone : 'var(--color-neutral-500)',
                    letterSpacing: '-0.01em',
                    marginBottom: 6,
                  }}
                >
                  {level ? b.badge_name : 'No badge yet'}
                </p>

                {/* Counts */}
                <p style={{ fontSize: 13, color: 'var(--color-text)', fontWeight: 500, marginBottom: 2 }}>
                  {count} recognition{count !== 1 ? 's' : ''}
                </p>
                <p style={{ fontSize: 12, color: 'var(--color-neutral-600)', marginBottom: 12 }}>
                  {b.unique_recognizer_count} unique recognizer{b.unique_recognizer_count !== 1 ? 's' : ''}
                </p>

                {/* Progress bar */}
                {level !== 5 ? (
                  <>
                    <div
                      className="vs-progress-track"
                      role="progressbar"
                      aria-valuenow={count}
                      aria-valuemax={next ?? 1}
                      aria-valuemin={0}
                      aria-label={`Progress toward ${b.next_badge_name ?? 'next badge'}`}
                    >
                      <div
                        className="vs-progress-fill"
                        style={{ width: `${pct}%`, background: tone }}
                      />
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--color-neutral-600)', marginTop: 5 }}>
                      {next
                        ? level
                          ? `${count}/${next} for ${b.next_badge_name}`
                          : `${count}/1 recognition unlocks Cheers`
                        : count === 0 ? '1 recognition unlocks Cheers' : ''}
                    </p>
                  </>
                ) : (
                  <p
                    className="vs-kicker"
                    style={{ color: tone, fontSize: 10 }}
                  >
                    Highest badge achieved ✓
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
