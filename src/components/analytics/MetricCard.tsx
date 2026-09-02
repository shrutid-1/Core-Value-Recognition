import React from 'react'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface MetricCardProps {
  label: string
  value: number | string
  icon?: React.ReactNode
  iconBg?: string
  trend?: number       // positive = up, negative = down, 0 = flat
  trendLabel?: string
  highlight?: boolean  // draws attention to the card (e.g. pending items)
  className?: string
  onClick?: () => void
}

export function MetricCard({
  label,
  value,
  icon,
  iconBg = 'bg-blue-50',
  trend,
  trendLabel,
  highlight = false,
  className,
  onClick,
}: MetricCardProps) {
  const TrendIcon =
    trend == null ? null : trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus
  const trendColor =
    trend == null ? '' : trend > 0 ? 'text-success' : trend < 0 ? 'text-danger' : 'text-text-muted'

  const Tag = onClick ? 'button' : 'div'

  return (
    <Tag
      className={cn(
        'bg-surface border rounded-xl p-5 text-left w-full',
        highlight ? 'border-amber-300 shadow-amber-100/60' : 'border-border',
        onClick && 'cursor-pointer hover:shadow-sm transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
        className
      )}
      onClick={onClick}
      // button type suppresses implicit submit inside forms
      {...(onClick ? { type: 'button' as const } : {})}
    >
      {icon && (
        <div
          className={cn('inline-flex items-center justify-center h-9 w-9 rounded-xl mb-3', iconBg)}
          aria-hidden="true"
        >
          {icon}
        </div>
      )}
      <p className="text-2xl font-bold text-text-primary leading-none tabular-nums">{value}</p>
      <p className="text-xs text-text-muted mt-1.5 leading-snug">{label}</p>
      {TrendIcon && trendLabel && (
        <div className={cn('flex items-center gap-1 mt-2.5 text-xs font-medium', trendColor)}>
          <TrendIcon size={12} aria-hidden="true" />
          <span>{trendLabel}</span>
        </div>
      )}
    </Tag>
  )
}
