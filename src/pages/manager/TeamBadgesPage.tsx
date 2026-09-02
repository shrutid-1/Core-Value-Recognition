import React, { useEffect, useState } from 'react'
import { Zap } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { PageHeader } from '@/components/shared/PageHeader'
import { TableSkeleton } from '@/components/shared/SkeletonLoader'
import { EmptyState } from '@/components/shared/EmptyState'
import { EmployeeAvatar } from '@/components/shared/EmployeeAvatar'
import { BADGE_LEVEL_NAMES, CORE_VALUE_COLORS } from '@/lib/constants'
import type { CoreValueSlug } from '@/lib/constants'

interface TeamBadgeRow {
  employee_id:      string
  employee_name:    string
  avatar_url:       string | null
  core_value_name:  string
  core_value_slug:  string
  badge_level:      number
  recognition_count: number
}

function rowKey(r: TeamBadgeRow) { return `${r.employee_id}-${r.core_value_name}` }

/** Minimal additive badge glyph for table rows */
function BadgeGlyph({ level, color }: { level: number; color: string }) {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} aria-hidden="true" style={{ flexShrink: 0 }}>
      <rect x={3} y={3} width={18} height={18} />
      {level >= 2 && <rect x={7} y={7} width={10} height={10} />}
      {level >= 3 && <><line x1={12} y1={3} x2={12} y2={21} /><line x1={3} y1={12} x2={21} y2={12} /></>}
      {level >= 4 && <><line x1={3} y1={3} x2={21} y2={21} /><line x1={21} y1={3} x2={3} y2={21} /></>}
      {level >= 5 && <rect x={9} y={9} width={6} height={6} fill={color} />}
    </svg>
  )
}

export default function TeamBadgesPage() {
  const { employee } = useAuth()
  const [rows, setRows]       = useState<TeamBadgeRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!employee) return
    supabase
      .from('employees')
      .select('id, full_name, avatar_url')
      .eq('manager_id', employee.id)
      .eq('is_active', true)
      .then(async ({ data: team }) => {
        if (!team || team.length === 0) { setLoading(false); return }
        const ids = team.map(e => e.id)
        const { data: badges } = await supabase
          .from('employee_value_badges')
          .select('employee_id, badge_level, recognition_count, core_values:core_value_id(name, slug)')
          .in('employee_id', ids)
          .eq('period_type', 'annual')
          .not('badge_level', 'is', null)
          .order('badge_level', { ascending: false })

        const result: TeamBadgeRow[] = (badges ?? []).map(b => {
          const emp = team.find(e => e.id === b.employee_id)
          const cv  = b.core_values as { name: string; slug: string } | null
          return {
            employee_id:       b.employee_id,
            employee_name:     emp?.full_name ?? '',
            avatar_url:        emp?.avatar_url ?? null,
            core_value_name:   cv?.name ?? '',
            core_value_slug:   cv?.slug ?? '',
            badge_level:       b.badge_level ?? 0,
            recognition_count: b.recognition_count,
          }
        })
        setRows(result)
        setLoading(false)
      })
  }, [employee])

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        kicker="Annual Period"
        title="Team Badges"
        subtitle="Current badge status for each of your direct reports."
      />

      {loading ? (
        <TableSkeleton />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<Zap size={36} />}
          title="No badges yet"
          description="Badges will appear here as your team members receive enough recognitions."
        />
      ) : (
        <div className="vs-card" style={{ overflow: 'hidden' }}>
          <div className="overflow-x-auto">
            <table className="vs-table w-full" style={{ minWidth: 440 }}>
              <thead>
                <tr style={{ background: 'color-mix(in srgb, var(--color-neutral-300) 30%, transparent)' }}>
                  <th>Employee</th>
                  <th className="hidden sm:table-cell">Core Value</th>
                  <th>Badge</th>
                  <th style={{ textAlign: 'right' }}>Recognitions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => {
                  const tone = CORE_VALUE_COLORS[r.core_value_slug as CoreValueSlug] ?? '#5980a6'
                  return (
                    <tr key={rowKey(r)}>
                      <td><EmployeeAvatar name={r.employee_name} avatarUrl={r.avatar_url} size="sm" showName /></td>
                      <td className="hidden sm:table-cell" style={{ color: 'var(--color-neutral-700)' }}>{r.core_value_name}</td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <BadgeGlyph level={r.badge_level} color={tone} />
                          <span
                            className="vs-tag"
                            style={{
                              fontSize: 11,
                              padding: '2px 8px',
                              background: `color-mix(in srgb, ${tone} 12%, var(--color-bg))`,
                              color: tone,
                              border: `1px solid color-mix(in srgb, ${tone} 30%, transparent)`,
                            }}
                          >
                            {BADGE_LEVEL_NAMES[r.badge_level] ?? `Level ${r.badge_level}`}
                          </span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: 'var(--color-neutral-700)' }}>
                        {r.recognition_count}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
