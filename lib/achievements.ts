// Achievement/Badge System

// Helper to get Supabase client (dynamic import for SSR safety)
async function getSupabaseClient() {
  const { createClientComponentClient } = await import('@/lib/supabase/browser-client')
  return createClientComponentClient()
}

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  category: 'habits' | 'finance' | 'health' | 'productivity' | 'general'
  requirement: number
  unlocked: boolean
  unlockedAt?: string
  progress: number
}

export const ACHIEVEMENTS: Achievement[] = [
  // Habit Achievements
  {
    id: 'habit-streak-7',
    title: '🔥 Week Warrior',
    description: 'Complete any habit for 7 days in a row',
    icon: '🔥',
    category: 'habits',
    requirement: 7,
    unlocked: false,
    progress: 0,
  },
  {
    id: 'habit-streak-30',
    title: '🌟 Monthly Master',
    description: 'Complete any habit for 30 days in a row',
    icon: '🌟',
    category: 'habits',
    requirement: 30,
    unlocked: false,
    progress: 0,
  },
  {
    id: 'habit-streak-100',
    title: '👑 Century Champion',
    description: 'Complete any habit for 100 days in a row',
    icon: '👑',
    category: 'habits',
    requirement: 100,
    unlocked: false,
    progress: 0,
  },
  {
    id: 'all-habits-day',
    title: '💪 Perfect Day',
    description: 'Complete all your habits in a single day',
    icon: '💪',
    category: 'habits',
    requirement: 1,
    unlocked: false,
    progress: 0,
  },

  // Financial Achievements
  {
    id: 'bills-paid-month',
    title: '💰 Bills Boss',
    description: 'Pay all bills on time for a full month',
    icon: '💰',
    category: 'finance',
    requirement: 1,
    unlocked: false,
    progress: 0,
  },
  {
    id: 'saved-1000',
    title: '💎 Savings Star',
    description: 'Save $1,000',
    icon: '💎',
    category: 'finance',
    requirement: 1000,
    unlocked: false,
    progress: 0,
  },
  {
    id: 'tracked-100-transactions',
    title: '📊 Tracking Pro',
    description: 'Track 100 financial transactions',
    icon: '📊',
    category: 'finance',
    requirement: 100,
    unlocked: false,
    progress: 0,
  },

  // Health Achievements
  {
    id: 'health-checkup',
    title: '🏥 Health Conscious',
    description: 'Complete your annual health checkup',
    icon: '🏥',
    category: 'health',
    requirement: 1,
    unlocked: false,
    progress: 0,
  },
  {
    id: 'vitals-tracked-30',
    title: '❤️ Vital Tracker',
    description: 'Log vital signs for 30 days',
    icon: '❤️',
    category: 'health',
    requirement: 30,
    unlocked: false,
    progress: 0,
  },

  // Productivity Achievements
  {
    id: 'tasks-completed-50',
    title: '✅ Task Master',
    description: 'Complete 50 tasks',
    icon: '✅',
    category: 'productivity',
    requirement: 50,
    unlocked: false,
    progress: 0,
  },
  {
    id: 'perfect-week',
    title: '🎯 Perfect Week',
    description: 'Complete all tasks for a week',
    icon: '🎯',
    category: 'productivity',
    requirement: 1,
    unlocked: false,
    progress: 0,
  },

  // General Achievements
  {
    id: 'domains-tracked-10',
    title: '🌐 Life Organizer',
    description: 'Add items to 10 different life domains',
    icon: '🌐',
    category: 'general',
    requirement: 10,
    unlocked: false,
    progress: 0,
  },
  {
    id: 'items-tracked-100',
    title: '📈 Data Devotee',
    description: 'Track 100 total items across all domains',
    icon: '📈',
    category: 'general',
    requirement: 100,
    unlocked: false,
    progress: 0,
  },
  {
    id: 'documents-scanned-10',
    title: '📸 Scan Master',
    description: 'Scan 10 documents with OCR',
    icon: '📸',
    category: 'general',
    requirement: 10,
    unlocked: false,
    progress: 0,
  },
  {
    id: 'first-week',
    title: '🎉 Getting Started',
    description: 'Use LifeHub for 7 consecutive days',
    icon: '🎉',
    category: 'general',
    requirement: 7,
    unlocked: false,
    progress: 0,
  },
]

export class AchievementManager {
  private static STORAGE_KEY = 'lifehub_achievements'
  private static UNLOCKED_KEY = 'lifehub_unlocked_achievements'

  static async getAchievements(): Promise<Achievement[]> {
    if (typeof window === 'undefined') return ACHIEVEMENTS

    try {
      const supabase = await getSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Load from Supabase
        const { data, error } = await supabase
          .from('domain_entries')
          .select('*')
          .eq('user_id', user.id)
          .eq('domain', 'achievements')
          .order('created_at', { ascending: false })
        
        if (!error && data && data.length > 0) {
          // Transform Supabase data to expected format
          const storedAchievements = data.map((entry: any) => ({
            id: entry.metadata?.achievementId || entry.id,
            title: entry.title,
            description: entry.description,
            icon: entry.metadata?.icon,
            category: entry.metadata?.category,
            requirement: entry.metadata?.requirement,
            unlocked: entry.metadata?.unlocked || false,
            progress: entry.metadata?.progress || 0,
            unlockedAt: entry.metadata?.unlockedAt
          }))
          
          // Merge with default achievements to include any new ones
          return ACHIEVEMENTS.map(defaultAch => {
            const stored = storedAchievements.find((a: any) => a.id === defaultAch.id)
            return stored || defaultAch
          })
        }
      } else {
        // Fallback to IndexedDB for unauthenticated users
        const { idbGet } = await import('@/lib/utils/idb-cache')
        const stored = await idbGet<Achievement[]>(this.STORAGE_KEY)
        if (stored) {
          return stored
        }
      }
    } catch (error) {
      console.error('Failed to load achievements:', error)
    }

    return ACHIEVEMENTS
  }

  static async saveAchievements(achievements: Achievement[]): Promise<void> {
    if (typeof window === 'undefined') return

    try {
      const supabase = await getSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Save to Supabase - upsert each achievement
        for (const achievement of achievements) {
          // Check if achievement already exists
          const { data: existing } = await supabase
            .from('domain_entries')
            .select('id')
            .eq('user_id', user.id)
            .eq('domain', 'achievements')
            .eq('metadata->>achievementId', achievement.id)
            .single()
          
          const metadata = {
            achievementId: achievement.id,
            icon: achievement.icon,
            category: achievement.category,
            requirement: achievement.requirement,
            unlocked: achievement.unlocked,
            progress: achievement.progress,
            unlockedAt: achievement.unlockedAt
          }
          
          if (existing) {
            // Update existing
            await supabase
              .from('domain_entries')
              .update({
                title: achievement.title,
                description: achievement.description,
                metadata,
                updated_at: new Date().toISOString()
              })
              .eq('id', existing.id)
          } else {
            // Insert new
            await supabase
              .from('domain_entries')
              .insert({
                user_id: user.id,
                domain: 'achievements',
                title: achievement.title,
                description: achievement.description,
                metadata
              })
          }
        }
      } else {
        // Fallback to IndexedDB
        const { idbSet } = await import('@/lib/utils/idb-cache')
        await idbSet(this.STORAGE_KEY, achievements)
      }
    } catch (error) {
      console.error('Failed to save achievements:', error)
    }
  }

  static async checkAchievements(): Promise<Achievement[]> {
    const achievements = await this.getAchievements()
    const newlyUnlocked: Achievement[] = []

    try {
      // Fallback to IndexedDB for SSR or unauthenticated users
      const { idbGet } = await import('@/lib/utils/idb-cache')
      const habits = await idbGet<any[]>('lifehub_habits', [])
      const tasks = await idbGet<any[]>('lifehub_tasks', [])
      const bills = await idbGet<any[]>('lifehub_bills', [])
      const documents = await idbGet<any[]>('lifehub_documents', [])
      const data = await idbGet<Record<string, any>>('lifehub_data', {})

      // Calculate baseline stats
      const maxStreak = habits ? Math.max(...habits.map((h: any) => h.streak), 0) : 0
      const completedHabitsToday = habits ? habits.filter((h: any) => h.completed).length : 0
      const totalHabits = habits ? habits.length : 0
      const completedTasks = tasks ? tasks.filter((t: any) => t.completed).length : 0
      const paidBills = bills ? bills.filter((b: any) => b.status === 'paid').length : 0
      const totalBills = bills ? bills.length : 0
      const scannedDocs = documents ? documents.filter((d: any) => d.extractedText).length : 0
      const totalItems = data ? Object.values(data).reduce((sum: number, items: any) => sum + items.length, 0) : 0
      const activeDomains = data ? Object.keys(data).filter(key => data[key]?.length > 0).length : 0

      // Check each achievement locally (will be overridden by Supabase version if available)
      achievements.forEach(achievement => {
        if (!achievement.unlocked) {
          let shouldUnlock = false
          let progress = 0

          switch (achievement.id) {
            case 'habit-streak-7':
              progress = Math.min(maxStreak, 7)
              shouldUnlock = maxStreak >= 7
              break
            case 'habit-streak-30':
              progress = Math.min(maxStreak, 30)
              shouldUnlock = maxStreak >= 30
              break
            case 'habit-streak-100':
              progress = Math.min(maxStreak, 100)
              shouldUnlock = maxStreak >= 100
              break
            case 'all-habits-day':
              progress = totalHabits > 0 && completedHabitsToday === totalHabits ? 1 : 0
              shouldUnlock = progress === 1
              break
            case 'bills-paid-month':
              progress = totalBills > 0 && paidBills === totalBills ? 1 : 0
              shouldUnlock = progress === 1
              break
            case 'tasks-completed-50':
              progress = Math.min(completedTasks, 50)
              shouldUnlock = completedTasks >= 50
              break
            case 'items-tracked-100':
              progress = Math.min(totalItems, 100)
              shouldUnlock = totalItems >= 100
              break
            case 'domains-tracked-10':
              progress = Math.min(activeDomains, 10)
              shouldUnlock = activeDomains >= 10
              break
            case 'documents-scanned-10':
              progress = Math.min(scannedDocs, 10)
              shouldUnlock = scannedDocs >= 10
              break
          }

          achievement.progress = progress

          if (shouldUnlock) {
            achievement.unlocked = true
            achievement.unlockedAt = new Date().toISOString()
            newlyUnlocked.push(achievement)
          }
        }
      })

      await this.saveAchievements(achievements)
    } catch (error) {
      console.error('Error checking achievements:', error)
    }

    return newlyUnlocked
  }

  static async checkAchievementsFromSupabase(): Promise<Achievement[]> {
    const achievements = await this.getAchievements()
    const newlyUnlocked: Achievement[] = []

    try {
      const supabase = await getSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      // Load datasets in parallel
      const [habitsRes, tasksRes, billsRes, docsRes, domainsRes] = await Promise.all([
        supabase.from('habits').select('id, streak, completion_history, frequency').eq('user_id', user.id),
        supabase.from('tasks').select('id, completed').eq('user_id', user.id),
        supabase.from('bills').select('id, status').eq('user_id', user.id),
        supabase.from('documents').select('id, extracted_text').eq('user_id', user.id),
        supabase.from('domains').select('domain_name, data').eq('user_id', user.id),
      ])

      const habits = habitsRes.data || []
      const tasks = tasksRes.data || []
      const bills = billsRes.data || []
      const documents = (docsRes.data || []).map((d: any) => ({ extractedText: d.extracted_text }))
      const domainsObj: Record<string, any[]> = {}
      for (const row of domainsRes.data || []) {
        domainsObj[row.domain_name] = row.data || []
      }

      const today = new Date().toISOString().split('T')[0]
      const maxStreak = Math.max(...habits.map((h: any) => Number(h.streak || 0)), 0)
      const completedHabitsToday = habits.filter((h: any) => (h.completion_history || []).includes(today)).length
      const totalHabits = habits.length
      const completedTasks = tasks.filter((t: any) => t.completed).length
      const paidBills = bills.filter((b: any) => (b.status || '').toLowerCase() === 'paid').length
      const totalBills = bills.length
      const scannedDocs = documents.filter((d: any) => !!d.extractedText).length
      const totalItems = Object.values(domainsObj).reduce((sum: number, items: any) => sum + (items?.length || 0), 0)
      const activeDomains = Object.keys(domainsObj).filter(key => (domainsObj[key]?.length || 0) > 0).length

      achievements.forEach(achievement => {
        if (!achievement.unlocked) {
          let shouldUnlock = false
          let progress = 0

          switch (achievement.id) {
            case 'habit-streak-7':
              progress = Math.min(maxStreak, 7)
              shouldUnlock = maxStreak >= 7
              break
            case 'habit-streak-30':
              progress = Math.min(maxStreak, 30)
              shouldUnlock = maxStreak >= 30
              break
            case 'habit-streak-100':
              progress = Math.min(maxStreak, 100)
              shouldUnlock = maxStreak >= 100
              break
            case 'all-habits-day':
              progress = totalHabits > 0 && completedHabitsToday === totalHabits ? 1 : 0
              shouldUnlock = progress === 1
              break
            case 'bills-paid-month':
              progress = totalBills > 0 && paidBills === totalBills ? 1 : 0
              shouldUnlock = progress === 1
              break
            case 'tasks-completed-50':
              progress = Math.min(completedTasks, 50)
              shouldUnlock = completedTasks >= 50
              break
            case 'items-tracked-100':
              progress = Math.min(totalItems, 100)
              shouldUnlock = totalItems >= 100
              break
            case 'domains-tracked-10':
              progress = Math.min(activeDomains, 10)
              shouldUnlock = activeDomains >= 10
              break
            case 'documents-scanned-10':
              progress = Math.min(scannedDocs, 10)
              shouldUnlock = scannedDocs >= 10
              break
          }

          achievement.progress = progress

          if (shouldUnlock) {
            achievement.unlocked = true
            achievement.unlockedAt = new Date().toISOString()
            newlyUnlocked.push(achievement)
          }
        }
      })

      await this.saveAchievements(achievements)
    } catch (error) {
      console.error('Error checking achievements from Supabase:', error)
    }

    return newlyUnlocked
  }

  static async getUnlockedAchievements(): Promise<Achievement[]> {
    const achievements = await this.getAchievements()
    return achievements.filter(a => a.unlocked)
  }

  static async getProgress(): Promise<{ unlocked: number; total: number; percentage: number }> {
    const achievements = await this.getAchievements()
    const unlocked = achievements.filter(a => a.unlocked).length
    const total = achievements.length
    const percentage = Math.round((unlocked / total) * 100)

    return { unlocked, total, percentage }
  }

  static async resetAchievements(): Promise<void> {
    const { idbDel } = await import('@/lib/utils/idb-cache')
    await idbDel(this.STORAGE_KEY)
    await idbDel(this.UNLOCKED_KEY)
  }
}

export default AchievementManager








