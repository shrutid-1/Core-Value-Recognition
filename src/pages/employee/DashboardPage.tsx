import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Award, Users, Calendar, Star, Plus, ArrowRight } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { ROUTES } from '@/lib/constants'
import { MetricCardSkeleton, CardSkeleton, Skeleton } from '@/components/shared/SkeletonLoader'
import { EmptyState } from '@/components/shared/EmptyState'
import { RecognitionCard } from '@/components/recognition/RecognitionCard'
import { BadgeProgressMini } from '@/components/badges/BadgeProgressMini'
import type { RecognitionFeedItem, BadgeSummary } from '@/types'

interface DashboardStats {
  received: number
  given: number
  thisMonth: number
  mostRecognizedValue: string | null
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

interface MetricTileProps {
  label: string
  value: number | string
  icon: React.ReactNode
  isText?: boolean
}
function MetricTile({ label, value, icon, isText }: MetricTileProps) {
  return (
    <div
      className="vs-card relative"
      style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 6 }}
    >
      <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />
      <div
        style={{
          width: 28,
          height: 28,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'color-mix(in srgb, var(--color-accent) 12%, transparent)',
          color: 'var(--color-accent-700)',
          marginBottom: 4,
        }}
        aria-hidden="true"
      >
        {icon}
      </div>
      <p
        className="font-condensed vs-metric-value"
        style={{ fontSize: isText ? 18 : 34, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}
      >
        {value}
      </p>
      <p style={{ fontSize: 12, color: 'var(--color-neutral-600)', lineHeight: 1.35 }}>{label}</p>
    </div>
  )
}

export default function DashboardPage() {
  const { employee } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats]       = useState<DashboardStats | null>(null)
  const [recentFeed, setRecentFeed] = useState<RecognitionFeedItem[]>([])
  const [badges, setBadges]     = useState<BadgeSummary[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    if (!employee) return
    async function load() {
      setLoading(true)
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

      const [receivedRes, givenRes, monthRes, badgeRes, feedRes] = await Promise.all([
        supabase.from('nominations').select('id', { count: 'exact', head: true }).eq('nominee_id', employee!.id).eq('status', 'approved'),
        supabase.from('nominations').select('id', { count: 'exact', head: true }).eq('nominator_id', employee!.id).eq('status', 'approved'),
        supabase.from('nominations').select('id', { count: 'exact', head: true }).eq('nominee_id', employee!.id).eq('status', 'approved').gte('approved_at', monthStart),
        supabase.from('employee_value_badges').select('core_value_id, recognition_count, unique_recognizer_count, badge_level, period_start, period_end, core_values:core_value_id (name, slug, accent_color, icon)').eq('employee_id', employee!.id).eq('period_type', 'annual'),
        supabase.from('v_recognition_feed').select('*').or(`nominator_id.eq.${employee!.id},nominee_id.eq.${employee!.id}`).order('approved_at', { ascending: false }).limit(5),
      ])

      const valueCountMap: Record<string, number> = {}
      ;(badgeRes.data ?? []).forEach(b => {
        const cv = b.core_values as { name: string } | null
        if (cv) valueCountMap[cv.name] = (valueCountMap[cv.name] ?? 0) + b.recognition_count
      })
      const mostRecognizedValue = Object.keys(valueCountMap).length > 0
        ? Object.entries(valueCountMap).sort((a, b) => b[1] - a[1])[0][0]
        : null

      setStats({ received: receivedRes.count ?? 0, given: givenRes.count ?? 0, thisMonth: monthRes.count ?? 0, mostRecognizedValue })

      const { data: defs } = await supabase.from('badge_definitions').select('*').order('level')
      const defList = defs ?? []

      const mappedBadges: BadgeSummary[] = (badgeRes.data ?? []).map(b => {
        const cv = b.core_values as { name: string; slug: string; accent_color: string; icon: string } | null
        const level = b.badge_level
        const nextDef = defList.find(d => d.level === (level ? level + 1 : 1))
        return {
          core_value_id: b.core_value_id, core_value_name: cv?.name ?? '', core_value_slug: cv?.slug ?? '',
          core_value_color: cv?.accent_color ?? '', core_value_icon: cv?.icon ?? '',
          badge_level: level, badge_name: defList.find(d => d.level === level)?.name ?? null,
          recognition_count: b.recognition_count, unique_recognizer_count: b.unique_recognizer_count,
          next_threshold: nextDef?.minimum_count ?? null, next_badge_name: nextDef?.name ?? null,
          period_start: b.period_start, period_end: b.period_end,
        }
      })

      setBadges(mappedBadges)
      setRecentFeed(feedRes.data ?? [])
      setLoading(false)
    }
    load()
  }, [employee])

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Skeleton style={{ height: 34, width: 260 }} />
          <Skeleton style={{ height: 14, width: 360 }} />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <MetricCardSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} style={{ height: 120 }} />)}
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Greeting header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <p className="vs-kicker" style={{ marginBottom: 4 }}>Employee Dashboard</p>
          <h1
            className="font-condensed"
            style={{ fontSize: 34, fontWeight: 600, color: 'var(--color-text)', letterSpacing: '-0.015em' }}
          >
            {greeting()}, {employee?.full_name?.split(' ')[0]}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--color-neutral-600)', marginTop: 4 }}>
            Celebrate the behaviours that make Touchcore stronger.
          </p>
        </div>
        <button
          className="vs-btn vs-btn-primary relative self-start shrink-0"
          onClick={() => navigate(ROUTES.GIVE_RECOGNITION)}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />
          <Plus size={14} aria-hidden="true" />
          Give Recognition
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricTile label="Recognitions Received" value={stats?.received ?? 0} icon={<Award size={15} />} />
        <MetricTile label="Recognitions Given"    value={stats?.given ?? 0}    icon={<Users size={15} />} />
        <MetricTile label="This Month"            value={stats?.thisMonth ?? 0} icon={<Calendar size={15} />} />
        <MetricTile label="Top Core Value"        value={stats?.mostRecognizedValue ?? '—'} icon={<Star size={15} />} isText />
      </div>

      {/* Core Value Journey Preview */}
      {badges.length > 0 && (
        <div className="vs-card" style={{ overflow: 'visible' }}>
          <div
            className="vs-section-header"
            style={{ padding: '14px 16px 8px', marginBottom: 0 }}
          >
            <h2
              className="font-condensed"
              style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text)', margin: 0 }}
            >
              My Core Value Journey
            </h2>
            <button
              className="vs-btn-ghost ml-auto flex items-center gap-1"
              style={{ fontSize: 12, padding: '2px 6px' }}
              onClick={() => navigate(ROUTES.CORE_VALUE_JOURNEY)}
            >
              View all <ArrowRight size={11} aria-hidden="true" />
            </button>
          </div>
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3"
            style={{ padding: '12px 16px 16px' }}
          >
            {badges.map(b => <BadgeProgressMini key={b.core_value_id} badge={b} />)}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="vs-card" style={{ overflow: 'visible' }}>
        <div
          className="vs-section-header"
          style={{ padding: '14px 16px 8px', marginBottom: 0 }}
        >
          <h2
            className="font-condensed"
            style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text)', margin: 0 }}
          >
            Recent Activity
          </h2>
          <button
            className="vs-btn-ghost ml-auto flex items-center gap-1"
            style={{ fontSize: 12, padding: '2px 6px' }}
            onClick={() => navigate(ROUTES.RECOGNITION_FEED)}
          >
            View feed <ArrowRight size={11} aria-hidden="true" />
          </button>
        </div>
        <div style={{ padding: '0 16px 16px' }}>
          {recentFeed.length === 0 ? (
            <EmptyState
              icon={<Award size={32} />}
              title="No recognitions yet"
              description="Great behaviours happen every day. Be the first to recognize someone."
              action={{ label: 'Give Recognition', onClick: () => navigate(ROUTES.GIVE_RECOGNITION) }}
              className="py-8"
            />
          ) : (
            <div style={{ borderTop: '1px solid var(--color-divider)' }}>
              {recentFeed.map(item => (
                <RecognitionCard key={item.id} item={item} compact />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
