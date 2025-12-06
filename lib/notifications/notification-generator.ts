/**
 * Notification Generator - Scans all domains and generates smart notifications
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { Notification } from '@/lib/types/notification-types'

export class NotificationGenerator {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Generate all notifications for a user by scanning their domains
   */
  async generateNotifications(userId: string): Promise<Notification[]> {
    console.log('Generating notifications for user:', userId)
    console.log('🔔 Generating notifications for user:', userId)
    
    const notifications: Omit<Notification, 'id' | 'created_at' | 'updated_at'>[] = []

    try {
      // Load domain data directly from Supabase (server-safe)
      const [insuranceEntries, vehicleEntries, healthEntries, homeEntries, relationshipEntries, billsRows] = await Promise.all([
        this.supabase.from('domain_entries_view').select('id, domain, title, metadata').eq('domain', 'insurance').eq('user_id', userId),
        this.supabase.from('domain_entries_view').select('id, domain, title, metadata').eq('domain', 'vehicles').eq('user_id', userId),
        this.supabase.from('domain_entries_view').select('id, domain, title, metadata').eq('domain', 'health').eq('user_id', userId),
        this.supabase.from('domain_entries_view').select('id, domain, title, metadata').eq('domain', 'home').eq('user_id', userId),
        this.supabase.from('domain_entries_view').select('id, domain, title, metadata').eq('domain', 'relationships').eq('user_id', userId),
        this.supabase.from('bills').select('*').eq('user_id', userId),
      ])

      const insurance = (insuranceEntries.data || []).map((e: any) => ({
        id: e.id,
        provider: e.metadata?.provider,
        type: e.metadata?.policyType,
        expiration_date: e.metadata?.expiryDate || e.metadata?.expirationDate,
      }))

      const vehicles = (vehicleEntries.data || []).map((e: any) => ({
        id: e.id,
        year: e.metadata?.year,
        make: e.metadata?.make,
        model: e.metadata?.model,
        registrationExpiration: e.metadata?.registrationExpiration || e.metadata?.registrationDate,
        nextServiceDate: e.metadata?.nextServiceDate,
      }))

      const health = (healthEntries.data || []).map((e: any) => ({
        id: e.id,
        type: e.metadata?.type || e.metadata?.itemType || e.metadata?.logType,
        itemType: e.metadata?.type || e.metadata?.itemType || e.metadata?.logType,
        date: e.metadata?.date,
        appointmentDate: e.metadata?.appointmentDate,
        doctor: e.metadata?.doctor,
        provider: e.metadata?.provider,
        medicationName: e.metadata?.medicationName || e.metadata?.name,
        name: e.metadata?.name || e.metadata?.medicationName,
        refillDate: e.metadata?.refillDate,
        description: e.metadata?.notes || e.title,
      }))

      const home = (homeEntries.data || []).map((e: any) => ({
        id: e.id,
        type: e.metadata?.itemType,
        title: e.title,
        name: e.title,
        dueDate: e.metadata?.dueDate,
      }))

      const relationships = (relationshipEntries.data || []).map((e: any) => ({
        id: e.id,
        name: e.title,
        birthday: e.metadata?.birthday,
        anniversaryDate: e.metadata?.anniversaryDate,
      }))

      const utilities = (billsRows.data || []).map((b: any) => ({
        id: b.id,
        name: b.title,
        company: b.category,
        amount: b.amount,
        dueDate: b.due_date,
      }))

      // Check Insurance
      notifications.push(...this.checkInsurance(insurance, userId))

      // Check Vehicles
      notifications.push(...this.checkVehicles(vehicles, userId))

      // Check Health (appointments, medications)
      notifications.push(...this.checkHealth(health, userId))

      // Check Bills
      notifications.push(...this.checkBills(utilities, userId))

      // Check Home Maintenance
      notifications.push(...this.checkHomeMaintenance(home, userId))

      // Check Personal Events (birthdays, anniversaries)
      notifications.push(...this.checkPersonalEvents(relationships, userId))

      // Check Documents (expiring documents across all domains)
      notifications.push(...await this.checkDocuments(userId))

      // Check Goals and Achievements
      notifications.push(...await this.checkGoals(userId))

      // Check Streaks and Milestones
      notifications.push(...await this.checkStreaks(userId))

      // Check Spending Anomalies
      notifications.push(...await this.checkSpendingAnomalies(userId))

      // Check Net Worth Changes
      notifications.push(...await this.checkNetWorthChanges(userId))

      // Insert notifications into database
      if (notifications.length > 0) {
        const { error } = await this.supabase
          .from('notifications')
          .insert(notifications)

        if (error) {
          console.error('❌ Error saving notifications:', error)
        } else {
          console.log(`✅ Generated ${notifications.length} notifications`)
        }
      } else {
        console.log('ℹ️ No new notifications to generate')
      }

      return notifications as Notification[]
    } catch (error) {
      console.error('❌ Error generating notifications:', error)
      return []
    }
  }

  /**
   * Check documents for expiring items
   */
  private async checkDocuments(userId: string): Promise<any[]> {
    const notifications: any[] = []
    const now = new Date()

    try {
      // Get documents with expiration dates
      const { data: documents, error } = await this.supabase
        .from('documents')
        .select('*')
        .eq('user_id', userId)
        .not('expiration_date', 'is', null)
        .gte('expiration_date', now.toISOString()) // Only future expirations
        .order('expiration_date', { ascending: true })

      if (error || !documents) return []

      for (const doc of documents) {
        const expirationDate = new Date(doc.expiration_date)
        const daysUntilExpiration = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

        // Expires within 7 days (Critical)
        if (daysUntilExpiration <= 7 && daysUntilExpiration >= 0) {
          notifications.push({
            user_id: userId,
            type: 'document_expiring',
            priority: 'critical',
            title: '🔴 Document Expiring Soon',
            message: `${doc.document_name || doc.file_name} expires in ${daysUntilExpiration} day${daysUntilExpiration !== 1 ? 's' : ''}!`,
            icon: '🔴',
            action_url: `/domains/${doc.domain}`,
            action_label: 'View Document',
            related_domain: doc.domain,
            related_id: doc.id,
            read: false,
            dismissed: false,
          })
        }
        // Expires within 30 days (High Priority)
        else if (daysUntilExpiration <= 30 && daysUntilExpiration > 7) {
          notifications.push({
            user_id: userId,
            type: 'document_expiring',
            priority: 'high',
            title: '🟠 Document Expiring',
            message: `${doc.document_name || doc.file_name} expires in ${daysUntilExpiration} days.`,
            icon: '🟠',
            action_url: `/domains/${doc.domain}`,
            action_label: 'View Document',
            related_domain: doc.domain,
            related_id: doc.id,
            read: false,
            dismissed: false,
          })
        }
        // Expires within 90 days (Medium Priority)
        else if (daysUntilExpiration <= 90 && daysUntilExpiration > 30) {
          notifications.push({
            user_id: userId,
            type: 'document_expiring',
            priority: 'medium',
            title: '🟡 Document Renewal Reminder',
            message: `${doc.document_name || doc.file_name} expires in ${daysUntilExpiration} days.`,
            icon: '🟡',
            action_url: `/domains/${doc.domain}`,
            action_label: 'View Document',
            related_domain: doc.domain,
            related_id: doc.id,
            read: false,
            dismissed: false,
          })
        }
      }
    } catch (error) {
      console.error('Error checking documents:', error)
    }

    return notifications
  }

  /**
   * Check insurance for expiring policies
   */
  private checkInsurance(insurance: any[], userId: string): any[] {
    const notifications: any[] = []
    const now = new Date()

    for (const policy of insurance) {
      if (!policy.expirationDate && !policy.expiration_date) continue

      const expirationDate = new Date(policy.expirationDate || policy.expiration_date)
      const daysUntilExpiration = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      // Already expired
      if (daysUntilExpiration < 0) {
        notifications.push({
          user_id: userId,
          type: 'insurance_expired',
          priority: 'critical',
          title: '🔴 Insurance Policy Expired',
          message: `Your ${policy.type || policy.coverageType} insurance with ${policy.provider} has expired!`,
          icon: '🔴',
          action_url: '/insurance',
          action_label: 'Renew Now',
          related_domain: 'insurance',
          related_id: policy.id,
          read: false,
          dismissed: false,
        })
      }
      // Expires within 7 days (Critical)
      else if (daysUntilExpiration <= 7) {
        notifications.push({
          user_id: userId,
          type: 'insurance_expiring_soon',
          priority: 'critical',
          title: '🔴 Insurance Expires Soon',
          message: `Your ${policy.type || policy.coverageType} insurance expires in ${daysUntilExpiration} day${daysUntilExpiration === 1 ? '' : 's'}!`,
          icon: '🔴',
          action_url: '/insurance',
          action_label: 'View Policy',
          related_domain: 'insurance',
          related_id: policy.id,
          read: false,
          dismissed: false,
        })
      }
      // Expires within 30 days (Important)
      else if (daysUntilExpiration <= 30) {
        notifications.push({
          user_id: userId,
          type: 'insurance_expiring_soon',
          priority: 'important',
          title: '🟡 Insurance Renewal Coming Up',
          message: `Your ${policy.type || policy.coverageType} insurance expires in ${daysUntilExpiration} days.`,
          icon: '🟡',
          action_url: '/insurance',
          action_label: 'View Policy',
          related_domain: 'insurance',
          related_id: policy.id,
          read: false,
          dismissed: false,
        })
      }
    }

    return notifications
  }

  /**
   * Check vehicles for registration and service
   */
  private checkVehicles(vehicles: any[], userId: string): any[] {
    const notifications: any[] = []
    const now = new Date()

    for (const vehicle of vehicles) {
      // Check registration
      if (vehicle.registrationExpiration) {
        const regDate = new Date(vehicle.registrationExpiration)
        const daysUntil = Math.ceil((regDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

        if (daysUntil < 0) {
          notifications.push({
            user_id: userId,
            type: 'vehicle_registration_overdue',
            priority: 'critical',
            title: '🔴 Vehicle Registration Overdue',
            message: `Registration for your ${vehicle.year} ${vehicle.make} ${vehicle.model} is overdue!`,
            icon: '🚗',
            action_url: '/vehicles',
            action_label: 'Renew Now',
            related_domain: 'vehicles',
            related_id: vehicle.id,
            read: false,
            dismissed: false,
          })
        } else if (daysUntil <= 30) {
          notifications.push({
            user_id: userId,
            type: 'vehicle_registration_expiring',
            priority: daysUntil <= 7 ? 'critical' : 'important',
            title: daysUntil <= 7 ? '🔴 Registration Expires Soon' : '🟡 Registration Renewal Due',
            message: `Registration for your ${vehicle.year} ${vehicle.make} ${vehicle.model} expires in ${daysUntil} days.`,
            icon: daysUntil <= 7 ? '🔴' : '🟡',
            action_url: '/vehicles',
            action_label: 'View Vehicle',
            related_domain: 'vehicles',
            related_id: vehicle.id,
            read: false,
            dismissed: false,
          })
        }
      }

      // Check service due
      if (vehicle.nextServiceDate) {
        const serviceDate = new Date(vehicle.nextServiceDate)
        const daysUntil = Math.ceil((serviceDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

        if (daysUntil <= 7 && daysUntil >= 0) {
          notifications.push({
            user_id: userId,
            type: 'vehicle_service_due',
            priority: 'important',
            title: '🟡 Vehicle Service Due',
            message: `${vehicle.year} ${vehicle.make} ${vehicle.model} is due for service in ${daysUntil} days.`,
            icon: '🔧',
            action_url: '/vehicles',
            action_label: 'Schedule Service',
            related_domain: 'vehicles',
            related_id: vehicle.id,
            read: false,
            dismissed: false,
          })
        }
      }
    }

    return notifications
  }

  /**
   * Check health items (appointments, medications)
   */
  private checkHealth(health: any[], userId: string): any[] {
    const notifications: any[] = []
    const now = new Date()

    for (const item of health) {
      // Check appointments
      if (item.type === 'appointment' || item.itemType === 'appointment') {
        const appointmentDate = new Date(item.date || item.appointmentDate)
        const hoursUntil = (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60)

        if (hoursUntil > 0 && hoursUntil <= 2) {
          notifications.push({
            user_id: userId,
            type: 'appointment_soon',
            priority: 'critical',
            title: '🔴 Appointment in 2 Hours',
            message: `${item.description || 'Appointment'} with ${item.doctor || item.provider || 'provider'} at ${appointmentDate.toLocaleTimeString()}`,
            icon: '🏥',
            action_url: '/health',
            action_label: 'View Details',
            related_domain: 'health',
            related_id: item.id,
            read: false,
            dismissed: false,
          })
        } else if (hoursUntil > 2 && hoursUntil <= 24) {
          notifications.push({
            user_id: userId,
            type: 'appointment_today',
            priority: 'important',
            title: '🟡 Appointment Tomorrow',
            message: `${item.description || 'Appointment'} with ${item.doctor || item.provider || 'provider'} at ${appointmentDate.toLocaleString()}`,
            icon: '🏥',
            action_url: '/health',
            action_label: 'View Details',
            related_domain: 'health',
            related_id: item.id,
            read: false,
            dismissed: false,
          })
        }
      }

      // Check medication refills - CRITICAL if due within 7 days
      if (item.type === 'medication' || item.itemType === 'medication') {
        if (item.refillDate) {
          const refillDate = new Date(item.refillDate)
          const daysUntil = Math.ceil((refillDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

          // Alert for medications due within 7 days - ALL are critical priority
          if (daysUntil <= 7 && daysUntil >= 0) {
            const urgencyMessage = daysUntil === 0 
              ? 'needs refill TODAY' 
              : daysUntil === 1 
                ? 'needs refill TOMORROW'
                : `needs refill in ${daysUntil} days`
            
            notifications.push({
              user_id: userId,
              type: 'medication_refill_needed',
              priority: 'critical',
              title: '🔴 Medication Refill Alert',
              message: `${item.medicationName || item.name} ${urgencyMessage}`,
              icon: '💊',
              action_url: '/health',
              action_label: 'Request Refill',
              related_domain: 'health',
              related_id: item.id,
              read: false,
              dismissed: false,
            })
          }
        }
      }
    }

    return notifications
  }

  /**
   * Check bills for due dates
   */
  private checkBills(bills: any[], userId: string): any[] {
    const notifications: any[] = []
    const now = new Date()

    for (const bill of bills) {
      if (!bill.dueDate) continue

      const dueDate = new Date(bill.dueDate)
      const daysUntil = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      if (daysUntil < 0) {
        notifications.push({
          user_id: userId,
          type: 'bill_overdue',
          priority: 'critical',
          title: '🔴 Bill Past Due',
          message: `Your ${bill.name || bill.company} bill of $${bill.amount} is overdue!`,
          icon: '💵',
          action_url: '/utilities',
          action_label: 'Pay Now',
          related_domain: 'utilities',
          related_id: bill.id,
          read: false,
          dismissed: false,
        })
      } else if (daysUntil <= 3) {
        notifications.push({
          user_id: userId,
          type: 'bill_due_soon',
          priority: 'critical',
          title: '🔴 Bill Due Soon',
          message: `Your ${bill.name || bill.company} bill of $${bill.amount} is due in ${daysUntil} day${daysUntil === 1 ? '' : 's'}!`,
          icon: '💵',
          action_url: '/utilities',
          action_label: 'Pay Now',
          related_domain: 'utilities',
          related_id: bill.id,
          read: false,
          dismissed: false,
        })
      } else if (daysUntil <= 7) {
        notifications.push({
          user_id: userId,
          type: 'bill_due_soon',
          priority: 'important',
          title: '🟡 Upcoming Bill',
          message: `Your ${bill.name || bill.company} bill of $${bill.amount} is due in ${daysUntil} days.`,
          icon: '💵',
          action_url: '/utilities',
          action_label: 'View Bill',
          related_domain: 'utilities',
          related_id: bill.id,
          read: false,
          dismissed: false,
        })
      }
    }

    return notifications
  }

  /**
   * Check home maintenance tasks
   */
  private checkHomeMaintenance(home: any[], userId: string): any[] {
    const notifications: any[] = []
    const now = new Date()

    for (const task of home) {
      if (task.type === 'maintenance' && task.dueDate) {
        const dueDate = new Date(task.dueDate)
        const daysUntil = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

        if (daysUntil <= 7 && daysUntil >= 0) {
          notifications.push({
            user_id: userId,
            type: 'home_maintenance_due',
            priority: 'important',
            title: '🟡 Home Maintenance Due',
            message: `${task.title || task.name} is due in ${daysUntil} day${daysUntil === 1 ? '' : 's'}`,
            icon: '🏠',
            action_url: '/home',
            action_label: 'View Task',
            related_domain: 'home',
            related_id: task.id,
            read: false,
            dismissed: false,
          })
        }
      }
    }

    return notifications
  }

  /**
   * Check personal events (birthdays, anniversaries)
   */
  private checkPersonalEvents(relationships: any[], userId: string): any[] {
    const notifications: any[] = []
    const now = new Date()

    for (const person of relationships) {
      // Check birthday
      if (person.birthday) {
        const birthday = new Date(person.birthday)
        const thisYearBirthday = new Date(now.getFullYear(), birthday.getMonth(), birthday.getDate())
        const daysUntil = Math.ceil((thisYearBirthday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

        if (daysUntil >= 0 && daysUntil <= 3) {
          notifications.push({
            user_id: userId,
            type: 'birthday_upcoming',
            priority: 'important',
            title: '🎂 Birthday Coming Up',
            message: `${person.name}'s birthday is in ${daysUntil} day${daysUntil === 1 ? '' : 's'}!`,
            icon: '🎂',
            action_url: '/relationships',
            action_label: 'View Contact',
            related_domain: 'relationships',
            related_id: person.id,
            read: false,
            dismissed: false,
          })
        }
      }

      // Check anniversary
      if (person.anniversaryDate) {
        const anniversary = new Date(person.anniversaryDate)
        const thisYearAnniversary = new Date(now.getFullYear(), anniversary.getMonth(), anniversary.getDate())
        const daysUntil = Math.ceil((thisYearAnniversary.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

        if (daysUntil >= 0 && daysUntil <= 3) {
          notifications.push({
            user_id: userId,
            type: 'anniversary_upcoming',
            priority: 'important',
            title: '💝 Anniversary Coming Up',
            message: `${person.name}'s anniversary is in ${daysUntil} day${daysUntil === 1 ? '' : 's'}!`,
            icon: '💝',
            action_url: '/relationships',
            action_label: 'View Contact',
            related_domain: 'relationships',
            related_id: person.id,
            read: false,
            dismissed: false,
          })
        }
      }
    }

    return notifications
  }

  /**
   * Delete old dismissed notifications (cleanup)
   */
  async cleanupOldNotifications(userId: string, daysOld: number = 30): Promise<void> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    await this.supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId)
      .eq('dismissed', true)
      .lt('created_at', cutoffDate.toISOString())

    console.log(`🧹 Cleaned up old notifications older than ${daysOld} days`)
  }

  /**
   * Check goals for achievements and milestones
   */
  private async checkGoals(userId: string): Promise<any[]> {
    const notifications: any[] = []

    try {
      // Fetch goals from Supabase
      const { data: goals } = await this.supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .eq('completed', false)

      if (!goals) return notifications

      for (const goal of goals) {
        // Check if goal was recently achieved
        if (goal.currentValue >= goal.targetValue && !goal.notified) {
          notifications.push({
            user_id: userId,
            type: 'goal_achieved',
            priority: 'info',
            title: '🎉 Goal Achieved!',
            message: `Congratulations! You've achieved your goal: ${goal.title}`,
            icon: '🎉',
            action_url: '/goals',
            action_label: 'View Goals',
            related_domain: 'goals',
            related_id: goal.id,
            read: false,
            dismissed: false,
          })

          // Mark goal as notified
          await this.supabase
            .from('goals')
            .update({ notified: true })
            .eq('id', goal.id)
        }
      }
    } catch (error) {
      console.error('Error checking goals:', error)
    }

    return notifications
  }

  /**
   * Check for streak milestones
   */
  private async checkStreaks(userId: string): Promise<any[]> {
    const notifications: any[] = []

    try {
      // Check workout streak
      const { data: workouts } = await this.supabase
        .from('workouts')
        .select('date')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(30)

      if (workouts && workouts.length > 0) {
        const streak = this.calculateStreak(workouts.map(w => w.date))
        
        // Notify on milestone streaks (7, 30, 100 days)
        if ([7, 30, 100].includes(streak)) {
          notifications.push({
            user_id: userId,
            type: 'streak_milestone',
            priority: 'info',
            title: '🔥 Streak Milestone!',
            message: `Amazing! You've maintained a ${streak}-day workout streak!`,
            icon: '🔥',
            action_url: '/fitness',
            action_label: 'View Stats',
            related_domain: 'fitness',
            read: false,
            dismissed: false,
          })
        }
      }

      // Check meditation streak
      const { data: meditations } = await this.supabase
        .from('mindfulness_sessions')
        .select('date')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(30)

      if (meditations && meditations.length > 0) {
        const streak = this.calculateStreak(meditations.map(m => m.date))
        
        if ([7, 21, 100].includes(streak)) {
          notifications.push({
            user_id: userId,
            type: 'streak_milestone',
            priority: 'info',
            title: '🧘 Mindfulness Streak!',
            message: `Wonderful! You've meditated for ${streak} consecutive days!`,
            icon: '🧘',
            action_url: '/health',
            action_label: 'View Progress',
            related_domain: 'health',
            read: false,
            dismissed: false,
          })
        }
      }
    } catch (error) {
      console.error('Error checking streaks:', error)
    }

    return notifications
  }

  /**
   * Check for spending anomalies
   */
  private async checkSpendingAnomalies(userId: string): Promise<any[]> {
    const notifications: any[] = []

    try {
      // Get transactions from last 30 days
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data: transactions } = await this.supabase
        .from('transactions')
        .select('amount, date, category')
        .eq('user_id', userId)
        .gte('date', thirtyDaysAgo.toISOString())
        .eq('type', 'expense')

      if (!transactions || transactions.length < 10) return notifications

      // Calculate average daily spending
      const totalSpent = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)
      const avgDailySpending = totalSpent / 30

      // Check today's spending
      const today = new Date().toISOString().split('T')[0]
      const todayTransactions = transactions.filter(t => t.date.startsWith(today))
      const todaySpending = todayTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)

      // Alert if today's spending is 2x average
      if (todaySpending > avgDailySpending * 2 && todaySpending > 100) {
        notifications.push({
          user_id: userId,
          type: 'spending_spike',
          priority: 'important',
          title: '💸 Spending Alert',
          message: `You've spent $${todaySpending.toFixed(2)} today, which is ${Math.round(todaySpending / avgDailySpending)}x your daily average.`,
          icon: '💸',
          action_url: '/finance',
          action_label: 'View Transactions',
          related_domain: 'finance',
          read: false,
          dismissed: false,
        })
      }
    } catch (error) {
      console.error('Error checking spending anomalies:', error)
    }

    return notifications
  }

  /**
   * Check for net worth increases
   */
  private async checkNetWorthChanges(userId: string): Promise<any[]> {
    const notifications: any[] = []

    try {
      // Get net worth snapshots
      const { data: snapshots } = await this.supabase
        .from('net_worth_snapshots')
        .select('amount, date')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(2)

      if (!snapshots || snapshots.length < 2) return notifications

      const current = snapshots[0].amount
      const previous = snapshots[1].amount
      const increase = current - previous
      const percentChange = (increase / Math.abs(previous)) * 100

      // Notify on significant increases (>5% or >$5000)
      if (increase > 5000 || percentChange > 5) {
        notifications.push({
          user_id: userId,
          type: 'net_worth_increased',
          priority: 'info',
          title: '📈 Net Worth Increased!',
          message: `Great news! Your net worth increased by $${increase.toFixed(2)} (${percentChange.toFixed(1)}%)`,
          icon: '📈',
          action_url: '/finance',
          action_label: 'View Details',
          related_domain: 'finance',
          read: false,
          dismissed: false,
        })
      }
    } catch (error) {
      console.error('Error checking net worth changes:', error)
    }

    return notifications
  }

  /**
   * Calculate consecutive day streak
   */
  private calculateStreak(dates: string[]): number {
    if (dates.length === 0) return 0

    const sortedDates = dates
      .map(d => new Date(d))
      .sort((a, b) => b.getTime() - a.getTime())

    let streak = 1
    let currentDate = sortedDates[0]

    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = new Date(currentDate)
      prevDate.setDate(prevDate.getDate() - 1)

      const checkDate = new Date(sortedDates[i])
      
      // Check if dates are consecutive
      if (
        checkDate.getFullYear() === prevDate.getFullYear() &&
        checkDate.getMonth() === prevDate.getMonth() &&
        checkDate.getDate() === prevDate.getDate()
      ) {
        streak++
        currentDate = checkDate
      } else {
        break
      }
    }

    return streak
  }
}











