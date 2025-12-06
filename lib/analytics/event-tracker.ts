'use client'

import { createClientComponentClient } from '@/lib/supabase/browser-client'

export interface AnalyticsEvent {
  user_id: string
  event_type: string
  event_data: Record<string, any>
  timestamp: Date
}

export class EventTracker {
  private supabase = createClientComponentClient()
  private queue: AnalyticsEvent[] = []
  private batchInterval = 5000 // Send batch every 5 seconds
  private isProcessing = false

  constructor() {
    // Start batch processor
    if (typeof window !== 'undefined') {
      setInterval(() => this.processBatch(), this.batchInterval)
    }
  }

  /**
   * Track an event
   */
  async track(eventType: string, eventData: Record<string, any> = {}) {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()

      if (!user) {
        console.warn('Analytics event skipped: user not authenticated', { eventType })
        return
      }

      const event: AnalyticsEvent = {
        user_id: user.id,
        event_type: eventType,
        event_data: eventData,
        timestamp: new Date(),
      }

      // Add to queue
      this.queue.push(event)

      // If queue is large, process immediately
      if (this.queue.length >= 10) {
        this.processBatch()
      }
    } catch (error) {
      console.error('Failed to track event:', error)
    }
  }

  /**
   * Process queued events in batch
   */
  private async processBatch() {
    if (this.isProcessing || this.queue.length === 0) return

    this.isProcessing = true

    try {
      const events = [...this.queue]
      this.queue = []

      // Send to Supabase
      const { error } = await this.supabase
        .from('analytics_events')
        .insert(events)

      if (error) {
        console.error('Failed to send analytics:', error)
        // Re-queue on failure
        this.queue.unshift(...events)
      }
    } catch (error) {
      console.error('Batch processing failed:', error)
    } finally {
      this.isProcessing = false
    }
  }

}

// Singleton instance
export const analytics = new EventTracker()

// Helper functions for common events
export const trackEvent = {
  // Dashboard events
  dashboardView: (mode: 'standard' | 'customizable') =>
    analytics.track('dashboard_view', { mode }),

  layoutChanged: (layoutId: string, layoutName: string) =>
    analytics.track('layout_changed', { layout_id: layoutId, layout_name: layoutName }),

  cardInteraction: (cardId: string, action: 'view' | 'click' | 'expand') =>
    analytics.track('card_interaction', { card_id: cardId, action }),

  // Customization events
  layoutCreated: (layoutName: string, template: string) =>
    analytics.track('layout_created', { layout_name: layoutName, template }),

  cardCustomized: (cardId: string, property: string, value: any) =>
    analytics.track('card_customized', { card_id: cardId, property, value }),

  // Settings events
  settingChanged: (setting: string, value: any) =>
    analytics.track('setting_changed', { setting, value }),

  // Navigation events
  pageView: (path: string) =>
    analytics.track('page_view', { path }),

  // Goal events
  goalAchieved: (goalType: string, goalName: string) =>
    analytics.track('goal_achieved', { goal_type: goalType, goal_name: goalName }),
}

























