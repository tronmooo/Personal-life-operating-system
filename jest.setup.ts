import '@testing-library/jest-dom'
import 'fake-indexeddb/auto'

// Ensure IndexedDB is available on both `global` and `window` in Jest/jsdom
// (some libraries reference `indexedDB` directly, others use `window.indexedDB`)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const g: any = global as any
if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w: any = window as any
  if (!g.indexedDB && w.indexedDB) g.indexedDB = w.indexedDB
  if (!w.indexedDB && g.indexedDB) w.indexedDB = g.indexedDB
  if (!g.IDBKeyRange && w.IDBKeyRange) g.IDBKeyRange = w.IDBKeyRange
  if (!w.IDBKeyRange && g.IDBKeyRange) w.IDBKeyRange = g.IDBKeyRange
}

// Some IndexedDB implementations (incl. fake-indexeddb) may not implement `indexedDB.databases()`.
// Provide a minimal polyfill so tests that iterate databases can run.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
if (typeof (indexedDB as any).databases !== 'function') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(indexedDB as any).databases = async () => [{ name: 'lifehub-cache' }]
}

// Minimal Fetch API class polyfills for tests that construct `new Request(...)`
// (jsdom doesn't always provide Request/Response; some test files only need `.method`)
if (typeof (globalThis as any).Request === 'undefined') {
  class MinimalRequest {
    url: string
    method: string
    body?: any
    constructor(input: string, init: { method?: string; body?: any } = {}) {
      this.url = input
      this.method = init.method || 'GET'
      this.body = init.body
    }
  }
  ;(globalThis as any).Request = MinimalRequest
}

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

// Node/JSDOM doesn't always provide Fetch API classes; some route tests expect them.
// Provide minimal polyfills (enough for our current tests which mostly access request.method/url/body).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
if (!(global as any).Headers) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(global as any).Headers = class HeadersPolyfill {
    private map = new Map<string, string>()
    constructor(init?: Record<string, string>) {
      if (init) for (const [k, v] of Object.entries(init)) this.map.set(k.toLowerCase(), v)
    }
    get(name: string) {
      return this.map.get(name.toLowerCase()) ?? null
    }
    set(name: string, value: string) {
      this.map.set(name.toLowerCase(), value)
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
if (!(global as any).Request) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(global as any).Request = class RequestPolyfill {
    url: string
    method: string
    body?: any
    headers: any
    constructor(url: string, init?: { method?: string; body?: any; headers?: any }) {
      this.url = url
      this.method = (init?.method || 'GET').toUpperCase()
      this.body = init?.body
      this.headers = init?.headers || {}
    }
    async json() {
      return this.body ? JSON.parse(this.body) : null
    }
    async text() {
      return this.body ? String(this.body) : ''
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
if (!(global as any).Response) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(global as any).Response = class ResponsePolyfill {
    ok: boolean
    status: number
    private _body: any
    constructor(body?: any, init?: { status?: number }) {
      this.status = init?.status ?? 200
      this.ok = this.status >= 200 && this.status < 300
      this._body = body
    }
    async json() {
      return this._body ? JSON.parse(this._body) : null
    }
    async text() {
      return this._body ? String(this._body) : ''
    }
  }
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




