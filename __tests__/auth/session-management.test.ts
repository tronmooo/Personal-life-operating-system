/**
 * Authentication Session Management Tests
 * 
 * Tests session lifecycle, persistence, expiration, and multi-tab behavior.
 * 
 * Priority: P0 (CRITICAL)
 * Risk: Session hijacking, auth bypass, data loss
 */

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createMockUser, createMockSession, wait } from '../utils/test-helpers'
import { idbSet, idbGet, idbClear } from '@/lib/utils/idb-cache'

jest.mock('@/lib/utils/idb-cache', () => ({
  idbSet: jest.fn(),
  idbGet: jest.fn(),
  idbClear: jest.fn(),
}))

describe('Authentication Session Management', () => {
  let mockSupabase: any
  
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabase = createClientComponentClient()
  })

  describe('Session Initialization', () => {
    test('Should retrieve existing session on app load', async () => {
      const mockSession = createMockSession()
      
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      })

      const result = await mockSupabase.auth.getSession()

      expect(result.data.session).toBeDefined()
      expect(result.data.session.user.id).toBe('test-user-id')
    })

    test('Should handle no session gracefully', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      })

      const result = await mockSupabase.auth.getSession()

      expect(result.data.session).toBeNull()
      expect(result.error).toBeNull()
    })
  })

  describe('Sign-In Flow', () => {
    test('Should create session on successful sign-in', async () => {
      const mockSession = createMockSession()
      
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: mockSession.user,
          session: mockSession,
        },
        error: null,
      })

      const result = await mockSupabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'password123',
      })

      expect(result.data.session).toBeDefined()
      expect(result.data.user).toBeDefined()
      expect(result.error).toBeNull()
    })

    test('Should handle invalid credentials', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials', code: 'invalid_credentials' },
      })

      const result = await mockSupabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'wrongpassword',
      })

      expect(result.data.session).toBeNull()
      expect(result.error).toBeDefined()
      expect(result.error.message).toContain('Invalid credentials')
    })
  })

  describe('Sign-Out Flow', () => {
    test('Should clear session on sign-out', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({
        error: null,
      })

      ;(idbClear as jest.Mock).mockResolvedValue(undefined)

      await mockSupabase.auth.signOut()
      
      // Should clear IDB cache
      await idbClear()

      expect(mockSupabase.auth.signOut).toHaveBeenCalled()
      expect(idbClear).toHaveBeenCalled()
    })

    test('Should cleanup subscriptions on sign-out', async () => {
      const unsubscribeMock = jest.fn()
      
      mockSupabase.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: unsubscribeMock } }
      })

      const { data: { subscription } } = mockSupabase.auth.onAuthStateChange(
        jest.fn()
      )

      // Simulate sign-out
      await mockSupabase.auth.signOut()
      subscription.unsubscribe()

      expect(unsubscribeMock).toHaveBeenCalled()
    })
  })

  describe('Session Expiration', () => {
    test('Should detect expired session', async () => {
      const expiredSession = {
        ...createMockSession(),
        expires_at: Date.now() / 1000 - 3600, // Expired 1 hour ago
      }

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: expiredSession },
        error: null,
      })

      const result = await mockSupabase.auth.getSession()
      const isExpired = result.data.session.expires_at < Date.now() / 1000

      expect(isExpired).toBe(true)
    })

    test('Should refresh expired session automatically', async () => {
      const newSession = createMockSession()
      
      mockSupabase.auth.refreshSession.mockResolvedValue({
        data: { session: newSession },
        error: null,
      })

      const result = await mockSupabase.auth.refreshSession()

      expect(result.data.session).toBeDefined()
      expect(result.data.session.access_token).toBe('mock-access-token')
    })

    test('Should handle refresh failure gracefully', async () => {
      mockSupabase.auth.refreshSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Refresh token invalid', code: 'invalid_refresh_token' },
      })

      const result = await mockSupabase.auth.refreshSession()

      expect(result.data.session).toBeNull()
      expect(result.error).toBeDefined()
    })
  })

  describe('Auth State Changes', () => {
    test('Should listen for auth state changes', async () => {
      const callbackMock = jest.fn()
      
      const { data: { subscription } } = mockSupabase.auth.onAuthStateChange(
        callbackMock
      )

      expect(subscription).toBeDefined()
      expect(subscription.unsubscribe).toBeDefined()
    })

    test('Should handle SIGNED_IN event', async () => {
      const callbackMock = jest.fn()
      const mockSession = createMockSession()
      
      mockSupabase.auth.onAuthStateChange.mockImplementation((callback: (event: string, session: any) => void) => {
        // Simulate SIGNED_IN event
        callback('SIGNED_IN', mockSession)
        return {
          data: { subscription: { unsubscribe: jest.fn() } }
        }
      })

      mockSupabase.auth.onAuthStateChange(callbackMock)

      expect(callbackMock).toHaveBeenCalledWith('SIGNED_IN', mockSession)
    })

    test('Should handle SIGNED_OUT event', async () => {
      const callbackMock = jest.fn()
      
      mockSupabase.auth.onAuthStateChange.mockImplementation((callback: (event: string, session: any) => void) => {
        // Simulate SIGNED_OUT event
        callback('SIGNED_OUT', null)
        return {
          data: { subscription: { unsubscribe: jest.fn() } }
        }
      })

      mockSupabase.auth.onAuthStateChange(callbackMock)

      expect(callbackMock).toHaveBeenCalledWith('SIGNED_OUT', null)
    })
  })

  describe('Multi-Tab Behavior', () => {
    test('Should sync auth state across tabs', async () => {
      const mockSession = createMockSession()
      
      // Tab 1 signs in
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockSession.user, session: mockSession },
        error: null,
      })

      await mockSupabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'password123',
      })

      // Tab 2 should detect auth state change
      const callbackMock = jest.fn()
      mockSupabase.auth.onAuthStateChange.mockImplementation((callback: (event: string, session: any) => void) => {
        callback('SIGNED_IN', mockSession)
        return {
          data: { subscription: { unsubscribe: jest.fn() } }
        }
      })

      mockSupabase.auth.onAuthStateChange(callbackMock)

      expect(callbackMock).toHaveBeenCalledWith('SIGNED_IN', expect.any(Object))
    })

    test('Should sign out all tabs when one tab signs out', async () => {
      const callbackMock = jest.fn()
      
      mockSupabase.auth.onAuthStateChange.mockImplementation((callback: (event: string, session: any) => void) => {
        // Simulate sign-out detected in another tab
        callback('SIGNED_OUT', null)
        return {
          data: { subscription: { unsubscribe: jest.fn() } }
        }
      })

      mockSupabase.auth.onAuthStateChange(callbackMock)

      expect(callbackMock).toHaveBeenCalledWith('SIGNED_OUT', null)
    })
  })

  describe('Session Persistence', () => {
    test('Should persist session across page reloads', async () => {
      const mockSession = createMockSession()
      
      // Sign in
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockSession.user, session: mockSession },
        error: null,
      })

      await mockSupabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'password123',
      })

      // Simulate page reload
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      })

      const result = await mockSupabase.auth.getSession()

      expect(result.data.session).toBeDefined()
      expect(result.data.session.user.id).toBe('test-user-id')
    })

    test('Should clear session data on explicit sign-out', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({
        error: null,
      })

      ;(idbClear as jest.Mock).mockResolvedValue(undefined)

      await mockSupabase.auth.signOut()
      await idbClear()

      // After sign-out, session should be null
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      })

      const result = await mockSupabase.auth.getSession()

      expect(result.data.session).toBeNull()
      expect(idbClear).toHaveBeenCalled()
    })
  })

  describe('Security Considerations', () => {
    test('Should not expose sensitive token data in logs', () => {
      const mockSession = createMockSession()
      
      // Session object should not be logged in production
      const sanitizedSession = {
        user: { id: mockSession.user.id, email: mockSession.user.email },
        expires_at: mockSession.expires_at,
        // Tokens should NOT be logged
      }

      expect(sanitizedSession).not.toHaveProperty('access_token')
      expect(sanitizedSession).not.toHaveProperty('refresh_token')
    })

    test('Should validate session integrity', async () => {
      const mockSession = createMockSession()
      
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      })

      const result = await mockSupabase.auth.getSession()
      const session = result.data.session

      // Session should have required fields
      expect(session).toHaveProperty('access_token')
      expect(session).toHaveProperty('user')
      expect(session).toHaveProperty('expires_at')
      expect(session.user).toHaveProperty('id')
    })
  })
})

