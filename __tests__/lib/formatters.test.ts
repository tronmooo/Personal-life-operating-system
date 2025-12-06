/**
 * Unit tests for formatting utilities
 * Tests currency, number, and text formatters
 */

import {
  formatCurrency,
  formatNumber,
  formatWeight,
  formatMeal,
  formatWorkout,
  formatMedication,
  formatCompactCurrency,
  formatPercentage,
} from '@/lib/formatters'

describe('Formatters', () => {
  describe('formatCurrency', () => {
    test('formats standard currency', () => {
      expect(formatCurrency(1000)).toBe('$1,000.00')
      expect(formatCurrency(1234567.89)).toBe('$1,234,567.89')
    })

    test('handles zero', () => {
      expect(formatCurrency(0)).toBe('$0.00')
    })

    test('handles negative values', () => {
      expect(formatCurrency(-500)).toBe('-$500.00')
    })

    test('handles string input', () => {
      expect(formatCurrency('1000')).toBe('$1,000.00')
    })

    test('handles invalid input', () => {
      expect(formatCurrency('invalid')).toBe('$0.00')
    })
  })

  describe('formatNumber', () => {
    test('formats numbers with thousands separators', () => {
      expect(formatNumber(1000)).toBe('1,000')
      expect(formatNumber(1234567)).toBe('1,234,567')
    })

    test('handles zero', () => {
      expect(formatNumber(0)).toBe('0')
    })

    test('handles string input', () => {
      expect(formatNumber('5000')).toBe('5,000')
    })
  })

  describe('formatWeight', () => {
    test('formats weight with unit', () => {
      expect(formatWeight(185)).toBe('185 lbs')
      expect(formatWeight('170')).toBe('170 lbs')
    })

    test('includes details when provided', () => {
      expect(formatWeight(180, 'Morning weigh-in')).toBe('180 lbs - Morning weigh-in')
    })

    test('handles empty details', () => {
      expect(formatWeight(180, '')).toBe('180 lbs')
      expect(formatWeight(180, '   ')).toBe('180 lbs')
    })
  })

  describe('formatMeal', () => {
    test('formats meal name', () => {
      expect(formatMeal('Chicken Salad')).toBe('Chicken Salad')
    })

    test('includes details when provided', () => {
      expect(formatMeal('Chicken Salad', '450 cal')).toBe('Chicken Salad - 450 cal')
    })

    test('trims whitespace', () => {
      expect(formatMeal('  Pasta  ', '  600 cal  ')).toBe('Pasta - 600 cal')
    })
  })

  describe('formatWorkout', () => {
    test('formats workout type', () => {
      expect(formatWorkout('Running')).toBe('Running')
    })

    test('includes details when provided', () => {
      expect(formatWorkout('Running', '30 min')).toBe('Running - 30 min')
    })
  })

  describe('formatMedication', () => {
    test('formats medication name', () => {
      expect(formatMedication('Aspirin')).toBe('Aspirin')
    })

    test('includes dosage when provided', () => {
      expect(formatMedication('Aspirin', '100mg')).toBe('Aspirin - 100mg')
    })
  })

  describe('formatCompactCurrency', () => {
    test('formats billions', () => {
      expect(formatCompactCurrency(4_500_000_000)).toBe('$4.5B')
      expect(formatCompactCurrency(1_000_000_000)).toBe('$1.0B')
    })

    test('formats millions', () => {
      expect(formatCompactCurrency(4_500_000)).toBe('$4.5M')
      expect(formatCompactCurrency(1_000_000)).toBe('$1.0M')
    })

    test('formats thousands', () => {
      expect(formatCompactCurrency(4_500)).toBe('$4.5K')
      expect(formatCompactCurrency(1_000)).toBe('$1.0K')
    })

    test('formats small amounts normally', () => {
      expect(formatCompactCurrency(500)).toBe('$500.00')
    })

    test('handles negative values', () => {
      expect(formatCompactCurrency(-5_000_000)).toBe('-$5.0M')
    })

    test('handles zero', () => {
      expect(formatCompactCurrency(0)).toBe('$0.00')
    })
  })

  describe('formatPercentage', () => {
    test('formats percentage with default decimals', () => {
      expect(formatPercentage(97.0)).toBe('97.0%')
      expect(formatPercentage(12.5)).toBe('12.5%')
    })

    test('formats percentage with custom decimals', () => {
      expect(formatPercentage(97.123, 2)).toBe('97.12%')
      expect(formatPercentage(97.123, 0)).toBe('97%')
    })

    test('handles zero', () => {
      expect(formatPercentage(0)).toBe('0.0%')
    })

    test('handles invalid input', () => {
      expect(formatPercentage(NaN)).toBe('0%')
    })
  })
})






























