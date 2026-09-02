import React, { useEffect } from 'react'
import { X } from 'lucide-react'

interface ConfirmModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'destructive'
  onConfirm: () => void | Promise<void>
  loading?: boolean
}

export function ConfirmModal({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  loading = false,
}: ConfirmModalProps) {
  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false)
    }
    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [open, onOpenChange])

  if (!open) return null

  const handleConfirm = async () => {
    await onConfirm()
    onOpenChange(false)
  }

  return (
    <div
      className="vs-dialog-backdrop"
      onClick={e => { if (e.target === e.currentTarget) onOpenChange(false) }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      aria-describedby={description ? 'confirm-modal-desc' : undefined}
    >
      <div
        className="vs-dialog"
        style={{ animation: 'vs-rise 200ms ease-out both' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Blueprint corner marks */}
        <i className="corner tl" />
        <i className="corner tr" />
        <i className="corner bl" />
        <i className="corner br" />

        {/* Header */}
        <div
          className="flex items-start justify-between"
          style={{
            padding: '16px 18px 12px',
            borderBottom: '1px solid var(--color-divider)',
          }}
        >
          <h2
            id="confirm-modal-title"
            className="font-condensed"
            style={{ fontSize: 20, fontWeight: 600, color: 'var(--color-text)', letterSpacing: '-0.01em' }}
          >
            {title}
          </h2>
          <button
            className="vs-btn-icon"
            style={{ width: 28, height: 28, flexShrink: 0 }}
            onClick={() => onOpenChange(false)}
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        {description && (
          <p
            id="confirm-modal-desc"
            style={{
              padding: '14px 18px',
              fontSize: 14,
              color: 'var(--color-neutral-700)',
              lineHeight: 1.55,
            }}
          >
            {description}
          </p>
        )}

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-2"
          style={{
            padding: '12px 18px',
            borderTop: '1px solid var(--color-divider)',
          }}
        >
          <button
            className="vs-btn"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            className={`vs-btn relative ${variant === 'destructive' ? '' : 'vs-btn-primary'}`}
            style={
              variant === 'destructive'
                ? {
                    background: 'var(--color-accent-800)',
                    color: 'var(--color-bg)',
                    borderColor: 'var(--color-accent-800)',
                  }
                : undefined
            }
            onClick={handleConfirm}
            disabled={loading}
            aria-busy={loading}
          >
            {variant !== 'destructive' && (
              <>
                <i className="corner tl" />
                <i className="corner tr" />
                <i className="corner bl" />
                <i className="corner br" />
              </>
            )}
            {loading ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
