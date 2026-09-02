import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckSquare, Users, Award, ArrowRight } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { ROUTES } from '@/lib/constants'
import { MetricCardSkeleton } from '@/components/shared/SkeletonLoader'

interface Stats { pending: number; teamRecognitions: number; teamMembers: number }

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

function MetricTile({
  label, value, icon, highlight = false, onClick,
}: {
  label: string; value: number; icon: React.ReactNode
  highlight?: boolean; onClick?: () => void
}) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      className="vs-card relative w-full text-left"
      style={{
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        cursor: onClick ? 'pointer' : 'default',
        borderLeft: highlight && value > 0 ? '3px solid var(--color-accent)' : undefined,
        overflow: 'visible',
      }}
      onClick={onClick}
      onMouseEnter={onClick ? e => ((e.currentTarget as HTMLElement).style.background = 'color-mix(in srgb, var(--color-accent) 5%, transparent)') : undefined}
      onMouseLeave={onClick ? e => ((e.currentTarget as HTMLElement).style.background = 'transparent') : undefined}
      {...(onClick ? { type: 'button' as const } : {})}
    >
      {onClick && (
        <>
          <i className="corner tl" /><i className="corner tr" />
          <i className="corner bl" /><i className="corner br" />
        </>
      )}
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
        style={{ fontSize: 34, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}
      >
        {value}
      </p>
      <p style={{ fontSize: 12, color: 'var(--color-neutral-600)', lineHeight: 1.35 }}>{label}</p>
    </Tag>
  )
}

function QuickActionCard({ title, description, onClick }: { title: string; description: string; onClick: () => void }) {
  return (
    <button
      className="vs-card relative w-full text-left"
      style={{ padding: 16, overflow: 'visible', cursor: 'pointer' }}
      onClick={onClick}
      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'color-mix(in srgb, var(--color-accent) 5%, transparent)')}
      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
    >
      <i className="corner tl" /><i className="corner tr" />
      <i className="corner bl" /><i className="corner br" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            className="font-condensed"
            style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text)', marginBottom: 5 }}
          >
            {title}
          </p>
          <p style={{ fontSize: 13, color: 'var(--color-neutral-600)', lineHeight: 1.5 }}>{description}</p>
        </div>
        <ArrowRight size={16} style={{ color: 'var(--color-neutral-500)', flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
      </div>
    </button>
  )
}

export default function ManagerDashboardPage() {
  const { employee } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats]   = useState<Stats>({ pending: 0, teamRecognitions: 0, teamMembers: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!employee) return
    async function load() {
      const [pendingRes, teamRes] = await Promise.all([
        supabase.from('nominations').select('id', { count: 'exact', head: true }).eq('assigned_approver_id', employee!.id).eq('status', 'pending'),
        supabase.from('employees').select('id', { count: 'exact', head: true }).eq('manager_id', employee!.id).eq('is_active', true),
      ])
      const { data: teamData } = await supabase.from('employees').select('id').eq('manager_id', employee!.id).eq('is_active', true)
      const teamIds = (teamData ?? []).map(e => e.id)
      let teamRecognitions = 0
      if (teamIds.length > 0) {
        const { count } = await supabase.from('nominations').select('id', { count: 'exact', head: true }).eq('status', 'approved').in('nominee_id', teamIds)
        teamRecognitions = count ?? 0
      }
      setStats({ pending: pendingRes.count ?? 0, teamMembers: teamRes.count ?? 0, teamRecognitions })
      setLoading(false)
    }
    load()
  }, [employee])

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <p className="vs-kicker" style={{ marginBottom: 4 }}>Manager Dashboard</p>
          <h1
            className="font-condensed"
            style={{ fontSize: 34, fontWeight: 600, color: 'var(--color-text)', letterSpacing: '-0.015em' }}
          >
            {greeting()}, {employee?.full_name?.split(' ')[0]}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--color-neutral-600)', marginTop: 4 }}>
            {stats.pending > 0
              ? `${stats.pending} recognition${stats.pending !== 1 ? 's' : ''} waiting for your review.`
              : "Here's a summary of your team's recognition activity."}
          </p>
        </div>
        {!loading && stats.pending > 0 && (
          <button
            className="vs-btn vs-btn-primary relative self-start shrink-0"
            onClick={() => navigate(ROUTES.PENDING_APPROVALS)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />
            <CheckSquare size={14} aria-hidden="true" />
            Review {stats.pending} Pending
          </button>
        )}
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => <MetricCardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <MetricTile label="Pending Approvals"  value={stats.pending}          icon={<CheckSquare size={15} />} highlight={stats.pending > 0} onClick={() => navigate(ROUTES.PENDING_APPROVALS)} />
          <MetricTile label="Team Members"       value={stats.teamMembers}      icon={<Users size={15} />} />
          <MetricTile label="Team Recognitions"  value={stats.teamRecognitions} icon={<Award size={15} />} onClick={() => navigate(ROUTES.TEAM_RECOGNITION)} />
        </div>
      )}

      {/* Quick action cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <QuickActionCard
          title="Pending Approvals"
          description={stats.pending === 0
            ? "You're all caught up — no recognitions waiting for review."
            : `${stats.pending} recognition${stats.pending !== 1 ? 's' : ''} need your review.`}
          onClick={() => navigate(ROUTES.PENDING_APPROVALS)}
        />
        <QuickActionCard
          title="Team Recognition"
          description="View how your team is being recognized across Core Values."
          onClick={() => navigate(ROUTES.TEAM_RECOGNITION)}
        />
        <QuickActionCard
          title="Team Badges"
          description="See which Core Value badges your team members have earned this year."
          onClick={() => navigate(ROUTES.TEAM_BADGES)}
        />
      </div>
    </div>
  )
}
