import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Merge Tailwind classes safely, resolving conflicts */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Generate a UUID v4 for idempotency keys */
export function generateUUID(): string {
  return crypto.randomUUID()
}

/** Truncate text to a maximum length with ellipsis */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}

/** Get initials from a full name (up to 2 letters) */
export function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 0) return ''
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

/** Pluralize a word based on count */
export function pluralize(count: number, singular: string, plural?: string): string {
  const pluralForm = plural ?? singular + 's'
  return count === 1 ? singular : pluralForm
}

/** Determine recognition source based on nominator/nominee roles */
export function classifyRecognitionSource(
  nominatorRole: string,
  nomineeRole: string,
  nominatorId: string,
  nomineeManagerId: string | null
): 'peer' | 'manager' | 'hr' | 'leadership' {
  if (nominatorRole === 'hr_admin') return 'hr'
  if (nominatorRole === 'super_admin') return 'leadership'
  if (nominatorRole === 'manager' && nominatorId === nomineeManagerId) return 'manager'
  if (nominatorRole === 'manager') return 'peer' // manager recognizing someone not in their team
  return 'peer'
}
