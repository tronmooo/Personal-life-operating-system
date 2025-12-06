/**
 * Test Helper Utilities
 * Common functions for creating test data and mocks
 */

import { Domain } from '@/types/domains'
import { User } from '@supabase/supabase-js'

/**
 * Create a mock user for testing
 */
export const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: 'test-user-id',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'test@example.com',
  email_confirmed_at: new Date().toISOString(),
  phone: '',
  confirmed_at: new Date().toISOString(),
  last_sign_in_at: new Date().toISOString(),
  app_metadata: {},
  user_metadata: {},
  identities: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
})

/**
 * Create a mock domain entry for testing
 */
export const createMockEntry = (domain: Domain, overrides: any = {}) => ({
  id: `test-entry-${Date.now()}`,
  user_id: 'test-user-id',
  domain,
  title: `Test ${domain} Entry`,
  description: 'Test description',
  metadata: {},
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
})

/**
 * Wait for a specified time (for async testing)
 */
export const wait = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms))

/**
 * Wait for a condition to be true
 */
export const waitFor = async (
  condition: () => boolean,
  timeout: number = 5000,
  interval: number = 100
): Promise<void> => {
  const startTime = Date.now()
  
  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error(`Timeout waiting for condition after ${timeout}ms`)
    }
    await wait(interval)
  }
}

/**
 * Create mock session for testing
 */
export const createMockSession = (userId: string = 'test-user-id') => ({
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  expires_at: Date.now() / 1000 + 3600,
  token_type: 'bearer',
  user: createMockUser({ id: userId }),
})

/**
 * Simulate realtime event
 */
export const simulateRealtimeEvent = (
  eventType: 'INSERT' | 'UPDATE' | 'DELETE',
  table: string,
  record: any
) => ({
  eventType,
  table,
  schema: 'public',
  new: eventType !== 'DELETE' ? record : undefined,
  old: eventType !== 'INSERT' ? record : undefined,
  commit_timestamp: new Date().toISOString(),
})

/**
 * Mock Supabase response success
 */
export const mockSuccess = <T>(data: T) => ({
  data,
  error: null,
  status: 200,
  statusText: 'OK',
})

/**
 * Mock Supabase response error
 */
export const mockError = (message: string, code: string = 'ERROR') => ({
  data: null,
  error: {
    message,
    code,
    details: '',
    hint: '',
  },
  status: 400,
  statusText: 'Bad Request',
})

/**
 * Create mock Plaid API response
 */
export const createMockPlaidResponse = (type: 'link_token' | 'access_token' | 'accounts') => {
  switch (type) {
    case 'link_token':
      return {
        link_token: 'link-test-token-' + Date.now(),
        expiration: new Date(Date.now() + 3600000).toISOString(),
      }
    case 'access_token':
      return {
        access_token: 'access-test-token',
        item_id: 'item-test-id',
        request_id: 'request-test-id',
      }
    case 'accounts':
      return {
        accounts: [
          {
            account_id: 'account-1',
            name: 'Checking Account',
            type: 'depository',
            subtype: 'checking',
            mask: '1234',
            balances: {
              current: 1000.00,
              available: 950.00,
              currency: 'USD',
            },
          },
        ],
      }
    default:
      return {}
  }
}



