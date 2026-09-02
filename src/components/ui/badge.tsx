import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/**
 * Blueprint badge / tag component.
 * Monochromatic accent family — no semantic colors (no green/red/orange).
 * Tag variant mapping:
 *   default  → accent filled (approved, Core Value names)
 *   neutral  → neutral fill  (metadata, pending)
 *   outline  → accent border transparent (behaviour, declined)
 *   secondary → neutral muted
 */
const badgeVariants = cva(
  'inline-flex items-center gap-1 text-xs font-medium whitespace-nowrap font-[Barlow,sans-serif]',
  {
    variants: {
      variant: {
        // Accent tag (approved / active / published)
        default:
          'bg-[var(--color-accent-100)] text-[var(--color-accent-800)] border-0',
        // Neutral tag (pending / draft / metadata)
        secondary:
          'bg-[var(--color-neutral-100)] text-[var(--color-neutral-800)] border-0',
        // Outline tag (declined / clarification / behaviour)
        outline:
          'bg-transparent border border-[var(--color-accent-400)] text-[var(--color-accent-700)]',
        // Dark filled (active / strong emphasis)
        destructive:
          'bg-[var(--color-accent-800)] text-[var(--color-bg)] border-0',
        // All legacy core-value variants collapse to the accent tag
        adaptable:     'bg-[color-mix(in_srgb,#749dc4_14%,var(--color-bg))] text-[#749dc4] border border-[color-mix(in_srgb,#749dc4_30%,transparent)]',
        transparent:   'bg-[color-mix(in_srgb,#627d98_14%,var(--color-bg))] text-[#627d98] border border-[color-mix(in_srgb,#627d98_30%,transparent)]',
        collaborative: 'bg-[color-mix(in_srgb,#2c455d_14%,var(--color-bg))] text-[#2c455d] border border-[color-mix(in_srgb,#2c455d_30%,transparent)]',
        innovative:    'bg-[color-mix(in_srgb,#94bce3_14%,var(--color-bg))] text-[#416180]   border border-[color-mix(in_srgb,#94bce3_30%,transparent)]',
        accountable:   'bg-[color-mix(in_srgb,#416180_14%,var(--color-bg))] text-[#416180] border border-[color-mix(in_srgb,#416180_30%,transparent)]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span
      className={cn(badgeVariants({ variant }), className)}
      style={{ padding: '3px 8px', letterSpacing: '0.02em', ...props.style }}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
