/**
 * Service Worker for Push Notifications
 */

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installed')
  self.skipWaiting()
})

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activated')
  event.waitUntil(self.clients.claim())
})

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received')

  let data = {}
  if (event.data) {
    try {
      data = event.data.json()
    } catch (e) {
      data = { title: event.data.text() }
    }
  }

  const title = data.title || 'LifeHub Notification'
  const options = {
    body: data.message || data.body || '',
    icon: data.icon || '/icon-192x192.png',
    badge: '/icon-96x96.png',
    data: {
      url: data.action_url || data.url || '/',
      notificationId: data.id,
    },
    actions: data.actions || [],
    tag: data.tag || 'lifehub-notification',
    requireInteraction: data.priority === 'critical',
    vibrate: data.priority === 'critical' ? [200, 100, 200] : [100],
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  )
})

// Notification click event - handle user clicking on notification
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked')

  event.notification.close()

  const urlToOpen = event.notification.data?.url || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus()
        }
      }
      // If not, open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen)
      }
    })
  )
})

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('Service Worker: Notification closed')
})



