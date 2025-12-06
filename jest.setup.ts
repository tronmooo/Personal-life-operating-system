import '@testing-library/jest-dom'
import 'fake-indexeddb/auto'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    }
  },
  usePathname() {
    return '/'
  },
  useSearchParams() {
    return new URLSearchParams()
  },
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock IntersectionObserver
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(global as any).IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return []
  }
  unobserve() {}
}

// Mock ResizeObserver
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(global as any).ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Suppress console errors during tests
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(global as any).console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
}

// Global fetch mock to prevent real network calls in provider code
// eslint-disable-next-line @typescript-eslint/no-explicit-any
if (!(global as any).fetch) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(global as any).fetch = jest.fn(async () => ({ ok: true, json: async () => ({ data: [] }) }))
}

// Mock Supabase client used by DataProvider and components
jest.mock('@supabase/auth-helpers-nextjs', () => {
  const authListeners: unknown[] = []
  const mockAuth = {
    getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
    onAuthStateChange: jest.fn((_event: unknown, _session: unknown) => {
      const subscription = { unsubscribe: jest.fn() }
      authListeners.push(subscription)
      return { data: { subscription } }
    }),
    getUser: jest
      .fn()
      .mockResolvedValue({ data: { user: { id: 'test-user-id' } }, error: null }),
  }
  const mockStorage = {
    from: jest.fn(() => ({
      upload: jest
        .fn()
        .mockResolvedValue({ data: { path: 'test-path' }, error: null }),
      getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'https://example.com/file.pdf' } })),
    })),
  }
  const mockFrom = jest.fn(() => ({
    insert: jest.fn(() => ({
      select: jest.fn(() => ({ single: jest.fn().mockResolvedValue({ data: {}, error: null }) })),
    })),
    select: jest.fn(() => ({ single: jest.fn().mockResolvedValue({ data: {}, error: null }) })),
  }))
  return {
    createClientComponentClient: () => ({ auth: mockAuth, storage: mockStorage, from: mockFrom }),
  }
})

// Transform ignore exception isn't always enough; provide a light jose mock
jest.mock('jose', () => ({
  jwtVerify: jest.fn(async () => ({ payload: {} })),
}))




