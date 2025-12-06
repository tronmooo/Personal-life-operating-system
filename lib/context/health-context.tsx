'use client'

import React, { createContext, useContext, useMemo, useCallback } from 'react'
import { format, parseISO, isFuture } from 'date-fns'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import type { DomainData } from '@/types/domains'
import type {
  HealthData,
  HealthMetric,
  Medication,
  Symptom,
  Condition,
  HealthAppointment,
  Workout,
  Meal,
  HealthProvider,
  MedicalDocument,
  Allergy,
  Vaccination,
  MedicationAdherence,
  HealthDashboardSummary
} from '@/types/health'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface HealthContextType {
  healthData: HealthData
  dashboardSummary: HealthDashboardSummary
  addHealthMetric: (metric: Omit<HealthMetric, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateHealthMetric: (id: string, updates: Partial<HealthMetric>) => void
  deleteHealthMetric: (id: string) => void
  addMedication: (medication: Omit<Medication, 'id' | 'adherenceHistory' | 'createdAt' | 'updatedAt'>) => void
  updateMedication: (id: string, updates: Partial<Medication>) => void
  deleteMedication: (id: string) => void
  logMedicationAdherence: (medicationId: string, adherence: Omit<MedicationAdherence, 'date' | 'time'>) => void
  addSymptom: (symptom: Omit<Symptom, 'id' | 'updates' | 'createdAt' | 'updatedAt'>) => void
  updateSymptom: (id: string, updates: Partial<Symptom>) => void
  deleteSymptom: (id: string) => void
  addCondition: (condition: Omit<Condition, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateCondition: (id: string, updates: Partial<Condition>) => void
  deleteCondition: (id: string) => void
  addAppointment: (appointment: Omit<HealthAppointment, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateAppointment: (id: string, updates: Partial<HealthAppointment>) => void
  deleteAppointment: (id: string) => void
  addWorkout: (workout: Omit<Workout, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateWorkout: (id: string, updates: Partial<Workout>) => void
  deleteWorkout: (id: string) => void
  addMeal: (meal: Omit<Meal, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateMeal: (id: string, updates: Partial<Meal>) => void
  deleteMeal: (id: string) => void
  addProvider: (provider: Omit<HealthProvider, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateProvider: (id: string, updates: Partial<HealthProvider>) => void
  deleteProvider: (id: string) => void
  addDocument: (document: Omit<MedicalDocument, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateDocument: (id: string, updates: Partial<MedicalDocument>) => void
  deleteDocument: (id: string) => void
  addAllergy: (allergy: Omit<Allergy, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateAllergy: (id: string, updates: Partial<Allergy>) => void
  deleteAllergy: (id: string) => void
  addVaccination: (vaccination: Omit<Vaccination, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateVaccination: (id: string, updates: Partial<Vaccination>) => void
  deleteVaccination: (id: string) => void
  refreshDashboard: () => void
}

const HealthContext = createContext<HealthContextType | undefined>(undefined)

const HEALTH_CATEGORY = {
  METRIC: 'metric',
  MEDICATION: 'medication',
  SYMPTOM: 'symptom',
  CONDITION: 'condition',
  APPOINTMENT: 'appointment',
  WORKOUT: 'workout',
  MEAL: 'meal',
  PROVIDER: 'provider',
  DOCUMENT: 'document',
  ALLERGY: 'allergy',
  VACCINATION: 'vaccination'
} as const

type HealthCategory = typeof HEALTH_CATEGORY[keyof typeof HEALTH_CATEGORY]

type AnyHealthRecord =
  | HealthMetric
  | Medication
  | Symptom
  | Condition
  | HealthAppointment
  | Workout
  | Meal
  | HealthProvider
  | MedicalDocument
  | Allergy
  | Vaccination

function getCategoryFromMetadata(item: DomainData): string | undefined {
  const meta = item.metadata as any
  return meta?.category || meta?.itemType || meta?.type
}

function getRecordFromMetadata<T extends object>(item: DomainData): Partial<T> {
  const meta = item.metadata as any
  if (meta?.data) {
    return { ...meta.data } as Partial<T>
  }
  const clone = { ...meta }
  if (clone) {
    delete clone.category
    delete clone.itemType
    delete clone.type
  }
  return clone as Partial<T>
}

function ensureArray<T>(value: T[] | undefined, fallback: T[] = []): T[] {
  return Array.isArray(value) ? value : fallback
}

function defaultIsoDate(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

function formatDateOrFallback(value?: string, fallbackIso?: string): string {
  if (typeof value === 'string' && value.length > 0) return value
  if (fallbackIso) return fallbackIso.split('T')[0]
  return defaultIsoDate()
}

function parseNullableNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') return undefined
  const num = Number(value)
  return Number.isFinite(num) ? num : undefined
}

function normalizeDateTime(value?: string): string | undefined {
  if (!value) return undefined
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return undefined
  return date.toISOString()
}

function mapEntries<T extends AnyHealthRecord>(
  items: DomainData[],
  category: HealthCategory,
  normalizer: (raw: Partial<T>, item: DomainData) => T
): T[] {
  return items
    .filter(item => getCategoryFromMetadata(item) === category)
    .map(item => {
      const raw = getRecordFromMetadata<T>(item)
      return normalizer(raw, item)
    })
}

function buildHealthData(items: DomainData[]): HealthData {
  const metrics = mapEntries<HealthMetric>(items, HEALTH_CATEGORY.METRIC, (raw, item) => {
    const rawAny = raw as any
    const createdAt = rawAny?.createdAt ?? item.createdAt
    const updatedAt = rawAny?.updatedAt ?? item.updatedAt
    const recordedAtRaw = rawAny?.recordedAt ?? rawAny?.date ?? item.createdAt
    const metricType = rawAny?.metricType ?? rawAny?.logType
    const unit = typeof rawAny?.unit === 'string' ? rawAny.unit : null
    const primaryValue = parseNullableNumber(rawAny?.value ?? rawAny?.metricValue ?? rawAny?.weight ?? rawAny?.systolic)
    const secondaryValue = parseNullableNumber(
      rawAny?.secondaryValue ??
      rawAny?.secondary ??
      rawAny?.diastolic ??
      rawAny?.bloodPressureDiastolic
    )

    const metric: HealthMetric = {
      ...(raw as Partial<HealthMetric>),
      id: item.id,
      date: formatDateOrFallback(rawAny?.date ?? (recordedAtRaw ? String(recordedAtRaw) : undefined), item.createdAt),
      recordedAt: normalizeDateTime(recordedAtRaw ?? undefined),
      metricType,
      unit: unit ?? null,
      value: primaryValue ?? undefined,
      secondaryValue: secondaryValue ?? undefined,
      weight: parseNullableNumber(rawAny?.weight),
      bodyFat: parseNullableNumber(rawAny?.bodyFat),
      bloodPressureSystolic: parseNullableNumber(rawAny?.bloodPressureSystolic),
      bloodPressureDiastolic: parseNullableNumber(rawAny?.bloodPressureDiastolic),
      heartRate: parseNullableNumber(rawAny?.heartRate),
      bloodGlucose: parseNullableNumber(rawAny?.bloodGlucose),
      sleepHours: parseNullableNumber(rawAny?.sleepHours),
      sleepQuality: parseNullableNumber(rawAny?.sleepQuality),
      energyLevel: parseNullableNumber(rawAny?.energyLevel),
      mood: parseNullableNumber(rawAny?.mood),
      waterIntake: parseNullableNumber(rawAny?.waterIntake),
      steps: parseNullableNumber(rawAny?.steps),
      activeMinutes: parseNullableNumber(rawAny?.activeMinutes),
      caloriesBurned: parseNullableNumber(rawAny?.caloriesBurned),
      notes: rawAny?.notes ?? rawAny?.entry ?? undefined,
      createdAt,
      updatedAt,
    }

    switch (metricType) {
      case 'weight':
        metric.weight = primaryValue ?? metric.weight
        metric.unit = metric.unit ?? 'lbs'
        break
      case 'body-fat':
        metric.bodyFat = primaryValue ?? metric.bodyFat
        metric.unit = metric.unit ?? '%'
        break
      case 'blood-pressure':
        metric.bloodPressureSystolic = primaryValue ?? metric.bloodPressureSystolic
        metric.bloodPressureDiastolic = secondaryValue ?? metric.bloodPressureDiastolic
        metric.unit = metric.unit ?? 'mmHg'
        break
      case 'heart-rate':
        metric.heartRate = primaryValue ?? metric.heartRate
        metric.unit = metric.unit ?? 'bpm'
        break
      case 'blood-glucose':
        metric.bloodGlucose = primaryValue ?? metric.bloodGlucose
        metric.unit = metric.unit ?? 'mg/dL'
        break
      case 'sleep-hours':
        metric.sleepHours = primaryValue ?? metric.sleepHours
        break
      case 'sleep-quality':
        metric.sleepQuality = primaryValue ?? metric.sleepQuality
        break
      case 'energy-level':
        metric.energyLevel = primaryValue ?? metric.energyLevel
        break
      case 'mood':
        metric.mood = primaryValue ?? metric.mood
        break
      case 'water-intake':
        metric.waterIntake = primaryValue ?? metric.waterIntake
        metric.unit = metric.unit ?? 'oz'
        break
      case 'steps':
        metric.steps = primaryValue ?? metric.steps
        break
      case 'active-minutes':
        metric.activeMinutes = primaryValue ?? metric.activeMinutes
        break
      case 'calories-burned':
        metric.caloriesBurned = primaryValue ?? metric.caloriesBurned
        break
      case 'note':
        metric.notes = metric.notes ?? rawAny?.value ?? rawAny?.entry ?? undefined
        break
      default:
        break
    }

    return metric
  })

  const medications = mapEntries<Medication>(items, HEALTH_CATEGORY.MEDICATION, (raw, item) => {
    const createdAt = raw.createdAt ?? item.createdAt
    const updatedAt = raw.updatedAt ?? item.updatedAt
    return {
      ...raw,
      id: item.id,
      adherenceHistory: ensureArray(raw.adherenceHistory, []),
      reminderEnabled: raw.reminderEnabled ?? false,
      createdAt,
      updatedAt
    } as Medication
  })

  const symptoms = mapEntries<Symptom>(items, HEALTH_CATEGORY.SYMPTOM, (raw, item) => {
    const createdAt = raw.createdAt ?? item.createdAt
    const updatedAt = raw.updatedAt ?? item.updatedAt
    return {
      ...raw,
      id: item.id,
      updates: ensureArray(raw.updates, []),
      createdAt,
      updatedAt
    } as Symptom
  })

  const conditions = mapEntries<Condition>(items, HEALTH_CATEGORY.CONDITION, (raw, item) => {
    const createdAt = raw.createdAt ?? item.createdAt
    const updatedAt = raw.updatedAt ?? item.updatedAt
    return {
      ...raw,
      id: item.id,
      createdAt,
      updatedAt
    } as Condition
  })

  const appointments = mapEntries<HealthAppointment>(items, HEALTH_CATEGORY.APPOINTMENT, (raw, item) => {
    const createdAt = raw.createdAt ?? item.createdAt
    const updatedAt = raw.updatedAt ?? item.updatedAt
    return {
      ...raw,
      id: item.id,
      reminderDaysBefore: ensureArray(raw.reminderDaysBefore, []),
      createdAt,
      updatedAt
    } as HealthAppointment
  })

  const workouts = mapEntries<Workout>(items, HEALTH_CATEGORY.WORKOUT, (raw, item) => {
    const createdAt = raw.createdAt ?? item.createdAt
    const updatedAt = raw.updatedAt ?? item.updatedAt
    return {
      ...raw,
      id: item.id,
      createdAt,
      updatedAt
    } as Workout
  })

  const meals = mapEntries<Meal>(items, HEALTH_CATEGORY.MEAL, (raw, item) => {
    const createdAt = raw.createdAt ?? item.createdAt
    const updatedAt = raw.updatedAt ?? item.updatedAt
    return {
      ...raw,
      id: item.id,
      detectedFoods: ensureArray(raw.detectedFoods, []),
      createdAt,
      updatedAt
    } as Meal
  })

  const providers = mapEntries<HealthProvider>(items, HEALTH_CATEGORY.PROVIDER, (raw, item) => {
    const createdAt = raw.createdAt ?? item.createdAt
    const updatedAt = raw.updatedAt ?? item.updatedAt
    return {
      ...raw,
      id: item.id,
      createdAt,
      updatedAt
    } as HealthProvider
  })

  const documents = mapEntries<MedicalDocument>(items, HEALTH_CATEGORY.DOCUMENT, (raw, item) => {
    const createdAt = raw.createdAt ?? item.createdAt
    const updatedAt = raw.updatedAt ?? item.updatedAt
    return {
      ...raw,
      id: item.id,
      createdAt,
      updatedAt
    } as MedicalDocument
  })

  const allergies = mapEntries<Allergy>(items, HEALTH_CATEGORY.ALLERGY, (raw, item) => {
    const createdAt = raw.createdAt ?? item.createdAt
    const updatedAt = raw.updatedAt ?? item.updatedAt
    return {
      ...raw,
      id: item.id,
      reactionSymptoms: ensureArray(raw.reactionSymptoms, []),
      createdAt,
      updatedAt
    } as Allergy
  })

  const vaccinations = mapEntries<Vaccination>(items, HEALTH_CATEGORY.VACCINATION, (raw, item) => {
    const createdAt = raw.createdAt ?? item.createdAt
    const updatedAt = raw.updatedAt ?? item.updatedAt
    return {
      ...raw,
      id: item.id,
      sideEffects: ensureArray(raw.sideEffects, []),
      createdAt,
      updatedAt
    } as Vaccination
  })

  return {
    metrics,
    medications,
    symptoms,
    conditions,
    appointments,
    workouts,
    meals,
    providers,
    documents,
    allergies,
    vaccinations
  }
}

function buildDashboardSummary(healthData: HealthData): HealthDashboardSummary {
  const today = defaultIsoDate()
  const todaysMetric = healthData.metrics.find(metric => metric.date === today)

  const activeMedications = healthData.medications.filter(med => med.status === 'active')
  const todaysMedicationCount = activeMedications.reduce((count, med) => {
    const adherence = med.adherenceHistory.find(entry => entry.date === today && entry.taken)
    return count + (adherence ? 1 : 0)
  }, 0)

  const upcomingAppointments = healthData.appointments
    .filter(appointment => appointment.status === 'scheduled' && isFuture(parseISO(appointment.dateTime)))
    .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())
    .slice(0, 3)

  const activeSymptoms = healthData.symptoms.filter(symptom => symptom.status === 'ongoing')

  const medicationReminders = activeMedications.filter(med => {
    if (!med.remainingPills || !med.totalPills) return false
    const percentRemaining = (med.remainingPills / med.totalPills) * 100
    return percentRemaining <= 20
  })

  return {
    todaysMedicationsTaken: todaysMedicationCount,
    todaysMedicationsTotal: activeMedications.length,
    todaysSteps: todaysMetric?.steps || 0,
    stepsGoal: 10000,
    waterIntake: todaysMetric?.waterIntake || 0,
    waterGoal: 64,
    activeMinutes: todaysMetric?.activeMinutes || 0,
    activeMinutesGoal: 30,
    sleepHours: todaysMetric?.sleepHours || 0,
    sleepQuality: todaysMetric?.sleepQuality || 0,
    energyLevel: todaysMetric?.energyLevel || 0,
    upcomingAppointments,
    activeSymptoms,
    medicationReminders
  }
}

function getDefaultTitle(category: HealthCategory, data: any): string {
  switch (category) {
    case HEALTH_CATEGORY.METRIC:
      return data.date ? `Health Metric ${data.date}` : 'Health Metric'
    case HEALTH_CATEGORY.MEDICATION:
      return data.name || 'Medication'
    case HEALTH_CATEGORY.SYMPTOM:
      return data.name || 'Symptom'
    case HEALTH_CATEGORY.CONDITION:
      return data.name || 'Condition'
    case HEALTH_CATEGORY.APPOINTMENT:
      return data.providerName || 'Health Appointment'
    case HEALTH_CATEGORY.WORKOUT:
      return data.workoutName || 'Workout'
    case HEALTH_CATEGORY.MEAL:
      return data.foodDescription || 'Meal'
    case HEALTH_CATEGORY.PROVIDER:
      return data.name || 'Provider'
    case HEALTH_CATEGORY.DOCUMENT:
      return data.documentName || 'Medical Document'
    case HEALTH_CATEGORY.ALLERGY:
      return data.allergenName || 'Allergy'
    case HEALTH_CATEGORY.VACCINATION:
      return data.vaccineName || 'Vaccination'
    default:
      return 'Health Entry'
  }
}

export function HealthProvider({ children }: { children: React.ReactNode }) {
  const { data, addData, updateData, deleteData, reloadDomain } = useData()
  const supabase = useMemo(() => createClientComponentClient(), [])

  const healthItems = useMemo<DomainData[]>(
    () => (Array.isArray(data.health) ? (data.health as DomainData[]) : []),
    [data.health]
  )

  const healthData = useMemo(() => buildHealthData(healthItems), [healthItems])
  const dashboardSummary = useMemo(() => buildDashboardSummary(healthData), [healthData])

  const findEntry = useCallback(
    (category: HealthCategory, id: string): DomainData | null => {
      const entry = healthItems.find(item => item.id === id)
      if (!entry) return null
      const entryCategory = getCategoryFromMetadata(entry)
      if (entryCategory !== category) return null
      return entry
    },
    [healthItems]
  )

  const createEntry = useCallback(
    (category: HealthCategory, payload: Record<string, any>, options?: { title?: string; description?: string }) => {
      const timestamp = new Date().toISOString()
      const dataPayload = {
        ...payload,
        createdAt: payload.createdAt ?? timestamp,
        updatedAt: payload.updatedAt ?? timestamp
      }

      const title = options?.title ?? getDefaultTitle(category, dataPayload)
      void addData('health', {
        title,
        description: options?.description,
        metadata: {
          category,
          data: dataPayload
        }
      })
    },
    [addData]
  )

  const updateEntry = useCallback(
    (
      category: HealthCategory,
      id: string,
      updates: Partial<Record<string, any>>,
      options?: {
        title?: string
        description?: string
      }
    ) => {
      const entry = findEntry(category, id)
      if (!entry) return

      const current = getRecordFromMetadata<any>(entry)
      const updated = {
        ...current,
        ...updates,
        createdAt: current?.createdAt ?? entry.createdAt,
        updatedAt: new Date().toISOString()
      }

      const title = options?.title ?? entry.title ?? getDefaultTitle(category, updated)

      void updateData('health', id, {
        title,
        description: options?.description ?? entry.description,
        metadata: {
          ...(entry.metadata as any),
          category,
          data: updated
        }
      })
    },
    [findEntry, updateData]
  )

  const removeEntry = useCallback(
    (category: HealthCategory, id: string) => {
      const entry = findEntry(category, id)
      if (!entry) return
      void deleteData('health', id)
    },
    [deleteData, findEntry]
  )

  // Health Metrics
  const addHealthMetric = useCallback(
    (metric: Omit<HealthMetric, 'id' | 'createdAt' | 'updatedAt'>) => {
      createEntry(HEALTH_CATEGORY.METRIC, metric, { title: getDefaultTitle(HEALTH_CATEGORY.METRIC, metric) })
    },
    [createEntry]
  )

  const updateHealthMetric = useCallback(
    (id: string, updates: Partial<HealthMetric>) => {
      const entry = findEntry(HEALTH_CATEGORY.METRIC, id)
      if (!entry) return
      const current = getRecordFromMetadata<HealthMetric>(entry)
      const merged = { ...current, ...updates }
      updateEntry(HEALTH_CATEGORY.METRIC, id, updates, {
        title: getDefaultTitle(HEALTH_CATEGORY.METRIC, merged)
      })
    },
    [findEntry, updateEntry]
  )

  const deleteHealthMetric = useCallback(
    (id: string) => {
      const entry = findEntry(HEALTH_CATEGORY.METRIC, id)
      if (!entry) return

      const metadata = entry.metadata as any
      const isSupabaseMetric =
        metadata &&
        !metadata?.data &&
        (metadata?.metricType !== undefined ||
          metadata?.recordedAt !== undefined ||
          metadata?.value !== undefined ||
          metadata?.secondaryValue !== undefined)

      if (isSupabaseMetric) {
        void supabase
          .from('health_metrics')
          .delete()
          .eq('id', id)
          .then(({ error }) => {
            if (error) {
              console.error('Failed to delete health metric from Supabase:', error)
              return
            }
            void reloadDomain('health')
          })
        return
      }

      removeEntry(HEALTH_CATEGORY.METRIC, id)
    },
    [findEntry, removeEntry, reloadDomain, supabase]
  )

  // Medications
  const addMedication = useCallback(
    (medication: Omit<Medication, 'id' | 'adherenceHistory' | 'createdAt' | 'updatedAt'>) => {
      createEntry(HEALTH_CATEGORY.MEDICATION, { ...medication, adherenceHistory: [] }, {
        title: medication.name
      })
    },
    [createEntry]
  )

  const updateMedication = useCallback(
    (id: string, updates: Partial<Medication>) => {
      const entry = findEntry(HEALTH_CATEGORY.MEDICATION, id)
      if (!entry) return
      const current = getRecordFromMetadata<Medication>(entry)
      const merged = { ...current, ...updates }
      updateEntry(HEALTH_CATEGORY.MEDICATION, id, updates, {
        title: getDefaultTitle(HEALTH_CATEGORY.MEDICATION, merged)
      })
    },
    [findEntry, updateEntry]
  )

  const deleteMedication = useCallback(
    (id: string) => {
      removeEntry(HEALTH_CATEGORY.MEDICATION, id)
    },
    [removeEntry]
  )

  const logMedicationAdherence = useCallback(
    (medicationId: string, adherence: Omit<MedicationAdherence, 'date' | 'time'>) => {
      const entry = findEntry(HEALTH_CATEGORY.MEDICATION, medicationId)
      if (!entry) return
      const current = getRecordFromMetadata<Medication>(entry)
      const history = ensureArray(current.adherenceHistory, [])
      const timestamp = new Date()
      const newRecord: MedicationAdherence = {
        ...adherence,
        date: format(timestamp, 'yyyy-MM-dd'),
        time: format(timestamp, 'HH:mm')
      }
      updateEntry(
        HEALTH_CATEGORY.MEDICATION,
        medicationId,
        { adherenceHistory: [...history, newRecord] }
      )
    },
    [findEntry, updateEntry]
  )

  // Symptoms
  const addSymptom = useCallback(
    (symptom: Omit<Symptom, 'id' | 'updates' | 'createdAt' | 'updatedAt'>) => {
      createEntry(HEALTH_CATEGORY.SYMPTOM, { ...symptom, updates: [] }, { title: symptom.name })
    },
    [createEntry]
  )

  const updateSymptom = useCallback(
    (id: string, updates: Partial<Symptom>) => {
      const entry = findEntry(HEALTH_CATEGORY.SYMPTOM, id)
      if (!entry) return
      const current = getRecordFromMetadata<Symptom>(entry)
      const merged = { ...current, ...updates }
      updateEntry(HEALTH_CATEGORY.SYMPTOM, id, updates, {
        title: getDefaultTitle(HEALTH_CATEGORY.SYMPTOM, merged)
      })
    },
    [findEntry, updateEntry]
  )

  const deleteSymptom = useCallback(
    (id: string) => {
      removeEntry(HEALTH_CATEGORY.SYMPTOM, id)
    },
    [removeEntry]
  )

  // Conditions
  const addCondition = useCallback(
    (condition: Omit<Condition, 'id' | 'createdAt' | 'updatedAt'>) => {
      createEntry(HEALTH_CATEGORY.CONDITION, condition, { title: condition.name })
    },
    [createEntry]
  )

  const updateCondition = useCallback(
    (id: string, updates: Partial<Condition>) => {
      const entry = findEntry(HEALTH_CATEGORY.CONDITION, id)
      if (!entry) return
      const current = getRecordFromMetadata<Condition>(entry)
      const merged = { ...current, ...updates }
      updateEntry(HEALTH_CATEGORY.CONDITION, id, updates, {
        title: getDefaultTitle(HEALTH_CATEGORY.CONDITION, merged)
      })
    },
    [findEntry, updateEntry]
  )

  const deleteCondition = useCallback(
    (id: string) => {
      removeEntry(HEALTH_CATEGORY.CONDITION, id)
    },
    [removeEntry]
  )

  // Appointments
  const addAppointment = useCallback(
    (appointment: Omit<HealthAppointment, 'id' | 'createdAt' | 'updatedAt'>) => {
      createEntry(HEALTH_CATEGORY.APPOINTMENT, appointment, {
        title: appointment.providerName || getDefaultTitle(HEALTH_CATEGORY.APPOINTMENT, appointment)
      })
    },
    [createEntry]
  )

  const updateAppointment = useCallback(
    (id: string, updates: Partial<HealthAppointment>) => {
      const entry = findEntry(HEALTH_CATEGORY.APPOINTMENT, id)
      if (!entry) return
      const current = getRecordFromMetadata<HealthAppointment>(entry)
      const merged = { ...current, ...updates }
      updateEntry(HEALTH_CATEGORY.APPOINTMENT, id, updates, {
        title: getDefaultTitle(HEALTH_CATEGORY.APPOINTMENT, merged)
      })
    },
    [findEntry, updateEntry]
  )

  const deleteAppointment = useCallback(
    (id: string) => {
      removeEntry(HEALTH_CATEGORY.APPOINTMENT, id)
    },
    [removeEntry]
  )

  // Workouts
  const addWorkout = useCallback(
    (workout: Omit<Workout, 'id' | 'createdAt' | 'updatedAt'>) => {
      createEntry(HEALTH_CATEGORY.WORKOUT, workout, { title: workout.workoutName })
    },
    [createEntry]
  )

  const updateWorkout = useCallback(
    (id: string, updates: Partial<Workout>) => {
      const entry = findEntry(HEALTH_CATEGORY.WORKOUT, id)
      if (!entry) return
      const current = getRecordFromMetadata<Workout>(entry)
      const merged = { ...current, ...updates }
      updateEntry(HEALTH_CATEGORY.WORKOUT, id, updates, {
        title: getDefaultTitle(HEALTH_CATEGORY.WORKOUT, merged)
      })
    },
    [findEntry, updateEntry]
  )

  const deleteWorkout = useCallback(
    (id: string) => {
      removeEntry(HEALTH_CATEGORY.WORKOUT, id)
    },
    [removeEntry]
  )

  // Meals
  const addMeal = useCallback(
    (meal: Omit<Meal, 'id' | 'createdAt' | 'updatedAt'>) => {
      createEntry(HEALTH_CATEGORY.MEAL, meal, {
        title: getDefaultTitle(HEALTH_CATEGORY.MEAL, meal)
      })
    },
    [createEntry]
  )

  const updateMeal = useCallback(
    (id: string, updates: Partial<Meal>) => {
      const entry = findEntry(HEALTH_CATEGORY.MEAL, id)
      if (!entry) return
      const current = getRecordFromMetadata<Meal>(entry)
      const merged = { ...current, ...updates }
      updateEntry(HEALTH_CATEGORY.MEAL, id, updates, {
        title: getDefaultTitle(HEALTH_CATEGORY.MEAL, merged)
      })
    },
    [findEntry, updateEntry]
  )

  const deleteMeal = useCallback(
    (id: string) => {
      removeEntry(HEALTH_CATEGORY.MEAL, id)
    },
    [removeEntry]
  )

  // Providers
  const addProvider = useCallback(
    (provider: Omit<HealthProvider, 'id' | 'createdAt' | 'updatedAt'>) => {
      createEntry(HEALTH_CATEGORY.PROVIDER, provider, { title: provider.name })
    },
    [createEntry]
  )

  const updateProvider = useCallback(
    (id: string, updates: Partial<HealthProvider>) => {
      const entry = findEntry(HEALTH_CATEGORY.PROVIDER, id)
      if (!entry) return
      const current = getRecordFromMetadata<HealthProvider>(entry)
      const merged = { ...current, ...updates }
      updateEntry(HEALTH_CATEGORY.PROVIDER, id, updates, {
        title: getDefaultTitle(HEALTH_CATEGORY.PROVIDER, merged)
      })
    },
    [findEntry, updateEntry]
  )

  const deleteProvider = useCallback(
    (id: string) => {
      removeEntry(HEALTH_CATEGORY.PROVIDER, id)
    },
    [removeEntry]
  )

  // Documents
  const addDocument = useCallback(
    (document: Omit<MedicalDocument, 'id' | 'createdAt' | 'updatedAt'>) => {
      createEntry(HEALTH_CATEGORY.DOCUMENT, document, { title: document.documentName })
    },
    [createEntry]
  )

  const updateDocument = useCallback(
    (id: string, updates: Partial<MedicalDocument>) => {
      const entry = findEntry(HEALTH_CATEGORY.DOCUMENT, id)
      if (!entry) return
      const current = getRecordFromMetadata<MedicalDocument>(entry)
      const merged = { ...current, ...updates }
      updateEntry(HEALTH_CATEGORY.DOCUMENT, id, updates, {
        title: getDefaultTitle(HEALTH_CATEGORY.DOCUMENT, merged)
      })
    },
    [findEntry, updateEntry]
  )

  const deleteDocument = useCallback(
    (id: string) => {
      removeEntry(HEALTH_CATEGORY.DOCUMENT, id)
    },
    [removeEntry]
  )

  // Allergies
  const addAllergy = useCallback(
    (allergy: Omit<Allergy, 'id' | 'createdAt' | 'updatedAt'>) => {
      createEntry(HEALTH_CATEGORY.ALLERGY, allergy, { title: allergy.allergenName })
    },
    [createEntry]
  )

  const updateAllergy = useCallback(
    (id: string, updates: Partial<Allergy>) => {
      const entry = findEntry(HEALTH_CATEGORY.ALLERGY, id)
      if (!entry) return
      const current = getRecordFromMetadata<Allergy>(entry)
      const merged = { ...current, ...updates }
      updateEntry(HEALTH_CATEGORY.ALLERGY, id, updates, {
        title: getDefaultTitle(HEALTH_CATEGORY.ALLERGY, merged)
      })
    },
    [findEntry, updateEntry]
  )

  const deleteAllergy = useCallback(
    (id: string) => {
      removeEntry(HEALTH_CATEGORY.ALLERGY, id)
    },
    [removeEntry]
  )

  // Vaccinations
  const addVaccination = useCallback(
    (vaccination: Omit<Vaccination, 'id' | 'createdAt' | 'updatedAt'>) => {
      createEntry(HEALTH_CATEGORY.VACCINATION, vaccination, { title: vaccination.vaccineName })
    },
    [createEntry]
  )

  const updateVaccination = useCallback(
    (id: string, updates: Partial<Vaccination>) => {
      const entry = findEntry(HEALTH_CATEGORY.VACCINATION, id)
      if (!entry) return
      const current = getRecordFromMetadata<Vaccination>(entry)
      const merged = { ...current, ...updates }
      updateEntry(HEALTH_CATEGORY.VACCINATION, id, updates, {
        title: getDefaultTitle(HEALTH_CATEGORY.VACCINATION, merged)
      })
    },
    [findEntry, updateEntry]
  )

  const deleteVaccination = useCallback(
    (id: string) => {
      removeEntry(HEALTH_CATEGORY.VACCINATION, id)
    },
    [removeEntry]
  )

  const refreshDashboard = useCallback(() => {
    void reloadDomain('health')
  }, [reloadDomain])

  return (
    <HealthContext.Provider
      value={{
        healthData,
        dashboardSummary,
        addHealthMetric,
        updateHealthMetric,
        deleteHealthMetric,
        addMedication,
        updateMedication,
        deleteMedication,
        logMedicationAdherence,
        addSymptom,
        updateSymptom,
        deleteSymptom,
        addCondition,
        updateCondition,
        deleteCondition,
        addAppointment,
        updateAppointment,
        deleteAppointment,
        addWorkout,
        updateWorkout,
        deleteWorkout,
        addMeal,
        updateMeal,
        deleteMeal,
        addProvider,
        updateProvider,
        deleteProvider,
        addDocument,
        updateDocument,
        deleteDocument,
        addAllergy,
        updateAllergy,
        deleteAllergy,
        addVaccination,
        updateVaccination,
        deleteVaccination,
        refreshDashboard
      }}
    >
      {children}
    </HealthContext.Provider>
  )
}

export function useHealth() {
  const context = useContext(HealthContext)
  if (context === undefined) {
    throw new Error('useHealth must be used within a HealthProvider')
  }
  return context
}
