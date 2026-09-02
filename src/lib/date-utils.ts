import { format, formatDistanceToNow, parseISO, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns'
import { toZonedTime, fromZonedTime } from 'date-fns-tz'

const DEFAULT_TIMEZONE = 'Asia/Kolkata'

/** Format a UTC ISO string for display in IST */
export function formatIST(utcDate: string, fmt = 'dd MMM yyyy'): string {
  const zoned = toZonedTime(parseISO(utcDate), DEFAULT_TIMEZONE)
  return format(zoned, fmt)
}

/** Format a UTC ISO string with time in IST */
export function formatISTDateTime(utcDate: string): string {
  return formatIST(utcDate, 'dd MMM yyyy, hh:mm a')
}

/** Relative time like "2 hours ago" */
export function timeAgo(utcDate: string): string {
  return formatDistanceToNow(parseISO(utcDate), { addSuffix: true })
}

/** Get current date in IST as Date object */
export function nowIST(): Date {
  return toZonedTime(new Date(), DEFAULT_TIMEZONE)
}

/** Get the start/end of the current calendar year (for annual badge period) */
export function currentAnnualPeriod(): { start: string; end: string } {
  const now = nowIST()
  const year = now.getFullYear()
  return {
    start: `${year}-01-01`,
    end: `${year}-12-31`,
  }
}

/**
 * Get the Touchcore financial year quarter boundaries.
 * Q1 = Apr–Jun, Q2 = Jul–Sep, Q3 = Oct–Dec, Q4 = Jan–Mar
 * q1StartMonth is 1-indexed (4 = April by default, configurable)
 */
export function getFinancialQuarter(
  date: Date,
  q1StartMonth = 4
): { quarter: number; start: Date; end: Date; label: string } {
  const month = date.getMonth() + 1 // 1-indexed
  const year = date.getFullYear()

  // Normalize month relative to Q1 start
  const offset = ((month - q1StartMonth + 12) % 12)
  const quarter = Math.floor(offset / 3) + 1

  // Quarter start month (1-indexed)
  const qStartMonth = ((q1StartMonth - 1 + (quarter - 1) * 3) % 12) + 1
  const qStartYear = qStartMonth > month
    ? year - 1
    : month === 1 && qStartMonth > 9 ? year - 1 : year

  const startDate = new Date(qStartYear, qStartMonth - 1, 1)
  const endDate = endOfMonth(new Date(qStartYear, qStartMonth + 1, 1))

  return {
    quarter,
    start: startDate,
    end: endDate,
    label: `Q${quarter} FY${year}`,
  }
}

/** Get current financial quarter label */
export function currentQuarterLabel(q1StartMonth = 4): string {
  return getFinancialQuarter(nowIST(), q1StartMonth).label
}

/** Get quarter boundaries as ISO date strings */
export function getQuarterBounds(
  quarter: number,
  fiscalYear: number,
  q1StartMonth = 4
): { start: string; end: string } {
  const qStartMonth = ((q1StartMonth - 1 + (quarter - 1) * 3) % 12) + 1
  // Q4 (Jan–Mar) belongs to the NEXT calendar year if Q1 starts in April
  const calendarYear = quarter === 4 && q1StartMonth === 4 ? fiscalYear + 1 : fiscalYear

  const start = new Date(calendarYear, qStartMonth - 1, 1)
  const end = endOfMonth(new Date(calendarYear, qStartMonth + 1, 1))

  return {
    start: format(start, 'yyyy-MM-dd'),
    end: format(end, 'yyyy-MM-dd'),
  }
}

/** Format a date range as a readable string */
export function formatDateRange(start: string, end: string): string {
  return `${formatIST(start, 'dd MMM')} – ${formatIST(end, 'dd MMM yyyy')}`
}

/** Get the start/end of a given month */
export function getMonthBounds(year: number, month: number): { start: string; end: string } {
  const date = new Date(year, month - 1, 1)
  return {
    start: format(startOfMonth(date), 'yyyy-MM-dd'),
    end: format(endOfMonth(date), 'yyyy-MM-dd'),
  }
}

/** Get today in IST as YYYY-MM-DD */
export function todayIST(): string {
  return format(nowIST(), 'yyyy-MM-dd')
}
