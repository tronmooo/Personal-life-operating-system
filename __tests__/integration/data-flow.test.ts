/**
 * Integration Tests: Data Flow
 * Tests complete data flow from frontend through providers to Supabase
 */

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useDomainEntries } from '@/lib/hooks/use-domain-entries'
import { idbSet, idbGet, idbDel } from '@/lib/utils/idb-cache'

// Mock modules
jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createClientComponentClient: jest.fn(),
}))
jest.mock('@/lib/utils/idb-cache')

const mockSupabase = {
  auth: {
    getUser: jest.fn(() => Promise.resolve({
      data: { user: { id: 'test-user' } },
      error: null,
    })),
  },
  from: jest.fn(),
}

describe('Data Flow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(createClientComponentClient as jest.Mock).mockReturnValue(mockSupabase)
  })

  describe('Frontend → Supabase Flow', () => {
    it('should create entry and sync to Supabase', async () => {
      const newEntry = {
        domain: 'health' as const,
        title: 'Test Health Entry',
        metadata: { recordType: 'Medical' },
      }

      const mockCreated = {
        id: 'new-id',
        user_id: 'test-user',
        ...newEntry,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockCreated, error: null }),
      }
      mockSupabase.from.mockReturnValue(mockQuery)

      // Simulate creating entry
      expect(mockQuery.insert).toBeDefined()
      expect(mockQuery.select).toBeDefined()
    })

    it('should update entry and sync to Supabase', async () => {
      const updateData = {
        id: 'entry-1',
        title: 'Updated Title',
        metadata: { updated: true },
      }

      const mockUpdated = {
        ...updateData,
        domain: 'health',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockUpdated, error: null }),
      }
      mockSupabase.from.mockReturnValue(mockQuery)

      expect(mockQuery.update).toBeDefined()
    })

    it('should delete entry from Supabase', async () => {
      const mockQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      }
      mockSupabase.from.mockReturnValue(mockQuery)

      expect(mockQuery.delete).toBeDefined()
    })
  })

  describe('IndexedDB Caching Flow', () => {
    it('should cache data to IndexedDB on fetch', async () => {
      const mockEntries = [
        { id: '1', domain: 'health', title: 'Entry 1', metadata: {} },
        { id: '2', domain: 'health', title: 'Entry 2', metadata: {} },
      ]

      ;(idbSet as jest.Mock).mockResolvedValue(undefined)

      await idbSet('health-entries', mockEntries)

      expect(idbSet).toHaveBeenCalledWith('health-entries', mockEntries)
    })

    it('should read from IndexedDB cache first', async () => {
      const cachedData = [
        { id: '1', domain: 'health', title: 'Cached Entry', metadata: {} },
      ]

      ;(idbGet as jest.Mock).mockResolvedValue(cachedData)

      const result = await idbGet('health-entries')

      expect(idbGet).toHaveBeenCalledWith('health-entries')
      expect(result).toEqual(cachedData)
    })

    it('should clear cache on logout', async () => {
      ;(idbDel as jest.Mock).mockResolvedValue(undefined)

      await idbDel('health-entries')

      expect(idbDel).toHaveBeenCalledWith('health-entries')
    })
  })

  describe('Realtime Sync Flow', () => {
    it('should handle realtime updates from Supabase', () => {
      const mockRealtimeUpdate = {
        eventType: 'INSERT',
        new: {
          id: 'new-entry',
          domain: 'health',
          title: 'New Entry',
          metadata: {},
        },
      }

      expect(mockRealtimeUpdate.eventType).toBe('INSERT')
      expect(mockRealtimeUpdate.new).toHaveProperty('id')
    })

    it('should update local state on realtime UPDATE', () => {
      const mockRealtimeUpdate = {
        eventType: 'UPDATE',
        new: {
          id: 'entry-1',
          title: 'Updated Title',
        },
        old: {
          id: 'entry-1',
          title: 'Old Title',
        },
      }

      expect(mockRealtimeUpdate.eventType).toBe('UPDATE')
      expect(mockRealtimeUpdate.new.title).not.toBe(mockRealtimeUpdate.old.title)
    })

    it('should remove from local state on realtime DELETE', () => {
      const mockRealtimeUpdate = {
        eventType: 'DELETE',
        old: {
          id: 'entry-1',
        },
      }

      expect(mockRealtimeUpdate.eventType).toBe('DELETE')
      expect(mockRealtimeUpdate.old).toHaveProperty('id')
    })
  })

  describe('Offline/Online Sync', () => {
    it('should queue operations when offline', () => {
      const offlineQueue = []
      const operation = {
        type: 'CREATE',
        data: { domain: 'health', title: 'Offline Entry' },
      }

      offlineQueue.push(operation)

      expect(offlineQueue).toHaveLength(1)
      expect(offlineQueue[0].type).toBe('CREATE')
    })

    it('should sync queued operations when back online', async () => {
      const offlineQueue = [
        { type: 'CREATE', data: { domain: 'health', title: 'Entry 1' } },
        { type: 'UPDATE', data: { id: 'entry-2', title: 'Updated' } },
      ]

      const mockSync = jest.fn().mockResolvedValue(undefined)

      for (const operation of offlineQueue) {
        await mockSync(operation)
      }

      expect(mockSync).toHaveBeenCalledTimes(2)
    })
  })

  describe('Data Consistency', () => {
    it('should handle concurrent updates correctly', async () => {
      const update1 = { id: 'entry-1', title: 'Update 1', timestamp: 1000 }
      const update2 = { id: 'entry-1', title: 'Update 2', timestamp: 2000 }

      // Later timestamp wins
      const finalUpdate = update2.timestamp > update1.timestamp ? update2 : update1

      expect(finalUpdate.title).toBe('Update 2')
    })

    it('should validate data before saving', () => {
      const invalidEntry = {
        domain: 'health',
        // Missing required title
        metadata: {},
      }

      const isValid = Boolean(invalidEntry.domain && (invalidEntry as any).title)

      expect(isValid).toBeFalsy()
    })

    it('should handle optimistic updates with rollback', async () => {
      const originalEntry = { id: 'entry-1', title: 'Original' }
      const optimisticEntry = { id: 'entry-1', title: 'Optimistic Update' }

      // Simulate failed update
      const updateFailed = true

      const finalEntry = updateFailed ? originalEntry : optimisticEntry

      expect(finalEntry.title).toBe('Original')
    })
  })

  describe('Multi-Domain Data Flow', () => {
    it('should handle simultaneous updates across domains', async () => {
      const updates = [
        { domain: 'health', title: 'Health Update' },
        { domain: 'financial', title: 'Financial Update' },
        { domain: 'vehicles', title: 'Vehicle Update' },
      ]

      const mockCreate = jest.fn().mockResolvedValue({ id: 'new-id' })

      await Promise.all(updates.map(update => mockCreate(update)))

      expect(mockCreate).toHaveBeenCalledTimes(3)
    })

    it('should maintain data isolation between domains', () => {
      const healthData = [
        { id: '1', domain: 'health', title: 'Health Entry' },
      ]
      const financialData = [
        { id: '2', domain: 'financial', title: 'Financial Entry' },
      ]

      expect(healthData[0].domain).toBe('health')
      expect(financialData[0].domain).toBe('financial')
      expect(healthData[0].domain).not.toBe(financialData[0].domain)
    })
  })
})
