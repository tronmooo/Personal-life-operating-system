/**
 * Format a number as currency
 */
export function formatCurrency(
  amount: number,
  includeSymbol: boolean = true,
  currency: string = 'USD'
): string {
  if (isNaN(amount)) return includeSymbol ? '$0.00' : '0.00'

  const formatted = new Intl.NumberFormat('en-US', {
    style: includeSymbol ? 'currency' : 'decimal',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)

  return formatted
}

/**
 * Parse currency string to number
 */
export function parseCurrency(value: string): number {
  const cleaned = value.replace(/[^0-9.-]/g, '')
  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? 0 : parsed
}




