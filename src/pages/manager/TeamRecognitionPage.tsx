import React, { useEffect, useState } from 'react'
import { Users } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import type { RecognitionFeedItem } from '@/types'
import { PageHeader } from '@/components/shared/PageHeader'
import { CardSkeleton } from '@/components/shared/SkeletonLoader'
import { EmptyState } from '@/components/shared/EmptyState'
import { RecognitionCard } from '@/components/recognition/RecognitionCard'

export default function TeamRecognitionPage() {
  const { employee } = useAuth()
  const [items, setItems]     = useState<RecognitionFeedItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!employee) return
    supabase
      .from('employees')
      .select('id')
      .eq('manager_id', employee.id)
      .eq('is_active', true)
      .then(async ({ data: teamData }) => {
        const teamIds = (teamData ?? []).map(e => e.id)
        if (teamIds.length === 0) { setLoading(false); return }
        const { data } = await supabase
          .from('v_recognition_feed')
          .select('*')
          .in('nominee_id', teamIds)
          .order('approved_at', { ascending: false })
          .limit(50)
        setItems(data ?? [])
        setLoading(false)
      })
  }, [employee])

  return (
    <div className="animate-fade-in" style={{ maxWidth: 680, margin: '0 auto' }}>
      <PageHeader
        kicker="Your Team"
        title="Team Recognition"
        subtitle="Recognitions received by your direct reports."
      />

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Users size={36} />}
          title="No team recognitions yet"
          description="Approved recognitions for your team members will appear here."
        />
      ) : (
        <div className="vs-card" style={{ overflow: 'visible' }}>
          {items.map((item, i) => (
            <div key={item.id} style={{ borderTop: i > 0 ? '1px solid var(--color-divider)' : 'none' }}>
              <RecognitionCard item={item} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
