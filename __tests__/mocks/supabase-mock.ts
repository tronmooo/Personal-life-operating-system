/**
 * Supabase Client Mock
 * Provides a complete mock of the Supabase client for testing
 */

export const createMockSupabaseClient = () => {
  const mockClient = {
    auth: {
      getUser: jest.fn(),
      getSession: jest.fn(),
      signInWithPassword: jest.fn(),
      signInWithOAuth: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } }
      })),
      refreshSession: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      upsert: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      gt: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn(),
      maybeSingle: jest.fn(),
      range: jest.fn().mockReturnThis(),
    })),
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
    })),
    removeChannel: jest.fn(),
    rpc: jest.fn(),
  }

  return mockClient
}

// Mock createClientComponentClient
export const mockCreateClientComponentClient = jest.fn(() => createMockSupabaseClient())

// Setup mock for Supabase auth helpers
jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createClientComponentClient: mockCreateClientComponentClient,
  createRouteHandlerClient: jest.fn(() => createMockSupabaseClient()),
  createServerComponentClient: jest.fn(() => createMockSupabaseClient()),
}))

export default createMockSupabaseClient



