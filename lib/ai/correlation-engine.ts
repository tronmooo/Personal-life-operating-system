/**
 * Cross-Domain Correlation Engine
 * Detects patterns and correlations across different life domains
 */

export interface Correlation {
  metric1: string
  metric2: string
  domain1: string
  domain2: string
  correlation: number // -1 to 1
  confidence: number // 0 to 1
  insight: string
  sampleSize: number
}

interface DataPoint {
  date: string
  value: number
}

/**
 * Calculate Pearson correlation coefficient
 */
function calculateCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) return 0

  const n = x.length
  const sumX = x.reduce((a, b) => a + b, 0)
  const sumY = y.reduce((a, b) => a + b, 0)
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0)
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0)
  const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0)

  const numerator = n * sumXY - sumX * sumY
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))

  if (denominator === 0) return 0
  return numerator / denominator
}

/**
 * Align two data series by date
 */
function alignDataByDate(data1: DataPoint[], data2: DataPoint[]): [number[], number[]] {
  const map1 = new Map(data1.map(d => [d.date, d.value]))
  const map2 = new Map(data2.map(d => [d.date, d.value]))

  const commonDates = [...map1.keys()].filter(date => map2.has(date))

  const aligned1 = commonDates.map(date => map1.get(date)!)
  const aligned2 = commonDates.map(date => map2.get(date)!)

  return [aligned1, aligned2]
}

/**
 * Extract sleep hours from logs
 */
function extractSleepData(logs: any[]): DataPoint[] {
  return logs
    .filter(log => log.data.hours)
    .map(log => ({
      date: log.data.date || new Date(log.timestamp).toISOString().split('T')[0],
      value: parseFloat(log.data.hours)
    }))
}

/**
 * Extract workout data from logs
 */
function extractWorkoutData(logs: any[]): DataPoint[] {
  const dailyWorkouts: Record<string, number> = {}
  
  logs.forEach(log => {
    const date = log.data.date || new Date(log.timestamp).toISOString().split('T')[0]
    dailyWorkouts[date] = (dailyWorkouts[date] || 0) + parseFloat(log.data.duration || 0)
  })

  return Object.entries(dailyWorkouts).map(([date, value]) => ({ date, value }))
}

/**
 * Extract mood scores from journal logs
 */
function extractMoodData(logs: any[]): DataPoint[] {
  const moodScores: Record<string, number> = {
    '😊 Amazing': 10,
    '😄 Happy': 8,
    '😌 Content': 7,
    '😐 Neutral': 5,
    '😔 Sad': 3,
    '😢 Very Sad': 2,
    '😠 Angry': 4,
    '😰 Anxious': 3,
    '😴 Tired': 5,
    '🤒 Unwell': 2
  }

  return logs
    .filter(log => log.data.mood)
    .map(log => ({
      date: log.data.date || new Date(log.timestamp).toISOString().split('T')[0],
      value: moodScores[log.data.mood] || 5
    }))
}

/**
 * Extract daily spending from financial logs
 */
function extractSpendingData(logs: any[]): DataPoint[] {
  const dailySpending: Record<string, number> = {}

  logs
    .filter(log => log.type === 'expense')
    .forEach(log => {
      const date = log.data.date || new Date(log.timestamp).toISOString().split('T')[0]
      dailySpending[date] = (dailySpending[date] || 0) + parseFloat(log.data.amount || 0)
    })

  return Object.entries(dailySpending).map(([date, value]) => ({ date, value }))
}

/**
 * Analyze correlations across all domains
 */
export function analyzeCorrelations(allLogs: Record<string, any[]>): Correlation[] {
  const correlations: Correlation[] = []

  // Sleep vs Productivity/Workouts
  const sleepLogs = allLogs['mindfulness'] || []
  const workoutLogs = allLogs['hobbies'] || []
  const journalLogs = sleepLogs.filter(log => log.type === 'journal')
  const workouts = workoutLogs.filter(log => log.type === 'workout')

  if (sleepLogs.length > 5 && workouts.length > 5) {
    const sleepData = extractSleepData(sleepLogs)
    const workoutData = extractWorkoutData(workouts)
    const [alignedSleep, alignedWorkout] = alignDataByDate(sleepData, workoutData)

    if (alignedSleep.length >= 5) {
      const corr = calculateCorrelation(alignedSleep, alignedWorkout)
      if (Math.abs(corr) > 0.3) {
        let insight = ''
        if (corr > 0.5) {
          insight = `You exercise ${Math.round(corr * 100)}% more on days with 7+ hours of sleep`
        } else if (corr > 0.3) {
          insight = `Better sleep moderately increases workout duration (${Math.round(corr * 100)}% correlation)`
        }

        correlations.push({
          metric1: 'Sleep Hours',
          metric2: 'Workout Duration',
          domain1: 'mindfulness',
          domain2: 'hobbies',
          correlation: corr,
          confidence: Math.min(alignedSleep.length / 30, 1),
          insight,
          sampleSize: alignedSleep.length
        })
      }
    }
  }

  // Exercise vs Mood
  if (journalLogs.length > 5 && workouts.length > 5) {
    const moodData = extractMoodData(journalLogs)
    const workoutData = extractWorkoutData(workouts)
    const [alignedMood, alignedWorkout] = alignDataByDate(moodData, workoutData)

    if (alignedMood.length >= 5) {
      const corr = calculateCorrelation(alignedWorkout, alignedMood)
      if (Math.abs(corr) > 0.3) {
        let insight = ''
        if (corr > 0.5) {
          insight = `Strong positive correlation: Exercise significantly improves your mood (+${Math.round(corr * 100)}%)`
        } else if (corr > 0.3) {
          insight = `Exercise tends to improve your mood (${Math.round(corr * 100)}% correlation)`
        }

        correlations.push({
          metric1: 'Exercise',
          metric2: 'Mood Score',
          domain1: 'hobbies',
          domain2: 'mindfulness',
          correlation: corr,
          confidence: Math.min(alignedMood.length / 30, 1),
          insight,
          sampleSize: alignedMood.length
        })
      }
    }
  }

  // Spending vs Mood
  const financialLogs = allLogs['financial'] || []
  if (journalLogs.length > 5 && financialLogs.length > 5) {
    const moodData = extractMoodData(journalLogs)
    const spendingData = extractSpendingData(financialLogs)
    const [alignedMood, alignedSpending] = alignDataByDate(moodData, spendingData)

    if (alignedMood.length >= 5) {
      const corr = calculateCorrelation(alignedMood, alignedSpending)
      if (Math.abs(corr) > 0.3) {
        let insight = ''
        if (corr < -0.4) {
          insight = `Spending increases ${Math.round(Math.abs(corr) * 100)}% when mood is low - possible stress spending`
        } else if (corr < -0.3) {
          insight = `Lower mood days show increased spending patterns`
        } else if (corr > 0.3) {
          insight = `Higher mood correlates with more spending - treat yourself days?`
        }

        correlations.push({
          metric1: 'Mood Score',
          metric2: 'Daily Spending',
          domain1: 'mindfulness',
          domain2: 'financial',
          correlation: corr,
          confidence: Math.min(alignedMood.length / 30, 1),
          insight,
          sampleSize: alignedMood.length
        })
      }
    }
  }

  return correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation))
}

/**
 * Get natural language explanation of correlation
 */
export function explainCorrelation(corr: Correlation): string {
  const strength = Math.abs(corr.correlation)
  const direction = corr.correlation > 0 ? 'positive' : 'negative'

  let strengthText = ''
  if (strength > 0.7) strengthText = 'very strong'
  else if (strength > 0.5) strengthText = 'strong'
  else if (strength > 0.3) strengthText = 'moderate'
  else strengthText = 'weak'

  return `${strengthText} ${direction} correlation between ${corr.metric1} and ${corr.metric2}`
}







