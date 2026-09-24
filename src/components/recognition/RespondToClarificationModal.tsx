import { useState } from 'react'
import { AlertCircle, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { NominationWithJoins } from '@/types'

interface RespondToClarificationModalProps {
  nomination: NominationWithJoins
  onClose: () => void
  onSuccess?: () => void
}

export function RespondToClarificationModal({
  nomination,
  onClose,
  onSuccess,
}: RespondToClarificationModalProps) {
  const [responseText, setResponseText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async () => {
    // Validation
    const trimmed = responseText.trim()
    if (!trimmed) {
      setError('Please provide clarification. This field is required.')
      return
    }

    if (trimmed.length < 10) {
      setError('Please provide more detail (at least 10 characters).')
      return
    }

    if (trimmed.length > 1000) {
      setError('Response is too long (maximum 1000 characters).')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { error: invokeError } = await supabase.functions.invoke('process-approval', {
        body: {
          nomination_id: nomination.id,
          action: 'submit_clarification_response',
          response_text: trimmed,
        },
      })

      if (invokeError) {
        const errorMsg = invokeError?.message || 'Failed to submit clarification. Please try again.'
        setError(errorMsg)
        setLoading(false)
        return
      }

      setSuccess(true)
      setResponseText('')
      
      // Show success message briefly then close
      setTimeout(() => {
        onClose()
        onSuccess?.()
      }, 1500)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An unexpected error occurred.'
      setError(errorMsg)
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div
        className="vs-dialog-backdrop"
        onClick={e => { if (e.target === e.currentTarget) onClose() }}
        role="dialog"
        aria-modal="true"
      >
        <div className="vs-dialog animate-fade-in" style={{ minWidth: 400 }}>
          <div
            className="flex flex-col items-center justify-center"
            style={{ padding: '40px 24px', textAlign: 'center' }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'var(--color-success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--color-bg)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="font-condensed" style={{ fontSize: 20, fontWeight: 600, color: 'var(--color-text)' }}>
              Clarification submitted
            </h2>
            <p style={{ fontSize: 13, color: 'var(--color-neutral-600)', marginTop: 8, lineHeight: 1.5 }}>
              Your response has been submitted for review. The manager will review it shortly.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="vs-dialog-backdrop"
      onClick={e => { if (e.target === e.currentTarget && !loading) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="clarification-modal-title"
    >
      <div
        className="vs-dialog animate-fade-in"
        style={{ minWidth: 420, maxWidth: 500 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '16px 18px 12px', borderBottom: '1px solid var(--color-divider)' }}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h2
                id="clarification-modal-title"
                className="font-condensed"
                style={{ fontSize: 20, fontWeight: 600, color: 'var(--color-text)' }}
              >
                Respond to clarification
              </h2>
              <p style={{ fontSize: 13, color: 'var(--color-neutral-600)', marginTop: 4, lineHeight: 1.5 }}>
                Provide additional information to help the manager evaluate this recognition.
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              style={{
                padding: 4,
                background: 'none',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                color: 'var(--color-neutral-600)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: loading ? 0.5 : 1,
              }}
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Manager's Clarification Request (read-only) */}
        {nomination.clarification_note && (
          <div
            style={{
              padding: '14px 18px',
              borderBottom: '1px solid var(--color-divider)',
              background: 'color-mix(in srgb, var(--color-accent) 3%, transparent)',
            }}
          >
            <p
              className="vs-kicker"
              style={{ fontSize: 12, color: 'var(--color-neutral-600)', marginBottom: 6 }}
            >
              Manager's clarification request:
            </p>
            <p
              style={{
                fontSize: 13,
                color: 'var(--color-text)',
                lineHeight: 1.55,
                fontStyle: 'italic',
              }}
            >
              "{nomination.clarification_note}"
            </p>
          </div>
        )}

        {/* Response Input */}
        <div style={{ padding: '14px 18px' }}>
          <label
            htmlFor="response-text"
            style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--color-text)',
              marginBottom: 6,
            }}
          >
            Your clarification
            <span aria-hidden="true" style={{ color: 'var(--color-accent-700)', marginLeft: 3 }}>
              *
            </span>
          </label>
          <textarea
            id="response-text"
            className="vs-input w-full"
            style={{ minHeight: 120, resize: 'vertical', fontFamily: 'inherit' }}
            value={responseText}
            onChange={e => {
              setResponseText(e.target.value)
              if (error) setError(null)
            }}
            placeholder="Provide additional information, context, or examples that help clarify this recognition…"
            disabled={loading}
            autoFocus
          />
          {error && (
            <p
              className="flex items-center gap-1"
              role="alert"
              style={{ marginTop: 8, fontSize: 12, color: 'var(--color-accent-800)' }}
            >
              <AlertCircle size={12} aria-hidden="true" />
              {error}
            </p>
          )}
          <p style={{ fontSize: 11, color: 'var(--color-neutral-600)', marginTop: 6 }}>
            {responseText.trim().length}/1000 characters
          </p>
        </div>

        {/* Footer */}
        <div
          className="flex justify-end gap-2"
          style={{ padding: '12px 18px', borderTop: '1px solid var(--color-divider)' }}
        >
          <button
            className="vs-btn"
            onClick={onClose}
            disabled={loading}
            style={{ cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            Cancel
          </button>
          <button
            className="vs-btn vs-btn-primary relative"
            onClick={handleSubmit}
            disabled={loading || responseText.trim().length === 0}
            style={{
              cursor: loading || responseText.trim().length === 0 ? 'not-allowed' : 'pointer',
            }}
            aria-busy={loading}
          >
            <i className="corner tl" />
            <i className="corner tr" />
            <i className="corner bl" />
            <i className="corner br" />
            {loading ? 'Submitting…' : 'Submit for re-approval'}
          </button>
        </div>
      </div>
    </div>
  )
}
