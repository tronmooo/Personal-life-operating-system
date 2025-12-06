'use client'

export interface ParsedCommand {
  action: string // The action to perform (e.g., 'log', 'add', 'query', 'schedule')
  domain: string // The domain (e.g., 'health', 'financial', 'vehicles')
  parameters: Record<string, any> // Action-specific parameters
  summary: string // Human-readable summary
  confidence: number // 0-1 confidence score
}

/**
 * Parse natural language command into structured action
 * Using OpenAI API for intelligent parsing
 */
export async function parseCommand(transcript: string): Promise<ParsedCommand | null> {
  try {
    // Call OpenAI API
    const response = await fetch('/api/voice/parse-command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript }),
    })

    if (!response.ok) {
      throw new Error('Failed to parse command')
    }

    const result = await response.json()
    return result.command
  } catch (error) {
    console.error('Command parsing error:', error)
    
    // Fallback to local parsing
    return parseCommandLocally(transcript)
  }
}

/**
 * Parse multiple commands from a single transcript
 * Splits on common delimiters and parses each separately
 */
export async function parseMultipleCommands(transcript: string): Promise<ParsedCommand[]> {
  const commands: ParsedCommand[] = []
  
  // Split on common delimiters
  // "and", "also", "plus", sentence endings
  const segments = transcript
    .split(/\s+and\s+|\s+also\s+|\s+plus\s+|\.\s+|,\s+and\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 0)

  console.log('📝 Parsing multiple commands from segments:', segments)

  // Parse each segment
  for (const segment of segments) {
    const parsed = await parseCommand(segment)
    if (parsed) {
      commands.push(parsed)
    }
  }

  return commands
}

/**
 * Local fallback parser (rule-based)
 * Uses regex patterns to identify commands
 */
function parseCommandLocally(transcript: string): ParsedCommand | null {
  const text = transcript.toLowerCase().trim()

  // Health Commands
  
  // Steps - multiple variations
  if (text.includes('steps') || text.includes('step')) {
    const stepsMatch = text.match(/(\d+)\s*steps?/)
    if (stepsMatch) {
      return {
        action: 'log',
        domain: 'health',
        parameters: {
          type: 'steps',
          value: parseInt(stepsMatch[1]),
          date: new Date().toISOString(),
        },
        summary: `Log ${stepsMatch[1]} steps`,
        confidence: 0.9,
      }
    }
  }

  // Weight - catch many variations
  if (text.includes('weight') || text.includes('weigh') || text.includes('pounds') || text.includes('lbs') || text.includes('kg')) {
    // Match patterns like:
    // "my weight is 175 pounds"
    // "my weight was 175 pounds"
    // "I weigh 175 pounds"
    // "weight 175"
    // "175 pounds"
    // "weighed 175 lbs"
    const weightMatch = text.match(/(?:weight|weigh|weighed)?\s*(?:is|was|at)?\s*(\d+(?:\.\d+)?)\s*(?:pounds?|lbs?|lb|kg|kilograms?)?/)
    if (weightMatch && weightMatch[1]) {
      const value = parseFloat(weightMatch[1])
      return {
        action: 'log',
        domain: 'health',
        parameters: {
          type: 'weight',
          value,
          unit: text.includes('kg') ? 'kg' : 'lbs',
          date: new Date().toISOString(),
        },
        summary: `Log weight: ${value} ${text.includes('kg') ? 'kg' : 'lbs'}`,
        confidence: 0.95,
      }
    }
  }

  // Water
  if (text.includes('water')) {
    const waterMatch = text.match(/(\d+)\s*(ounces?|oz|glasses?|ml|liters?)/)
    if (waterMatch) {
      const value = parseInt(waterMatch[1])
      const unit = waterMatch[2]
      return {
        action: 'log',
        domain: 'health',
        parameters: {
          type: 'water',
          value,
          unit: unit.includes('glass') ? 'glasses' : unit.includes('oz') ? 'ounces' : unit,
          date: new Date().toISOString(),
        },
        summary: `Add ${value} ${unit} of water`,
        confidence: 0.9,
      }
    }
  }

  if (text.includes('blood pressure') || text.includes('bp')) {
    const bpMatch = text.match(/(\d+)\s*(?:over|\/)\s*(\d+)/)
    if (bpMatch) {
      return {
        action: 'log',
        domain: 'health',
        parameters: {
          type: 'blood_pressure',
          systolic: parseInt(bpMatch[1]),
          diastolic: parseInt(bpMatch[2]),
          date: new Date().toISOString(),
        },
        summary: `Record blood pressure ${bpMatch[1]}/${bpMatch[2]}`,
        confidence: 0.9,
      }
    }
  }

  if (text.includes('log') && text.includes('meal')) {
    const calorieMatch = text.match(/(\d+)\s*calories?/)
    const mealText = text.replace(/log|meal|(\d+\s*calories?)/g, '').trim()
    
    return {
      action: 'log',
      domain: 'health',
      parameters: {
        type: 'meal',
        description: mealText || 'Meal',
        calories: calorieMatch ? parseInt(calorieMatch[1]) : null,
        date: new Date().toISOString(),
      },
      summary: `Log meal: ${mealText}${calorieMatch ? ` (${calorieMatch[1]} calories)` : ''}`,
      confidence: 0.8,
    }
  }

  // Task Commands
  if (text.includes('add task') || text.includes('add to-do') || text.includes('remind me')) {
    const taskText = text.replace(/add\s*(task|to-do)|remind me to/g, '').trim()
    return {
      action: 'add',
      domain: 'tasks',
      parameters: {
        title: taskText,
        created_at: new Date().toISOString(),
      },
      summary: `Add task: ${taskText}`,
      confidence: 0.85,
    }
  }

  // Vehicle Commands
  if (text.includes('schedule') && (text.includes('car') || text.includes('vehicle') || text.includes('service'))) {
    return {
      action: 'schedule',
      domain: 'vehicles',
      parameters: {
        type: 'service',
        description: text.replace(/schedule|car|vehicle|service/g, '').trim() || 'Car service',
        date: extractDate(text) || new Date().toISOString(),
      },
      summary: `Schedule car service`,
      confidence: 0.8,
    }
  }

  // Financial Query Commands
  if (text.includes('how much') && text.includes('spend')) {
    return {
      action: 'query',
      domain: 'financial',
      parameters: {
        type: 'expenses',
        period: extractPeriod(text) || 'this_month',
      },
      summary: `Query spending for ${extractPeriod(text) || 'this month'}`,
      confidence: 0.9,
    }
  }

  if (text.includes('net worth') || text.includes('networth')) {
    return {
      action: 'query',
      domain: 'financial',
      parameters: {
        type: 'net_worth',
      },
      summary: `Query net worth`,
      confidence: 0.95,
    }
  }

  // Appointment Query
  if (text.includes('show') && text.includes('appointment')) {
    return {
      action: 'query',
      domain: 'health',
      parameters: {
        type: 'appointments',
        period: extractPeriod(text) || 'upcoming',
      },
      summary: `Show appointments`,
      confidence: 0.9,
    }
  }

  // Navigation Commands
  if (text.includes('open') || text.includes('show') || text.includes('go to')) {
    if (text.includes('dashboard')) {
      return {
        action: 'navigate',
        domain: 'app',
        parameters: { path: '/command-center' },
        summary: 'Open dashboard',
        confidence: 0.95,
      }
    }
    if (text.includes('settings')) {
      return {
        action: 'navigate',
        domain: 'app',
        parameters: { path: '/settings' },
        summary: 'Open settings',
        confidence: 0.95,
      }
    }
    if (text.includes('analytics')) {
      return {
        action: 'navigate',
        domain: 'app',
        parameters: { path: '/analytics' },
        summary: 'Open analytics',
        confidence: 0.95,
      }
    }
  }

  // Could not parse
  return null
}

// Helper: Extract date from text
function extractDate(text: string): string | null {
  const tomorrow = text.match(/tomorrow/)
  const nextWeek = text.match(/next\s+week/)
  const nextDay = text.match(/next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i)

  if (tomorrow) {
    const date = new Date()
    date.setDate(date.getDate() + 1)
    return date.toISOString()
  }

  if (nextWeek) {
    const date = new Date()
    date.setDate(date.getDate() + 7)
    return date.toISOString()
  }

  if (nextDay) {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const targetDay = nextDay[1].toLowerCase()
    const targetDayIndex = days.indexOf(targetDay)
    const currentDayIndex = new Date().getDay()
    
    let daysToAdd = targetDayIndex - currentDayIndex
    if (daysToAdd <= 0) daysToAdd += 7
    
    const date = new Date()
    date.setDate(date.getDate() + daysToAdd)
    return date.toISOString()
  }

  return null
}

// Helper: Extract time period from text
function extractPeriod(text: string): string | null {
  if (text.includes('today')) return 'today'
  if (text.includes('this week')) return 'this_week'
  if (text.includes('this month')) return 'this_month'
  if (text.includes('this year')) return 'this_year'
  if (text.includes('last week')) return 'last_week'
  if (text.includes('last month')) return 'last_month'
  return null
}

// Example commands for reference
export const EXAMPLE_COMMANDS = [
  // Single commands
  'My weight is 175 pounds',
  'I weigh 175 pounds',
  'Log 10000 steps',
  'Add water 16 ounces',
  'Record blood pressure 120 over 80',
  'Log meal chicken salad 450 calories',
  'Add task call dentist',
  'Schedule car service next Tuesday',
  'How much did I spend this month?',
  "What's my net worth?",
  'Show my appointments',
  'Open dashboard',
  
  // Multiple commands (using "and")
  'My weight is 175 pounds and log 10000 steps',
  'Log 10000 steps and add water 16 ounces',
  'Add task buy groceries and schedule car service tomorrow',
]

