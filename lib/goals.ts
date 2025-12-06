/**
 * Goals and routines management
 * ✅ MIGRATED: Now uses Supabase via useRoutines() hook
 * @deprecated RoutineManager class - Use useRoutines() hook instead
 */

export interface RoutineStep {
  id: string
  title: string
  duration?: number
  completed?: boolean
}

export interface Routine {
  id: string
  name: string
  description?: string
  timeOfDay: 'morning' | 'evening' | 'anytime'
  days: string[]
  estimatedDuration: number
  completionCount: number
  steps: RoutineStep[]
  enabled?: boolean
  type?: string
}

export interface PresetRoutine {
  name: string
  description: string
  timeOfDay: 'morning' | 'evening' | 'anytime'
  days: string[]
  estimatedDuration: number
  steps: RoutineStep[]
}

/**
 * @deprecated CRUD methods removed. Use useRoutines() hook from '@/lib/hooks/use-routines' instead
 * 
 * Only getPresetRoutines() remains for backward compatibility.
 * All routine operations (add, update, delete, complete) now use Supabase via useRoutines().
 * Migration from localStorage to Supabase happens automatically on first use of useRoutines().
 * 
 * Example:
 *   const { routines, addRoutine, completeRoutine, deleteRoutine, updateRoutine } = useRoutines()
 */
export class RoutineManager {
  static getPresetRoutines(): PresetRoutine[] {
    return [
      {
        name: 'Morning Energy Boost',
        description: 'Start your day with energy and focus',
        timeOfDay: 'morning',
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        estimatedDuration: 30,
        steps: [
          { id: '1', title: 'Drink water (16oz)', duration: 2 },
          { id: '2', title: 'Morning stretch routine', duration: 10 },
          { id: '3', title: 'Meditation or breathing exercises', duration: 5 },
          { id: '4', title: 'Review daily goals', duration: 5 },
          { id: '5', title: 'Healthy breakfast', duration: 15 }
        ]
      },
      {
        name: 'Evening Wind Down',
        description: 'Prepare for restful sleep',
        timeOfDay: 'evening',
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        estimatedDuration: 45,
        steps: [
          { id: '1', title: 'Turn off screens', duration: 5 },
          { id: '2', title: 'Light stretching or yoga', duration: 15 },
          { id: '3', title: 'Journal or gratitude practice', duration: 10 },
          { id: '4', title: 'Prepare tomorrow\'s clothes', duration: 5 },
          { id: '5', title: 'Herbal tea and reading', duration: 20 }
        ]
      },
      {
        name: 'Workout Routine',
        description: 'Full body strength training',
        timeOfDay: 'anytime',
        days: ['Monday', 'Wednesday', 'Friday'],
        estimatedDuration: 60,
        steps: [
          { id: '1', title: 'Warm-up cardio', duration: 10 },
          { id: '2', title: 'Upper body exercises', duration: 20 },
          { id: '3', title: 'Lower body exercises', duration: 20 },
          { id: '4', title: 'Core workout', duration: 10 },
          { id: '5', title: 'Cool down and stretch', duration: 10 }
        ]
      }
    ]
  }
}
