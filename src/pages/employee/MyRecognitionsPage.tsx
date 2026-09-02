import React, { useEffect, useState } from 'react'
import { Award, Send } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import type { NominationWithDetails } from '@/types'
import { PageHeader } from '@/components/shared/PageHeader'
import { CardSkeleton } from '@/components/shared/SkeletonLoader'
import { EmptyState } from '@/components/shared/EmptyState'
import { CoreValueBadge } from '@/components/shared/CoreValueBadge'
import { EmployeeAvatar } from '@/components/shared/EmployeeAvatar'
import { formatIST } from '@/lib/date-utils'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@/lib/constants'

type Tab = 'received' | 'given'

const STATUS_STYLE: Record<string, { label: string; variant: 'accent' | 'neutral' | 'outline' }> = {
  approved:                { label: 'Published',            variant: 'accent'   },
  pending:                 { label: 'Pending approval',     variant: 'neutral'  },
  clarification_requested: { label: 'Clarification needed', variant: 'outline'  },
  rejected:                { label: 'Not approved',         variant: 'neutral'  },
  draft:                   { label: 'Draft',                variant: 'neutral'  },
}

export default function MyRecognitionsPage() {
  const { employee } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab]       = useState<Tab>('received')
  const [items, setItems]   = useState<NominationWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!employee) return
    setLoading(true)

    const field = tab === 'received' ? 'nominee_id' : 'nominator_id'
    const statusFilter = tab === 'received'
      ? ['approved']
      : ['approved', 'pending', 'clarification_requested', 'rejected']

    supabase
      .from('nominations')
      .select(`
        *,
        nominator:nominator_id (id, full_name, avatar_url),
        nominee:nominee_id (id, full_name, avatar_url),
        core_value:core_value_id (id, name, slug, accent_color, icon),
        behaviour:behaviour_id (id, name),
        project:project_id (id, name)
      `)
      .eq(field, employee.id)
      .in('status', statusFilter)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setItems((data as unknown as NominationWithDetails[]) ?? [])
        setLoading(false)
      })
  }, [employee, tab])

  return (
    <div className="animate-fade-in" style={{ maxWidth: 680, margin: '0 auto' }}>
      <PageHeader kicker="My Activity" title="My Recognitions" />

      {/* Segmented tab control */}
      <div className="vs-seg" style={{ marginBottom: 20, width: 'fit-content' }} role="tablist">
        {(['received', 'given'] as Tab[]).map(t => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            style={{
              padding: '6px 18px',
              fontSize: 13,
              fontFamily: 'Barlow Condensed, sans-serif',
              fontWeight: 600,
              border: 'none',
              borderRight: '1px solid var(--color-divider)',
              background: tab === t ? 'var(--color-accent)' : 'transparent',
              color: tab === t ? 'var(--color-bg)' : 'var(--color-neutral-600)',
              cursor: 'pointer',
              transition: 'background 120ms, color 120ms',
              textTransform: 'capitalize',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={tab === 'received' ? <Award size={36} /> : <Send size={36} />}
          title={tab === 'received' ? 'No recognitions received yet' : 'No recognitions given yet'}
          description={
            tab === 'received'
              ? 'Your first recognition will appear here once approved.'
              : 'When you recognize a colleague, it will appear here.'
          }
          action={tab === 'given'
            ? { label: 'Give Recognition', onClick: () => navigate(ROUTES.GIVE_RECOGNITION) }
            : undefined
          }
        />
      ) : (
        <div className="vs-card" style={{ overflow: 'visible' }}>
          {items.map((n, i) => {
            const cv = n.core_value as { name: string; slug: string } | null
            const other = tab === 'received' ? n.nominator : n.nominee
            const otherPerson = other as { full_name: string; avatar_url: string | null } | null
            const statusInfo = STATUS_STYLE[n.status] ?? { label: n.status, variant: 'neutral' as const }

            return (
              <article
                key={n.id}
                style={{
                  padding: '14px 16px',
                  borderTop: i > 0 ? '1px solid var(--color-divider)' : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <EmployeeAvatar
                      name={otherPerson?.full_name ?? ''}
                      avatarUrl={otherPerson?.avatar_url}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text)', lineHeight: 1.3 }}>
                        {tab === 'received' ? 'From ' : 'For '}
                        <strong>{otherPerson?.full_name}</strong>
                      </p>
                      <p style={{ fontSize: 11, color: 'var(--color-neutral-600)', marginTop: 1 }}>
                        {formatIST(n.created_at)}
                      </p>
                    </div>
                  </div>
                  {/* Status tag */}
                  <span
                    className={`vs-tag vs-tag-${statusInfo.variant}`}
                    style={{ flexShrink: 0 }}
                  >
                    {statusInfo.label}
                  </span>
                </div>

                {/* Core value */}
                {cv && (
                  <div>
                    <CoreValueBadge name={cv.name} slug={cv.slug} />
                  </div>
                )}

                {/* Story */}
                <p style={{ fontSize: 13, color: 'var(--color-neutral-700)', lineHeight: 1.55 }}>
                  {n.what_happened}
                </p>

                {/* Clarification note — only to nominator on given tab */}
                {n.status === 'clarification_requested' && n.clarification_note && tab === 'given' && (
                  <div
                    style={{
                      padding: '10px 12px',
                      border: '1px solid var(--color-accent-400)',
                      background: 'color-mix(in srgb, var(--color-accent) 6%, var(--color-bg))',
                      fontSize: 12,
                      color: 'var(--color-accent-800)',
                    }}
                  >
                    <p style={{ fontWeight: 600, marginBottom: 3 }}>Clarification requested</p>
                    <p>{n.clarification_note}</p>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
