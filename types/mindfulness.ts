// Mindfulness Domain Types

export type PracticeType =
  | 'Breathing'
  | 'Body Scan'
  | 'Loving-Kindness'
  | 'Walking Meditation'
  | 'Guided Imagery'
  | 'Mindful Listening'
  | 'Journaling'
  | 'Yoga Nidra'

export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced'

export type GoalType = 'Daily Minutes' | 'Sessions Per Week' | 'Consistency Streak'

export interface MindfulnessPractice {
  id: string
  name: string
  practiceType: PracticeType
  description?: string
  instructions?: string
  suggestedDurationMinutes: number
  difficultyLevel?: DifficultyLevel
  tags: string[]
  createdAt: string
}

export interface MindfulnessSession {
  id: string
  userId: string
  practiceType: PracticeType
  startTime: string
  endTime: string
  durationMinutes: number
  guided: boolean
  guideName?: string
  moodBefore?: number // 1-5
  moodAfter?: number // 1-5
  notes?: string
  createdAt: string
}

export interface MindfulnessGoal {
  id: string
  userId: string
  type: GoalType
  target: number
  currentStreak: number
  longestStreak: number
  lastActivityDate?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface MindfulnessCheckin {
  id: string
  userId: string
  timestamp: string
  moodScore?: number // 1-5
  energyLevel?: number // 1-5
  stressLevel?: number // 1-5
  emotions: string[]
  journalEntry?: string
  createdAt: string
}

// Insights & Analytics Types
export interface MoodInsight {
  averageMoodImprovement: number
  totalSessions: number
  message: string
}

export interface BestPracticeInsight {
  practiceType: PracticeType
  averageMoodAfter: number
  sessionCount: number
  message: string
}

export interface ConsistencyInsight {
  currentStreak: number
  longestStreak: number
  message: string
  celebration?: boolean
}

export interface MindfulnessStats {
  totalSessions: number
  totalMinutes: number
  currentStreak: number
  longestStreak: number
  averageMoodImprovement: number
  mostUsedPractice?: PracticeType
  sessionsThisWeek: number
  minutesToday: number
}

















