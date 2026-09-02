import React from 'react'
import { EmployeeAvatar } from '@/components/shared/EmployeeAvatar'
import { CoreValueBadge } from '@/components/shared/CoreValueBadge'
import { Badge } from '@/components/ui/badge'
import { BADGE_LEVEL_NAMES } from '@/lib/constants'
import type { CoreValueSlug } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface LeaderCardProps {
  rank?: number
  employeeName: string
  avatarUrl?: string | null
  coreValueName?: string
  coreValueSlug?: CoreValueSlug
  recognitionCount: number
  uniqueRecognizers: number
  badgeLevel?: number | null
  isJoint?: boolean
  className?: string
}

const RANK_COLORS: Record<number, string> = {
  1: 'text-amber-500',
  2: 'text-slate-400',
  3: 'text-orange-400',
}

export function LeaderCard({
  rank,
  employeeName,
  avatarUrl,
  coreValueName,
  coreValueSlug,
  recognitionCount,
  uniqueRecognizers,
  badgeLevel,
  isJoint = false,
  className,
}: LeaderCardProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      {/* Rank number */}
      {rank != null && (
        <span
          className={cn(
            'text-sm font-bold w-5 text-right shrink-0 tabular-nums',
            RANK_COLORS[rank] ?? 'text-text-muted'
          )}
          aria-label={`Rank ${rank}`}
        >
          {rank}
        </span>
      )}

      {/* Avatar */}
      <EmployeeAvatar name={employeeName} avatarUrl={avatarUrl} size="md" className="shrink-0" />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="text-sm font-semibold text-text-primary truncate">{employeeName}</p>
          {isJoint && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">Joint</Badge>
          )}
          {badgeLevel && (
            <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-full font-medium shrink-0">
              {BADGE_LEVEL_NAMES[badgeLevel]}
            </span>
          )}
        </div>
        <p className="text-xs text-text-muted mt-0.5">
          {recognitionCount} recognition{recognitionCount !== 1 ? 's' : ''}
          {' · '}{uniqueRecognizers} unique
        </p>
      </div>

      {/* Core Value tag */}
      {coreValueName && coreValueSlug && (
        <CoreValueBadge
          name={coreValueName}
          slug={coreValueSlug}
          size="sm"
          className="shrink-0"
        />
      )}
    </div>
  )
}
