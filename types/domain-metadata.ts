export interface FinancialDomainMetadata {
  id?: string
  title?: string
  description?: string
  type?: string
  itemType?: string
  logType?: string
  transactionType?: string
  accountType?: string
  category?: string
  status?: string
  timestamp?: string
  date?: string
  transactionDate?: string
  postedAt?: string
  balance?: number | string
  value?: number | string
  currentValue?: number | string
  currentBalance?: number | string
  amount?: number | string
  monthlyPremium?: number | string
  descriptionOverride?: string
  completion_history?: string[]
  [key: string]: unknown
}

export interface HealthDomainMetadata {
  id?: string
  recordType?: string
  type?: string
  logType?: string
  entryType?: string
  date?: string
  provider?: string
  duration?: number | string
  minutes?: number | string
  steps?: number | string
  weight?: number | string
  heartRate?: number | string
  hr?: number | string
  bpm?: number | string
  glucose?: number | string
  systolic?: number | string
  diastolic?: number | string
  moodScore?: number | string
  moodValue?: number | string
  medication?: string
  expiryDate?: string
  notes?: string
  [key: string]: unknown
}

export interface InsuranceDomainMetadata {
  itemType?: string
  policyType?: string
  provider?: string
  policyNumber?: string
  premium?: number | string
  deductible?: number | string
  coverageAmount?: number | string
  documentName?: string
  documentType?: string
  attorney?: string
  caseNumber?: string
  issueDate?: string
  renewalDate?: string
  expiryDate?: string
  status?: string
  beneficiaries?: string
  attachments?: string
  reminderDays?: number
  monthlyPremium?: number | string
  [key: string]: unknown
}

export interface HomeDomainMetadata {
  itemType?: string
  type?: string
  category?: string
  location?: string
  dueDate?: string
  lastCompleted?: string
  recurring?: boolean
  frequency?: string
  priority?: string
  status?: string
  purchaseDate?: string
  warrantyExpires?: string
  manufacturer?: string
  modelNumber?: string
  serialNumber?: string
  condition?: string
  projectStatus?: string
  startDate?: string
  targetDate?: string
  completedDate?: string
  budget?: number | string
  actualCost?: number | string
  progressPercent?: number | string
  propertyAddress?: string
  propertyType?: string
  purchasePrice?: number | string
  currentValue?: number | string
  estimatedValue?: number | string
  propertyValue?: number | string
  mortgageBalance?: number | string
  propertyTax?: number | string
  squareFeet?: number | string
  yearBuilt?: number | string
  documentType?: string
  documentUrl?: string
  expirationDate?: string
  providerName?: string
  serviceType?: string
  contactPhone?: string
  contactEmail?: string
  rating?: number | string
  lastServiceDate?: string
  website?: string
  estimatedCost?: number | string
  cost?: number | string
  paidDate?: string
  notes?: string
  attachments?: string
  tags?: string
  reminderDays?: number
  [key: string]: unknown
}

export interface VehiclesDomainMetadata {
  type?: string
  category?: string
  value?: number | string
  estimatedValue?: number | string
  currentValue?: number | string
  needsService?: boolean
  serviceDue?: boolean
  mileage?: number | string
  currentMileage?: number | string
  maintenanceDue?: string
  [key: string]: unknown
}

export interface AppliancesDomainMetadata {
  id?: string
  name?: string
  brand?: string
  model?: string
  serialNumber?: string
  purchaseDate?: string
  purchasePrice?: number | string
  value?: number | string
  cost?: number | string
  warrantyExpiry?: string
  warrantyExpires?: string
  warrantyType?: string
  maintenanceDue?: string
  nextMaintenance?: string
  needsMaintenance?: boolean
  location?: string
  condition?: string
  estimatedLifespan?: number | string
  status?: string
  notes?: string
  photoUrl?: string
  [key: string]: unknown
}

export interface PetsDomainMetadata {
  petId?: string
  type?: string
  itemType?: string
  vaccines?: Array<{ status?: string; [key: string]: unknown }>
  expenses?: Array<{ date: string; amount: number | string; type?: string; [key: string]: unknown }>
  [key: string]: unknown
}

export interface RelationshipsDomainMetadata {
  type?: string
  relationshipType?: string
  importantDates?: Array<{ label?: string; date?: string }>
  reminders?: Array<{ label?: string; date?: string }>
  [key: string]: unknown
}

export interface DigitalDomainMetadata {
  category?: string
  type?: string
  monthlyCost?: number | string
  cost?: number | string
  username?: string
  renewalDate?: string
  expiryDate?: string
  passwordStrength?: string
  [key: string]: unknown
}

export interface MindfulnessDomainMetadata {
  entryType?: string
  type?: string
  date?: string
  duration?: number | string
  minutes?: number | string
  moodScore?: number | string
  moodValue?: number | string
  fullContent?: string
  aiInsight?: string
  [key: string]: unknown
}

export interface FitnessDomainMetadata {
  activityType?: string
  date?: string
  duration?: number | string
  calories?: number | string
  caloriesBurned?: number | string
  steps?: number | string
  distance?: number | string
  [key: string]: unknown
}

export interface NutritionDomainMetadata {
  itemType?: string
  type?: string
  date?: string
  calories?: number | string
  protein?: number | string
  carbs?: number | string
  fats?: number | string
  fiber?: number | string
  sugar?: number | string
  water?: number | string
  goals?: {
    caloriesGoal?: number | string
    proteinGoal?: number | string
    carbsGoal?: number | string
    fatsGoal?: number | string
    fiberGoal?: number | string
    sugarGoal?: number | string
    waterGoal?: number | string
    [key: string]: unknown
  }
  [key: string]: unknown
}

export interface MiscDomainMetadata {
  category?: string
  estimatedValue?: number | string
  currentValue?: number | string
  value?: number | string
  purchasePrice?: number | string
  isInsured?: boolean
  [key: string]: unknown
}

export interface ServicesDomainMetadata {
  serviceType?: string
  providerName?: string
  accountNumber?: string
  monthlyCost?: number | string
  annualCost?: number | string
  contractStart?: string
  contractEnd?: string
  autoRenew?: boolean
  cancellationNotice?: number
  coverage?: string
  deductible?: number | string
  contactPhone?: string
  contactEmail?: string
  website?: string
  satisfactionRating?: number
  lastReviewed?: string
  potentialSavings?: number | string
  comparisonHistory?: Array<{
    date: string
    competitors: number
    savingsFound: number
    switched: boolean
  }>
  notes?: string
  reminderDays?: number
  [key: string]: unknown
}

export interface LegalDomainMetadata {
  documentType?: string
  type?: string
  caseNumber?: string
  attorney?: string
  lawFirm?: string
  courtName?: string
  filingDate?: string
  hearingDate?: string
  closedDate?: string
  status?: string
  category?: string
  documentName?: string
  documentUrl?: string
  issueDate?: string
  expiryDate?: string
  renewalDate?: string
  cost?: number | string
  notes?: string
  attachments?: string
  reminderDays?: number
  [key: string]: unknown
}

export type DomainMetadataMap = {
  financial: FinancialDomainMetadata
  health: HealthDomainMetadata
  insurance: InsuranceDomainMetadata
  home: HomeDomainMetadata
  vehicles: VehiclesDomainMetadata
  appliances: AppliancesDomainMetadata
  pets: PetsDomainMetadata
  relationships: RelationshipsDomainMetadata
  digital: DigitalDomainMetadata
  mindfulness: MindfulnessDomainMetadata
  fitness: FitnessDomainMetadata
  nutrition: NutritionDomainMetadata
  services: ServicesDomainMetadata
  miscellaneous: MiscDomainMetadata
}

export type AnyDomainMetadata = DomainMetadataMap[keyof DomainMetadataMap]
