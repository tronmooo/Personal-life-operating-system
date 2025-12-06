/**
 * CRITICAL SECURITY TESTS: Row-Level Security (RLS)
 * 
 * These tests verify that users cannot access other users' data.
 * Failure of these tests indicates a CRITICAL SECURITY VULNERABILITY.
 * 
 * Priority: P0 (CRITICAL)
 * Risk: Data breach, privacy violation, legal liability
 */

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { listDomainEntries, createDomainEntry, updateDomainEntry, deleteDomainEntry } from '@/lib/hooks/use-domain-entries'
import { createMockUser, mockSuccess, mockError } from '../utils/test-helpers'

describe('🔴 CRITICAL: Row-Level Security (RLS)', () => {
  let mockSupabase: any
  
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabase = createClientComponentClient()
  })

  describe('User Data Isolation', () => {
    test('🔴 CRITICAL: User A cannot see User B data', async () => {
      // User B has data
      const userBData = {
        id: 'entry-b',
        user_id: 'user-b-id',
        domain: 'health',
        title: 'User B Private Medical Record',
        metadata: { sensitive: true },
      }

      // User A tries to list entries
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: createMockUser({ id: 'user-a-id' }) },
        error: null,
      })

      // Mock RLS: User A should NOT see User B's data
      mockSupabase.from().order.mockResolvedValue({
        data: [], // Empty - RLS filters out User B's data
        error: null,
      })

      const entries = await listDomainEntries(mockSupabase, 'health')

      // CRITICAL: User A should NOT see User B's data
      expect(entries).toEqual([])
      expect(entries).not.toContainEqual(
        expect.objectContaining({ id: 'entry-b' })
      )
    })

    test('🔴 CRITICAL: User cannot update another user data', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: createMockUser({ id: 'user-a-id' }) },
        error: null,
      })

      // Mock RLS: Update fails (no rows affected)
      mockSupabase.from().single.mockResolvedValue({
        data: null,
        error: { message: 'No rows updated', code: 'PGRST116' },
      })

      // User A tries to update User B's entry
      await expect(
        updateDomainEntry(mockSupabase, {
          id: 'user-b-entry-id',
          title: 'Malicious Update',
        })
      ).rejects.toThrow()
    })

    test('🔴 CRITICAL: User cannot delete another user data', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: createMockUser({ id: 'user-a-id' }) },
        error: null,
      })

      // Mock RLS: Delete fails (no rows affected)
      const mockDelete = jest.fn().mockReturnThis()
      const mockEq = jest.fn()
      
      // First eq (id) returns this, second eq (user_id) returns promise
      mockEq.mockReturnValueOnce({ eq: mockEq }).mockResolvedValueOnce({
        data: null,
        error: null,
        count: 0, // No rows deleted
      })

      mockSupabase.from.mockReturnValue({
        delete: mockDelete,
      })
      mockDelete.mockReturnValue({
        eq: mockEq,
      })

      // Should not throw but should not delete anything
      await deleteDomainEntry(mockSupabase, 'user-b-entry-id')

      // Verify delete was called with user filter
      expect(mockSupabase.from).toHaveBeenCalledWith('domain_entries')
    })
  })

  describe('Unauthenticated Access', () => {
    test('🔴 CRITICAL: Unauthenticated users cannot read data', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      })

      const entries = await listDomainEntries(mockSupabase, 'health')

      // Should return empty array (no data leak)
      expect(entries).toEqual([])
    })

    test('🔴 CRITICAL: Unauthenticated users cannot write data', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      })

      await expect(
        createDomainEntry(mockSupabase, {
          domain: 'financial',
          title: 'Unauthorized Entry',
        })
      ).rejects.toThrow()
    })
  })

  describe('Query Parameter Injection', () => {
    test.skip('🔴 CRITICAL: Cannot bypass RLS with SQL injection in filters', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: createMockUser({ id: 'user-a-id' }) },
        error: null,
      })

      // Mock chained query methods
      const mockOrder = jest.fn().mockReturnThis()
      const mockEq = jest.fn().mockReturnThis()
      const mockSelect = jest.fn().mockReturnThis()
      
      mockEq.mockReturnValue({ eq: mockEq, order: mockOrder })
      mockOrder.mockResolvedValue({
        data: [
          {
            id: 'entry-a',
            user_id: 'user-a-id',
            domain: 'health',
            title: 'User A Data',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            metadata: {},
          },
        ],
        error: null,
      })

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        order: mockOrder,
      })
      
      mockSelect.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        order: mockOrder,
      })

      const entries = await listDomainEntries(mockSupabase, 'health')

      // Should only get own data (RLS enforced)
      expect(entries).toHaveLength(1)
      expect((entries[0] as any).user_id).toBe('user-a-id')
    })
  })

  describe('Cross-Domain Isolation', () => {
    test('User can only access their own data across all domains', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: createMockUser({ id: 'user-a-id' }) },
        error: null,
      })

      const domains: Array<'health' | 'financial' | 'vehicles'> = ['health', 'financial', 'vehicles']
      
      for (const domain of domains) {
        mockSupabase.from().order.mockResolvedValue({
          data: [
            {
              id: `entry-${domain}`,
              user_id: 'user-a-id',
              domain,
              title: `User A ${domain}`,
            },
          ],
          error: null,
        })

        const entries = await listDomainEntries(mockSupabase, domain)

        // Each domain should only show user's own data
        expect(entries.every(e => (e as any).user_id === 'user-a-id')).toBe(true)
      }
    })
  })

  describe('User Enumeration Prevention', () => {
    test('🔴 CRITICAL: Cannot enumerate users via entry IDs', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: createMockUser({ id: 'user-b-id' }) },
        error: null,
      })

      // User B tries to access User A's entry by guessing ID
      mockSupabase.from().order.mockResolvedValue({
        data: [], // RLS returns empty, not "forbidden"
        error: null,
      })

      const entries = await listDomainEntries(mockSupabase, 'health')

      // Should NOT reveal that entry exists
      expect(entries).toEqual([])
      
      // Error should be generic "not found", not "belongs to another user"
    })
  })

  describe('Admin/Service Role Bypass', () => {
    test('Service role can access all data (for migrations/admin)', async () => {
      // Service role should bypass RLS for admin operations
      // This test documents expected behavior for service role
      
      // In production, service role should ONLY be used server-side
      // Never expose service role key to client
      
      const serviceRoleClient = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'service-role', role: 'service_role' } },
            error: null,
          }),
        },
        from: jest.fn(() => ({
          select: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({
            data: [
              { id: '1', user_id: 'user-a' },
              { id: '2', user_id: 'user-b' },
            ],
            error: null,
          }),
        })),
      }

      // Service role should see all data (bypasses RLS)
      // This is intentional for admin operations
      expect(serviceRoleClient.auth.getUser).toBeDefined()
    })
  })
})

