export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent'

export type NotificationDbPriority = 'info' | 'important' | 'critical'

export function mapDbPriorityToApp(priority: NotificationDbPriority | string | null | undefined): NotificationPriority {
  switch (priority) {
    case 'critical':
      return 'urgent'
    case 'important':
      return 'high'
    case 'info':
    case null:
    case undefined:
      return 'medium'
    default:
      return priority as NotificationPriority
  }
}

export function mapAppPriorityToDb(priority: NotificationPriority): NotificationDbPriority {
  switch (priority) {
    case 'urgent':
      return 'critical'
    case 'high':
      return 'important'
    case 'medium':
    case 'low':
    default:
      return 'info'
  }
}
export type NotificationCategory = 
  | 'bill'
  | 'appointment'
  | 'task'
  | 'maintenance'
  | 'health'
  | 'reminder'
  | 'goal'
  | 'alert'

export interface AppNotification {
  id: string
  title: string
  message: string
  category: NotificationCategory
  priority: NotificationPriority
  domain?: string
  itemId?: string
  dueDate?: Date
  isRead: boolean
  isCompleted: boolean
  createdAt: Date
  completedAt?: Date
}

// Backward compatibility - explicit type alias
export type Notification = AppNotification

export interface Reminder {
  id: string
  title: string
  description?: string
  domain: string
  itemId?: string
  category: NotificationCategory
  priority: NotificationPriority
  dueDate: Date
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
    interval: number // every X days/weeks/months/years
    endDate?: Date
  }
  isCompleted: boolean
  notificationOffset?: number // minutes before due date to notify
  createdAt: Date
  completedAt?: Date
}
