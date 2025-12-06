/**
 * Unit tests for AutoOCRUploader component
 * Tests file upload, OCR processing, and database integration
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AutoOCRUploader } from '@/components/auto-ocr-uploader'
import { DataProvider } from '@/lib/providers/data-provider'

// Mock Supabase client
const mockSupabase = {
  auth: {
    getUser: jest.fn().mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null,
    }),
    getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
    onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
  },
  storage: {
    from: jest.fn(() => ({
      upload: jest.fn().mockResolvedValue({
        data: { path: 'test-path' },
        error: null,
      }),
      getPublicUrl: jest.fn(() => ({
        data: { publicUrl: 'https://test.com/file.pdf' },
      })),
    })),
  },
  from: jest.fn(() => ({
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn().mockResolvedValue({
          data: { id: 'test-doc-id' },
          error: null,
        }),
      })),
    })),
  })),
}

jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createClientComponentClient: () => mockSupabase,
}))

// Mock OCR Service
jest.mock('@/lib/services/ocr-service', () => ({
  OCRService: {
    processDocument: jest.fn().mockResolvedValue({
      text: 'Test OCR text',
      confidence: 95,
      metadata: {
        dates: [],
        expirationDate: null,
        renewalDate: null,
        policyNumber: null,
        accountNumber: null,
        amount: null,
        currency: null,
        email: null,
        phone: null,
      },
    }),
    analyzeDocumentType: jest.fn().mockReturnValue('document'),
  },
}))

describe('AutoOCRUploader Component', () => {
  const mockOnDocumentUploaded = jest.fn()
  const domainId = 'test-domain'

  beforeEach(() => {
    mockOnDocumentUploaded.mockClear()
  })

  test('renders upload area', () => {
    render(
      <DataProvider>
        <AutoOCRUploader domainId={domainId} onDocumentUploaded={mockOnDocumentUploaded} />
      </DataProvider>
    )

    expect(screen.getAllByText(/upload document/i)[0]).toBeInTheDocument()
    expect(screen.getByText(/choose file/i)).toBeInTheDocument()
  })

  test('shows file size limit', () => {
    render(
      <DataProvider>
        <AutoOCRUploader domainId={domainId} onDocumentUploaded={mockOnDocumentUploaded} maxSize={10} />
      </DataProvider>
    )

    expect(screen.getByText(/max.*10.*mb/i)).toBeInTheDocument()
  })

  test('accepts file input', () => {
    render(
      <DataProvider>
        <AutoOCRUploader domainId={domainId} onDocumentUploaded={mockOnDocumentUploaded} />
      </DataProvider>
    )

    const input = screen.getByLabelText(/upload document/i).closest('input')
    expect(input).toHaveAttribute('type', 'file')
    expect(input).toHaveAttribute('accept', '.pdf,.jpg,.jpeg,.png,.webp')
  })

  test('validates file size', async () => {
    render(
      <DataProvider>
        <AutoOCRUploader domainId={domainId} onDocumentUploaded={mockOnDocumentUploaded} maxSize={1} />
      </DataProvider>
    )

    const input = screen.getByLabelText(/upload document/i).closest('input') as HTMLInputElement
    
    // Create a large file (2MB)
    const largeFile = new File(['x'.repeat(2 * 1024 * 1024)], 'large.pdf', { type: 'application/pdf' })

    Object.defineProperty(input, 'files', {
      value: [largeFile],
      writable: false,
    })

    fireEvent.change(input)

    await waitFor(() => {
      expect(screen.getByText(/file size exceeds/i)).toBeInTheDocument()
    })
  })

  test('validates file type', async () => {
    render(
      <DataProvider>
        <AutoOCRUploader domainId={domainId} onDocumentUploaded={mockOnDocumentUploaded} />
      </DataProvider>
    )

    const input = screen.getByLabelText(/upload document/i).closest('input') as HTMLInputElement
    
    // Create an invalid file type
    const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' })

    Object.defineProperty(input, 'files', {
      value: [invalidFile],
      writable: false,
    })

    fireEvent.change(input)

    await waitFor(() => {
      expect(screen.getByText(/invalid file type/i)).toBeInTheDocument()
    })
  })

  test('displays supported formats', () => {
    render(
      <DataProvider>
        <AutoOCRUploader domainId={domainId} onDocumentUploaded={mockOnDocumentUploaded} />
      </DataProvider>
    )

    expect(screen.getByText(/PDF, JPG, PNG, WEBP/i)).toBeInTheDocument()
  })
})






























