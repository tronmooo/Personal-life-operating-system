/**
 * Domain Entries Hook Tests
 * Tests all CRUD operations for domain entries across all domains
 */

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import {
  listDomainEntries,
  createDomainEntry,
  updateDomainEntry,
  deleteDomainEntry,
  normalizeDomainEntry,
} from '@/lib/hooks/use-domain-entries'
import type { Domain } from '@/types/domains'

// Mock Supabase client
jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createClientComponentClient: jest.fn(),
}))

const mockSupabaseClient = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(),
}

const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
}

describe('Domain Entries CRUD Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(createClientComponentClient as jest.Mock).mockReturnValue(mockSupabaseClient)
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })
  })

  describe('normalizeDomainEntry', () => {
    it('should normalize domain entry with all fields', () => {
      const now = new Date().toISOString()
      const entry = {
        id: 'id1',
        domain: 'health',
        title: 'Medical Checkup',
        description: 'Annual checkup',
        created_at: now,
        updated_at: now,
        metadata: { recordType: 'Medical', provider: 'Dr. Smith' },
      }

      const normalized = normalizeDomainEntry(entry)

      expect(normalized).toEqual({
        id: 'id1',
        domain: 'health',
        title: 'Medical Checkup',
        description: 'Annual checkup',
        createdAt: now,
        updatedAt: now,
        metadata: { recordType: 'Medical', provider: 'Dr. Smith' },
      })
    })

    it('should handle null description', () => {
      const entry = {
        id: 'id1',
        domain: 'health',
        title: 'Test',
        description: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {},
      }

      const normalized = normalizeDomainEntry(entry)
      expect(normalized.description).toBeUndefined()
    })

    it('should provide default dates if missing', () => {
      const entry = {
        id: 'id1',
        domain: 'health',
        title: 'Test',
        metadata: {},
      }

      const normalized = normalizeDomainEntry(entry)
      expect(normalized.createdAt).toBeTruthy()
      expect(normalized.updatedAt).toBeTruthy()
    })
  })

  describe('listDomainEntries', () => {
    const mockEntries = [
      {
        id: '1',
        domain: 'health',
        title: 'Entry 1',
        description: 'Desc 1',
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '2',
        domain: 'health',
        title: 'Entry 2',
        description: 'Desc 2',
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]

    it('should list all domain entries when no domain specified', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockEntries, error: null }),
      }
      mockSupabaseClient.from.mockReturnValue(mockQuery)

      const result = await listDomainEntries(mockSupabaseClient as any)

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('domain_entries_view')
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', mockUser.id)
      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('1')
    })

    it('should filter by domain when specified', async () => {
      const finalQuery = Promise.resolve({ data: mockEntries, error: null })
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn(function(this: any) {
          // First call (user_id) returns this, second call (domain) returns the promise
          if (this.eqCallCount === undefined) this.eqCallCount = 0
          this.eqCallCount++
          return this.eqCallCount === 1 ? this : finalQuery
        }),
        order: jest.fn().mockReturnThis(),
        eqCallCount: 0,
      }
      mockSupabaseClient.from.mockReturnValue(mockQuery)

      await listDomainEntries(mockSupabaseClient as any, 'health')

      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', mockUser.id)
      expect(mockQuery.eq).toHaveBeenCalledWith('domain', 'health')
    })

    it('should return empty array when not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      })

      const result = await listDomainEntries(mockSupabaseClient as any)

      expect(result).toEqual([])
    })

    it('should throw error on database error', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: null, error: new Error('DB error') }),
      }
      mockSupabaseClient.from.mockReturnValue(mockQuery)

      await expect(listDomainEntries(mockSupabaseClient as any)).rejects.toThrow('DB error')
    })
  })

  describe('createDomainEntry', () => {
    it('should create a new entry with all fields', async () => {
      const payload = {
        domain: 'health' as Domain,
        title: 'New Health Entry',
        description: 'Test description',
        metadata: { recordType: 'Medical' },
      }

      const mockInserted = {
        id: 'new-id',
        user_id: mockUser.id,
        ...payload,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockInserted, error: null }),
      }
      mockSupabaseClient.from.mockReturnValue(mockQuery)

      const result = await createDomainEntry(mockSupabaseClient as any, payload)

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('domain_entries')
      expect(mockQuery.insert).toHaveBeenCalledWith({
        domain: payload.domain,
        title: payload.title,
        description: payload.description,
        metadata: payload.metadata,
        user_id: mockUser.id,
      })
      expect(result.id).toBe('new-id')
      expect(result.title).toBe('New Health Entry')
    })

    it('should create entry with custom id if provided', async () => {
      const payload = {
        id: 'custom-id',
        domain: 'vehicles' as Domain,
        title: 'My Car',
        metadata: { make: 'Toyota' },
      }

      const mockInserted = {
        ...payload,
        user_id: mockUser.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockInserted, error: null }),
      }
      mockSupabaseClient.from.mockReturnValue(mockQuery)

      const result = await createDomainEntry(mockSupabaseClient as any, payload)

      expect(result.id).toBe('custom-id')
    })

    it('should throw error when not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      })

      const payload = {
        domain: 'health' as Domain,
        title: 'Test',
      }

      await expect(createDomainEntry(mockSupabaseClient as any, payload)).rejects.toThrow()
    })

    it('should throw error on database error', async () => {
      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: new Error('Insert failed') }),
      }
      mockSupabaseClient.from.mockReturnValue(mockQuery)

      const payload = {
        domain: 'health' as Domain,
        title: 'Test',
      }

      await expect(createDomainEntry(mockSupabaseClient as any, payload)).rejects.toThrow('Insert failed')
    })
  })

  describe('updateDomainEntry', () => {
    it('should update entry with provided fields', async () => {
      const payload = {
        id: 'entry-1',
        title: 'Updated Title',
        description: 'Updated description',
        metadata: { newField: 'value' },
      }

      const mockUpdated = {
        ...payload,
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
      mockSupabaseClient.from.mockReturnValue(mockQuery)

      const result = await updateDomainEntry(mockSupabaseClient as any, payload)

      expect(mockQuery.update).toHaveBeenCalledWith({
        title: payload.title,
        description: payload.description,
        metadata: payload.metadata,
      })
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'entry-1')
      expect(result.title).toBe('Updated Title')
    })

    it('should only update provided fields', async () => {
      const payload = {
        id: 'entry-1',
        title: 'New Title',
      }

      const mockUpdated = {
        domain: 'health',
        title: 'Updated Title',
        description: 'Updated description',
        metadata: { newField: 'value' },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockUpdated, error: null }),
      }
      mockSupabaseClient.from.mockReturnValue(mockQuery)

      await updateDomainEntry(mockSupabaseClient as any, payload)

      expect(mockQuery.update).toHaveBeenCalledWith({
        title: 'New Title',
      })
    })

    it('should throw error on database error', async () => {
      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: new Error('Update failed') }),
      }
      mockSupabaseClient.from.mockReturnValue(mockQuery)

      const payload = {
        id: 'entry-1',
        title: 'Test',
      }

      await expect(updateDomainEntry(mockSupabaseClient as any, payload)).rejects.toThrow('Update failed')
    })
  })

  describe('deleteDomainEntry', () => {
    it('should delete entry by id', async () => {
      const mockQuery: any = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn(),
      }
      // First .eq() call returns mockQuery, second .eq() call returns promise
      mockQuery.eq.mockReturnValueOnce(mockQuery).mockResolvedValueOnce({ error: null, count: 1 })
      mockSupabaseClient.from.mockReturnValue(mockQuery)

      await deleteDomainEntry(mockSupabaseClient as any, 'entry-1')

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('domain_entries')
      expect(mockQuery.delete).toHaveBeenCalled()
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'entry-1')
    })

    it('should throw error on database error', async () => {
      const mockQuery: any = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn(),
      }
      // First .eq() call returns mockQuery, second .eq() call returns promise with error
      mockQuery.eq.mockReturnValueOnce(mockQuery).mockResolvedValueOnce({ error: new Error('Delete failed') })
      mockSupabaseClient.from.mockReturnValue(mockQuery)

      await expect(deleteDomainEntry(mockSupabaseClient as any, 'entry-1')).rejects.toThrow('Delete failed')
    })
  })
})
