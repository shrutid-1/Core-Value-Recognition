import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CheckSquare, Award, Bell, FileText, AlertCircle, MessageSquare, Zap,
} from 'lucide-react'
import type { Notification, NotificationType } from '@/types'
import { timeAgo } from '@/lib/date-utils'
import { useNotifications } from '@/context/NotificationContext'
import { ROUTES } from '@/lib/constants'

interface NotificationItemProps {
  notification: Notification
  onClose: () => void
}

const NOTIFICATION_ICONS: Record<NotificationType, React.ReactNode> = {
  nomination_submitted:       <CheckSquare size={13} />,
  approval_required:          <AlertCircle size={13} />,
  clarification_requested:    <MessageSquare size={13} />,
  nomination_approved:        <CheckSquare size={13} />,
  nomination_rejected:        <AlertCircle size={13} />,
  recognition_received:       <Award size={13} />,
  team_recognition_published: <Bell size={13} />,
  badge_unlocked:             <Zap size={13} />,
  monthly_report_ready:       <FileText size={13} />,
}

function getNotificationHref(type: NotificationType): string {
  if (type === 'approval_required')                 return ROUTES.PENDING_APPROVALS
  if (type === 'badge_unlocked')                    return ROUTES.CORE_VALUE_JOURNEY
  if (type === 'recognition_received')              return ROUTES.MY_RECOGNITIONS
  if (type === 'nomination_approved')               return ROUTES.MY_RECOGNITIONS
  if (type === 'clarification_requested')           return ROUTES.MY_RECOGNITIONS
  if (type === 'monthly_report_ready')              return ROUTES.REPORTS
  return ROUTES.RECOGNITION_FEED
}

export function NotificationItem({ notification, onClose }: NotificationItemProps) {
  const { markAsRead } = useNotifications()
  const navigate = useNavigate()

  const handleClick = async () => {
    if (!notification.is_read) await markAsRead(notification.id)
    navigate(getNotificationHref(notification.type))
    onClose()
  }

  return (
    <button
      className="w-full text-left flex items-start gap-3"
      style={{
        padding: '10px 14px',
        borderBottom: '1px solid var(--color-divider)',
        background: notification.is_read
          ? 'transparent'
          : 'color-mix(in srgb, var(--color-accent) 6%, transparent)',
        cursor: 'pointer',
        transition: 'background 120ms',
        border: 'none',
        borderBottom: '1px solid var(--color-divider)',
        fontFamily: 'Barlow, sans-serif',
      }}
      onMouseEnter={e =>
        (e.currentTarget.style.background = 'color-mix(in srgb, var(--color-accent) 8%, transparent)')
      }
      onMouseLeave={e =>
        (e.currentTarget.style.background = notification.is_read
          ? 'transparent'
          : 'color-mix(in srgb, var(--color-accent) 6%, transparent)')
      }
      onClick={handleClick}
    >
      {/* Icon tile */}
      <div
        style={{
          width: 28,
          height: 28,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'color-mix(in srgb, var(--color-accent) 12%, transparent)',
          color: 'var(--color-accent-700)',
          flexShrink: 0,
          marginTop: 1,
        }}
      >
        {NOTIFICATION_ICONS[notification.type]}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          style={{
            fontSize: 13,
            lineHeight: 1.4,
            color: notification.is_read ? 'var(--color-neutral-700)' : 'var(--color-text)',
            fontWeight: notification.is_read ? 400 : 500,
          }}
        >
          {notification.title}
        </p>
        <p
          className="line-clamp-2"
          style={{ fontSize: 12, color: 'var(--color-neutral-600)', marginTop: 2 }}
        >
          {notification.body}
        </p>
        <p
          style={{
            fontSize: 10,
            color: 'var(--color-neutral-500)',
            marginTop: 4,
            letterSpacing: '0.03em',
          }}
        >
          {timeAgo(notification.created_at)}
        </p>
      </div>

      {/* Unread indicator */}
      {!notification.is_read && (
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'var(--color-accent)',
            flexShrink: 0,
            marginTop: 6,
          }}
          aria-label="Unread"
        />
      )}
    </button>
  )
}
