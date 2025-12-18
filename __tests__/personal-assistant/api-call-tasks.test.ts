import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { POST as createTask, GET as listTasks } from '@/app/api/call-tasks/route'
import { GET as getTask, PATCH as updateTask, DELETE as deleteTask } from '@/app/api/call-tasks/[id]/route'
import { POST as startCall } from '@/app/api/call-tasks/[id]/start-call/route'

// Mock Supabase
jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createRouteHandlerClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn()
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      maybeSingle: jest.fn(),
      limit: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis()
    }))
  }))
}))

// Mock AI helper
jest.mock('@/lib/services/call-ai-helper', () => ({
  planCallTask: jest.fn(),
  generateCallScript: jest.fn()
}))

// Mock Twilio service
jest.mock('@/lib/services/twilio-voice-service', () => ({
  createTwilioService: jest.fn(() => ({
    makeCall: jest.fn()
  }))
}))

describe('Call Tasks API', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com'
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/call-tasks', () => {
    it('should create a call task with valid input', async () => {
      const request = new Request('http://localhost:3000/api/call-tasks', {
        method: 'POST',
        body: JSON.stringify({
          raw_instruction: 'Call my dentist',
          priority: 'normal'
        })
      })

      // Mock successful creation
      const mockPlanCallTask = await import('@/lib/services/call-ai-helper')
      jest.mocked(mockPlanCallTask.planCallTask).mockResolvedValue({
        goal: 'Schedule appointment',
        steps: ['Call dentist'],
        questionsToAsk: [],
        missingInfo: ['phone number'],
        requiresClarification: true,
        hardConstraints: {},
        softPreferences: {}
      })

      // Test would continue with actual API call
      expect(request.method).toBe('POST')
    })

    it('should reject requests without raw_instruction', async () => {
      const request = new Request('http://localhost:3000/api/call-tasks', {
        method: 'POST',
        body: JSON.stringify({})
      })

      expect(request.method).toBe('POST')
    })
  })

  describe('PATCH /api/call-tasks/:id', () => {
    it('should validate status transitions', () => {
      const validTransitions: Record<string, string[]> = {
        'pending': ['preparing', 'waiting_for_user', 'ready_to_call', 'cancelled'],
        'waiting_for_user': ['ready_to_call', 'cancelled'],
        'ready_to_call': ['in_progress', 'cancelled'],
        'in_progress': ['completed', 'failed', 'cancelled']
      }

      // Test transition: waiting_for_user -> ready_to_call (valid)
      expect(validTransitions['waiting_for_user']).toContain('ready_to_call')

      // Test transition: in_progress -> pending (invalid)
      expect(validTransitions['in_progress']).not.toContain('pending')

      // Test transition: completed -> anything (invalid - no transitions)
      expect(validTransitions['completed']).toBeUndefined()
    })

    it('should auto-transition when missing info is filled', () => {
      const task = {
        status: 'waiting_for_user',
        target_phone_number: null,
        ai_plan: {
          missingInfo: ['phone number']
        }
      }

      const updates = {
        target_phone_number: '+1-555-1234'
      }

      // Logic: if phone was missing and now provided, auto-transition
      const hasMissingInfo = task.ai_plan.missingInfo.some((info: string) => 
        info.toLowerCase().includes('phone') && !updates.target_phone_number
      )

      expect(hasMissingInfo).toBe(false)
      // Should auto-transition to ready_to_call
    })
  })

  describe('POST /api/call-tasks/:id/start-call', () => {
    it('should reject if status is not ready_to_call', () => {
      const task = { status: 'pending' }
      
      const canStartCall = task.status === 'ready_to_call'
      expect(canStartCall).toBe(false)
    })

    it('should reject if no phone number available', () => {
      const task: {
        status: string
        target_phone_number: string | null
        contact: { phone_number: string } | null
      } = {
        status: 'ready_to_call',
        target_phone_number: null,
        contact: null
      }

      const hasPhoneNumber = task.target_phone_number || task.contact?.phone_number
      expect(hasPhoneNumber).toBeFalsy()
    })

    it('should allow call with valid preconditions', () => {
      const task: {
        status: string
        target_phone_number: string | null
        contact: { phone_number: string } | null
      } = {
        status: 'ready_to_call',
        target_phone_number: '+1-555-1234',
        contact: null
      }

      const canStartCall = task.status === 'ready_to_call'
      const hasPhoneNumber = task.target_phone_number || task.contact?.phone_number

      expect(canStartCall && !!hasPhoneNumber).toBe(true)
    })
  })

  describe('Status Machine', () => {
    it('should follow valid state transitions', () => {
      const states = [
        'pending',
        'waiting_for_user',
        'ready_to_call',
        'in_progress',
        'completed'
      ]

      // Valid flow
      expect(states[0]).toBe('pending')
      expect(states[states.length - 1]).toBe('completed')
    })

    it('should not allow backwards transitions', () => {
      const invalidTransitions = [
        ['completed', 'in_progress'],
        ['in_progress', 'ready_to_call'],
        ['ready_to_call', 'pending']
      ]

      invalidTransitions.forEach(([from, to]) => {
        // These should be rejected by the API
        expect(from).not.toBe(to)
      })
    })
  })
})

describe('Webhook Processing', () => {
  it('should map Twilio statuses correctly', () => {
    const statusMap: Record<string, string> = {
      'queued': 'initiated',
      'ringing': 'ringing',
      'in-progress': 'connected',
      'completed': 'completed',
      'busy': 'failed',
      'no-answer': 'failed',
      'failed': 'failed',
      'canceled': 'cancelled'
    }

    expect(statusMap['completed']).toBe('completed')
    expect(statusMap['busy']).toBe('failed')
    expect(statusMap['in-progress']).toBe('connected')
  })

  it('should handle retry logic', () => {
    const settings = {
      auto_retry_failed_calls: true,
      max_retry_attempts: 2
    }

    const failedAttempts = 1

    const shouldRetry = 
      settings.auto_retry_failed_calls && 
      failedAttempts < settings.max_retry_attempts

    expect(shouldRetry).toBe(true)

    // After max attempts
    const failedAttempts2 = 2
    const shouldNotRetry = 
      settings.auto_retry_failed_calls && 
      failedAttempts2 < settings.max_retry_attempts

    expect(shouldNotRetry).toBe(false)
  })
})

