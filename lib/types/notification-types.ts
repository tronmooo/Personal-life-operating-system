/**
 * Notification Types and Interfaces
 */

export type NotificationPriority = 'critical' | 'important' | 'info'

export type NotificationType =
  // Insurance
  | 'insurance_expiring_soon'
  | 'insurance_expired'
  | 'insurance_premium_due'
  
  // Vehicles
  | 'vehicle_registration_expiring'
  | 'vehicle_registration_overdue'
  | 'vehicle_service_due'
  
  // Health
  | 'medication_refill_needed'
  | 'appointment_soon'
  | 'appointment_today'
  
  // Bills
  | 'bill_due_soon'
  | 'bill_overdue'
  
  // Home
  | 'home_maintenance_due'
  
  // Personal
  | 'birthday_upcoming'
  | 'anniversary_upcoming'
  
  // Goals
  | 'goal_achieved'
  | 'streak_milestone'
  
  // Finance
  | 'spending_spike'
  | 'net_worth_increased'
  
  // Documents
  | 'document_uploaded'
  
  // General
  | 'weekly_summary'
  | 'insights_available'

export interface Notification {
  id: string
  user_id: string
  
  type: NotificationType
  priority: NotificationPriority
  
  title: string
  message: string
  icon?: string
  
  action_url?: string
  action_label?: string
  
  related_domain?: string
  related_id?: string
  
  read: boolean
  dismissed: boolean
  snoozed_until?: string
  
  metadata?: Record<string, any>
  
  created_at: string
  updated_at: string
}

export interface NotificationSettings {
  user_id: string
  
  push_enabled: boolean
  push_subscription?: any
  
  critical_enabled: boolean
  important_enabled: boolean
  info_enabled: boolean
  
  daily_digest_time: string
  weekly_summary_day: number
  
  quiet_hours_start?: string
  quiet_hours_end?: string
  
  created_at: string
  updated_at: string
}

export interface NotificationRule {
  type: NotificationType
  priority: NotificationPriority
  icon: string
  titleTemplate: (data: any) => string
  messageTemplate: (data: any) => string
  actionLabel?: string
  actionUrl?: (data: any) => string
  checkCondition: (data: any) => boolean
}






























