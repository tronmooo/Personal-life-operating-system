/**
 * Formatting utilities for consistent display across the app
 */

/**
 * Format currency with proper thousands separators and currency symbol
 * @param amount - The amount to format
 * @param currency - The currency code (default: 'USD')
 * @returns Formatted currency string (e.g., "$4,000,000.00")
 */
export function formatCurrency(amount: number | string, currency: string = 'USD'): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  
  if (isNaN(numAmount)) return '$0.00'
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numAmount)
}

/**
 * Format large numbers with thousands separators (no currency symbol)
 * @param num - The number to format
 * @returns Formatted number string (e.g., "4,000,000")
 */
export function formatNumber(num: number | string): string {
  const numValue = typeof num === 'string' ? parseFloat(num) : num
  
  if (isNaN(numValue)) return '0'
  
  return new Intl.NumberFormat('en-US').format(numValue)
}

/**
 * Format weight with proper unit and spacing
 * @param value - The weight value
 * @param details - Optional details (e.g., "Morning weigh-in")
 * @returns Formatted weight string (e.g., "185 lbs - Morning weigh-in")
 */
export function formatWeight(value: string | number, details?: string): string {
  const parts = []
  parts.push(`${value} lbs`)
  if (details && details.trim()) {
    parts.push(details.trim())
  }
  return parts.join(' - ')
}

/**
 * Format meal entry with proper spacing
 * @param mealName - The name of the meal
 * @param details - Optional details (e.g., calories)
 * @returns Formatted meal string
 */
export function formatMeal(mealName: string, details?: string): string {
  const parts = [mealName.trim()]
  if (details && details.trim()) {
    parts.push(details.trim())
  }
  return parts.join(' - ')
}

/**
 * Format workout entry with proper spacing
 * @param exerciseType - The type of exercise
 * @param details - Optional details (e.g., duration)
 * @returns Formatted workout string
 */
export function formatWorkout(exerciseType: string, details?: string): string {
  const parts = [exerciseType.trim()]
  if (details && details.trim()) {
    parts.push(details.trim())
  }
  return parts.join(' - ')
}

/**
 * Format medication entry with proper spacing
 * @param medicationName - The name of the medication
 * @param details - Optional details (e.g., dosage)
 * @returns Formatted medication string
 */
export function formatMedication(medicationName: string, details?: string): string {
  const parts = [medicationName.trim()]
  if (details && details.trim()) {
    parts.push(details.trim())
  }
  return parts.join(' - ')
}

/**
 * Ensure proper text encoding (fix special characters)
 * @param text - The text to fix
 * @returns Text with proper encoding
 */
export function fixTextEncoding(text: string): string {
  // Replace common encoding issues
  return text
    .replace(/Ã©/g, 'é')
    .replace(/Ã¨/g, 'è')
    .replace(/Ã /g, 'à')
    .replace(/Ã¢/g, 'â')
    .replace(/Ã®/g, 'î')
    .replace(/Ã´/g, 'ô')
    .replace(/Ã»/g, 'û')
    .replace(/Ã§/g, 'ç')
    .replace(/Ã«/g, 'ë')
    .replace(/Ã¯/g, 'ï')
    .replace(/Ã¼/g, 'ü')
    .replace(/Ã±/g, 'ñ')
    .replace(/Ãˇ/g, 'č')
    .replace(/Å¡/g, 'š')
    .replace(/Ä‡/g, 'ć')
    .replace(/É/g, 'É')
}

/**
 * Format compact currency (for large numbers in limited space)
 * @param amount - The amount to format
 * @returns Compact formatted string (e.g., "$4M" or "$4.5K")
 */
export function formatCompactCurrency(amount: number): string {
  if (isNaN(amount)) return '$0'
  
  const absAmount = Math.abs(amount)
  const sign = amount < 0 ? '-' : ''
  
  if (absAmount >= 1_000_000_000) {
    return `${sign}$${(absAmount / 1_000_000_000).toFixed(1)}B`
  } else if (absAmount >= 1_000_000) {
    return `${sign}$${(absAmount / 1_000_000).toFixed(1)}M`
  } else if (absAmount >= 1_000) {
    return `${sign}$${(absAmount / 1_000).toFixed(1)}K`
  } else {
    return formatCurrency(amount)
  }
}

/**
 * Format percentage with proper decimal places
 * @param value - The percentage value
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted percentage string (e.g., "97.0%")
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  if (isNaN(value)) return '0%'
  return `${value.toFixed(decimals)}%`
}
































