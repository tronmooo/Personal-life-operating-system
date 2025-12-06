// Simple Appliances Domain Types

export type ApplianceCategory = 
  | 'Refrigerator'
  | 'Oven'
  | 'Dishwasher'
  | 'Washing Machine'
  | 'Dryer'
  | 'HVAC'
  | 'Television'
  | 'Microwave'
  | 'Freezer'
  | 'Other'

export type WarrantyType = 
  | 'Manufacturer'
  | 'Extended'
  | 'Store'
  | 'Parts'
  | 'Labor'

export type AlertType = 
  | 'warranty-expiring'
  | 'warranty-expired'
  | 'end-of-life'
  | 'start-shopping'

export type AlertSeverity = 'high' | 'medium' | 'low'

export interface Appliance {
  id: string
  userId: string
  name: string
  brand?: string
  modelNumber?: string
  category: ApplianceCategory
  serialNumber?: string
  purchaseDate: string
  purchasePrice?: number
  expectedLifespan: number
  location?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface Warranty {
  id: string
  userId: string
  applianceId: string
  type: WarrantyType
  provider: string
  durationMonths: number
  startDate: string
  endDate: string
  coverageDescription?: string
  contactInfo?: string
  claimProcess?: string
  isTransferable: boolean
  createdAt: string
  updatedAt: string
}

export interface ApplianceAlert {
  id: string
  applianceId: string
  applianceName: string
  type: AlertType
  severity: AlertSeverity
  message: string
  date?: string
  action?: string
}

export interface ApplianceWithWarranty extends Appliance {
  warranty?: Warranty
  alerts: ApplianceAlert[]
  age: number
  warrantyStatus: 'active' | 'expiring-soon' | 'expired' | 'none'
  lifespanStatus: 'new' | 'good' | 'aging' | 'replace-soon'
}

















