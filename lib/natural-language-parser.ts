// Natural Language Input Parser

export interface ParsedInput {
  type: 'task' | 'habit' | 'bill' | 'event' | 'note' | 'unknown'
  title: string
  date?: string
  time?: string
  amount?: number
  priority?: 'high' | 'medium' | 'low'
  category?: string
  description?: string
  confidence: number
}

export class NaturalLanguageParser {
  // Task patterns
  private static taskKeywords = ['task', 'todo', 'remind', 'remember', 'do', 'need to', 'have to', 'must']
  
  // Habit patterns
  private static habitKeywords = ['habit', 'daily', 'everyday', 'routine', 'practice']
  
  // Bill patterns
  private static billKeywords = ['bill', 'pay', 'payment', 'invoice', 'subscription', 'charge']
  
  // Event patterns
  private static eventKeywords = ['event', 'meeting', 'appointment', 'schedule', 'calendar', 'birthday', 'party']
  
  // Date patterns
  private static datePatterns = {
    today: /\b(today|tonight)\b/i,
    tomorrow: /\b(tomorrow)\b/i,
    nextWeek: /\bnext week\b/i,
    thisWeek: /\bthis week\b/i,
    monday: /\b(monday|mon)\b/i,
    tuesday: /\b(tuesday|tue|tues)\b/i,
    wednesday: /\b(wednesday|wed)\b/i,
    thursday: /\b(thursday|thu|thur|thurs)\b/i,
    friday: /\b(friday|fri)\b/i,
    saturday: /\b(saturday|sat)\b/i,
    sunday: /\b(sunday|sun)\b/i,
    inDays: /\bin (\d+) days?\b/i,
    onDate: /\bon (\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)\b/i,
  }
  
  // Time patterns
  private static timePatterns = {
    hourMinute: /\b(\d{1,2}):(\d{2})\s*(am|pm)?\b/i,
    hour: /\b(\d{1,2})\s*(am|pm)\b/i,
    at: /\bat (\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\b/i,
  }
  
  // Amount patterns
  private static amountPatterns = {
    dollar: /\$(\d+(?:\.\d{2})?)\b/,
    amount: /\bamount:?\s*\$?(\d+(?:\.\d{2})?)\b/i,
  }
  
  // Priority patterns
  private static priorityPatterns = {
    high: /\b(urgent|important|asap|critical|high priority|!!|!!!)\b/i,
    medium: /\b(medium|normal|moderate)\b/i,
    low: /\b(low|later|whenever|someday)\b/i,
  }

  static parse(input: string): ParsedInput {
    const lowerInput = input.toLowerCase()
    
    // Detect type
    const type = this.detectType(lowerInput)
    
    // Extract components
    const title = this.extractTitle(input, type)
    const date = this.extractDate(lowerInput)
    const time = this.extractTime(lowerInput)
    const amount = this.extractAmount(input)
    const priority = this.extractPriority(lowerInput)
    
    // Calculate confidence
    const confidence = this.calculateConfidence(type, { title, date, time, amount })
    
    return {
      type,
      title,
      date,
      time,
      amount,
      priority,
      confidence,
    }
  }
  
  private static detectType(input: string): ParsedInput['type'] {
    // Check for explicit type keywords
    if (this.taskKeywords.some(kw => input.includes(kw))) return 'task'
    if (this.habitKeywords.some(kw => input.includes(kw))) return 'habit'
    if (this.billKeywords.some(kw => input.includes(kw))) return 'bill'
    if (this.eventKeywords.some(kw => input.includes(kw))) return 'event'
    
    // Heuristics based on content
    if (this.amountPatterns.dollar.test(input)) return 'bill'
    if (this.datePatterns.today.test(input) || this.timePatterns.at.test(input)) return 'event'
    
    // Default to task
    return 'task'
  }
  
  private static extractTitle(input: string, type: string): string {
    let title = input
    
    // Remove type prefix if present
    const typeWords = [...this.taskKeywords, ...this.habitKeywords, ...this.billKeywords, ...this.eventKeywords]
    typeWords.forEach(word => {
      const regex = new RegExp(`^(add |create |new )?${word}:?\\s+`, 'i')
      title = title.replace(regex, '')
    })
    
    // Remove date/time suffixes
    title = title.replace(/(tomorrow|today|tonight|next week|this week)/gi, '').trim()
    title = title.replace(/\bat (\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\b/gi, '').trim()
    title = title.replace(/\bon (\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)\b/gi, '').trim()
    
    // Remove priority indicators
    title = title.replace(/\(urgent\)|\(important\)|!!|!!!/gi, '').trim()
    
    // Capitalize first letter
    title = title.charAt(0).toUpperCase() + title.slice(1)
    
    return title || 'Untitled'
  }
  
  private static extractDate(input: string): string | undefined {
    const today = new Date()
    
    // Check "today"
    if (this.datePatterns.today.test(input)) {
      return today.toISOString().split('T')[0]
    }
    
    // Check "tomorrow"
    if (this.datePatterns.tomorrow.test(input)) {
      const tomorrow = new Date(today)
      tomorrow.setDate(today.getDate() + 1)
      return tomorrow.toISOString().split('T')[0]
    }
    
    // Check "next week"
    if (this.datePatterns.nextWeek.test(input)) {
      const nextWeek = new Date(today)
      nextWeek.setDate(today.getDate() + 7)
      return nextWeek.toISOString().split('T')[0]
    }
    
    // Check specific day of week
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    for (let i = 0; i < days.length; i++) {
      const dayPattern = this.datePatterns[days[i] as keyof typeof this.datePatterns]
      if (dayPattern && dayPattern.test(input)) {
        const targetDay = i
        const currentDay = today.getDay()
        let daysToAdd = targetDay - currentDay
        if (daysToAdd <= 0) daysToAdd += 7 // Next occurrence
        const targetDate = new Date(today)
        targetDate.setDate(today.getDate() + daysToAdd)
        return targetDate.toISOString().split('T')[0]
      }
    }
    
    // Check "in X days"
    const inDaysMatch = input.match(this.datePatterns.inDays)
    if (inDaysMatch) {
      const days = parseInt(inDaysMatch[1])
      const targetDate = new Date(today)
      targetDate.setDate(today.getDate() + days)
      return targetDate.toISOString().split('T')[0]
    }
    
    // Check explicit date
    const dateMatch = input.match(this.datePatterns.onDate)
    if (dateMatch) {
      try {
        const date = new Date(dateMatch[1])
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0]
        }
      } catch (e) {
        // Invalid date
      }
    }
    
    return undefined
  }
  
  private static extractTime(input: string): string | undefined {
    // Check "at HH:MM AM/PM"
    const atMatch = input.match(this.timePatterns.at)
    if (atMatch) {
      return this.normalizeTime(atMatch[1])
    }
    
    // Check "HH:MM AM/PM"
    const timeMatch = input.match(this.timePatterns.hourMinute)
    if (timeMatch) {
      let hour = parseInt(timeMatch[1])
      const minute = timeMatch[2]
      const period = timeMatch[3]?.toLowerCase()
      
      if (period === 'pm' && hour !== 12) hour += 12
      if (period === 'am' && hour === 12) hour = 0
      
      return `${hour.toString().padStart(2, '0')}:${minute}`
    }
    
    // Check "H AM/PM"
    const hourMatch = input.match(this.timePatterns.hour)
    if (hourMatch) {
      let hour = parseInt(hourMatch[1])
      const period = hourMatch[2].toLowerCase()
      
      if (period === 'pm' && hour !== 12) hour += 12
      if (period === 'am' && hour === 12) hour = 0
      
      return `${hour.toString().padStart(2, '0')}:00`
    }
    
    return undefined
  }
  
  private static normalizeTime(timeStr: string): string {
    const match = timeStr.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i)
    if (!match) return timeStr
    
    let hour = parseInt(match[1])
    const minute = match[2] || '00'
    const period = match[3]?.toLowerCase()
    
    if (period === 'pm' && hour !== 12) hour += 12
    if (period === 'am' && hour === 12) hour = 0
    
    return `${hour.toString().padStart(2, '0')}:${minute}`
  }
  
  private static extractAmount(input: string): number | undefined {
    // Check $XX.XX format
    const dollarMatch = input.match(this.amountPatterns.dollar)
    if (dollarMatch) {
      return parseFloat(dollarMatch[1])
    }
    
    // Check "amount: XX" format
    const amountMatch = input.match(this.amountPatterns.amount)
    if (amountMatch) {
      return parseFloat(amountMatch[1])
    }
    
    return undefined
  }
  
  private static extractPriority(input: string): 'high' | 'medium' | 'low' | undefined {
    if (this.priorityPatterns.high.test(input)) return 'high'
    if (this.priorityPatterns.medium.test(input)) return 'medium'
    if (this.priorityPatterns.low.test(input)) return 'low'
    return undefined
  }
  
  private static calculateConfidence(
    type: string, 
    extracted: { title: string; date?: string; time?: string; amount?: number }
  ): number {
    let confidence = 50 // Base confidence
    
    // Increase confidence based on what was successfully extracted
    if (extracted.title && extracted.title !== 'Untitled') confidence += 20
    if (extracted.date) confidence += 15
    if (extracted.time) confidence += 10
    if (extracted.amount) confidence += 5
    if (type !== 'unknown') confidence += 10
    
    return Math.min(confidence, 100)
  }
  
  // Helper to generate examples
  static getExamples(): string[] {
    return [
      "Add task: Call dentist tomorrow at 2pm",
      "Pay electric bill $127.45 by Friday",
      "Meeting with John next Monday at 10am",
      "Start daily meditation habit",
      "Urgent: Submit report today",
      "Birthday party on 10/15 at 6pm",
      "Gym workout tomorrow morning",
      "Buy groceries $50 this weekend",
    ]
  }
}

export default NaturalLanguageParser








