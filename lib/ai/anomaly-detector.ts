/**
 * Anomaly Detection Engine
 * Identifies unusual patterns and deviations from normal behavior
 */

export interface Anomaly {
  type: 'spending' | 'health' | 'habit' | 'pet' | 'sleep' | 'general'
  severity: 'low' | 'medium' | 'high'
  title: string
  description: string
  detected_at: Date
  recommendation: string
  metric_value: number
  normal_range: { min: number, max: number }
}

/**
 * Calculate standard deviation
 */
function standardDeviation(values: number[]): number {
  if (values.length === 0) return 0
  const avg = values.reduce((a, b) => a + b, 0) / values.length
  const squareDiffs = values.map(value => Math.pow(value - avg, 2))
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length
  return Math.sqrt(avgSquareDiff)
}

/**
 * Detect spending anomalies
 */
function detectSpendingAnomalies(logs: any[]): Anomaly[] {
  const anomalies: Anomaly[] = []
  
  const expenses = logs.filter(log => log.type === 'expense')
  if (expenses.length < 10) return anomalies

  // Calculate daily spending
  const dailySpending: Record<string, number> = {}
  expenses.forEach(log => {
    const date = log.data.date || new Date(log.timestamp).toISOString().split('T')[0]
    dailySpending[date] = (dailySpending[date] || 0) + parseFloat(log.data.amount || 0)
  })

  const amounts = Object.values(dailySpending)
  const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length
  const stdDev = standardDeviation(amounts)

  // Check recent spending (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const recentExpenses = expenses.filter(log => 
    new Date(log.data.date || log.timestamp) > sevenDaysAgo
  )
  const recentTotal = recentExpenses.reduce((sum, log) => sum + parseFloat(log.data.amount || 0), 0)
  const recentDaily = recentTotal / 7

  if (recentDaily > avg + stdDev * 2) {
    anomalies.push({
      type: 'spending',
      severity: 'high',
      title: 'Unusual Spending Spike',
      description: `Your spending is ${Math.round(((recentDaily - avg) / avg) * 100)}% above normal`,
      detected_at: new Date(),
      recommendation: 'Review recent transactions and adjust budget if needed',
      metric_value: recentDaily,
      normal_range: { min: avg - stdDev, max: avg + stdDev }
    })
  } else if (recentDaily > avg + stdDev) {
    anomalies.push({
      type: 'spending',
      severity: 'medium',
      title: 'Elevated Spending',
      description: `Spending is ${Math.round(((recentDaily - avg) / avg) * 100)}% higher than usual`,
      detected_at: new Date(),
      recommendation: 'Monitor spending for the rest of the month',
      metric_value: recentDaily,
      normal_range: { min: avg - stdDev, max: avg + stdDev }
    })
  }

  return anomalies
}

/**
 * Detect health metric anomalies
 */
function detectHealthAnomalies(logs: any[]): Anomaly[] {
  const anomalies: Anomaly[] = []

  // Weight anomalies
  const weightLogs = logs.filter(log => log.type === 'weight' && log.data.weight)
  if (weightLogs.length >= 5) {
    const weights = weightLogs.map(log => parseFloat(log.data.weight))
    const avg = weights.reduce((a, b) => a + b, 0) / weights.length
    const stdDev = standardDeviation(weights)
    const latest = weights[weights.length - 1]

    if (Math.abs(latest - avg) > stdDev * 2) {
      anomalies.push({
        type: 'health',
        severity: 'high',
        title: 'Significant Weight Change',
        description: `Weight change of ${Math.abs(latest - avg).toFixed(1)} lbs detected`,
        detected_at: new Date(),
        recommendation: 'Consider consulting with a healthcare professional',
        metric_value: latest,
        normal_range: { min: avg - stdDev * 2, max: avg + stdDev * 2 }
      })
    }
  }

  // Blood pressure anomalies
  const bpLogs = logs.filter(log => log.type === 'blood_pressure')
  if (bpLogs.length >= 3) {
    const latest = bpLogs[bpLogs.length - 1]
    const systolic = parseFloat(latest.data.systolic || 0)
    const diastolic = parseFloat(latest.data.diastolic || 0)

    // Check for hypertension
    if (systolic > 140 || diastolic > 90) {
      anomalies.push({
        type: 'health',
        severity: 'high',
        title: 'Elevated Blood Pressure',
        description: `Reading: ${systolic}/${diastolic} mmHg (above normal range)`,
        detected_at: new Date(),
        recommendation: 'Consult with doctor if consistently elevated',
        metric_value: systolic,
        normal_range: { min: 90, max: 140 }
      })
    } else if (systolic < 90 || diastolic < 60) {
      anomalies.push({
        type: 'health',
        severity: 'medium',
        title: 'Low Blood Pressure',
        description: `Reading: ${systolic}/${diastolic} mmHg (below normal range)`,
        detected_at: new Date(),
        recommendation: 'Monitor and consult doctor if symptomatic',
        metric_value: systolic,
        normal_range: { min: 90, max: 140 }
      })
    }
  }

  return anomalies
}

/**
 * Detect missed routine activities
 */
function detectMissedRoutines(logs: any[]): Anomaly[] {
  const anomalies: Anomaly[] = []

  // Check for gaps in regular logging
  const logsByType: Record<string, Date[]> = {}
  
  logs.forEach(log => {
    const type = log.type
    const date = new Date(log.data.date || log.timestamp)
    if (!logsByType[type]) {
      logsByType[type] = []
    }
    logsByType[type].push(date)
  })

  Object.entries(logsByType).forEach(([type, dates]) => {
    if (dates.length < 10) return

    dates.sort((a, b) => a.getTime() - b.getTime())
    const latestLog = dates[dates.length - 1]
    const daysSinceLastLog = (Date.now() - latestLog.getTime()) / (24 * 60 * 60 * 1000)

    // Calculate average gap between logs
    const gaps: number[] = []
    for (let i = 1; i < dates.length; i++) {
      gaps.push((dates[i].getTime() - dates[i - 1].getTime()) / (24 * 60 * 60 * 1000))
    }
    const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length

    // If it's been significantly longer than usual
    if (daysSinceLastLog > avgGap * 3 && daysSinceLastLog > 3) {
      anomalies.push({
        type: 'habit',
        severity: daysSinceLastLog > avgGap * 5 ? 'high' : 'medium',
        title: `Missed Routine: ${type}`,
        description: `It's been ${Math.round(daysSinceLastLog)} days since your last ${type} log (usual: ${Math.round(avgGap)} days)`,
        detected_at: new Date(),
        recommendation: `Resume your ${type} routine to maintain consistency`,
        metric_value: daysSinceLastLog,
        normal_range: { min: 0, max: avgGap * 2 }
      })
    }
  })

  return anomalies
}

/**
 * Detect sleep pattern disruptions
 */
function detectSleepAnomalies(logs: any[]): Anomaly[] {
  const anomalies: Anomaly[] = []

  const sleepLogs = logs.filter(log => log.data.hours)
  if (sleepLogs.length < 7) return anomalies

  const hours = sleepLogs.map(log => parseFloat(log.data.hours))
  const avg = hours.reduce((a, b) => a + b, 0) / hours.length

  // Check recent week
  const recentLogs = sleepLogs.slice(-7)
  const recentHours = recentLogs.map(log => parseFloat(log.data.hours))
  const recentAvg = recentHours.reduce((a, b) => a + b, 0) / recentHours.length

  if (recentAvg < 6) {
    anomalies.push({
      type: 'sleep',
      severity: 'high',
      title: 'Sleep Deprivation Detected',
      description: `Averaging ${recentAvg.toFixed(1)} hours/night (last 7 days)`,
      detected_at: new Date(),
      recommendation: 'Prioritize sleep for better health and productivity',
      metric_value: recentAvg,
      normal_range: { min: 7, max: 9 }
    })
  } else if (recentAvg < 7 && avg >= 7) {
    anomalies.push({
      type: 'sleep',
      severity: 'medium',
      title: 'Reduced Sleep Pattern',
      description: `Sleep down to ${recentAvg.toFixed(1)} hrs from usual ${avg.toFixed(1)} hrs`,
      detected_at: new Date(),
      recommendation: 'Try to return to your normal sleep schedule',
      metric_value: recentAvg,
      normal_range: { min: 7, max: 9 }
    })
  }

  return anomalies
}

/**
 * Detect all anomalies across domains
 */
export function detectAnomalies(allLogs: Record<string, any[]>): Anomaly[] {
  const anomalies: Anomaly[] = []

  // Financial anomalies
  const financialLogs = allLogs['financial'] || []
  anomalies.push(...detectSpendingAnomalies(financialLogs))

  // Health anomalies
  const healthLogs = allLogs['health'] || []
  anomalies.push(...detectHealthAnomalies(healthLogs))

  // Sleep anomalies
  const mindfulnessLogs = allLogs['mindfulness'] || []
  anomalies.push(...detectSleepAnomalies(mindfulnessLogs))

  // Routine anomalies (check all domains)
  Object.values(allLogs).flat().forEach(log => {
    const routineAnomalies = detectMissedRoutines([log])
    anomalies.push(...routineAnomalies)
  })

  return anomalies.sort((a, b) => {
    const severityOrder = { high: 3, medium: 2, low: 1 }
    return severityOrder[b.severity] - severityOrder[a.severity]
  })
}







