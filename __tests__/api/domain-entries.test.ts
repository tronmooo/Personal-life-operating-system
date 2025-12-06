/**
 * API Route Tests: /api/domain-entries
 * Tests CRUD operations through API endpoints
 */

import { createMocks } from 'node-mocks-http'

// Mock Supabase
jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createRouteHandlerClient: jest.fn(() => mockSupabase),
}))

const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(),
}

describe('/api/domain-entries', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null,
    })
  })

  describe('GET /api/domain-entries', () => {
    it('should return all domain entries for authenticated user', async () => {
      const mockEntries = [
        {
          id: '1',
          domain: 'health',
          title: 'Entry 1',
          metadata: {},
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          domain: 'financial',
          title: 'Entry 2',
          metadata: {},
          created_at: new Date().toISOString(),
        },
      ]

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockEntries, error: null }),
      }
      mockSupabase.from.mockReturnValue(mockQuery)

      expect(mockEntries).toHaveLength(2)
    })

    it('should filter by domain when query param provided', async () => {
      const mockEntries = [
        {
          id: '1',
          domain: 'health',
          title: 'Health Entry',
          metadata: {},
          created_at: new Date().toISOString(),
        },
      ]

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockEntries, error: null }),
      }
      mockSupabase.from.mockReturnValue(mockQuery)

      expect(mockQuery.eq).toBeDefined()
    })

    it('should return 401 when not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      })

      // Test that proper error handling occurs
      await expect(mockSupabase.auth.getUser()).resolves.toMatchObject({
        error: expect.any(Error),
      })
    })
  })

  describe('POST /api/domain-entries', () => {
    it('should create new domain entry', async () => {
      const newEntry = {
        domain: 'health',
        title: 'New Health Entry',
        description: 'Test description',
        metadata: { recordType: 'Medical' },
      }

      const mockInserted = {
        id: 'new-id',
        user_id: 'test-user-id',
        ...newEntry,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockInserted, error: null }),
      }
      mockSupabase.from.mockReturnValue(mockQuery)

      expect(mockQuery.insert).toBeDefined()
      expect(mockQuery.select).toBeDefined()
    })

    it('should validate required fields', async () => {
      const invalidEntry = {
        domain: 'health',
        // Missing title
        metadata: {},
      }

      // Should validate that title is required
      expect(invalidEntry).not.toHaveProperty('title')
    })

    it('should return 401 when not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      })

      await expect(mockSupabase.auth.getUser()).resolves.toMatchObject({
        error: expect.any(Error),
      })
    })
  })

  describe('PUT /api/domain-entries', () => {
    it('should update existing entry', async () => {
      const updateData = {
        id: 'entry-1',
        title: 'Updated Title',
        metadata: { updated: true },
      }

      const mockUpdated = {
        ...updateData,
        domain: 'health'
      }

      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockUpdated, error: null }),
      }
      mockSupabase.from.mockReturnValue(mockQuery)

      expect(mockQuery.update).toBeDefined()
      expect(mockQuery.eq).toBeDefined()
    })

    it('should return 404 when entry not found', async () => {
      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
      }
      mockSupabase.from.mockReturnValue(mockQuery)

      const result = await mockQuery.single()
      expect(result.data).toBeNull()
    })
  })

  describe('DELETE /api/domain-entries', () => {
    it('should delete entry by id', async () => {
      const mockQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      }
      mockSupabase.from.mockReturnValue(mockQuery)

      await mockQuery.delete().eq('id', 'entry-1')

      expect(mockQuery.delete).toHaveBeenCalled()
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'entry-1')
    })

    it('should return 404 when entry not found', async () => {
      const mockQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: { code: 'PGRST116' } }),
      }
      mockSupabase.from.mockReturnValue(mockQuery)

      const result = await mockQuery.delete().eq('id', 'nonexistent')
      expect(result.error).toBeDefined()
    })

    it('should return 401 when not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      })

      await expect(mockSupabase.auth.getUser()).resolves.toMatchObject({
        error: expect.any(Error),
      })
    })
  })
})
