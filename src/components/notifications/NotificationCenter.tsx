import React from 'react'
import { Bell, CheckCheck } from 'lucide-react'
import { useNotifications } from '@/context/NotificationContext'
import { NotificationItem } from './NotificationItem'

interface NotificationCenterProps {
  onClose: () => void
}

export function NotificationCenter({ onClose }: NotificationCenterProps) {
  const { notifications, unreadCount, markAllAsRead } = useNotifications()

  return (
    <div
      className="absolute right-0 top-full z-50 flex flex-col"
      style={{
        marginTop: 6,
        width: 'min(380px, calc(100vw - 32px))',
        maxHeight: 480,
        background: 'var(--color-bg)',
        border: '1px solid var(--color-divider)',
        boxShadow: 'var(--shadow-lg)',
      }}
      role="region"
      aria-label="Notifications"
    >
      {/* Header */}
      <div
        className="flex items-center justify-between shrink-0"
        style={{ padding: '10px 14px', borderBottom: '1px solid var(--color-divider)' }}
      >
        <div className="flex items-center gap-2">
          <h2
            className="font-condensed"
            style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text)', letterSpacing: '-0.01em' }}
          >
            Notifications
          </h2>
          {unreadCount > 0 && (
            <span
              className="vs-tag vs-tag-accent"
              style={{ fontSize: 10, padding: '1px 6px' }}
              aria-label={`${unreadCount} unread`}
            >
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            className="flex items-center gap-1 vs-btn-ghost"
            style={{ padding: '3px 6px', fontSize: 12 }}
            onClick={() => markAllAsRead()}
            aria-label="Mark all notifications as read"
          >
            <CheckCheck size={12} />
            Mark all read
          </button>
        )}
      </div>

      {/* Notification list */}
      <div className="flex-1 overflow-y-auto" style={{ overflowX: 'hidden' }}>
        {notifications.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center text-center"
            style={{ padding: '40px 24px' }}
          >
            <Bell size={32} style={{ color: 'var(--color-neutral-400)', marginBottom: 12 }} aria-hidden="true" />
            <p
              className="font-condensed"
              style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text)' }}
            >
              All caught up
            </p>
            <p style={{ fontSize: 13, color: 'var(--color-neutral-600)', marginTop: 4 }}>
              No new notifications right now.
            </p>
          </div>
        ) : (
          notifications.map(n => (
            <NotificationItem key={n.id} notification={n} onClose={onClose} />
          ))
        )}
      </div>
    </div>
  )
}
