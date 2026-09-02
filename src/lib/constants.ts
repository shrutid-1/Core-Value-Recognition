/** Core Value slugs — used for routing and icon mapping */
export const CORE_VALUE_SLUGS = [
  'adaptable',
  'transparent',
  'collaborative',
  'innovative',
  'accountable',
] as const

export type CoreValueSlug = typeof CORE_VALUE_SLUGS[number]

/**
 * Core Value tone colors — monochromatic steel-blue family.
 * Blueprint design system: no greens, reds, or purples.
 */
export const CORE_VALUE_COLORS: Record<CoreValueSlug, string> = {
  adaptable:     '#749dc4',  // accent-500
  transparent:   '#627d98',  // accent-2-600
  collaborative: '#2c455d',  // accent-800
  innovative:    '#94bce3',  // accent-400
  accountable:   '#416180',  // accent-700
}

/**
 * Tailwind soft-tint backgrounds for legacy page usage.
 * Maps to the closest accent ramp class available.
 */
export const CORE_VALUE_BG: Record<CoreValueSlug, string> = {
  adaptable:     'bg-accent-100',
  transparent:   'bg-accent-100',
  collaborative: 'bg-accent-100',
  innovative:    'bg-accent-100',
  accountable:   'bg-accent-100',
}

export const CORE_VALUE_TEXT: Record<CoreValueSlug, string> = {
  adaptable:     'text-accent-700',
  transparent:   'text-accent-700',
  collaborative: 'text-accent-900',
  innovative:    'text-accent-600',
  accountable:   'text-accent-700',
}

export const CORE_VALUE_BORDER: Record<CoreValueSlug, string> = {
  adaptable:     'border-accent-300',
  transparent:   'border-accent-300',
  collaborative: 'border-accent-700',
  innovative:    'border-accent-300',
  accountable:   'border-accent-500',
}

export const CORE_VALUE_RING: Record<CoreValueSlug, string> = {
  adaptable:     'ring-accent-400',
  transparent:   'ring-accent-400',
  collaborative: 'ring-accent-700',
  innovative:    'ring-accent-300',
  accountable:   'ring-accent-500',
}

/** Badge level display names — mirrors DB, used for fallback display only */
export const BADGE_LEVEL_NAMES: Record<number, string> = {
  1: 'Cheers',
  2: 'Applause',
  3: 'Kudos',
  4: 'Spotlight',
  5: 'Value Ambassador',
}

/** Pagination defaults */
export const PAGE_SIZE = 20
export const SEARCH_DEBOUNCE_MS = 300

/** App timezone */
export const APP_TIMEZONE = 'Asia/Kolkata'

/** Routes */
export const ROUTES = {
  // Auth
  LOGIN: '/login',
  RESET_PASSWORD: '/reset-password',

  // Employee
  DASHBOARD: '/dashboard',
  GIVE_RECOGNITION: '/give-recognition',
  RECOGNITION_FEED: '/feed',
  MY_RECOGNITIONS: '/my-recognitions',
  CORE_VALUE_JOURNEY: '/my-journey',
  PROFILE: '/profile',

  // Manager
  MANAGER_DASHBOARD: '/manager/dashboard',
  PENDING_APPROVALS: '/manager/approvals',
  TEAM_RECOGNITION: '/manager/team',
  TEAM_BADGES: '/manager/badges',

  // HR Admin
  HR_DASHBOARD: '/hr/dashboard',
  ANALYTICS: '/hr/analytics',
  BADGE_ANALYTICS: '/hr/badge-analytics',
  REPORTS: '/hr/reports',
  EMPLOYEES: '/hr/employees',
  DEPARTMENTS: '/hr/departments',
  PROJECTS: '/hr/projects',
  CORE_VALUES: '/hr/core-values',
  BEHAVIOURS: '/hr/behaviours',
  SCENARIOS: '/hr/scenarios',
  REWARDS: '/hr/rewards',
  AUDIT_LOGS: '/hr/audit-logs',
  SETTINGS: '/hr/settings',
} as const
