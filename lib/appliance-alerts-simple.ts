import { Appliance, Warranty, ApplianceAlert, ApplianceWithWarranty } from '@/types/appliances-simple'

/**
 * Calculate age of appliance in years
 */
export function calculateAge(purchaseDate: string): number {
  const purchase = new Date(purchaseDate)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - purchase.getTime())
  const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25)
  return Math.round(diffYears * 10) / 10
}

/**
 * Calculate days until a date
 */
export function daysUntil(dateStr: string): number {
  const target = new Date(dateStr)
  const now = new Date()
  const diffTime = target.getTime() - now.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Generate alerts for an appliance
 */
export function generateAlerts(
  appliance: Appliance,
  warranty?: Warranty
): ApplianceAlert[] {
  const alerts: ApplianceAlert[] = []
  const age = calculateAge(appliance.purchaseDate)

  // Warranty Expiration Alerts
  if (warranty) {
    const daysLeft = daysUntil(warranty.endDate)
    
    if (daysLeft < 0) {
      // Warranty expired
      alerts.push({
        id: `${appliance.id}-warranty-expired`,
        applianceId: appliance.id,
        applianceName: appliance.name,
        type: 'warranty-expired',
        severity: 'medium',
        message: `${warranty.type} warranty expired`,
        date: warranty.endDate,
        action: 'Consider extended warranty or track for issues'
      })
    } else if (daysLeft <= 30) {
      // Expiring within 30 days
      alerts.push({
        id: `${appliance.id}-warranty-expiring`,
        applianceId: appliance.id,
        applianceName: appliance.name,
        type: 'warranty-expiring',
        severity: 'high',
        message: `${warranty.type} warranty expires in ${daysLeft} days`,
        date: warranty.endDate,
        action: 'File any warranty claims now or purchase extended coverage'
      })
    } else if (daysLeft <= 60) {
      // Expiring within 60 days
      alerts.push({
        id: `${appliance.id}-warranty-expiring`,
        applianceId: appliance.id,
        applianceName: appliance.name,
        type: 'warranty-expiring',
        severity: 'medium',
        message: `${warranty.type} warranty expires in ${daysLeft} days`,
        date: warranty.endDate,
        action: 'Review warranty coverage and consider extension'
      })
    }
  }

  // End of Life Alerts (based on expected lifespan)
  const lifespanYears = appliance.expectedLifespan
  const lifespanPercentage = (age / lifespanYears) * 100

  if (age >= lifespanYears) {
    // Reached or exceeded expected lifespan
    alerts.push({
      id: `${appliance.id}-end-of-life`,
      applianceId: appliance.id,
      applianceName: appliance.name,
      type: 'end-of-life',
      severity: 'high',
      message: `${appliance.name} is ${age} years old and has reached its expected lifespan of ${lifespanYears} years`,
      action: 'Consider replacement soon - start budgeting'
    })
  } else if (lifespanPercentage >= 85) {
    // 85% of lifespan used - start shopping
    alerts.push({
      id: `${appliance.id}-start-shopping`,
      applianceId: appliance.id,
      applianceName: appliance.name,
      type: 'start-shopping',
      severity: 'medium',
      message: `${appliance.name} is ${age} years old (${Math.round(lifespanPercentage)}% of expected ${lifespanYears} year lifespan)`,
      action: 'Start researching replacement models and watch for sales'
    })
  }

  return alerts.sort((a, b) => {
    // Sort by severity: high > medium > low
    const severityOrder = { high: 0, medium: 1, low: 2 }
    return severityOrder[a.severity] - severityOrder[b.severity]
  })
}

/**
 * Get warranty status
 */
export function getWarrantyStatus(warranty?: Warranty): 'active' | 'expiring-soon' | 'expired' | 'none' {
  if (!warranty) return 'none'
  
  const daysLeft = daysUntil(warranty.endDate)
  
  if (daysLeft < 0) return 'expired'
  if (daysLeft <= 60) return 'expiring-soon'
  return 'active'
}

/**
 * Get lifespan status
 */
export function getLifespanStatus(age: number, expectedLifespan: number): 'new' | 'good' | 'aging' | 'replace-soon' {
  const percentage = (age / expectedLifespan) * 100
  
  if (percentage >= 100) return 'replace-soon'
  if (percentage >= 85) return 'aging'
  if (percentage >= 50) return 'good'
  return 'new'
}

/**
 * Enrich appliance with warranty and alerts
 */
export function enrichAppliance(
  appliance: Appliance,
  warranty?: Warranty
): ApplianceWithWarranty {
  const age = calculateAge(appliance.purchaseDate)
  const alerts = generateAlerts(appliance, warranty)
  const warrantyStatus = getWarrantyStatus(warranty)
  const lifespanStatus = getLifespanStatus(age, appliance.expectedLifespan)

  return {
    ...appliance,
    warranty,
    alerts,
    age,
    warrantyStatus,
    lifespanStatus
  }
}

















