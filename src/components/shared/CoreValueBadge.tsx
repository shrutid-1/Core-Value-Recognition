import React from 'react'
import { cn } from '@/lib/utils'
import type { CoreValueSlug } from '@/lib/constants'

/**
 * Per-value tone colors — monochromatic steel-blue family.
 * Replaces the old multi-color mapping from the previous design.
 */
const VALUE_TONE: Record<CoreValueSlug, string> = {
  adaptable:     '#749dc4',  // accent-500
  transparent:   '#627d98',  // accent-2-600
  collaborative: '#2c455d',  // accent-800
  innovative:    '#94bce3',  // accent-400
  accountable:   '#416180',  // accent-700
}

interface CoreValueBadgeProps {
  name: string
  slug?: string
  accentColor?: string
  icon?: React.ReactNode
  size?: 'sm' | 'md'
  className?: string
}

export function CoreValueBadge({
  name,
  slug,
  accentColor,
  icon,
  size = 'sm',
  className,
}: CoreValueBadgeProps) {
  const normalizedSlug = (slug ?? name.toLowerCase().replace(/\s+/g, '-')) as CoreValueSlug
  const tone = accentColor ?? VALUE_TONE[normalizedSlug] ?? '#5980a6'

  const fontSize = size === 'sm' ? 11 : 13
  const paddingV = size === 'sm' ? '3px' : '4px'
  const paddingH = size === 'sm' ? '8px' : '10px'

  return (
    <span
      className={cn('vs-tag inline-flex items-center gap-1', className)}
      style={{
        fontSize,
        padding: `${paddingV} ${paddingH}`,
        background: `color-mix(in srgb, ${tone} 14%, var(--color-bg))`,
        color: tone,
        border: `1px solid color-mix(in srgb, ${tone} 30%, transparent)`,
        fontFamily: 'Barlow, sans-serif',
        fontWeight: 500,
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
      }}
    >
      {icon && <span aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>}
      {name}
    </span>
  )
}
