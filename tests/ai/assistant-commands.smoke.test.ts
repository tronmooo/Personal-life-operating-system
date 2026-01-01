/**
 * AI Assistant Commands - Smoke Tests
 * 
 * Automated "torture test" for the AI assistant command processing.
 * Tests each fixture from the command catalog by calling the multi-entry handler
 * and verifying it processes without fatal errors.
 * 
 * Run with: npm run test:assistant:smoke
 */

// Mock next/server before any imports that use it
jest.mock('next/server', () => {
  // Create mock Response with json() method
  class MockResponse {
    private body: any
    public status: number
    public headers: Headers

    constructor(body: any, init?: ResponseInit) {
      this.body = body
      this.status = init?.status || 200
      this.headers = new Headers(init?.headers)
    }

    async json() {
      if (typeof this.body === 'string') {
        return JSON.parse(this.body)
      }
      return this.body
    }

    async text() {
      if (typeof this.body === 'string') {
        return this.body
      }
      return JSON.stringify(this.body)
    }
  }

  return {
    NextRequest: jest.fn().mockImplementation((url: string, init?: any) => ({
      method: init?.method || 'GET',
      url,
      headers: new Headers(init?.headers),
      json: jest.fn(),
      nextUrl: { origin: 'http://localhost:3000', pathname: url },
    })),
    NextResponse: {
      json: (data: any, init?: ResponseInit) => {
        return new MockResponse(JSON.stringify(data), {
          ...init,
          headers: {
            'Content-Type': 'application/json',
            ...(init?.headers ? Object.fromEntries(new Headers(init.headers)) : {}),
          },
        })
      },
    },
  }
})

import { 
  ASSISTANT_COMMAND_FIXTURES, 
  getFixtureSummary,
  type AssistantCommandFixture 
} from './assistant-command-fixtures'

// Now import the handler after mocking
import { POST as multiEntryHandler } from '@/app/api/ai-assistant/multi-entry/route'
import type { NextRequest } from 'next/server'

// Mock Supabase client for tests
jest.mock('@/lib/supabase/server', () => ({
  createServerClient: jest.fn().mockResolvedValue({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user-123', email: 'test@example.com' } },
        error: null,
      }),
      getSession: jest.fn().mockResolvedValue({
        data: { session: { provider_token: 'mock-token' } },
        error: null,
      }),
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ 
        data: { settings: { activePersonId: 'me' } }, 
        error: null 
      }),
    }),
  }),
}))

// Mock OpenAI/Gemini API calls to avoid actual API costs during testing
// Tests will verify the handler doesn't crash - actual AI responses are mocked
const mockExtractedEntity = (prompt: string, domain: string) => ({
  entities: [{
    domain: domain,
    confidence: 85,
    title: `Test entry from: ${prompt.substring(0, 30)}...`,
    description: 'Mock entity for testing',
    data: { type: 'test', value: '100' },
    rawText: prompt,
  }],
  originalInput: prompt,
  timestamp: new Date().toISOString(),
  requiresConfirmation: false,
})

jest.mock('@/lib/ai/multi-entity-extractor', () => ({
  extractMultipleEntities: jest.fn().mockImplementation(async (input: string) => {
    // Return a mock extraction result
    return mockExtractedEntity(input, 'health')
  }),
}))

jest.mock('@/lib/ai/domain-router', () => ({
  routeEntities: jest.fn().mockImplementation((entities: any[]) => ({
    routedEntities: entities.map(e => ({
      ...e,
      domain: e.domain || 'health',
    })),
    conflicts: [],
  })),
  detectDuplicates: jest.fn().mockImplementation((entities: any[]) => entities),
}))

/**
 * Create a mock NextRequest with the given message
 * Uses a custom mock since NextRequest is hard to construct in test environment
 */
function createMockRequest(message: string, options: {
  userId?: string
  userTime?: { localHour: number; timezone: string }
} = {}): NextRequest {
  const bodyData = {
    message,
    userContext: options.userId ? { userId: options.userId } : undefined,
    userTime: options.userTime || { 
      localHour: new Date().getHours(), 
      timezone: 'America/New_York',
      localTime: new Date().toLocaleTimeString(),
    },
  }

  // Create a minimal mock that satisfies the handler's needs
  const mockRequest = {
    method: 'POST',
    url: 'http://localhost:3000/api/ai-assistant/multi-entry',
    headers: new Headers({
      'Content-Type': 'application/json',
    }),
    json: jest.fn().mockResolvedValue(bodyData),
    text: jest.fn().mockResolvedValue(JSON.stringify(bodyData)),
    body: null,
    nextUrl: {
      origin: 'http://localhost:3000',
      pathname: '/api/ai-assistant/multi-entry',
    },
    cookies: {
      get: jest.fn().mockReturnValue(undefined),
      getAll: jest.fn().mockReturnValue([]),
    },
  } as unknown as NextRequest

  return mockRequest
}

/**
 * Result tracking for test summary
 */
interface TestResult {
  fixture: AssistantCommandFixture
  passed: boolean
  status?: number
  responseBody?: any
  error?: string
  duration: number
}

const testResults: TestResult[] = []

describe('AI Assistant Command Smoke Tests', () => {
  beforeAll(() => {
    // Print fixture summary before tests
    const summary = getFixtureSummary()
    console.log('\n📊 Test Fixture Summary:')
    console.log(`   Total fixtures: ${summary.total}`)
    console.log(`   Multi-command fixtures: ${summary.multiCommandCount}`)
    console.log('   By category:', JSON.stringify(summary.byCategory, null, 2))
    console.log('')
  })

  afterAll(() => {
    // Print test results summary
    const passed = testResults.filter(r => r.passed).length
    const failed = testResults.filter(r => !r.passed).length
    
    console.log('\n' + '='.repeat(60))
    console.log('📋 SMOKE TEST RESULTS SUMMARY')
    console.log('='.repeat(60))
    console.log(`✅ Passed: ${passed}`)
    console.log(`❌ Failed: ${failed}`)
    console.log(`📊 Total:  ${testResults.length}`)
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:')
      testResults
        .filter(r => !r.passed)
        .forEach(r => {
          console.log(`   - ${r.fixture.name}: ${r.error || 'Unknown error'}`)
        })
    }
    
    // Group by category for detailed breakdown
    const byCategory = new Map<string, { passed: number; failed: number }>()
    testResults.forEach(r => {
      const cat = r.fixture.category || 'uncategorized'
      const current = byCategory.get(cat) || { passed: 0, failed: 0 }
      if (r.passed) current.passed++
      else current.failed++
      byCategory.set(cat, current)
    })
    
    console.log('\n📊 Results by Category:')
    byCategory.forEach((stats, category) => {
      const icon = stats.failed === 0 ? '✅' : '⚠️'
      console.log(`   ${icon} ${category}: ${stats.passed}/${stats.passed + stats.failed} passed`)
    })
    console.log('='.repeat(60))
  })

  describe('Handler Basic Functionality', () => {
    it('should return 400 for empty message', async () => {
      const request = createMockRequest('')
      const response = await multiEntryHandler(request)
      
      expect(response.status).toBe(400)
    })

    it('should return valid JSON response for valid message', async () => {
      const request = createMockRequest('My weight is 175 pounds')
      const response = await multiEntryHandler(request)
      
      // Should not be a server error
      expect(response.status).not.toBe(500)
      
      // Should return JSON
      const body = await response.json()
      expect(body).toBeDefined()
    })
  })

  describe('Command Fixtures Smoke Tests', () => {
    // Test each fixture
    ASSISTANT_COMMAND_FIXTURES.forEach((fixture, index) => {
      it(`[${index + 1}/${ASSISTANT_COMMAND_FIXTURES.length}] ${fixture.name}`, async () => {
        const startTime = Date.now()
        let result: TestResult = {
          fixture,
          passed: false,
          duration: 0,
        }

        try {
          // Log the test
          console.log(`\n🧪 Testing: ${fixture.name}`)
          console.log(`   Prompt: "${fixture.prompt.substring(0, 60)}${fixture.prompt.length > 60 ? '...' : ''}"`)
          console.log(`   Expected domain: ${Array.isArray(fixture.domain) ? fixture.domain.join(', ') : fixture.domain}`)

          // Create request
          const request = createMockRequest(fixture.prompt)
          
          // Call handler
          const response = await multiEntryHandler(request)
          result.status = response.status
          
          // Parse response body
          const body = await response.json()
          result.responseBody = body
          
          // Log response details
          console.log(`   Response status: ${response.status}`)
          if (body.success !== undefined) {
            console.log(`   Success: ${body.success}`)
          }
          if (body.message) {
            console.log(`   Message: ${body.message.substring(0, 80)}${body.message.length > 80 ? '...' : ''}`)
          }
          if (body.results?.length) {
            console.log(`   Results: ${body.results.length} entities processed`)
          }

          // Assertions
          // 1. Handler should not throw (if we got here, it didn't)
          
          // 2. Response status should not be 5xx (server error)
          expect(response.status).toBeLessThan(500)
          
          // 3. Response body should be present and be an object
          expect(body).toBeDefined()
          expect(typeof body).toBe('object')
          
          // 4. If there's an explicit error field, the test should still pass
          //    but we log it for investigation
          if (body.error && !body.success) {
            console.log(`   ⚠️ Handler returned error: ${body.error}`)
            // We don't fail on handler errors - the handler processed the request
            // successfully even if it couldn't extract entities
          }

          result.passed = true
          result.duration = Date.now() - startTime
          console.log(`   ✅ Passed (${result.duration}ms)`)
          
        } catch (error: any) {
          result.passed = false
          result.error = error.message
          result.duration = Date.now() - startTime
          console.log(`   ❌ Failed: ${error.message}`)
          
          // Re-throw to fail the test
          throw error
        } finally {
          testResults.push(result)
        }
      })
    })
  })

  describe('Multi-Command Processing', () => {
    const multiFixtures = ASSISTANT_COMMAND_FIXTURES.filter(f => f.isMultiCommand)

    it.each(multiFixtures.map((f, i) => [f.name, f]))(
      'Multi-command: %s',
      async (name, fixture) => {
        const f = fixture as AssistantCommandFixture
        const request = createMockRequest(f.prompt)
        const response = await multiEntryHandler(request)
        
        expect(response.status).toBeLessThan(500)
        
        const body = await response.json()
        expect(body).toBeDefined()
        
        // Multi-commands should attempt to process multiple entities
        // The mock returns 1 entity, but real usage would return more
        console.log(`   Multi-command "${f.name}" processed - status: ${response.status}`)
      }
    )
  })

  describe('Category Coverage Tests', () => {
    const categories = [
      'health_metric',
      'fitness',
      'nutrition',
      'expense',
      'vehicle',
      'pet',
      'home',
      'mindfulness',
      'task',
      'habit',
      'goal',
    ]

    it.each(categories)('has fixtures for category: %s', (category) => {
      const fixtures = ASSISTANT_COMMAND_FIXTURES.filter(
        f => f.category === category
      )
      expect(fixtures.length).toBeGreaterThan(0)
    })
  })

  describe('Domain Coverage Tests', () => {
    const expectedDomains = [
      'health',
      'fitness', 
      'nutrition',
      'financial',
      'vehicles',
      'pets',
      'home',
      'mindfulness',
      'tasks',
      'habits',
      'goals',
    ]

    it.each(expectedDomains)('has fixtures for domain: %s', (domain) => {
      const fixtures = ASSISTANT_COMMAND_FIXTURES.filter(f => {
        if (Array.isArray(f.domain)) {
          return f.domain.includes(domain)
        }
        return f.domain === domain
      })
      expect(fixtures.length).toBeGreaterThan(0)
    })
  })
})

/**
 * Utility to run a single fixture (for debugging)
 */
export async function runSingleFixture(fixtureName: string): Promise<TestResult | null> {
  const fixture = ASSISTANT_COMMAND_FIXTURES.find(f => f.name === fixtureName)
  if (!fixture) {
    console.error(`Fixture not found: ${fixtureName}`)
    return null
  }

  const startTime = Date.now()
  const request = createMockRequest(fixture.prompt)
  
  try {
    const response = await multiEntryHandler(request)
    const body = await response.json()
    
    return {
      fixture,
      passed: response.status < 500,
      status: response.status,
      responseBody: body,
      duration: Date.now() - startTime,
    }
  } catch (error: any) {
    return {
      fixture,
      passed: false,
      error: error.message,
      duration: Date.now() - startTime,
    }
  }
}

/**
 * Utility to run all fixtures and get summary
 */
export async function runAllFixtures(): Promise<{
  total: number
  passed: number
  failed: number
  results: TestResult[]
}> {
  const results: TestResult[] = []
  
  for (const fixture of ASSISTANT_COMMAND_FIXTURES) {
    const result = await runSingleFixture(fixture.name)
    if (result) {
      results.push(result)
    }
  }
  
  return {
    total: results.length,
    passed: results.filter(r => r.passed).length,
    failed: results.filter(r => !r.passed).length,
    results,
  }
}

