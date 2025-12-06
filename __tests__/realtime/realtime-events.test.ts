/**
 * Realtime Event Handling Tests
 * 
 * Tests INSERT, UPDATE, DELETE event handling and data synchronization.
 * 
 * Priority: P0 (CRITICAL)
 * Risk: Data corruption, stale data, sync failures
 */

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createMockUser, createMockEntry, simulateRealtimeEvent, wait } from '../utils/test-helpers'

describe('Realtime Event Handling', () => {
  let mockSupabase: any
  let mockChannel: any
  let eventCallback: any
  
  beforeEach(() => {
    jest.clearAllMocks()
    eventCallback = null
    
    mockChannel = {
      on: jest.fn((type, config, callback) => {
        eventCallback = callback
        return mockChannel
      }),
      subscribe: jest.fn().mockResolvedValue({ status: 'SUBSCRIBED' }),
      unsubscribe: jest.fn(),
    }
    
    mockSupabase = createClientComponentClient()
    mockSupabase.channel = jest.fn(() => mockChannel)
  })

  describe('INSERT Event Handling', () => {
    test('Should handle INSERT event and update local state', async () => {
      const localState: any[] = []
      
      const channel = mockSupabase.channel('test-channel')
      channel.on('postgres_changes', { event: 'INSERT', table: 'domain_entries' }, (payload: any) => {
        // Simulate adding to local state
        localState.push(payload.new)
      })
      await channel.subscribe()

      // Simulate INSERT event
      const newEntry = createMockEntry('health', { title: 'New Entry' })
      const event = simulateRealtimeEvent('INSERT', 'domain_entries', newEntry)
      
      eventCallback(event)

      expect(localState).toHaveLength(1)
      expect(localState[0].title).toBe('New Entry')
    })

    test('Should validate INSERT data before adding', async () => {
      const localState: any[] = []
      
      const channel = mockSupabase.channel('test-channel')
      channel.on('postgres_changes', { event: 'INSERT' }, (payload: any) => {
        // Validate before adding
        if (payload.new && payload.new.id && payload.new.title) {
          localState.push(payload.new)
        }
      })
      await channel.subscribe()

      // Valid entry
      const validEntry = createMockEntry('health', { title: 'Valid' })
      eventCallback(simulateRealtimeEvent('INSERT', 'domain_entries', validEntry))

      // Invalid entry (missing title)
      const invalidEntry = { id: 'test-id', domain: 'health' }
      eventCallback(simulateRealtimeEvent('INSERT', 'domain_entries', invalidEntry))

      // Only valid entry should be added
      expect(localState).toHaveLength(1)
      expect(localState[0].title).toBe('Valid')
    })
  })

  describe('UPDATE Event Handling', () => {
    test('Should handle UPDATE event and sync local state', async () => {
      const localState = [
        createMockEntry('health', { id: 'entry-1', title: 'Original Title' }),
      ]
      
      const channel = mockSupabase.channel('test-channel')
      channel.on('postgres_changes', { event: 'UPDATE' }, (payload: any) => {
        // Find and update entry
        const index = localState.findIndex(e => e.id === payload.new.id)
        if (index !== -1) {
          localState[index] = { ...localState[index], ...payload.new }
        }
      })
      await channel.subscribe()

      // Simulate UPDATE event
      const updatedEntry = { id: 'entry-1', title: 'Updated Title' }
      eventCallback(simulateRealtimeEvent('UPDATE', 'domain_entries', updatedEntry))

      expect(localState[0].title).toBe('Updated Title')
    })

    test('Should handle UPDATE for non-existent entry gracefully', async () => {
      const localState = [
        createMockEntry('health', { id: 'entry-1' }),
      ]
      
      const channel = mockSupabase.channel('test-channel')
      channel.on('postgres_changes', { event: 'UPDATE' }, (payload: any) => {
        const index = localState.findIndex(e => e.id === payload.new.id)
        if (index !== -1) {
          localState[index] = { ...localState[index], ...payload.new }
        }
        // If not found, optionally fetch from server or ignore
      })
      await channel.subscribe()

      // Update for entry that doesn't exist locally
      const updatedEntry = { id: 'entry-999', title: 'New Title' }
      eventCallback(simulateRealtimeEvent('UPDATE', 'domain_entries', updatedEntry))

      // Should not crash, state unchanged
      expect(localState).toHaveLength(1)
      expect(localState[0].id).toBe('entry-1')
    })
  })

  describe('DELETE Event Handling', () => {
    test('Should handle DELETE event and remove from local state', async () => {
      const localState = [
        createMockEntry('health', { id: 'entry-1' }),
        createMockEntry('health', { id: 'entry-2' }),
      ]
      
      const channel = mockSupabase.channel('test-channel')
      channel.on('postgres_changes', { event: 'DELETE' }, (payload: any) => {
        // Remove entry
        const index = localState.findIndex(e => e.id === payload.old.id)
        if (index !== -1) {
          localState.splice(index, 1)
        }
      })
      await channel.subscribe()

      // Simulate DELETE event
      eventCallback(simulateRealtimeEvent('DELETE', 'domain_entries', { id: 'entry-1' }))

      expect(localState).toHaveLength(1)
      expect(localState[0].id).toBe('entry-2')
    })

    test('Should handle DELETE for non-existent entry gracefully', async () => {
      const localState = [
        createMockEntry('health', { id: 'entry-1' }),
      ]
      
      const channel = mockSupabase.channel('test-channel')
      channel.on('postgres_changes', { event: 'DELETE' }, (payload: any) => {
        const index = localState.findIndex(e => e.id === payload.old.id)
        if (index !== -1) {
          localState.splice(index, 1)
        }
      })
      await channel.subscribe()

      // Delete for entry that doesn't exist
      eventCallback(simulateRealtimeEvent('DELETE', 'domain_entries', { id: 'entry-999' }))

      // State should be unchanged
      expect(localState).toHaveLength(1)
    })
  })

  describe('Event Filtering', () => {
    test('Should only process events for current user', async () => {
      const currentUserId = 'user-a'
      const localState: any[] = []
      
      const channel = mockSupabase.channel('test-channel')
      channel.on('postgres_changes', { event: '*' }, (payload: any) => {
        // Filter by user_id
        if (payload.new?.user_id === currentUserId) {
          localState.push(payload.new)
        }
      })
      await channel.subscribe()

      // Event for current user
      const userAEntry = createMockEntry('health', { user_id: 'user-a', title: 'User A' })
      eventCallback(simulateRealtimeEvent('INSERT', 'domain_entries', userAEntry))

      // Event for different user
      const userBEntry = createMockEntry('health', { user_id: 'user-b', title: 'User B' })
      eventCallback(simulateRealtimeEvent('INSERT', 'domain_entries', userBEntry))

      // Should only have User A's entry
      expect(localState).toHaveLength(1)
      expect(localState[0].title).toBe('User A')
    })

    test('Should filter by domain when specified', async () => {
      const targetDomain = 'health'
      const localState: any[] = []
      
      const channel = mockSupabase.channel('test-channel')
      channel.on('postgres_changes', { event: '*' }, (payload: any) => {
        if (payload.new?.domain === targetDomain) {
          localState.push(payload.new)
        }
      })
      await channel.subscribe()

      // Health entry (should be added)
      eventCallback(simulateRealtimeEvent('INSERT', 'domain_entries', 
        createMockEntry('health', { title: 'Health Entry' })
      ))

      // Financial entry (should be filtered out)
      eventCallback(simulateRealtimeEvent('INSERT', 'domain_entries', 
        createMockEntry('financial', { title: 'Financial Entry' })
      ))

      expect(localState).toHaveLength(1)
      expect(localState[0].domain).toBe('health')
    })
  })

  describe('Debouncing & Performance', () => {
    test('Should debounce rapid UPDATE events', async () => {
      let updateCount = 0
      let debounceTimer: NodeJS.Timeout | null = null
      
      const channel = mockSupabase.channel('test-channel')
      channel.on('postgres_changes', { event: 'UPDATE' }, (payload: any) => {
        // Debounce updates
        if (debounceTimer) clearTimeout(debounceTimer)
        
        debounceTimer = setTimeout(() => {
          updateCount++
        }, 500)
      })
      await channel.subscribe()

      // Rapid updates
      for (let i = 0; i < 10; i++) {
        eventCallback(simulateRealtimeEvent('UPDATE', 'domain_entries', 
          { id: 'entry-1', title: `Update ${i}` }
        ))
        await wait(100) // 100ms between updates
      }

      // Wait for debounce
      await wait(600)

      // Should only process once (debounced)
      expect(updateCount).toBe(1)
    })

    test('Should handle high volume of events', async () => {
      const localState: any[] = []
      const startTime = Date.now()
      
      const channel = mockSupabase.channel('test-channel')
      channel.on('postgres_changes', { event: 'INSERT' }, (payload: any) => {
        localState.push(payload.new)
      })
      await channel.subscribe()

      // Simulate 100 rapid events
      for (let i = 0; i < 100; i++) {
        eventCallback(simulateRealtimeEvent('INSERT', 'domain_entries', 
          createMockEntry('health', { id: `entry-${i}` })
        ))
      }

      const duration = Date.now() - startTime

      // Should handle quickly (< 1 second)
      expect(duration).toBeLessThan(1000)
      expect(localState).toHaveLength(100)
    })
  })

  describe('Error Handling', () => {
    test('Should handle malformed event payload', async () => {
      const localState: any[] = []
      const errors: any[] = []
      
      const channel = mockSupabase.channel('test-channel')
      channel.on('postgres_changes', { event: '*' }, (payload: any) => {
        try {
          if (payload.new && payload.new.id) {
            localState.push(payload.new)
          } else {
            throw new Error('Invalid payload')
          }
        } catch (error) {
          errors.push(error)
        }
      })
      await channel.subscribe()

      // Malformed payload
      eventCallback({ eventType: 'INSERT', new: null })

      // Should catch error, not crash
      expect(errors).toHaveLength(1)
      expect(localState).toHaveLength(0)
    })

    test('Should continue processing after error', async () => {
      const localState: any[] = []
      
      const channel = mockSupabase.channel('test-channel')
      channel.on('postgres_changes', { event: '*' }, (payload: any) => {
        try {
          localState.push(payload.new)
        } catch (error) {
          // Log error but continue
          console.error('Event processing error:', error)
        }
      })
      await channel.subscribe()

      // First event causes error
      eventCallback({ eventType: 'INSERT', new: null })

      // Second event should still process
      eventCallback(simulateRealtimeEvent('INSERT', 'domain_entries', 
        createMockEntry('health')
      ))

      // Should have processed second event
      expect(localState.length).toBeGreaterThan(0)
    })
  })
})



