import React, { useEffect } from 'react'
import { Trophy, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BadgeUnlockToastProps {
  badgeName: string
  coreValueName: string
  recognitionCount: number
  previousBadgeName?: string | null
  onClose: () => void
}

export function BadgeUnlockToast({
  badgeName,
  coreValueName,
  recognitionCount,
  previousBadgeName,
  onClose,
}: BadgeUnlockToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 6000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div
      className={cn(
        'fixed bottom-6 right-6 z-50 w-80 bg-surface border border-border rounded-xl shadow-md p-4',
        'animate-slide-in-right'
      )}
      role="status"
      aria-live="polite"
    >
      <button
        className="absolute top-3 right-3 text-text-muted hover:text-text-primary"
        onClick={onClose}
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>

      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0 animate-badge-pop">
          <Trophy size={20} className="text-amber-500" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text-primary">New badge unlocked!</p>
          <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
            {previousBadgeName
              ? `You've progressed from ${previousBadgeName} → ${badgeName} for ${coreValueName}.`
              : `You've unlocked ${badgeName} for ${coreValueName}! Recognized ${recognitionCount} time${recognitionCount !== 1 ? 's' : ''} this year.`
            }
          </p>
        </div>
      </div>

      {/* Progress line */}
      <div className="mt-3 h-0.5 rounded-full bg-border overflow-hidden">
        <div
          className="h-full bg-amber-400 rounded-full"
          style={{ animation: 'shrink-width 6s linear forwards' }}
        />
      </div>

      <style>{`
        @keyframes shrink-width {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  )
}
