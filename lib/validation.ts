/**
 * Input validation and sanitization utilities
 * Addresses security vulnerabilities and data integrity issues
 */

/**
 * Sanitizes HTML/script tags from user input to prevent XSS attacks
 * @param input - Raw user input string
 * @returns Sanitized string safe for display
 */
export function sanitizeInput(input: string): string {
  if (!input) return ''
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim()
}

/**
 * Validates email format
 * @param email - Email string to validate
 * @returns true if valid email format
 */
export function isValidEmail(email: string): boolean {
  if (!email) return true // Empty is allowed
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validates and parses numeric input, ensuring positive values only
 * @param value - String value to parse
 * @param options - Validation options
 * @returns Parsed number or null if invalid
 */
export function parsePositiveNumber(
  value: string,
  options: {
    min?: number
    max?: number
    allowZero?: boolean
  } = {}
): number | null {
  const { min = 0, max = Infinity, allowZero = false } = options
  
  // Only accept pure numeric input (with optional decimal)
  const numericRegex = /^-?\d*\.?\d+$/
  if (!numericRegex.test(value.trim())) {
    return null
  }
  
  const parsed = parseFloat(value)
  
  if (isNaN(parsed)) return null
  if (!allowZero && parsed === 0) return null
  if (parsed < min) return null
  if (parsed > max) return null
  
  return parsed
}

/**
 * Parse flexible date formats and convert to YYYY-MM-DD
 * Supports: MM/DD/YYYY, M/D/YYYY, YYYY-MM-DD
 * @param dateStr - Date string in various formats
 * @returns Date object or null if invalid
 */
export function parseFlexibleDate(dateStr: string): Date | null {
  if (!dateStr || !dateStr.trim()) return null
  
  // Try MM/DD/YYYY or M/D/YYYY format
  const slashFormat = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
  const slashMatch = dateStr.match(slashFormat)
  if (slashMatch) {
    const [, month, day, year] = slashMatch
    const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    if (!isNaN(dateObj.getTime())) {
      return dateObj
    }
  }
  
  // Try YYYY-MM-DD format (ISO)
  const isoFormat = /^(\d{4})-(\d{2})-(\d{2})$/
  const isoMatch = dateStr.match(isoFormat)
  if (isoMatch) {
    const dateObj = new Date(dateStr)
    if (!isNaN(dateObj.getTime())) {
      return dateObj
    }
  }
  
  // Try direct parse as fallback
  const dateObj = new Date(dateStr)
  if (!isNaN(dateObj.getTime())) {
    return dateObj
  }
  
  return null
}

/**
 * Convert date to YYYY-MM-DD format
 * @param date - Date object
 * @returns Date string in YYYY-MM-DD format
 */
export function formatDateToISO(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Validates date is not in the future
 * Now accepts multiple date formats: MM/DD/YYYY, M/D/YYYY, YYYY-MM-DD
 * @param date - Date string or Date object
 * @param allowFuture - Whether to allow future dates
 * @returns true if date is valid
 */
export function isValidDate(date: string | Date, allowFuture: boolean = false): boolean {
  if (!date) return true // Empty is allowed
  
  let dateObj: Date
  
  if (typeof date === 'string') {
    const parsed = parseFlexibleDate(date)
    if (!parsed) return false
    dateObj = parsed
  } else {
    dateObj = date
  }
  
  if (isNaN(dateObj.getTime())) return false
  
  if (!allowFuture && dateObj > new Date()) {
    return false
  }
  
  // Check for reasonable date range (1900 - current year + 100)
  const year = dateObj.getFullYear()
  if (year < 1900 || year > new Date().getFullYear() + 100) {
    return false
  }
  
  return true
}

/**
 * Validates phone number format (basic validation)
 * @param phone - Phone number string
 * @returns true if valid phone format
 */
export function isValidPhone(phone: string): boolean {
  if (!phone) return true // Empty is allowed
  
  // Remove all non-numeric characters for validation
  const cleaned = phone.replace(/\D/g, '')
  
  // Check if it has at least 10 digits (US standard)
  return cleaned.length >= 10
}

/**
 * Validates water intake amount (reasonable limits)
 * @param amount - Amount in ounces
 * @returns true if within reasonable range
 */
export function isValidWaterAmount(amount: number): boolean {
  // Maximum reasonable water intake: 200 oz per day
  // Minimum: 1 oz
  return amount >= 1 && amount <= 200
}

/**
 * Validates financial amount (no negatives unless explicitly allowed)
 * @param amount - Financial amount
 * @param allowNegative - Whether negative values are allowed
 * @returns true if valid
 */
export function isValidFinancialAmount(
  amount: number,
  allowNegative: boolean = false
): boolean {
  if (isNaN(amount)) return false
  if (!allowNegative && amount < 0) return false
  if (Math.abs(amount) > 999999999) return false // Reasonable max: 1 billion
  
  return true
}

/**
 * Gets validation error message for display
 */
export function getValidationError(type: string, value: any): string | null {
  switch (type) {
    case 'email':
      return !isValidEmail(value) ? 'Please enter a valid email address' : null
    
    case 'phone':
      return !isValidPhone(value) ? 'Please enter a valid phone number (at least 10 digits)' : null
    
    case 'date':
      return !isValidDate(value) ? 'Please enter a valid date (not in the future)' : null
    
    case 'date-future-ok':
      return !isValidDate(value, true) ? 'Please enter a valid date' : null
    
    case 'positive-number':
      const num = parsePositiveNumber(value)
      return num === null ? 'Please enter a valid positive number' : null
    
    case 'water':
      const water = parsePositiveNumber(value, { min: 1, max: 200 })
      return water === null ? 'Please enter a valid amount (1-200 oz)' : null
    
    case 'financial':
      const amount = parseFloat(value)
      return !isValidFinancialAmount(amount) ? 'Please enter a valid amount (no negative values)' : null
    
    default:
      return null
  }
}


