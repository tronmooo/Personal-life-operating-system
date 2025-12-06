/**
 * Utilities for processing and categorizing extracted document fields
 */

import { ExtractedField } from '@/lib/ai/enhanced-document-extractor'

export interface CategorizedFields {
  highConfidence: FieldWithName[]
  mediumConfidence: FieldWithName[]
  lowConfidence: FieldWithName[]
}

export interface FieldWithName extends ExtractedField {
  name: string
}

/**
 * Categorize fields by confidence level
 */
export function categorizeFieldsByConfidence(
  fields: Record<string, ExtractedField>
): CategorizedFields {
  const fieldsArray: FieldWithName[] = Object.entries(fields).map(([name, field]) => ({
    ...field,
    name,
  }))

  return {
    highConfidence: fieldsArray.filter(f => f.confidence >= 0.8),
    mediumConfidence: fieldsArray.filter(f => f.confidence >= 0.5 && f.confidence < 0.8),
    lowConfidence: fieldsArray.filter(f => f.confidence < 0.5),
  }
}

/**
 * Get priority/important fields that should be shown first
 */
export function getPriorityFields(fields: Record<string, ExtractedField>): string[] {
  const priorityFieldNames = [
    // Insurance
    'policyNumber',
    'provider',
    'effectiveDate',
    'expirationDate',
    'renewalDate',
    'memberId',
    'groupNumber',
    
    // Financial
    'vendor',
    'company',
    'total',
    'amount',
    'totalDue',
    'date',
    'dueDate',
    'accountNumber',
    
    // Health/Prescription
    'medicationName',
    'dosage',
    'prescriberName',
    'provider',
    'diagnosis',
    
    // Vehicle
    'make',
    'model',
    'year',
    'vin',
    'licensePlate',
    'expirationDate',
  ]

  return Object.keys(fields).filter(name => priorityFieldNames.includes(name))
}

/**
 * Convert field name to human-readable label
 */
export function humanizeFieldName(fieldName: string): string {
  // If field already has a label, use it
  // Otherwise convert camelCase to Title Case
  return fieldName
    .replace(/([A-Z])/g, ' $1') // Add space before capitals
    .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
    .trim()
}

/**
 * Get appropriate icon for field type
 */
export function getFieldIcon(fieldType: string): string {
  const icons: Record<string, string> = {
    date: '📅',
    currency: '💰',
    number: '#️⃣',
    phone: '📞',
    email: '📧',
    address: '📍',
    text: '📝',
  }
  return icons[fieldType] || '📝'
}

/**
 * Format field value for display
 */
export function formatFieldValue(field: ExtractedField): string {
  if (field.value === null || field.value === undefined) {
    return ''
  }

  switch (field.fieldType) {
    case 'date':
      try {
        return new Date(field.value).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      } catch {
        return field.value.toString()
      }

    case 'currency':
      const num = typeof field.value === 'number' ? field.value : parseFloat(field.value)
      return isNaN(num) ? field.value.toString() : `$${num.toFixed(2)}`

    case 'phone':
      // Format phone number if it's just digits
      const digits = field.value.toString().replace(/\D/g, '')
      if (digits.length === 10) {
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
      }
      return field.value.toString()

    case 'number':
      return field.value.toString()

    default:
      if (Array.isArray(field.value)) {
        return field.value.join(', ')
      }
      return field.value.toString()
  }
}

/**
 * Get confidence badge color
 */
export function getConfidenceBadgeColor(confidence: number): string {
  if (confidence >= 0.8) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
  if (confidence >= 0.5) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
  return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
}

/**
 * Get confidence label
 */
export function getConfidenceLabel(confidence: number): string {
  if (confidence >= 0.8) return 'High'
  if (confidence >= 0.5) return 'Medium'
  return 'Low'
}

/**
 * Validate field value based on type
 */
export function validateFieldValue(field: ExtractedField, value: string): boolean {
  if (!value || value.trim() === '') return true // Empty is valid (optional fields)

  switch (field.fieldType) {
    case 'date':
      return !isNaN(Date.parse(value))

    case 'currency':
    case 'number':
      return !isNaN(parseFloat(value))

    case 'email':
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

    case 'phone':
      const digits = value.replace(/\D/g, '')
      return digits.length >= 10

    default:
      return true
  }
}

/**
 * Group fields by category (for display)
 */
export function groupFieldsByCategory(fields: Record<string, ExtractedField>): Record<string, FieldWithName[]> {
  const categories: Record<string, string[]> = {
    'Key Information': [
      'policyNumber', 'memberId', 'groupNumber', 'accountNumber',
      'vendor', 'company', 'provider', 'medicationName'
    ],
    'Dates': [
      'effectiveDate', 'expirationDate', 'renewalDate', 'date',
      'dueDate', 'issueDate', 'birthDate', 'dateOfBirth'
    ],
    'Financial': [
      'total', 'amount', 'totalDue', 'premium', 'deductible',
      'copay', 'price', 'subtotal', 'tax'
    ],
    'Contact Information': [
      'phone', 'email', 'address', 'providerPhone',
      'customerServicePhone', 'agentPhone'
    ],
    'Personal Information': [
      'name', 'subscriberName', 'beneficiaryName', 'patientName',
      'ownerName', 'prescriberName'
    ],
  }

  const grouped: Record<string, FieldWithName[]> = {
    'Key Information': [],
    'Dates': [],
    'Financial': [],
    'Contact Information': [],
    'Personal Information': [],
    'Other': [],
  }

  Object.entries(fields).forEach(([name, field]) => {
    const fieldWithName: FieldWithName = { ...field, name }
    
    let categorized = false
    for (const [category, fieldNames] of Object.entries(categories)) {
      if (fieldNames.includes(name)) {
        grouped[category].push(fieldWithName)
        categorized = true
        break
      }
    }
    
    if (!categorized) {
      grouped['Other'].push(fieldWithName)
    }
  })

  // Remove empty categories
  Object.keys(grouped).forEach(key => {
    if (grouped[key].length === 0) {
      delete grouped[key]
    }
  })

  return grouped
}




















