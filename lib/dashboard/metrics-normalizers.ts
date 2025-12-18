import { differenceInDays } from 'date-fns'
import type { DomainData } from '@/types/domains'

export type GenericMetadata = Record<string, unknown>

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date)

const getNestedValue = (obj: GenericMetadata, targetKey: string): unknown => {
  if (!obj) return undefined
  const target = targetKey.toLowerCase()
  const stack: Array<GenericMetadata> = [obj]

  while (stack.length > 0) {
    const current = stack.pop()!
    for (const [key, value] of Object.entries(current)) {
      if (key.toLowerCase() === target) {
        return value
      }
      if (isPlainObject(value)) {
        stack.push(value)
      }
    }
  }

  return undefined
}

const hasTruthyValueDeep = (meta: GenericMetadata, keys: string[]): boolean => {
  for (const key of keys) {
    const value = getNestedValue(meta, key)
    if (typeof value === 'string' && value.trim().length > 0) return true
    if (value !== undefined && value !== null && value !== '') return true
  }
  return false
}

export const extractMetadata = (entry: DomainData | undefined | null): GenericMetadata => {
  if (!entry) return {}
  const rawMetadata = entry.metadata as unknown
  
  if (!rawMetadata) return {}

  if (isPlainObject(rawMetadata)) {
    const metaObj = rawMetadata as Record<string, unknown>

    const nested = metaObj.metadata
    if (nested && isPlainObject(nested)) {
      return nested as GenericMetadata
    }

    return metaObj as GenericMetadata
  }

  return {}
}

export const parseNumeric = (value: unknown): number => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0
  }
  if (typeof value === 'string') {
    const parsed = parseFloat(value.replace(/[^0-9.-]/g, ''))
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

export const pickStringTokens = (meta: GenericMetadata, keys: string[]): string[] =>
  keys
    .map((key) => {
      const value = getNestedValue(meta, key)
      return typeof value === 'string' && value.trim().length > 0 ? value.toLowerCase() : undefined
    })
    .filter((token): token is string => Boolean(token))

export const pickFirstDate = (meta: GenericMetadata | undefined, keys: string[]): Date | null => {
  if (!meta) return null
  for (const key of keys) {
    const value = meta[key]
    if (value === null || value === undefined) continue
    const candidate = new Date(value as any)
    if (!Number.isNaN(candidate.getTime())) {
      return candidate
    }
  }
  return null
}

export const hasTruthyValue = (meta: GenericMetadata, keys: string[]): boolean =>
  hasTruthyValueDeep(meta, keys)

const dateFromValue = (value: unknown): Date | null => {
  if (value === null || value === undefined || value === '') {
    return null
  }
  const candidate = new Date(value as any)
  return Number.isNaN(candidate.getTime()) ? null : candidate
}

const pickEntryDate = (meta: GenericMetadata, entry: DomainData): Date | null => {
  const candidates: unknown[] = [
    meta.date,
    meta.recordedAt,
    meta.loggedAt,
    meta.timestamp,
    meta.performedOn,
    meta.eventDate,
    meta.startDate,
    meta.completedDate,
    meta.nextDue,
    meta.lastVisit,
    entry.updatedAt,
    entry.createdAt,
  ]

  for (const candidate of candidates) {
    const parsed = dateFromValue(candidate)
    if (parsed) {
      return parsed
    }
  }
  return null
}

type BaseMappedEntry = {
  entry: DomainData
  meta: GenericMetadata
  occurredAt: Date | null
}

const mapEntries = (entries: DomainData[] | undefined | null): BaseMappedEntry[] => {
  if (!Array.isArray(entries) || entries.length === 0) return []
  return entries.map((entry) => {
    const meta = extractMetadata(entry)
    return {
      entry,
      meta,
      occurredAt: pickEntryDate(meta, entry),
    }
  })
}

const sortByDateDesc = <T extends BaseMappedEntry>(items: T[]): T[] =>
  [...items].sort((a, b) => {
    const aTime = a.occurredAt ? a.occurredAt.getTime() : 0
    const bTime = b.occurredAt ? b.occurredAt.getTime() : 0
    return bTime - aTime
  })

export interface HealthStats {
  hasData: boolean
  itemsCount: number
  vitalsCount: number
  steps: number
  weight: number
  heartRate: number
  glucose: number
  medicationCount: number
  bloodPressure: string
  latestReadingDate: Date | null
}

const isHealthVitalsEntry = (meta: GenericMetadata): boolean => {
  const recordType = String(
    getNestedValue(meta, 'recordType') ??
    getNestedValue(meta, 'type') ??
    getNestedValue(meta, 'logType') ?? ''
  ).toLowerCase()
  if (recordType.includes('vital')) return true
  if (recordType.includes('fitness') || recordType.includes('wellness')) return true
  return hasTruthyValue(meta, ['steps', 'weight', 'heartRate', 'hr', 'bpm', 'glucose'])
}

const isHealthMedicationEntry = (meta: GenericMetadata): boolean => {
  const recordType = String(
    getNestedValue(meta, 'recordType') ??
    getNestedValue(meta, 'type') ??
    getNestedValue(meta, 'logType') ?? ''
  ).toLowerCase()
  if (recordType.includes('medication') || recordType.includes('pharmacy')) return true
  return hasTruthyValue(meta, ['medicationName', 'dosage', 'prescriber'])
}

const isBloodPressureEntry = (meta: GenericMetadata): boolean =>
  hasTruthyValue(meta, ['systolic', 'diastolic'])

const latestNumeric = (entries: BaseMappedEntry[], keys: string[]): number => {
  if (!entries || entries.length === 0) return 0

  const sorted = sortByDateDesc(entries)
  for (const item of sorted) {
    const meta = item.meta as GenericMetadata
    for (const key of keys) {
      const value = getNestedValue(meta, key)
      if (value === null || value === undefined) continue

      const parsed = parseNumeric(value)
      if (parsed !== 0 || (typeof value === 'number' && value === 0)) {
        return parsed
      }
    }
  }
  return 0
}

export const computeHealthStats = (entries?: DomainData[] | null): HealthStats => {
  const mapped = mapEntries(entries)
  
  // Debug: Log sample entries
  if (mapped.length > 0) {
    console.log('🏥 [computeHealthStats] Sample mapped entries:', mapped.slice(0, 2).map(({ entry, meta }) => ({
      id: entry.id,
      title: entry.title,
      metaKeys: Object.keys(meta),
      metaSample: Object.fromEntries(Object.entries(meta).slice(0, 5))
    })))
  }
  
  const vitals = mapped.filter(({ meta }) => isHealthVitalsEntry(meta))
  const medications = mapped.filter(({ meta }) => isHealthMedicationEntry(meta))
  const bpEntries = mapped.filter(({ meta }) => isBloodPressureEntry(meta))

  console.log('🏥 [computeHealthStats] Filtered:', 
    `Total: ${mapped.length}, ` +
    `Vitals: ${vitals.length}, ` +
    `Meds: ${medications.length}, ` +
    `BP Entries: ${bpEntries.length}`
  )
  
  if (vitals.length > 0) {
    console.log('🏥 [computeHealthStats] Vitals sample:', JSON.stringify({
      count: vitals.length,
      latest: vitals.slice(0, 2).map(v => ({
        date: v.occurredAt?.toISOString(),
        keys: Object.keys(v.meta),
        weight: v.meta.weight,
        heartRate: v.meta.heartRate,
        glucose: v.meta.glucose,
        bloodPressure: v.meta.bloodPressure
      }))
    }, null, 2))
  }

  const latestReading = sortByDateDesc(vitals)[0] ?? null

  const systolicEntry = sortByDateDesc(bpEntries)[0]
  let bloodPressure = '--/--'
  if (systolicEntry) {
    const meta = systolicEntry.meta
    const bpObj = meta.bloodPressure as GenericMetadata | undefined
    const systolic = parseNumeric(bpObj?.systolic ?? meta.systolic)
    const diastolic = parseNumeric(bpObj?.diastolic ?? meta.diastolic)
    if (systolic > 0 && diastolic > 0) {
      bloodPressure = `${Math.round(systolic)}/${Math.round(diastolic)}`
    }
  }

  // 🔧 FIX: Search ALL health entries for each vital sign (not just vitals entries)
  // This allows glucose from lab results, HR from older vitals entries, etc.
  // Also parse from titles when metadata is missing
  let weight = latestNumeric(vitals, ['weight'])
  let heartRate = latestNumeric(vitals, ['heartRate', 'hr', 'bpm'])
  const glucose = latestNumeric(mapped, ['glucose', 'bloodGlucose']) // Search ALL entries for glucose
  
  // 🔧 FALLBACK: Parse from titles if metadata is empty
  if (weight === 0 || heartRate === 0) {
    const sorted = sortByDateDesc(mapped)
    for (const item of sorted) {
      const title = item.entry.title?.toLowerCase() || ''
      
      // Parse weight from title (e.g., "220 lbs", "Weight: 175 lbs")
      if (weight === 0 && (title.includes('lbs') || title.includes('weight'))) {
        const weightMatch = title.match(/(\d+(?:\.\d+)?)\s*lbs?/i)
        if (weightMatch) {
          weight = parseFloat(weightMatch[1])
        }
      }
      
      // Parse heart rate from title (e.g., "Heart Rate: 72 bpm", "HR: 72")
      if (heartRate === 0 && (title.includes('bpm') || title.includes('heart') || title.includes('hr:'))) {
        const hrMatch = title.match(/(?:hr|heart\s*rate):\s*(\d+)|(\d+)\s*bpm/i)
        if (hrMatch) {
          heartRate = parseFloat(hrMatch[1] || hrMatch[2])
        }
      }
      
      // Stop searching once we found both
      if (weight > 0 && heartRate > 0) break
    }
  }

  // Debug: Show which entries are being used for each metric
  console.log('🏥 [computeHealthStats] Searching for vitals across entries:')
  
  // Find the source entry for each vital
  const weightEntry = sortByDateDesc(vitals).find(v => hasTruthyValue(v.meta, ['weight']))
  const hrEntry = sortByDateDesc(vitals).find(v => hasTruthyValue(v.meta, ['heartRate', 'hr', 'bpm']))
  const glucoseEntry = sortByDateDesc(mapped).find(v => hasTruthyValue(v.meta, ['glucose', 'bloodGlucose']))
  
  if (weightEntry) {
    console.log('  Weight:', weight, 'lbs from entry:', weightEntry.entry.title, '(', weightEntry.occurredAt?.toISOString().split('T')[0], ')')
  }
  if (hrEntry) {
    console.log('  Heart Rate:', heartRate, 'bpm from entry:', hrEntry.entry.title, '(', hrEntry.occurredAt?.toISOString().split('T')[0], ')')
  }
  if (glucoseEntry) {
    console.log('  Glucose:', glucose, 'mg/dL from entry:', glucoseEntry.entry.title, '(', glucoseEntry.occurredAt?.toISOString().split('T')[0], ')')
  }

  console.log('🏥 [computeHealthStats] ✅ Final extracted values:', 
    `Weight: ${weight}, ` +
    `HR: ${heartRate}, ` +
    `Glucose: ${glucose}, ` +
    `BP: ${bloodPressure}`
  )

  return {
    hasData: mapped.length > 0,
    itemsCount: mapped.length,
    vitalsCount: vitals.length,
    steps: latestNumeric(vitals, ['steps']) || latestNumeric(mapped, ['steps']),
    weight,
    heartRate,
    glucose,
    medicationCount: medications.length,
    bloodPressure,
    latestReadingDate: latestReading?.occurredAt ?? null,
  }
}

export interface PetsStats {
  hasData: boolean
  entriesCount: number
  petProfileCount: number
  vetVisitsLast30Cost: number
  vetVisitCountYear: number
  vaccinesDue: number
  monthlyCost: number
}

const isPetProfile = (meta: GenericMetadata): boolean => {
  const itemType = String(meta.itemType ?? meta.type ?? '').toLowerCase()
  // Only match actual pet profiles, not costs/documents/vaccinations with 'pet' in name
  if (itemType === 'pet-profile' || itemType === 'profile' || itemType === 'pet') {
    return true
  }
  // Fallback: check if it has pet-specific fields AND is not a cost/vaccination/document
  if (itemType === 'cost' || itemType === 'vaccination' || itemType === 'document') {
    return false
  }
  return hasTruthyValue(meta, ['species']) && hasTruthyValue(meta, ['name', 'petName'])
}

const isVetVisit = (meta: GenericMetadata): boolean => {
  const type = String(meta.type ?? meta.itemType ?? meta.category ?? '').toLowerCase()
  if (type.includes('vet') || type.includes('appointment') || type.includes('exam') || type.includes('checkup')) {
    return true
  }
  return hasTruthyValue(meta, ['veterinarian', 'clinic', 'visitType'])
}

const isExpenseEntry = (meta: GenericMetadata): boolean => {
  const type = String(meta.type ?? meta.itemType ?? meta.category ?? '').toLowerCase()
  if (type.includes('expense') || type.includes('food') || type.includes('supplies')) {
    return true
  }
  return hasTruthyValue(meta, ['amount', 'cost', 'monthlyCost', 'expenseAmount'])
}

const isVaccination = (meta: GenericMetadata): boolean => {
  const type = String(meta.type ?? meta.itemType ?? '').toLowerCase()
  if (type.includes('vaccine') || type.includes('vaccination')) {
    return true
  }
  return hasTruthyValue(meta, ['vaccine', 'vaccinationDate', 'nextDue'])
}

export const computePetsStats = (entries?: DomainData[] | null): PetsStats => {
  const mapped = mapEntries(entries)
  
  console.log('🐾 [computePetsStats] Total entries:', mapped.length)
  
  if (mapped.length === 0) {
    return {
      hasData: false,
      entriesCount: 0,
      petProfileCount: 0,
      vetVisitsLast30Cost: 0,
      vetVisitCountYear: 0,
      vaccinesDue: 0,
      monthlyCost: 0,
    }
  }

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)

  const petProfiles = mapped.filter(({ meta }) => isPetProfile(meta))
  const vetVisits = mapped.filter(({ meta }) => isVetVisit(meta))
  const expenses = mapped.filter(({ meta }) => isExpenseEntry(meta))
  const vaccinations = mapped.filter(({ meta }) => isVaccination(meta))
  
  console.log('🐾 [computePetsStats] Breakdown:', {
    profiles: petProfiles.length,
    vetVisits: vetVisits.length,
    expenses: expenses.length,
    vaccinations: vaccinations.length
  })
  
  if (petProfiles.length > 0) {
    console.log('🐾 [computePetsStats] Sample profiles:', petProfiles.slice(0, 3).map(p => ({ id: p.entry.id, title: p.entry.title, type: p.meta.type })))
  }

  const vetVisitsLast30Cost = vetVisits.reduce((sum, item) => {
    if (!item.occurredAt || item.occurredAt < thirtyDaysAgo) return sum
    return sum + parseNumeric(item.meta.cost ?? item.meta.amount ?? item.meta.expenseAmount)
  }, 0)

  const vetVisitCountYear = vetVisits.filter((item) => {
    if (!item.occurredAt) return false
    return item.occurredAt >= yearAgo
  }).length

  const vaccinesDue = vaccinations.filter((item) => {
    const due = pickFirstDate(item.meta, ['nextDue', 'dueDate', 'renewalDate'])
    if (!due) return false
    return due <= new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  }).length

  // Calculate monthly costs
  // Prioritize explicitly recurring expenses, but if none exist, estimate from recent expenses
  const recurringExpenses = expenses.filter(item => 
    !isVetVisit(item.meta) && item.meta.recurring === true
  )
  
  let monthlyCost = 0
  if (recurringExpenses.length > 0) {
    // Sum up explicitly recurring monthly costs
    monthlyCost = recurringExpenses.reduce((sum, item) => {
      const amount = parseNumeric(item.meta.monthlyCost ?? item.meta.cost ?? item.meta.amount ?? item.meta.expenseAmount)
      return sum + amount
    }, 0)
  } else {
    // Estimate monthly cost from recent non-vet expenses (last 30 days)
    const recentExpenses = expenses.filter(item => {
      if (isVetVisit(item.meta)) return false
      if (!item.occurredAt || item.occurredAt < thirtyDaysAgo) return false
      return true
    })
    monthlyCost = recentExpenses.reduce((sum, item) => {
      const amount = parseNumeric(item.meta.cost ?? item.meta.amount ?? item.meta.expenseAmount)
      return sum + amount
    }, 0)
  }

  // 🔧 FIX: Don't use mapped.length as fallback - it counts ALL entries not just profiles
  const actualPetCount = petProfiles.length
  
  console.log('🐾 [computePetsStats] Final count:', actualPetCount)

  return {
    hasData: true,
    entriesCount: mapped.length,
    petProfileCount: actualPetCount,
    vetVisitsLast30Cost,
    vetVisitCountYear,
    vaccinesDue,
    monthlyCost,
  }
}

export interface DigitalStats {
  hasData: boolean
  entriesCount: number
  subscriptions: number
  monthlyCost: number
  passwords: number
  expiring: number
}

const collectTokens = (meta: GenericMetadata, keys: string[]): string[] =>
  keys
    .map((key) => {
      const value = getNestedValue(meta, key)
      return typeof value === 'string' ? value.toLowerCase() : undefined
    })
    .filter((token): token is string => Boolean(token))

const toMonthlyAmount = (amount: number, meta: GenericMetadata): number => {
  const frequencyToken = collectTokens(meta, [
    'frequency',
    'billingFrequency',
    'billingCycle',
    'interval',
    'renewalFrequency',
  ])[0] ?? ''

  if (frequencyToken.includes('annual') || frequencyToken.includes('year')) return amount / 12
  if (frequencyToken.includes('quarter')) return amount / 3
  if (frequencyToken.includes('week')) return amount * 4
  if (frequencyToken.includes('day')) return amount * 30
  if (frequencyToken.includes('biweek')) return amount * 2
  return amount
}

const isDigitalSubscription = (meta: GenericMetadata): boolean => {
  // ✅ FIX: Match exact filtering logic used in subscriptions-tab.tsx
  // Only count items explicitly marked as subscriptions
  const type = getNestedValue(meta, 'type')
  return type === 'subscription'
}

export const computeDigitalStats = (entries?: DomainData[] | null): DigitalStats => {
  const mapped = mapEntries(entries)
  if (mapped.length === 0) {
    return {
      hasData: false,
      entriesCount: 0,
      subscriptions: 0,
      monthlyCost: 0,
      passwords: 0,
      expiring: 0,
    }
  }

  const now = new Date()

  // ✅ FIX: Count only items with type='subscription'
  const subscriptions = mapped.filter(({ meta }) => isDigitalSubscription(meta)).length

  // ✅ FIX: Only sum monthly cost for SUBSCRIPTIONS (type='subscription')
  // Digital assets (itemType='asset') have one-time cost, not monthly
  const monthlyCost = mapped.reduce((sum, { meta }) => {
    if (!isDigitalSubscription(meta)) return sum // Skip non-subscriptions
    
    const amount = parseNumeric(
      getNestedValue(meta, 'monthlyCost') ??
      getNestedValue(meta, 'subscriptionCost') ??
      getNestedValue(meta, 'cost') // Fallback for older entries
    )
    if (amount === 0) return sum
    return sum + toMonthlyAmount(amount, meta)
  }, 0)

  const passwords = mapped.reduce((total, { meta }) => {
    const passwordsValue = getNestedValue(meta, 'passwords')
    if (Array.isArray(passwordsValue)) {
      return total + passwordsValue.length
    }

    const passwordCount = parseNumeric(
      getNestedValue(meta, 'passwordCount') ??
      getNestedValue(meta, 'passwordsStored') ??
      passwordsValue
    )
    if (passwordCount > 0) {
      return total + passwordCount
    }

    const hasLogin = Boolean(
      getNestedValue(meta, 'username') ??
      getNestedValue(meta, 'login') ??
      getNestedValue(meta, 'email') ??
      getNestedValue(meta, 'password')
    )
    return hasLogin ? total + 1 : total
  }, 0)

  const expiring = mapped.filter(({ meta }) => {
    const expiryDate = pickFirstDate(meta, [
      'renewalDate',
      'expiryDate',
      'expirationDate',
      'nextBillingDate',
      'nextChargeDate',
    ])
    if (!expiryDate) return false
    const daysUntil = differenceInDays(expiryDate, now)
    return daysUntil >= 0 && daysUntil <= 30
  }).length

  return {
    hasData: true,
    entriesCount: mapped.length,
    subscriptions,
    monthlyCost,
    passwords,
    expiring,
  }
}

export interface AppliancesStats {
  hasData: boolean
  entriesCount: number
  count: number
  totalValue: number
  underWarranty: number
  needsMaint: number
  warrantiesDue: number
  totalCost: number
}

const getApplianceKey = (entry: BaseMappedEntry): string => {
  const entryId = entry.entry?.id
  if (entryId) return entryId

  const serial = getNestedValue(entry.meta, 'serialNumber') ?? getNestedValue(entry.meta, 'serial_number')
  if (typeof serial === 'string' && serial.trim().length > 0) {
    return serial.trim().toLowerCase()
  }

  const name =
    (typeof entry.entry?.title === 'string' && entry.entry.title) ||
    (typeof getNestedValue(entry.meta, 'name') === 'string' ? (getNestedValue(entry.meta, 'name') as string) : undefined)

  return `${name ?? 'appliance'}-${Math.random().toString(36).slice(2, 10)}`
}

export const computeAppliancesStats = (
  domainEntries?: DomainData[] | null,
  additionalEntries?: DomainData[] | null
): AppliancesStats => {
  const mappedDomain = mapEntries(domainEntries)
  const mappedAdditional = mapEntries(additionalEntries)
  const merged = [...mappedDomain, ...mappedAdditional]

  if (merged.length === 0) {
    return {
      hasData: false,
      entriesCount: 0,
      count: 0,
      totalValue: 0,
      underWarranty: 0,
      needsMaint: 0,
      warrantiesDue: 0,
      totalCost: 0,
    }
  }

  const deduped = Array.from(
    merged.reduce((map, item) => {
      const key = getApplianceKey(item)
      if (!map.has(key)) {
        map.set(key, item)
      }
      return map
    }, new Map<string, BaseMappedEntry>())
  )

  const now = new Date()

  const totalValue = deduped.reduce((sum, [, item]) => {
    const { meta } = item
    const value = parseNumeric(
      getNestedValue(meta, 'value') ??
      getNestedValue(meta, 'purchasePrice') ??
      getNestedValue(meta, 'purchase_price') ??
      getNestedValue(meta, 'estimatedValue') ??
      getNestedValue(meta, 'cost') ??
      getNestedValue(meta, 'replacementCost')
    )
    return sum + value
  }, 0)

  const underWarranty = deduped.filter(([, item]) => {
    const { meta } = item
    const expiryDate = pickFirstDate(meta, [
      'warrantyExpiry',
      'warranty_expiry',
      'warrantyExpires',
      'extendedWarranty',
    ])
    return Boolean(expiryDate && expiryDate > now)
  }).length

  const needsMaint = deduped.filter(([, item]) => {
    const { meta } = item
    const maintenanceFlag =
      getNestedValue(meta, 'maintenanceDue') ??
      getNestedValue(meta, 'needsMaintenance') ??
      getNestedValue(meta, 'needs_maintenance') ??
      getNestedValue(meta, 'maintenanceRequired')

    if (maintenanceFlag === true || maintenanceFlag === 'true') {
      return true
    }

    if (typeof maintenanceFlag === 'string' && maintenanceFlag.trim().length > 0) {
      return true
    }

    const status = String(getNestedValue(meta, 'status') ?? '').toLowerCase()
    if (status === 'overdue' || status === 'due') {
      return true
    }

    const maintenanceDate = pickFirstDate(meta, [
      'nextMaintenance',
      'maintenanceDue',
      'serviceDue',
      'inspectionDue',
      'nextServiceDate',
    ])
    if (!maintenanceDate) {
      return false
    }

    return maintenanceDate <= now
  }).length

  // Calculate warranties expiring within 30 days
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  const warrantiesDue = deduped.filter(([, item]) => {
    const { meta } = item
    const expiryDate = pickFirstDate(meta, [
      'warrantyExpiry',
      'warranty_expiry',
      'warrantyExpires',
      'extendedWarranty',
    ])
    return Boolean(expiryDate && expiryDate > now && expiryDate <= thirtyDaysFromNow)
  }).length

  // Calculate total cost: purchase prices + maintenance costs + all costs from appliance_costs table
  const totalCost = deduped.reduce((sum, [, item]) => {
    const { meta } = item
    
    // Add purchase price
    const purchasePrice = parseNumeric(
      getNestedValue(meta, 'purchasePrice') ??
      getNestedValue(meta, 'purchase_price') ??
      getNestedValue(meta, 'value')
    )
    
    // Add maintenance costs
    const maintenanceCost = parseNumeric(
      getNestedValue(meta, 'cost') ??
      getNestedValue(meta, 'maintenanceCost') ??
      getNestedValue(meta, 'maintenance_cost') ??
      getNestedValue(meta, 'annualCost') ??
      getNestedValue(meta, 'monthlyCost')
    )
    
    // Add all costs from appliance_costs table
    const allCosts = parseNumeric(
      getNestedValue(meta, 'totalCostsFromTable') ??
      getNestedValue(meta, 'allCosts')
    )
    
    return sum + purchasePrice + maintenanceCost + allCosts
  }, 0)

  console.log('🔧 [computeAppliancesStats] Results:', {
    count: deduped.length,
    totalValue,
    underWarranty,
    needsMaint,
    warrantiesDue,
    totalCost
  })

  return {
    hasData: true,
    entriesCount: merged.length,
    count: deduped.length,
    totalValue,
    underWarranty,
    needsMaint,
    warrantiesDue,
    totalCost,
  }
}

export type { BaseMappedEntry }

