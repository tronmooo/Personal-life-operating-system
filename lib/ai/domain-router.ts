import { Domain, DOMAIN_CONFIGS } from '@/types/domains'
import { DomainMetadataMap } from '@/types/domain-metadata'
import { ExtractedEntity } from './multi-entity-extractor'

export interface EntityConflict {
  entity: ExtractedEntity
  errors: string[]
}

export interface RoutingResult {
  routedEntities: ExtractedEntity[]
  conflicts?: EntityConflict[]
}

/**
 * Validates and enriches entity data based on domain rules
 */
export function validateAndEnrichEntity(entity: ExtractedEntity): {
  valid: boolean
  enrichedEntity?: ExtractedEntity
  errors?: string[]
} {
  const domainConfig = DOMAIN_CONFIGS[entity.domain]
  if (!domainConfig) {
    return { valid: false, errors: [`Invalid domain: ${entity.domain}`] }
  }

  const errors: string[] = []
  const enrichedData = { ...entity.data }

  // Domain-specific validation and enrichment
  switch (entity.domain) {
    case 'pets':
      // Infer species from context if not provided
      if (!enrichedData.species && enrichedData.petName) {
        enrichedData.species = inferSpeciesFromName(enrichedData.petName as string)
      }
      // Ensure type is set
      if (!enrichedData.type) {
        enrichedData.type = 'health_record'
      }
      break

    case 'nutrition':
      // Water entries should have 0 calories
      if (enrichedData.itemType === 'water' && !enrichedData.calories) {
        enrichedData.calories = '0'
      }
      // Ensure itemType is set
      if (!enrichedData.itemType) {
        enrichedData.itemType = 'meal'
      }
      // Ensure date is set for nutrition tracking
      if (!enrichedData.date) {
        enrichedData.date = new Date().toISOString()
      }
      break

    case 'financial':
      // Ensure type is set
      if (!enrichedData.type) {
        enrichedData.type = 'expense'
      }
      // Ensure date field
      if (!enrichedData.date && !enrichedData.transactionDate) {
        enrichedData.transactionDate = new Date().toISOString()
      }
      // Validate amount exists
      if (!enrichedData.amount) {
        errors.push('Financial entry missing amount')
      }
      break

    case 'fitness':
      // Ensure date is set
      if (!enrichedData.date) {
        enrichedData.date = new Date().toISOString()
      }
      // ✅ FIX: Fitness dashboard REQUIRES BOTH activityType AND type/itemType fields
      // The tabs filter by checking if type='activity'/'workout'/'exercise'
      // Then they display using activityType field
      if (!enrichedData.activityType) {
        enrichedData.activityType = enrichedData.exercise || enrichedData.activity || enrichedData.type || 'Running'
      }
      // Set type field for filtering (activities-tab.tsx line 48 checks this)
      if (!enrichedData.type && !enrichedData.itemType && !enrichedData.logType) {
        enrichedData.type = 'activity'
      }
      // Validate activity type or duration exists
      if (!enrichedData.activityType && !enrichedData.duration) {
        errors.push('Fitness entry missing activity type or duration')
      }
      break

    case 'health':
      // Ensure recordType is set
      if (!enrichedData.recordType && !enrichedData.type) {
        // Try to infer from available fields
        if (enrichedData.weight) enrichedData.recordType = 'weight'
        else if (enrichedData.systolic || enrichedData.diastolic) enrichedData.recordType = 'blood_pressure'
        else enrichedData.recordType = 'general'
      }
      // Ensure date is set
      if (!enrichedData.date) {
        enrichedData.date = new Date().toISOString()
      }
      break

    case 'vehicles':
      // Ensure type is set
      if (!enrichedData.type) {
        enrichedData.type = 'maintenance'
      }
      // Set status for maintenance entries
      if (enrichedData.type === 'maintenance' && !enrichedData.status) {
        enrichedData.status = enrichedData.cost ? 'Completed' : 'Pending'
      }
      break

    case 'home':
      // Ensure itemType is set
      if (!enrichedData.itemType) {
        enrichedData.itemType = 'Maintenance Task'
      }
      // Set default status
      if (!enrichedData.status) {
        enrichedData.status = 'Pending'
      }
      break

    case 'appliances':
      // Ensure name is set
      if (!enrichedData.name && entity.title) {
        enrichedData.name = entity.title
      }
      break

    case 'relationships':
      // Ensure relationshipType is set
      if (!enrichedData.relationshipType) {
        enrichedData.relationshipType = 'Friend'
      }
      break

    case 'digital':
      // Ensure serviceName or category exists
      if (!enrichedData.serviceName && !enrichedData.category) {
        errors.push('Digital entry missing service name or category')
      }
      break

    case 'mindfulness':
      // Ensure entryType is set
      if (!enrichedData.entryType && !enrichedData.type) {
        enrichedData.entryType = 'Journal'
      }
      // Ensure date
      if (!enrichedData.date) {
        enrichedData.date = new Date().toISOString()
      }
      break

    case 'insurance':
      // Ensure itemType is set
      if (!enrichedData.itemType) {
        enrichedData.itemType = 'Insurance Policy'
      }
      break

    case 'miscellaneous':
      // Ensure category is set
      if (!enrichedData.category && entity.title) {
        enrichedData.category = 'Other'
      }
      break
  }

  // Check for validation errors
  if (errors.length > 0) {
    return { valid: false, errors }
  }

  return {
    valid: true,
    enrichedEntity: { ...entity, data: enrichedData },
    errors: undefined
  }
}

/**
 * Infer animal species from pet name (common names)
 */
function inferSpeciesFromName(name: string): string {
  const lowerName = name.toLowerCase()
  
  // Common dog names
  const dogNames = ['max', 'buddy', 'charlie', 'bella', 'lucy', 'bailey', 'daisy', 
                    'cooper', 'molly', 'sadie', 'rocky', 'duke', 'bear', 'jack']
  
  // Common cat names  
  const catNames = ['whiskers', 'mittens', 'shadow', 'felix', 'luna', 'simba', 
                    'oliver', 'tiger', 'smokey', 'oreo', 'cleo', 'princess']
  
  if (dogNames.some(n => lowerName.includes(n))) return 'Dog'
  if (catNames.some(n => lowerName.includes(n))) return 'Cat'
  
  // Generic terms
  if (lowerName.includes('dog') || lowerName.includes('pup')) return 'Dog'
  if (lowerName.includes('cat') || lowerName.includes('kitten')) return 'Cat'
  if (lowerName.includes('bird')) return 'Bird'
  if (lowerName.includes('fish')) return 'Fish'
  
  return 'Unknown'
}

/**
 * Route entities to correct domains with conflict resolution
 */
export function routeEntities(entities: ExtractedEntity[]): RoutingResult {
  const routedEntities: ExtractedEntity[] = []
  const conflicts: EntityConflict[] = []

  for (const entity of entities) {
    const validation = validateAndEnrichEntity(entity)
    
    if (validation.valid && validation.enrichedEntity) {
      routedEntities.push(validation.enrichedEntity)
      console.log(`✅ [ROUTER] Validated ${entity.domain}: ${entity.title}`)
    } else {
      conflicts.push({
        entity,
        errors: validation.errors || ['Unknown validation error']
      })
      console.warn(`⚠️ [ROUTER] Validation failed for ${entity.domain}: ${entity.title}`, validation.errors)
    }
  }

  return { 
    routedEntities, 
    conflicts: conflicts.length > 0 ? conflicts : undefined 
  }
}

/**
 * Detect and handle duplicate/overlapping entities
 * Example: "vet visit $150" could create both pet entry AND financial entry
 */
export function detectDuplicates(entities: ExtractedEntity[]): ExtractedEntity[] {
  // For now, allow duplicates across different domains (e.g., vet visit + expense)
  // This is intentional - users may want both entries
  
  // Only filter exact duplicates within same domain
  const seen = new Set<string>()
  return entities.filter(entity => {
    const key = `${entity.domain}:${entity.title}:${JSON.stringify(entity.data)}`
    if (seen.has(key)) {
      console.warn(`⚠️ [ROUTER] Duplicate detected and filtered: ${entity.title}`)
      return false
    }
    seen.add(key)
    return true
  })
}
















