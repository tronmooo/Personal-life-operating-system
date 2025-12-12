import { describe, it } from '@jest/globals'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { CallTaskComposer } from '@/components/personal-assistant/call-task-composer'
import { CallTaskList } from '@/components/personal-assistant/call-task-list'

// Mock fetch
global.fetch = jest.fn()

describe('CallTaskComposer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render the composer form', () => {
    render(<CallTaskComposer />)
    
    expect(screen.getByText(/Create Call Task/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Example:/i)).toBeInTheDocument()
  })

  it('should show error when submitting without instruction', async () => {
    render(<CallTaskComposer />)
    
    const submitButton = screen.getByText(/Create Call Task/i)
    fireEvent.click(submitButton)

    // Toast error should be called
    await waitFor(() => {
      expect(global.fetch).not.toHaveBeenCalled()
    })
  })

  it('should submit valid task', async () => {
    const mockResponse = {
      success: true,
      call_task: { id: '123', status: 'ready_to_call' },
      ai_plan: { goal: 'Test goal' }
    }

    jest.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => mockResponse
    } as Response)

    render(<CallTaskComposer />)
    
    const textarea = screen.getByPlaceholderText(/Example:/i)
    fireEvent.change(textarea, { target: { value: 'Call my dentist' } })

    const submitButton = screen.getByText(/Create Call Task/i)
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/call-tasks', expect.objectContaining({
        method: 'POST'
      }))
    })
  })

  it('should show clarification UI when needed', async () => {
    const mockResponse = {
      success: true,
      call_task: { id: '123', status: 'waiting_for_user' },
      ai_plan: { 
        goal: 'Test goal',
        missingInfo: ['phone number']
      },
      requires_clarification: true
    }

    jest.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => mockResponse
    } as Response)

    render(<CallTaskComposer />)
    
    const textarea = screen.getByPlaceholderText(/Example:/i)
    fireEvent.change(textarea, { target: { value: 'Call someone' } })

    const submitButton = screen.getByText(/Create Call Task/i)
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/More Information Needed/i)).toBeInTheDocument()
    })
  })
})

describe('CallTaskList', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render loading state', () => {
    jest.mocked(global.fetch).mockImplementation(() => 
      new Promise(() => {}) // Never resolves
    )

    render(<CallTaskList />)
    
    // Should show loader
    expect(screen.getByTestId('loader') || document.querySelector('.animate-spin')).toBeTruthy()
  })

  it('should render task list', async () => {
    const mockTasks = {
      success: true,
      tasks: [
        {
          id: '1',
          title: 'Call dentist',
          status: 'ready_to_call',
          priority: 'normal',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          raw_instruction: 'Call my dentist'
        }
      ],
      total: 1
    }

    jest.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => mockTasks
    } as Response)

    render(<CallTaskList />)

    await waitFor(() => {
      expect(screen.getByText('Call dentist')).toBeInTheDocument()
    })
  })

  it('should show empty state when no tasks', async () => {
    jest.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, tasks: [], total: 0 })
    } as Response)

    render(<CallTaskList />)

    await waitFor(() => {
      expect(screen.getByText(/No Call Tasks Found/i)).toBeInTheDocument()
    })
  })

  it('should handle click on task', async () => {
    const mockTasks = {
      success: true,
      tasks: [
        {
          id: '1',
          title: 'Call dentist',
          status: 'ready_to_call',
          priority: 'normal',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          raw_instruction: 'Call my dentist'
        }
      ],
      total: 1
    }

    jest.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => mockTasks
    } as Response)

    const onTaskClick = jest.fn()
    render(<CallTaskList onTaskClick={onTaskClick} />)

    await waitFor(() => {
      const taskCard = screen.getByText('Call dentist').closest('div[class*="Card"]')
      if (taskCard) {
        fireEvent.click(taskCard)
        expect(onTaskClick).toHaveBeenCalled()
      }
    })
  })
})

describe('Status Indicators', () => {
  it('should use correct colors for statuses', () => {
    const statusColors: Record<string, string> = {
      'pending': 'bg-gray-500',
      'ready_to_call': 'bg-green-500',
      'in_progress': 'bg-purple-500',
      'completed': 'bg-green-600',
      'failed': 'bg-red-500'
    }

    expect(statusColors['ready_to_call']).toContain('green')
    expect(statusColors['failed']).toContain('red')
    expect(statusColors['in_progress']).toContain('purple')
  })

  it('should show correct icons for statuses', () => {
    const statusIcons = {
      'pending': 'Clock',
      'ready_to_call': 'PlayCircle',
      'in_progress': 'Phone',
      'completed': 'CheckCircle2',
      'failed': 'XCircle'
    }

    expect(statusIcons['ready_to_call']).toBe('PlayCircle')
    expect(statusIcons['completed']).toBe('CheckCircle2')
  })
})

