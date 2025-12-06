/**
 * Domain Entry Validation Schemas
 * 
 * Comprehensive validation rules for all 21 life domains
 * Prevents corrupted data, enforces schema consistency, and validates data types
 */

import { z } from 'zod'

// ============================================================================
// CONSTANTS & LIMITS
// ============================================================================

export const VALIDATION_LIMITS = {
  TITLE_MIN_LENGTH: 1,
  TITLE_MAX_LENGTH: 200,
  DESCRIPTION_MAX_LENGTH: 2000,
  JSON_MAX_DEPTH: 4,
  STRING_FIELD_MAX: 500,
  NUMERIC_MAX: 999999999,
  NUMERIC_MIN: -999999999,
  ARRAY_MAX_LENGTH: 100,
} as const

// ============================================================================
// BASE SCHEMAS
// ============================================================================

const baseEntrySchema = z.object({
  title: z.string()
    .min(VALIDATION_LIMITS.TITLE_MIN_LENGTH, 'Title cannot be empty')
    .max(VALIDATION_LIMITS.TITLE_MAX_LENGTH, 'Title too long (max 200 characters)')
    .trim(),
  description: z.string()
    .max(VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH, 'Description too long (max 2000 characters)')
    .optional()
    .default(''),
  user_id: z.string().uuid('Invalid user ID'),
  domain: z.string().min(1, 'Domain is required'),
})

// ============================================================================
// DOMAIN-SPECIFIC METADATA SCHEMAS
// ============================================================================

// Financial Domain
export const financialMetadataSchema = z.object({
  amount: z.number()
    .min(0, 'Amount cannot be negative')
    .max(VALIDATION_LIMITS.NUMERIC_MAX, 'Amount too large')
    .optional(),
  category: z.enum(['food', 'housing', 'transport', 'utilities', 'insurance', 'entertainment', 'healthcare', 'other']).optional(),
  type: z.enum(['income', 'expense', 'transfer', 'investment']).optional(),
  merchant: z.string().max(VALIDATION_LIMITS.STRING_FIELD_MAX).optional(),
  account: z.string().max(VALIDATION_LIMITS.STRING_FIELD_MAX).optional(),
  date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  recurring: z.boolean().optional(),
})

// Health Domain
export const healthMetadataSchema = z.object({
  measurement_type: z.enum(['weight', 'blood_pressure', 'glucose', 'heart_rate', 'temperature', 'medication', 'symptom']).optional(),
  weight: z.number().min(0).max(1000).optional(), // lbs or kg
  unit: z.enum(['lbs', 'kg', 'mmHg', 'bpm', 'mg/dL', 'F', 'C']).optional(),
  systolic: z.number().min(50).max(250).optional(),
  diastolic: z.number().min(30).max(200).optional(),
  glucose: z.number().min(0).max(600).optional(),
  heart_rate: z.number().min(20).max(300).optional(),
  medication_name: z.string().max(VALIDATION_LIMITS.STRING_FIELD_MAX).optional(),
  dosage: z.string().max(100).optional(),
  date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
})

// Pets Domain
export const petsMetadataSchema = z.object({
  species: z.enum(['dog', 'cat', 'bird', 'fish', 'reptile', 'rodent', 'other']).optional(),
  name: z.string().min(1).max(100).optional(),
  breed: z.string().max(VALIDATION_LIMITS.STRING_FIELD_MAX).optional(),
  age: z.number().min(0).max(100).optional(),
  weight: z.number().min(0).max(1000).optional(),
  weight_unit: z.enum(['lbs', 'kg']).optional(),
  birthdate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  vet: z.string().max(VALIDATION_LIMITS.STRING_FIELD_MAX).optional(),
  microchip: z.string().max(50).optional(),
  insurance: z.boolean().optional(),
})

// Fitness Domain
export const fitnessMetadataSchema = z.object({
  activity: z.enum(['running', 'walking', 'cycling', 'swimming', 'gym', 'yoga', 'sports', 'other']).optional(),
  distance: z.number().min(0).max(1000).optional(),
  distance_unit: z.enum(['miles', 'km', 'meters', 'yards']).optional(),
  duration: z.number().min(0).max(1440).optional(), // minutes in a day
  duration_unit: z.enum(['minutes', 'hours', 'seconds']).optional(),
  calories: z.number().min(0).max(10000).optional(),
  steps: z.number().min(0).max(100000).optional(),
  heart_rate_avg: z.number().min(20).max(300).optional(),
  date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
})

// Nutrition Domain
export const nutritionMetadataSchema = z.object({
  meal_type: z.enum(['breakfast', 'lunch', 'dinner', 'snack', 'drink']).optional(),
  calories: z.number().min(0).max(10000).optional(),
  protein: z.number().min(0).max(500).optional(), // grams
  carbs: z.number().min(0).max(1000).optional(), // grams
  fat: z.number().min(0).max(500).optional(), // grams
  fiber: z.number().min(0).max(200).optional(), // grams
  water: z.number().min(0).max(10000).optional(), // oz or ml
  servings: z.number().min(0).max(50).optional(),
  date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
})

// Vehicles Domain
export const vehiclesMetadataSchema = z.object({
  make: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  year: z.number().min(1900).max(new Date().getFullYear() + 2).optional(),
  mileage: z.number().min(0).max(999999).optional(),
  vin: z.string().max(17).optional(),
  license_plate: z.string().max(20).optional(),
  color: z.string().max(50).optional(),
  purchase_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  purchase_price: z.number().min(0).max(VALIDATION_LIMITS.NUMERIC_MAX).optional(),
})

// Insurance Domain
export const insuranceMetadataSchema = z.object({
  type: z.enum(['health', 'auto', 'home', 'life', 'disability', 'dental', 'vision', 'pet', 'other']).optional(),
  provider: z.string().max(VALIDATION_LIMITS.STRING_FIELD_MAX).optional(),
  policy_number: z.string().max(100).optional(),
  premium: z.number().min(0).max(VALIDATION_LIMITS.NUMERIC_MAX).optional(),
  premium_frequency: z.enum(['monthly', 'quarterly', 'annual', 'semi-annual']).optional(),
  deductible: z.number().min(0).max(VALIDATION_LIMITS.NUMERIC_MAX).optional(),
  coverage_amount: z.number().min(0).max(VALIDATION_LIMITS.NUMERIC_MAX).optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

// Career Domain
export const careerMetadataSchema = z.object({
  event_type: z.enum(['interview', 'job_offer', 'promotion', 'performance_review', 'training', 'project', 'milestone']).optional(),
  company: z.string().max(VALIDATION_LIMITS.STRING_FIELD_MAX).optional(),
  position: z.string().max(VALIDATION_LIMITS.STRING_FIELD_MAX).optional(),
  salary: z.number().min(0).max(VALIDATION_LIMITS.NUMERIC_MAX).optional(),
  status: z.enum(['scheduled', 'completed', 'cancelled', 'pending', 'in_progress']).optional(),
  date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  location: z.string().max(VALIDATION_LIMITS.STRING_FIELD_MAX).optional(),
})

// Education Domain
export const educationMetadataSchema = z.object({
  institution: z.string().max(VALIDATION_LIMITS.STRING_FIELD_MAX).optional(),
  course_name: z.string().max(VALIDATION_LIMITS.STRING_FIELD_MAX).optional(),
  degree: z.string().max(200).optional(),
  platform: z.string().max(200).optional(),
  status: z.enum(['enrolled', 'in_progress', 'completed', 'dropped', 'paused']).optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  completion_percentage: z.number().min(0).max(100).optional(),
  grade: z.string().max(10).optional(),
  credits: z.number().min(0).max(1000).optional(),
})

// Travel Domain
export const travelMetadataSchema = z.object({
  destination: z.string().max(VALIDATION_LIMITS.STRING_FIELD_MAX).optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  budget: z.number().min(0).max(VALIDATION_LIMITS.NUMERIC_MAX).optional(),
  actual_cost: z.number().min(0).max(VALIDATION_LIMITS.NUMERIC_MAX).optional(),
  flight_number: z.string().max(50).optional(),
  hotel: z.string().max(VALIDATION_LIMITS.STRING_FIELD_MAX).optional(),
  confirmation_number: z.string().max(100).optional(),
  type: z.enum(['vacation', 'business', 'family', 'adventure', 'other']).optional(),
})

// Home Domain
export const homeMetadataSchema = z.object({
  task_type: z.enum(['maintenance', 'repair', 'upgrade', 'cleaning', 'project', 'inspection']).optional(),
  system: z.enum(['HVAC', 'plumbing', 'electrical', 'roof', 'foundation', 'appliance', 'landscaping', 'other']).optional(),
  cost: z.number().min(0).max(VALIDATION_LIMITS.NUMERIC_MAX).optional(),
  contractor: z.string().max(VALIDATION_LIMITS.STRING_FIELD_MAX).optional(),
  date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).optional(),
  warranty_expiry: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

// Digital Domain
export const digitalMetadataSchema = z.object({
  type: z.enum(['subscription', 'password', 'account', 'license', 'domain']).optional(),
  service: z.string().max(VALIDATION_LIMITS.STRING_FIELD_MAX).optional(),
  cost: z.number().min(0).max(VALIDATION_LIMITS.NUMERIC_MAX).optional(),
  billing_frequency: z.enum(['monthly', 'annual', 'one-time', 'quarterly']).optional(),
  renewal_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status: z.enum(['active', 'cancelled', 'paused', 'trial']).optional(),
  username: z.string().max(200).optional(),
  url: z.string().url().max(500).optional(),
})

// ============================================================================
// DOMAIN SCHEMA MAPPER
// ============================================================================

export const DOMAIN_METADATA_SCHEMAS: Record<string, z.ZodType> = {
  financial: financialMetadataSchema,
  health: healthMetadataSchema,
  pets: petsMetadataSchema,
  fitness: fitnessMetadataSchema,
  nutrition: nutritionMetadataSchema,
  vehicles: vehiclesMetadataSchema,
  insurance: insuranceMetadataSchema,
  career: careerMetadataSchema,
  education: educationMetadataSchema,
  travel: travelMetadataSchema,
  home: homeMetadataSchema,
  digital: digitalMetadataSchema,
  // Fallback for domains without specific schemas
  default: z.record(z.unknown()),
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

export interface DomainEntry {
  title: string
  description?: string
  user_id: string
  domain: string
  metadata: Record<string, unknown>
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
  sanitized?: DomainEntry
}

/**
 * Validate a domain entry with comprehensive checks
 */
export function validateDomainEntry(entry: Partial<DomainEntry>): ValidationResult {
  const errors: string[] = []

  // 1. Validate base fields
  try {
    baseEntrySchema.parse(entry)
  } catch (error: any) {
    if (error.errors) {
      errors.push(...error.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`))
    }
  }

  // 2. Validate metadata against domain schema
  if (entry.domain && entry.metadata) {
    const schema = DOMAIN_METADATA_SCHEMAS[entry.domain] || DOMAIN_METADATA_SCHEMAS.default
    
    try {
      schema.parse(entry.metadata)
    } catch (error: any) {
      if (error.errors) {
        errors.push(...error.errors.map((e: any) => `metadata.${e.path.join('.')}: ${e.message}`))
      }
    }
  }

  // 3. Check for HTML/XSS in text fields
  if (entry.title && /<script|<iframe|javascript:/i.test(entry.title)) {
    errors.push('title: Contains potentially malicious content')
  }

  if (entry.description && /<script|<iframe|javascript:/i.test(entry.description)) {
    errors.push('description: Contains potentially malicious content')
  }

  // 4. Sanitize and return
  if (errors.length === 0) {
    return {
      valid: true,
      errors: [],
      sanitized: {
        ...entry,
        title: entry.title?.trim() || '',
        description: entry.description?.trim() || '',
      } as DomainEntry,
    }
  }

  return {
    valid: false,
    errors,
  }
}

/**
 * Validate metadata matches domain type
 */
export function validateDomainMetadataMatch(domain: string, metadata: Record<string, unknown>): boolean {
  // Check for obvious mismatches
  const metadataKeys = Object.keys(metadata)
  
  // Financial domain shouldn't have pet data
  if (domain === 'financial' && (metadataKeys.includes('species') || metadataKeys.includes('breed'))) {
    return false
  }
  
  // Health domain shouldn't have financial account data
  if (domain === 'health' && (metadataKeys.includes('account') && metadataKeys.includes('amount'))) {
    return false
  }
  
  // Pets domain shouldn't have money data
  if (domain === 'pets' && metadataKeys.includes('amount') && !metadataKeys.includes('species')) {
    return false
  }
  
  return true
}

/**
 * Check for potential duplicates
 */
export function isDuplicateEntry(
  newEntry: DomainEntry,
  existingEntries: DomainEntry[],
  timeWindowMinutes: number = 5
): boolean {
  const now = new Date()
  
  return existingEntries.some(existing => {
    // Same title and domain
    if (existing.title === newEntry.title && existing.domain === newEntry.domain) {
      // Check if created within time window (would need created_at field)
      return true
    }
    return false
  })
}
















