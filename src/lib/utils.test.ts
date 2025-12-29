import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { cn, formatCurrency, formatDate, formatRelativeTime } from './utils'

describe('cn (className utility)', () => {
  it('should merge class names correctly', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1')
  })

  it('should handle conditional classes', () => {
    expect(cn('base', true && 'included', false && 'excluded')).toBe('base included')
  })

  it('should merge Tailwind classes and resolve conflicts', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })

  it('should handle arrays of classes', () => {
    expect(cn(['class1', 'class2'])).toBe('class1 class2')
  })

  it('should handle undefined and null values', () => {
    expect(cn('base', undefined, null, 'end')).toBe('base end')
  })

  it('should handle empty strings', () => {
    expect(cn('base', '', 'end')).toBe('base end')
  })

  it('should handle object syntax', () => {
    expect(cn({ active: true, disabled: false })).toBe('active')
  })
})

describe('formatCurrency', () => {
  it('should format cents to USD currency string', () => {
    expect(formatCurrency(10000)).toBe('$100.00')
  })

  it('should format zero cents', () => {
    expect(formatCurrency(0)).toBe('$0.00')
  })

  it('should format large amounts', () => {
    expect(formatCurrency(1000000)).toBe('$10,000.00')
  })

  it('should format small amounts with decimals', () => {
    expect(formatCurrency(99)).toBe('$0.99')
  })

  it('should handle negative amounts', () => {
    expect(formatCurrency(-5000)).toBe('-$50.00')
  })

  it('should format with custom currency', () => {
    const result = formatCurrency(10000, 'EUR')
    expect(result).toContain('100')
  })

  it('should format with GBP currency', () => {
    const result = formatCurrency(10000, 'GBP')
    expect(result).toContain('100')
  })
})

describe('formatDate', () => {
  it('should format date string to readable format', () => {
    const result = formatDate('2024-01-15')
    expect(result).toBe('Jan 15, 2024')
  })

  it('should format Date object', () => {
    const date = new Date('2024-06-20')
    const result = formatDate(date)
    expect(result).toBe('Jun 20, 2024')
  })

  it('should format ISO date string with time', () => {
    const result = formatDate('2024-12-25T10:30:00.000Z')
    expect(result).toContain('Dec')
    expect(result).toContain('2024')
  })

  it('should handle different months correctly', () => {
    expect(formatDate('2024-03-01')).toBe('Mar 1, 2024')
    expect(formatDate('2024-07-15')).toBe('Jul 15, 2024')
    expect(formatDate('2024-11-30')).toBe('Nov 30, 2024')
  })
})

describe('formatRelativeTime', () => {
  const now = new Date('2024-06-15T12:00:00.000Z')

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(now)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return "just now" for very recent times', () => {
    const recent = new Date(now.getTime() - 30 * 1000) // 30 seconds ago
    expect(formatRelativeTime(recent)).toBe('just now')
  })

  it('should format minutes ago', () => {
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)
    expect(formatRelativeTime(fiveMinutesAgo)).toBe('5m ago')
  })

  it('should format single minute ago', () => {
    const oneMinuteAgo = new Date(now.getTime() - 1 * 60 * 1000)
    expect(formatRelativeTime(oneMinuteAgo)).toBe('1m ago')
  })

  it('should format hours ago', () => {
    const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000)
    expect(formatRelativeTime(threeHoursAgo)).toBe('3h ago')
  })

  it('should format single hour ago', () => {
    const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000)
    expect(formatRelativeTime(oneHourAgo)).toBe('1h ago')
  })

  it('should format days ago', () => {
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
    expect(formatRelativeTime(twoDaysAgo)).toBe('2d ago')
  })

  it('should format single day ago', () => {
    const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)
    expect(formatRelativeTime(oneDayAgo)).toBe('1d ago')
  })

  it('should format as date for times older than a week', () => {
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
    const result = formatRelativeTime(twoWeeksAgo)
    expect(result).toContain('Jun')
    expect(result).toContain('2024')
  })

  it('should handle string date input', () => {
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString()
    expect(formatRelativeTime(fiveMinutesAgo)).toBe('5m ago')
  })

  it('should handle exactly 59 minutes as minutes', () => {
    const fiftyNineMinutesAgo = new Date(now.getTime() - 59 * 60 * 1000)
    expect(formatRelativeTime(fiftyNineMinutesAgo)).toBe('59m ago')
  })

  it('should handle exactly 23 hours as hours', () => {
    const twentyThreeHoursAgo = new Date(now.getTime() - 23 * 60 * 60 * 1000)
    expect(formatRelativeTime(twentyThreeHoursAgo)).toBe('23h ago')
  })

  it('should handle exactly 6 days as days', () => {
    const sixDaysAgo = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000)
    expect(formatRelativeTime(sixDaysAgo)).toBe('6d ago')
  })
})
