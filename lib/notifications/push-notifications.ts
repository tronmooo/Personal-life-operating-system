/**
 * Web Push Notifications Support
 * Handles browser push notification subscriptions and sending
 */

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// VAPID Keys - Generate these with: npx web-push generate-vapid-keys
// Store these in environment variables in production
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''

export class PushNotificationManager {
  private supabase = createClientComponentClient()

  /**
   * Check if push notifications are supported in this browser
   */
  isSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window
  }

  /**
   * Check current notification permission status
   */
  getPermissionStatus(): NotificationPermission {
    return Notification.permission
  }

  /**
   * Request permission for push notifications
   */
  async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) {
      console.warn('Push notifications not supported in this browser')
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      return false
    }
  }

  /**
   * Subscribe to push notifications
   */
  async subscribe(userId: string): Promise<boolean> {
    if (!this.isSupported()) {
      console.warn('Push notifications not supported')
      return false
    }

    try {
      // Check permission
      if (Notification.permission !== 'granted') {
        const granted = await this.requestPermission()
        if (!granted) {
          return false
        }
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      })

      // Save subscription to database
      await this.saveSubscription(userId, subscription)

      console.log('✅ Successfully subscribed to push notifications')
      return true
    } catch (error) {
      console.error('Error subscribing to push notifications:', error)
      return false
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(userId: string): Promise<boolean> {
    try {
      const registration = await navigator.serviceWorker.getRegistration()
      if (!registration) return false

      const subscription = await registration.pushManager.getSubscription()
      if (!subscription) return false

      // Unsubscribe
      await subscription.unsubscribe()

      // Remove from database
      await this.removeSubscription(userId)

      console.log('✅ Successfully unsubscribed from push notifications')
      return true
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error)
      return false
    }
  }

  /**
   * Save push subscription to database
   */
  private async saveSubscription(
    userId: string,
    subscription: PushSubscription
  ): Promise<void> {
    await this.supabase
      .from('notification_settings')
      .upsert({
        user_id: userId,
        push_enabled: true,
        push_subscription: subscription.toJSON(),
      })
  }

  /**
   * Remove push subscription from database
   */
  private async removeSubscription(userId: string): Promise<void> {
    await this.supabase
      .from('notification_settings')
      .update({
        push_enabled: false,
        push_subscription: null,
      })
      .eq('user_id', userId)
  }

  /**
   * Convert VAPID key to Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  /**
   * Show a local notification (for testing)
   */
  async showLocalNotification(
    title: string,
    options?: NotificationOptions
  ): Promise<void> {
    if (!this.isSupported()) return

    if (Notification.permission === 'granted') {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration) {
        await registration.showNotification(title, {
          icon: '/icon-192x192.png',
          badge: '/icon-96x96.png',
          ...options,
        })
      } else {
        new Notification(title, options)
      }
    }
  }
}

/**
 * Singleton instance
 */
export const pushNotificationManager = new PushNotificationManager()



