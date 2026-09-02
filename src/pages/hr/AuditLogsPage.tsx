import React, { useEffect, useState } from 'react'
import { Shield } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { AuditLog } from '@/types'
import { PageHeader } from '@/components/shared/PageHeader'
import { TableSkeleton } from '@/components/shared/SkeletonLoader'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { formatISTDateTime } from '@/lib/date-utils'
import { PAGE_SIZE } from '@/lib/constants'

// Module-level constant — not recreated on every render
const AUDIT_ACTIONS = [
  'login', 'nomination_created', 'nomination_approved', 'nomination_rejected',
  'employee_created', 'employee_updated', 'role_changed', 'badge_threshold_changed', 'report_generated',
] as const

const SELECT_CLS = 'h-9 rounded-lg border border-border bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500'

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [filterAction, setFilterAction] = useState('')

  const fetchLogs = async (p: number, action = filterAction) => {
    if (p === 0) setLoading(true)
    else setLoadingMore(true)

    const from = p * PAGE_SIZE
    let q = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1)
    if (action) q = q.eq('action', action)

    const { data } = await q
    if (p === 0) setLogs(data ?? [])
    else setLogs(prev => [...prev, ...(data ?? [])])
    setHasMore((data ?? []).length === PAGE_SIZE)
    setLoading(false)
    setLoadingMore(false)
  }

  useEffect(() => {
    setPage(0)
    fetchLogs(0)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterAction])

  const loadMore = () => {
    const next = page + 1
    setPage(next)
    fetchLogs(next)
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Audit Logs"
        subtitle="Complete history of significant system and admin actions."
      />

      {/* Filter bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <label htmlFor="audit-filter" className="text-sm font-medium text-text-secondary shrink-0">
          Filter by action:
        </label>
        <select
          id="audit-filter"
          className={SELECT_CLS}
          value={filterAction}
          onChange={e => setFilterAction(e.target.value)}
        >
          <option value="">All actions</option>
          {AUDIT_ACTIONS.map(a => (
            <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <TableSkeleton rows={8} />
      ) : logs.length === 0 ? (
        <EmptyState
          icon={<Shield size={40} />}
          title="No audit logs"
          description={filterAction ? `No logs found for action "${filterAction.replace(/_/g, ' ')}".` : 'Actions will be logged here as they occur.'}
        />
      ) : (
        <>
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead className="bg-surface-secondary border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide whitespace-nowrap">Timestamp</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Actor</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Action</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide hidden md:table-cell">Entity</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide hidden lg:table-cell">Entity ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {logs.map(log => (
                    <tr key={log.id} className="hover:bg-surface-secondary/50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-text-muted tabular-nums">
                        {formatISTDateTime(log.created_at)}
                      </td>
                      <td className="px-4 py-3 text-sm text-text-secondary">
                        {log.actor_email ?? <span className="text-text-disabled">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <code className="text-xs bg-surface-secondary px-2 py-0.5 rounded-md font-mono text-text-primary border border-border">
                          {log.action}
                        </code>
                      </td>
                      <td className="px-4 py-3 text-sm text-text-secondary capitalize hidden md:table-cell">
                        {log.entity_type.replace(/_/g, ' ')}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {log.entity_id
                          ? <code className="text-xs text-text-muted font-mono">{log.entity_id.slice(0, 8)}&hellip;</code>
                          : <span className="text-text-disabled">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {hasMore && (
            <div className="flex justify-center">
              <Button variant="outline" size="sm" onClick={loadMore} loading={loadingMore}>
                Load more
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
