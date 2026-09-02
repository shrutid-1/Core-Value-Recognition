import React, { useState } from 'react'
import { Heart, Briefcase } from 'lucide-react'
import type { RecognitionFeedItem } from '@/types'
import { EmployeeAvatar } from '@/components/shared/EmployeeAvatar'
import { CoreValueBadge } from '@/components/shared/CoreValueBadge'
import { timeAgo } from '@/lib/date-utils'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'
import type { CoreValueSlug } from '@/lib/constants'

interface RecognitionCardProps {
  item: RecognitionFeedItem
  compact?: boolean
}

export function RecognitionCard({ item, compact = false }: RecognitionCardProps) {
  const { employee } = useAuth()
  const [appreciated, setAppreciated] = useState(false)
  const [appreciationCount, setAppreciationCount] = useState(item.appreciation_count)

  const handleAppreciate = async () => {
    if (!employee || appreciated) return
    setAppreciated(true)
    setAppreciationCount(c => c + 1)
    await supabase.from('nomination_appreciations').insert({
      nomination_id: item.id,
      employee_id: employee.id,
    })
  }

  const slug = item.core_value_name?.toLowerCase().replace(/\s+/g, '') as CoreValueSlug

  if (compact) {
    return (
      <article
        className="flex items-start gap-3 py-3 first:pt-0 last:pb-0 group"
        aria-label={`${item.nominator_name} recognized ${item.nominee_name} for ${item.core_value_name}`}
      >
        <EmployeeAvatar
          name={item.nominator_name}
          avatarUrl={item.nominator_avatar}
          size="sm"
          className="shrink-0 mt-0.5"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-text-primary leading-snug">
            <span className="font-semibold">{item.nominator_name}</span>
            <span className="text-text-muted"> recognized </span>
            <span className="font-semibold">{item.nominee_name}</span>
          </p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <CoreValueBadge name={item.core_value_name} slug={slug} size="sm" />
            <span className="text-xs text-text-disabled">
              {item.approved_at ? timeAgo(item.approved_at) : ''}
            </span>
          </div>
        </div>
      </article>
    )
  }

  return (
    <article
      className="bg-surface border border-border rounded-xl p-5 space-y-4 transition-shadow hover:shadow-sm"
      aria-label={`Recognition: ${item.nominator_name} recognized ${item.nominee_name} for ${item.core_value_name}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <EmployeeAvatar
            name={item.nominator_name}
            avatarUrl={item.nominator_avatar}
            size="md"
            className="shrink-0"
          />
          <div className="min-w-0">
            <p className="text-sm text-text-primary leading-snug">
              <span className="font-semibold">{item.nominator_name}</span>
              <span className="text-text-muted"> recognized </span>
              <span className="font-semibold">{item.nominee_name}</span>
            </p>
            <p className="text-xs text-text-muted mt-0.5">
              {item.approved_at ? timeAgo(item.approved_at) : ''}
              {item.project_name && (
                <> &middot; <span className="inline-flex items-center gap-1">
                  <Briefcase size={10} aria-hidden="true" />
                  {item.project_name}
                </span></>
              )}
            </p>
          </div>
        </div>
        <CoreValueBadge name={item.core_value_name} slug={slug} className="shrink-0" />
      </div>

      {/* Recognition text */}
      <blockquote className="text-sm text-text-secondary leading-relaxed border-l-2 border-surface-secondary pl-3 italic">
        &ldquo;{item.what_happened}&rdquo;
      </blockquote>

      {/* Nominee row */}
      <div className="flex items-center gap-2.5 pt-1 border-t border-border">
        <EmployeeAvatar
          name={item.nominee_name}
          avatarUrl={item.nominee_avatar}
          size="xs"
          className="shrink-0"
        />
        <p className="text-xs text-text-muted flex-1 min-w-0 truncate">
          <span className="font-medium text-text-secondary">{item.nominee_name}</span>
          {item.behaviour_name && <> &middot; {item.behaviour_name}</>}
        </p>

        {/* Appreciate */}
        <button
          onClick={handleAppreciate}
          disabled={appreciated || !employee}
          className={cn(
            'flex items-center gap-1.5 text-xs rounded-lg px-2.5 py-1.5 transition-all',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
            appreciated
              ? 'text-red-500 bg-red-50'
              : 'text-text-muted hover:text-red-500 hover:bg-red-50'
          )}
          aria-label={
            appreciated
              ? `Appreciated (${appreciationCount})`
              : `Appreciate this recognition (${appreciationCount})`
          }
          aria-pressed={appreciated}
        >
          <Heart
            size={13}
            className={cn('transition-all', appreciated && 'fill-red-500')}
            aria-hidden="true"
          />
          {appreciationCount > 0 && (
            <span className="tabular-nums">{appreciationCount}</span>
          )}
          {!appreciated && <span>Appreciate</span>}
        </button>
      </div>
    </article>
  )
}
