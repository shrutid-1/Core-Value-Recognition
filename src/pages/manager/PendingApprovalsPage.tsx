import React, { useEffect, useState, useCallback } from 'react'
import { CheckSquare, MessageSquare, XCircle, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import type { NominationWithDetails } from '@/types'
import { PageHeader } from '@/components/shared/PageHeader'
import { CardSkeleton } from '@/components/shared/SkeletonLoader'
import { EmptyState } from '@/components/shared/EmptyState'
import { EmployeeAvatar } from '@/components/shared/EmployeeAvatar'
import { CoreValueBadge } from '@/components/shared/CoreValueBadge'
import { formatIST } from '@/lib/date-utils'

type ActionType = 'approve' | 'reject' | 'clarify'

function Corners() {
  return (
    <>
      <i className="corner tl" /><i className="corner tr" />
      <i className="corner bl" /><i className="corner br" />
    </>
  )
}

export default function PendingApprovalsPage() {
  const { employee } = useAuth()
  const [nominations, setNominations] = useState<NominationWithDetails[]>([])
  const [loading, setLoading]         = useState(true)
  const [expanded, setExpanded]       = useState<string | null>(null)
  const [actionModal, setActionModal] = useState<{ type: ActionType; nomination: NominationWithDetails } | null>(null)
  const [actionText, setActionText]   = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError]     = useState<string | null>(null)

  const fetchPending = useCallback(async () => {
    if (!employee) return
    setLoading(true)
    const { data } = await supabase
      .from('nominations')
      .select(`
        *,
        nominator:nominator_id (id, full_name, avatar_url),
        nominee:nominee_id (id, full_name, avatar_url),
        core_value:core_value_id (id, name, slug, accent_color, icon),
        behaviour:behaviour_id (id, name),
        project:project_id (id, name)
      `)
      .eq('assigned_approver_id', employee.id)
      .eq('status', 'pending')
      .order('submitted_at', { ascending: true })
    setNominations((data as unknown as NominationWithDetails[]) ?? [])
    setLoading(false)
  }, [employee])

  useEffect(() => { fetchPending() }, [fetchPending])

  const openAction = (type: ActionType, nomination: NominationWithDetails) => {
    setActionModal({ type, nomination })
    setActionText('')
    setActionError(null)
  }

  const handleAction = async () => {
    if (!actionModal || !employee) return
    const { type, nomination } = actionModal
    if ((type === 'reject' || type === 'clarify') && !actionText.trim()) {
      setActionError(type === 'reject' ? 'Please provide a reason for rejection.' : 'Please describe what clarification you need.')
      return
    }
    setActionLoading(true)
    setActionError(null)
    const { error } = await supabase.functions.invoke('process-approval', {
      body: {
        nomination_id: nomination.id,
        action: type,
        approver_id: employee.id,
        reason: type === 'reject' ? actionText : undefined,
        clarification_note: type === 'clarify' ? actionText : undefined,
      },
    })
    if (error) { setActionError('Something went wrong. Please try again.'); setActionLoading(false); return }
    setActionModal(null)
    setActionText('')
    setExpanded(null)
    fetchPending()
    setActionLoading(false)
  }

  const closeModal = () => { setActionModal(null); setActionText(''); setActionError(null) }

  if (loading) {
    return (
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <PageHeader title="Pending Approvals" />
        {[...Array(3)].map((_, i) => <CardSkeleton key={i} />)}
      </div>
    )
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: 680, margin: '0 auto' }}>
      <PageHeader
        kicker="Manager Queue"
        title="Pending Approvals"
        subtitle={nominations.length > 0
          ? `${nominations.length} recognition${nominations.length !== 1 ? 's' : ''} awaiting your review`
          : undefined}
      />

      {nominations.length === 0 ? (
        <EmptyState
          icon={<CheckSquare size={36} />}
          title="You're all caught up"
          description="No recognitions are waiting for your review right now."
        />
      ) : (
        <div className="vs-card" style={{ overflow: 'visible' }}>
          {nominations.map((n, i) => {
            const cv        = n.core_value as { name: string; slug: string } | null
            const nominator = n.nominator as { full_name: string; avatar_url: string | null } | null
            const nominee   = n.nominee   as { full_name: string; avatar_url: string | null } | null
            const isExpanded = expanded === n.id

            return (
              <article key={n.id} style={{ borderTop: i > 0 ? '1px solid var(--color-divider)' : 'none' }}>

                {/* Summary row — clickable to expand */}
                <button
                  className="w-full flex items-center gap-3 text-left"
                  style={{
                    padding: '12px 16px',
                    background: isExpanded ? 'color-mix(in srgb, var(--color-accent) 5%, transparent)' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background 120ms',
                    fontFamily: 'Barlow, sans-serif',
                  }}
                  onClick={() => setExpanded(isExpanded ? null : n.id)}
                  aria-expanded={isExpanded}
                >
                  <EmployeeAvatar name={nominee?.full_name ?? ''} avatarUrl={nominee?.avatar_url} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text)', lineHeight: 1.3 }}>
                      <strong>{nominator?.full_name}</strong>
                      <span style={{ color: 'var(--color-neutral-600)', fontWeight: 400 }}> recognized </span>
                      <strong>{nominee?.full_name}</strong>
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--color-neutral-600)', marginTop: 2 }}>
                      {n.submitted_at ? formatIST(n.submitted_at) : ''}
                    </p>
                  </div>
                  {cv && (
                    <CoreValueBadge name={cv.name} slug={cv.slug} size="sm" className="hidden sm:inline-flex shrink-0" />
                  )}
                  <span style={{ color: 'var(--color-neutral-500)', flexShrink: 0 }} aria-hidden="true">
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </span>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div
                    className="animate-fade-in"
                    style={{
                      padding: '0 16px 16px',
                      borderTop: '1px solid var(--color-divider)',
                      background: 'color-mix(in srgb, var(--color-accent) 3%, transparent)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                    }}
                  >
                    {/* Core Value badge (mobile) */}
                    {cv && <div className="sm:hidden" style={{ paddingTop: 12 }}><CoreValueBadge name={cv.name} slug={cv.slug} /></div>}

                    {/* Story */}
                    <blockquote
                      style={{
                        borderLeft: '2px solid var(--color-accent-400)',
                        paddingLeft: 12,
                        margin: cv ? 0 : '12px 0 0',
                        fontSize: 13,
                        color: 'var(--color-neutral-700)',
                        fontStyle: 'italic',
                        lineHeight: 1.55,
                      }}
                    >
                      &ldquo;{n.what_happened}&rdquo;
                    </blockquote>

                    {n.what_impact && (
                      <div>
                        <p className="vs-kicker" style={{ marginBottom: 4 }}>Impact</p>
                        <p style={{ fontSize: 13, color: 'var(--color-neutral-700)', lineHeight: 1.5 }}>{n.what_impact}</p>
                      </div>
                    )}

                    {n.snapshot_behaviour_name && (
                      <p style={{ fontSize: 12, color: 'var(--color-neutral-600)' }}>
                        Behaviour: <strong style={{ color: 'var(--color-text)' }}>{n.snapshot_behaviour_name}</strong>
                      </p>
                    )}

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2" style={{ paddingTop: 4 }}>
                      <button className="vs-btn vs-btn-primary relative" onClick={() => openAction('approve', n)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />
                        <CheckSquare size={13} aria-hidden="true" /> Approve
                      </button>
                      <button className="vs-btn" onClick={() => openAction('clarify', n)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <MessageSquare size={13} aria-hidden="true" /> Request Clarification
                      </button>
                      <button
                        className="vs-btn vs-btn-ghost"
                        style={{ color: 'var(--color-accent-800)' }}
                        onClick={() => openAction('reject', n)}
                      >
                        <XCircle size={13} aria-hidden="true" /> Reject
                      </button>
                    </div>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}

      {/* Action Modal */}
      {actionModal && (
        <div
          className="vs-dialog-backdrop"
          onClick={e => { if (e.target === e.currentTarget) closeModal() }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="action-modal-title"
        >
          <div
            className="vs-dialog animate-fade-in"
            style={{ minWidth: 400 }}
            onClick={e => e.stopPropagation()}
          >
            <Corners />
            {/* Header */}
            <div style={{ padding: '16px 18px 12px', borderBottom: '1px solid var(--color-divider)' }}>
              <h2 id="action-modal-title" className="font-condensed" style={{ fontSize: 20, fontWeight: 600, color: 'var(--color-text)' }}>
                {actionModal.type === 'approve' && 'Approve recognition'}
                {actionModal.type === 'reject'  && 'Reject recognition'}
                {actionModal.type === 'clarify' && 'Request clarification'}
              </h2>
              <p style={{ fontSize: 13, color: 'var(--color-neutral-600)', marginTop: 4, lineHeight: 1.5 }}>
                {actionModal.type === 'approve' && 'This recognition will be published and the employee notified.'}
                {actionModal.type === 'reject'  && 'Provide a reason. The rejection reason will not be visible to the nominee.'}
                {actionModal.type === 'clarify' && 'Describe what additional information would help you evaluate this.'}
              </p>
            </div>

            {/* Body — textarea for reject/clarify */}
            {actionModal.type !== 'approve' && (
              <div style={{ padding: '14px 18px' }}>
                <label
                  htmlFor="action-text"
                  style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--color-text)', marginBottom: 6 }}
                >
                  {actionModal.type === 'reject' ? 'Reason' : 'Clarification request'}
                  <span aria-hidden="true" style={{ color: 'var(--color-accent-700)', marginLeft: 3 }}>*</span>
                </label>
                <textarea
                  id="action-text"
                  className="vs-input w-full"
                  style={{ minHeight: 110, resize: 'vertical' }}
                  value={actionText}
                  onChange={e => setActionText(e.target.value)}
                  placeholder={
                    actionModal.type === 'reject'
                      ? 'Explain why this recognition cannot be approved…'
                      : 'What additional detail would help validate this recognition?'
                  }
                  autoFocus
                />
                {actionError && (
                  <p
                    className="flex items-center gap-1"
                    role="alert"
                    style={{ marginTop: 6, fontSize: 12, color: 'var(--color-accent-800)' }}
                  >
                    <AlertCircle size={12} aria-hidden="true" />
                    {actionError}
                  </p>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="flex justify-end gap-2" style={{ padding: '12px 18px', borderTop: '1px solid var(--color-divider)' }}>
              <button className="vs-btn" onClick={closeModal} disabled={actionLoading}>Cancel</button>
              <button
                className="vs-btn vs-btn-primary relative"
                style={
                  actionModal.type === 'reject'
                    ? { background: 'var(--color-accent-800)', borderColor: 'var(--color-accent-800)', color: 'var(--color-bg)' }
                    : undefined
                }
                onClick={handleAction}
                disabled={actionLoading}
                aria-busy={actionLoading}
              >
                <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />
                {actionLoading ? 'Working…'
                  : actionModal.type === 'approve' ? 'Approve'
                  : actionModal.type === 'reject'  ? 'Reject'
                  : 'Send request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
