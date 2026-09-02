import React, { useEffect, useState, useCallback } from 'react'
import { Rss } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { RecognitionFeedItem } from '@/types'
import { RecognitionCard } from '@/components/recognition/RecognitionCard'
import { PageHeader } from '@/components/shared/PageHeader'
import { CardSkeleton } from '@/components/shared/SkeletonLoader'
import { EmptyState } from '@/components/shared/EmptyState'
import { PAGE_SIZE } from '@/lib/constants'

export default function RecognitionFeedPage() {
  const [items, setItems]           = useState<RecognitionFeedItem[]>([])
  const [loading, setLoading]       = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore]       = useState(false)
  const [page, setPage]             = useState(0)

  const fetchFeed = useCallback(async (pageNum: number) => {
    if (pageNum === 0) setLoading(true)
    else setLoadingMore(true)

    const from = pageNum * PAGE_SIZE
    const { data, error } = await supabase
      .from('v_recognition_feed')
      .select('*')
      .order('approved_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1)

    if (!error && data) {
      if (pageNum === 0) setItems(data)
      else setItems(prev => [...prev, ...data])
      setHasMore(data.length === PAGE_SIZE)
    }
    setLoading(false)
    setLoadingMore(false)
  }, [])

  useEffect(() => { fetchFeed(0) }, [fetchFeed])

  const loadMore = () => {
    const next = page + 1
    setPage(next)
    fetchFeed(next)
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: 680, margin: '0 auto' }}>
      <PageHeader
        kicker="Company Feed"
        title="Recognition Feed"
        subtitle="Celebrating the behaviours that make Touchcore stronger."
      />

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Rss size={36} />}
          title="No recognitions yet"
          description="Great behaviours happen every day. Be the first to recognize a colleague."
        />
      ) : (
        <>
          {/* Feed as a bordered card stack */}
          <div className="vs-card" style={{ overflow: 'visible' }}>
            {items.map((item, i) => (
              <div
                key={item.id}
                style={{ borderTop: i > 0 ? '1px solid var(--color-divider)' : 'none' }}
              >
                <RecognitionCard item={item} />
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center" style={{ marginTop: 20 }}>
              <button
                className="vs-btn"
                onClick={loadMore}
                disabled={loadingMore}
                aria-busy={loadingMore}
              >
                {loadingMore ? 'Loading…' : 'Load more'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
