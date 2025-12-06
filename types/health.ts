// Comprehensive Health Domain Types

// Health Metrics
export interface HealthMetric {
  id: string
  date: string // ISO date
  recordedAt?: string
  metricType?: string
  unit?: string | null
  value?: number | null
  secondaryValue?: number | null
  weight?: number
  bodyFat?: number
  bloodPressureSystolic?: number
  bloodPressureDiastolic?: number
  heartRate?: number
  bloodGlucose?: number
  sleepHours?: number
  sleepQuality?: number // 1-10
  energyLevel?: number // 1-10
  mood?: number // 1-10
  waterIntake?: number // oz/ml
  steps?: number
  activeMinutes?: number
  caloriesBurned?: number
  notes?: string
  createdAt: string
  updatedAt: string
}

// Medications
export interface Medication {
  id: string
  name: string
  dosage: string
  frequency: 'daily' | 'twice-daily' | 'three-times-daily' | 'weekly' | 'as-needed' | 'custom'
  customFrequency?: string
  timesOfDay: string[] // e.g., ["8:00 AM", "8:00 PM"]
  purpose: string
  condition?: string
  prescribingDoctor?: string
  pharmacy?: string
  startDate: string
  endDate?: string
  refillDueDate?: string
  remainingPills?: number
  totalPills?: number
  sideEffects?: string[]
  instructions?: string // e.g., "Take with food"
  status: 'active' | 'completed' | 'paused' | 'discontinued'
  reminderEnabled: boolean
  reminderTimes?: string[]
  notes?: string
  adherenceHistory: MedicationAdherence[]
  createdAt: string
  updatedAt: string
}

export interface MedicationAdherence {
  date: string // ISO date
  time: string // Time of day
  taken: boolean
  skipped?: boolean
  notes?: string
}

// Symptoms & Conditions
export interface Symptom {
  id: string
  name: string
  dateRecorded: string
  severity: 'mild' | 'moderate' | 'severe'
  duration?: string // e.g., "2 days", "ongoing"
  location?: string // Body part
  triggers?: string[]
  relatedMedication?: string
  relatedActivities?: string[]
  photos?: string[]
  status: 'ongoing' | 'resolved' | 'recurring'
  notes?: string
  updates: SymptomUpdate[]
  createdAt: string
  updatedAt: string
}

export interface SymptomUpdate {
  date: string
  severity: 'mild' | 'moderate' | 'severe'
  notes?: string
  actionsTaken?: string[]
}

export interface Condition {
  id: string
  name: string
  diagnosedDate: string
  status: 'active' | 'resolved' | 'managing' | 'monitoring'
  severity?: 'mild' | 'moderate' | 'severe'
  provider?: string
  treatment?: string
  medications?: string[] // IDs of related medications
  notes?: string
  createdAt: string
  updatedAt: string
}

// Appointments
export interface HealthAppointment {
  id: string
  dateTime: string // ISO datetime
  providerName: string
  providerSpecialty: string
  facilityName?: string
  appointmentType: 'checkup' | 'follow-up' | 'urgent' | 'telehealth' | 'procedure' | 'other'
  reasonForVisit: string
  location?: string
  address?: string
  insuranceInfo?: string
  copayAmount?: number
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show'
  reminderDaysBefore: number[]
  remindersSet: boolean
  questionsToAsk?: string[]
  preparationSteps?: string[]
  visitSummary?: string
  prescriptionsGiven?: string[]
  followUpRequired?: boolean
  followUpDate?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

// Workouts & Exercise
export interface Workout {
  id: string
  date: string
  workoutType: 'cardio' | 'strength' | 'yoga' | 'sports' | 'cycling' | 'swimming' | 'walking' | 'running' | 'other'
  workoutName: string
  duration: number // minutes
  intensity: 'light' | 'moderate' | 'vigorous'
  caloriesBurned?: number
  distance?: number // miles or km
  distanceUnit?: 'miles' | 'km'
  exerciseDetails?: string
  location: 'gym' | 'home' | 'outdoor' | 'studio' | 'other'
  howYouFelt?: number // 1-10
  notes?: string
  createdAt: string
  updatedAt: string
}

// Nutrition & Meals (enhanced from existing)
export interface Meal {
  id: string
  date: string
  time: string
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  foodDescription: string
  calories?: number
  protein?: number // grams
  carbs?: number // grams
  fat?: number // grams
  fiber?: number // grams
  sugar?: number // grams
  water?: number // oz/ml
  photo?: string
  howYouFeltAfter?: string
  detectedFoods?: Array<{
    name: string
    quantity: string
    calories: number
  }>
  notes?: string
  createdAt: string
  updatedAt: string
}

// Providers & Facilities
export interface HealthProvider {
  id: string
  name: string
  type: 'doctor' | 'dentist' | 'therapist' | 'specialist' | 'hospital' | 'lab' | 'pharmacy' | 'urgent-care' | 'other'
  specialty?: string
  phoneNumber?: string
  email?: string
  address?: string
  officeHours?: string
  insuranceAccepted?: string[]
  lastVisitDate?: string
  nextAppointmentDate?: string
  rating?: number // 1-5
  notes?: string
  emergencyContact?: boolean
  createdAt: string
  updatedAt: string
}

// Medical Records & Documents
export interface MedicalDocument {
  id: string
  documentName: string
  documentDate: string
  documentType: 'lab-results' | 'imaging' | 'prescription' | 'insurance-card' | 'visit-summary' | 'vaccine-record' | 'other'
  provider?: string
  relatedCondition?: string
  fileUrl?: string
  fileType?: string // pdf, jpg, png
  fileSize?: number // bytes
  pages?: number
  summary?: string
  keyFindings?: string
  tags: string[]
  sharedWith?: string[]
  notes?: string
  createdAt: string
  updatedAt: string
}

// Allergies & Medical History
export interface Allergy {
  id: string
  type: 'medication' | 'food' | 'environmental' | 'other'
  allergenName: string
  severity: 'mild' | 'moderate' | 'severe' | 'life-threatening'
  reactionSymptoms: string[]
  dateDiscovered?: string
  treatmentRequired?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

// Vaccinations & Immunizations
export interface Vaccination {
  id: string
  vaccineName: string
  dateAdministered: string
  providerLocation: string
  doseNumber?: string // "1st", "2nd", "Booster"
  nextDueDate?: string
  lotNumber?: string
  sideEffects?: string[]
  documentPhoto?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

// Aggregated Health Data
export interface HealthData {
  metrics: HealthMetric[]
  medications: Medication[]
  symptoms: Symptom[]
  conditions: Condition[]
  appointments: HealthAppointment[]
  workouts: Workout[]
  meals: Meal[]
  providers: HealthProvider[]
  documents: MedicalDocument[]
  allergies: Allergy[]
  vaccinations: Vaccination[]
}

// Health Goals & Targets
export interface HealthGoal {
  id: string
  category: 'weight' | 'exercise' | 'sleep' | 'water' | 'steps' | 'medication-adherence' | 'other'
  targetValue: number
  currentValue?: number
  unit: string
  deadline?: string
  progress?: number // percentage
  status: 'active' | 'achieved' | 'abandoned'
  createdAt: string
  updatedAt: string
}

// Dashboard Summary
export interface HealthDashboardSummary {
  todaysMedicationsTaken: number
  todaysMedicationsTotal: number
  todaysSteps: number
  stepsGoal: number
  waterIntake: number
  waterGoal: number
  activeMinutes: number
  activeMinutesGoal: number
  sleepHours: number
  sleepQuality: number
  energyLevel: number
  upcomingAppointments: HealthAppointment[]
  activeSymptoms: Symptom[]
  medicationReminders: Medication[]
}


















