/**
 * User Context Builder
 * Aggregates all user data for AI context
 */

import { createClient } from '@supabase/supabase-js'
import type { Domain } from '@/types/domains'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export interface UserContext {
  user: {
    id: string
    name: string
    email: string
    phone?: string
  }
  location?: {
    latitude: number
    longitude: number
    city: string
    state: string
    address?: string
    zipCode?: string
  }
  preferences: {
    maxBudget?: number
    preferredRadius?: number
    communicationStyle?: string
    timezone?: string
    favoriteBrands?: string[]
    dietaryRestrictions?: string[]
    allergies?: string[]
  }
  domains: {
    financial?: any[]
    health?: any[]
    vehicles?: any[]
    home?: any[]
    pets?: any[]
    insurance?: any[]
    relationships?: any[]
    [key: string]: any
  }
  recentActivity: {
    tasks?: any[]
    bills?: any[]
    events?: any[]
    habits?: any[]
  }
  summary?: string
}

export class UserContextBuilder {
  private supabase: ReturnType<typeof createClient>

  constructor() {
    this.supabase = createClient(supabaseUrl, supabaseKey)
  }

  /**
   * Build complete user context
   */
  async buildFullContext(userId: string): Promise<UserContext> {
    const [
      userData,
      location,
      settings,
      domainData,
      tasks,
      bills,
      events
    ] = await Promise.all([
      this.getUserData(userId),
      this.getUserLocation(userId),
      this.getUserPreferences(userId),
      this.getDomainData(userId),
      this.getTasks(userId),
      this.getBills(userId),
      this.getEvents(userId)
    ])

    const context: UserContext = {
      user: userData,
      location,
      preferences: settings,
      domains: domainData,
      recentActivity: {
        tasks,
        bills,
        events
      }
    }

    return context
  }

  /**
   * Build context for specific intent
   */
  async buildContextForIntent(
    userId: string, 
    intent: string
  ): Promise<UserContext> {
    const baseContext = await this.buildFullContext(userId)

    // Focus on relevant domains based on intent
    const relevantDomains = this.getRelevantDomains(intent)
    
    // Filter domain data to only include relevant ones
    const filteredDomains: Record<string, any> = {}
    for (const domain of relevantDomains) {
      if (baseContext.domains[domain]) {
        filteredDomains[domain] = baseContext.domains[domain]
      }
    }

    return {
      ...baseContext,
      domains: filteredDomains
    }
  }

  /**
   * Create concise summary for AI (token optimization)
   */
  async createSummary(context: UserContext): Promise<string> {
    const parts: string[] = []

    // User basics
    parts.push(`User: ${context.user.name}`)
    
    // Location
    if (context.location) {
      parts.push(`Location: ${context.location.city}, ${context.location.state}`)
    }

    // Budget
    if (context.preferences.maxBudget) {
      parts.push(`Max Budget: $${context.preferences.maxBudget}`)
    }

    // Vehicles
    if (context.domains.vehicles && context.domains.vehicles.length > 0) {
      const vehicle = context.domains.vehicles[0]
      const meta = vehicle.metadata || {}
      parts.push(`Vehicle: ${meta.year} ${meta.make} ${meta.model} (${meta.mileage || 0} miles)`)
    }

    // Dietary restrictions
    if (context.preferences.dietaryRestrictions && context.preferences.dietaryRestrictions.length > 0) {
      parts.push(`Diet: ${context.preferences.dietaryRestrictions.join(', ')}`)
    }

    // Allergies
    if (context.preferences.allergies && context.preferences.allergies.length > 0) {
      parts.push(`Allergies: ${context.preferences.allergies.join(', ')}`)
    }

    return parts.join(' | ')
  }

  /**
   * Get user data
   */
  private async getUserData(userId: string) {
    const { data: user } = await this.supabase.auth.admin.getUserById(userId)
    
    const { data: settings } = await this.supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle() as { data: any }

    return {
      id: userId,
      name: settings?.full_name || user?.user?.email?.split('@')[0] || 'User',
      email: user?.user?.email || '',
      phone: settings?.phone || user?.user?.phone
    }
  }

  /**
   * Get user location
   */
  private async getUserLocation(userId: string) {
    const { data } = await this.supabase
      .from('user_locations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle() as { data: any }

    if (!data) return undefined

    return {
      latitude: data.latitude,
      longitude: data.longitude,
      city: data.city,
      state: data.state,
      address: data.address,
      zipCode: data.zip_code
    }
  }

  /**
   * Get user preferences
   */
  private async getUserPreferences(userId: string) {
    const { data } = await this.supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle() as { data: any }

    return {
      maxBudget: data?.default_max_budget || 200,
      preferredRadius: data?.default_search_radius || 15,
      communicationStyle: data?.communication_style || 'professional',
      timezone: data?.timezone || 'America/Los_Angeles',
      favoriteBrands: data?.favorite_brands || [],
      dietaryRestrictions: data?.dietary_restrictions || [],
      allergies: data?.allergies || []
    }
  }

  /**
   * Get domain data
   */
  private async getDomainData(userId: string) {
    const { data } = await this.supabase
      .from('domain_entries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }) as { data: any[] | null }

    const domains: Record<string, any[]> = {}
    
    for (const entry of data || []) {
      if (!domains[entry.domain]) {
        domains[entry.domain] = []
      }
      domains[entry.domain].push(entry)
    }

    return domains
  }

  /**
   * Get tasks
   */
  private async getTasks(userId: string) {
    const { data } = await this.supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('completed', false)
      .order('due_date', { ascending: true, nullsFirst: false })
      .limit(10)

    return data || []
  }

  /**
   * Get bills
   */
  private async getBills(userId: string) {
    const { data } = await this.supabase
      .from('bills')
      .select('*')
      .eq('user_id', userId)
      .gte('due_date', new Date().toISOString())
      .order('due_date', { ascending: true })
      .limit(10)

    return data || []
  }

  /**
   * Get events
   */
  private async getEvents(userId: string) {
    const { data } = await this.supabase
      .from('events')
      .select('*')
      .eq('user_id', userId)
      .gte('date', new Date().toISOString())
      .order('date', { ascending: true })
      .limit(10)

    return data || []
  }

  /**
   * Determine relevant domains for intent
   */
  private getRelevantDomains(intent: string): Domain[] {
    const intentLower = intent.toLowerCase()

    const mapping: Record<string, Domain[]> = {
      auto: ['vehicles', 'financial'],
      car: ['vehicles', 'financial'],
      vehicle: ['vehicles', 'financial'],
      oil: ['vehicles'],
      tire: ['vehicles'],
      
      food: ['health', 'financial'],
      restaurant: ['health', 'financial'],
      pizza: ['health', 'financial'],
      dinner: ['health', 'financial'],
      
      plumber: ['home', 'financial'],
      electrician: ['home', 'financial'],
      hvac: ['home', 'financial'],
      repair: ['home', 'financial'],
      
      doctor: ['health', 'insurance', 'financial'],
      dentist: ['health', 'insurance', 'financial'],
      appointment: ['health', 'insurance'],
      
      pet: ['pets', 'financial'],
      vet: ['pets', 'insurance', 'financial']
    }

    for (const [keyword, domains] of Object.entries(mapping)) {
      if (intentLower.includes(keyword)) {
        return domains
      }
    }

    // Default: include all core domains
    return ['financial', 'health', 'vehicles', 'home']
  }
}

// Singleton instance
export const userContextBuilder = new UserContextBuilder()

