import {
  MindfulnessSession,
  MindfulnessGoal,
  MoodInsight,
  BestPracticeInsight,
  ConsistencyInsight,
  MindfulnessStats,
  PracticeType
} from '@/types/mindfulness'
import { differenceInDays, startOfWeek, isToday } from 'date-fns'

/**
 * Calculate mood improvement from sessions
 */
export function calculateMoodInsight(sessions: MindfulnessSession[]): MoodInsight {
  const sessionsWithMood = sessions.filter(s => s.moodBefore && s.moodAfter)
  
  if (sessionsWithMood.length === 0) {
    return {
      averageMoodImprovement: 0,
      totalSessions: 0,
      message: 'Start tracking your mood to see how practice affects you'
    }
  }

  const improvements = sessionsWithMood.map(s => 
    (s.moodAfter || 0) - (s.moodBefore || 0)
  )
  
  const average = improvements.reduce((sum, val) => sum + val, 0) / improvements.length
  const rounded = Math.round(average * 10) / 10

  let message = ''
  if (rounded > 1) {
    message = `Your practice consistently helps! You feel ${rounded} points better after sessions.`
  } else if (rounded > 0) {
    message = `You typically feel ${rounded} points calmer after practicing.`
  } else if (rounded === 0) {
    message = `Your sessions help you maintain emotional balance.`
  } else {
    message = `Consider trying different practices to find what works for you.`
  }

  return {
    averageMoodImprovement: rounded,
    totalSessions: sessionsWithMood.length,
    message
  }
}

/**
 * Find which practice type works best for the user
 */
export function findBestPractice(sessions: MindfulnessSession[]): BestPracticeInsight | null {
  const sessionsWithMood = sessions.filter(s => s.moodAfter)
  
  if (sessionsWithMood.length === 0) return null

  // Group by practice type
  const byType: { [key in PracticeType]?: { total: number; count: number } } = {}
  
  sessionsWithMood.forEach(session => {
    if (!byType[session.practiceType]) {
      byType[session.practiceType] = { total: 0, count: 0 }
    }
    const typeData = byType[session.practiceType]
    if (typeData) {
      typeData.total += session.moodAfter || 0
      typeData.count += 1
    }
  })

  // Find the best average
  let bestType: PracticeType | null = null
  let bestAverage = 0
  let bestCount = 0

  Object.entries(byType).forEach(([type, data]) => {
    const average = data.total / data.count
    if (average > bestAverage || (average === bestAverage && data.count > bestCount)) {
      bestType = type as PracticeType
      bestAverage = average
      bestCount = data.count
    }
  })

  if (!bestType) return null

  return {
    practiceType: bestType,
    averageMoodAfter: Math.round(bestAverage * 10) / 10,
    sessionCount: bestCount,
    message: `${bestType} practices work really well for you! Would you like to try one today?`
  }
}

/**
 * Calculate consistency streak and celebration
 */
export function calculateConsistencyInsight(goal: MindfulnessGoal | null): ConsistencyInsight {
  if (!goal) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      message: 'Set a goal to start tracking your consistency',
      celebration: false
    }
  }

  const { currentStreak, longestStreak } = goal
  
  // Celebrate milestones
  const isCelebration = currentStreak > 0 && currentStreak % 7 === 0

  let message = ''
  if (isCelebration) {
    message = `🎉 You've practiced for ${currentStreak} days in a row! That's ${currentStreak / 7} week${currentStreak > 7 ? 's' : ''} of consistency!`
  } else if (currentStreak > longestStreak) {
    message = `🌟 New personal record! You're on a ${currentStreak}-day streak!`
  } else if (currentStreak > 0) {
    message = `You're on a ${currentStreak}-day streak. Keep going!`
  } else {
    message = 'Ready to start a new streak? Even a few minutes today makes a difference.'
  }

  return {
    currentStreak,
    longestStreak,
    message,
    celebration: isCelebration
  }
}

/**
 * Calculate comprehensive stats
 */
export function calculateStats(
  sessions: MindfulnessSession[],
  goal: MindfulnessGoal | null
): MindfulnessStats {
  const totalSessions = sessions.length
  const totalMinutes = sessions.reduce((sum, s) => sum + s.durationMinutes, 0)
  
  // This week's sessions
  const weekStart = startOfWeek(new Date())
  const sessionsThisWeek = sessions.filter(s => 
    new Date(s.startTime) >= weekStart
  ).length

  // Today's minutes
  const minutesToday = sessions
    .filter(s => isToday(new Date(s.startTime)))
    .reduce((sum, s) => sum + s.durationMinutes, 0)

  // Mood improvement
  const moodInsight = calculateMoodInsight(sessions)
  
  // Most used practice
  const practiceCount: { [key in PracticeType]?: number } = {}
  sessions.forEach(s => {
    practiceCount[s.practiceType] = (practiceCount[s.practiceType] || 0) + 1
  })
  
  let mostUsedPractice: PracticeType | undefined
  let maxCount = 0
  Object.entries(practiceCount).forEach(([type, count]) => {
    if (count > maxCount) {
      mostUsedPractice = type as PracticeType
      maxCount = count
    }
  })

  return {
    totalSessions,
    totalMinutes,
    currentStreak: goal?.currentStreak || 0,
    longestStreak: goal?.longestStreak || 0,
    averageMoodImprovement: moodInsight.averageMoodImprovement,
    mostUsedPractice,
    sessionsThisWeek,
    minutesToday
  }
}

/**
 * Check if streak should break (last activity was not yesterday or today)
 */
export function shouldBreakStreak(lastActivityDate: string | null | undefined): boolean {
  if (!lastActivityDate) return true
  
  const daysSinceActivity = differenceInDays(new Date(), new Date(lastActivityDate))
  return daysSinceActivity > 1
}

/**
 * Update streak based on new session
 */
export function updateStreakFromSession(
  goal: MindfulnessGoal,
  sessionDate: Date
): { currentStreak: number; longestStreak: number; lastActivityDate: string } {
  const today = new Date(sessionDate).toISOString().split('T')[0]
  const lastDate = goal.lastActivityDate

  let currentStreak = goal.currentStreak
  let longestStreak = goal.longestStreak

  if (!lastDate) {
    // First session
    currentStreak = 1
  } else {
    const daysSinceLast = differenceInDays(new Date(today), new Date(lastDate))
    
    if (daysSinceLast === 0) {
      // Same day, keep streak
    } else if (daysSinceLast === 1) {
      // Next day, increment
      currentStreak += 1
    } else {
      // Broke streak
      currentStreak = 1
    }
  }

  if (currentStreak > longestStreak) {
    longestStreak = currentStreak
  }

  return {
    currentStreak,
    longestStreak,
    lastActivityDate: today
  }
}

















