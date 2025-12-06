/**
 * Comprehensive Domain CRUD Tests
 * Tests CRUD operations for all 21+ domains with domain-specific metadata
 */

import { createDomainEntry, updateDomainEntry } from '@/lib/hooks/use-domain-entries'
import type { Domain } from '@/types/domains'

// Mock Supabase
jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createClientComponentClient: jest.fn(() => mockClient),
}))

const mockClient = {
  auth: {
    getUser: jest.fn(() => Promise.resolve({
      data: { user: { id: 'test-user' } },
      error: null,
    })),
  },
  from: jest.fn(),
}

describe('All Domains CRUD Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const testDomainCRUD = (domain: Domain, sampleMetadata: any) => {
    describe(`${domain} domain`, () => {
      it(`should create ${domain} entry`, async () => {
        const mockInserted = {
          id: `${domain}-1`,
          user_id: 'test-user',
          domain,
          title: `Test ${domain} Entry`,
          description: 'Test description',
          metadata: sampleMetadata,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        const mockQuery = {
          insert: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: mockInserted, error: null }),
        }
        mockClient.from.mockReturnValue(mockQuery)

        const result = await createDomainEntry(mockClient as any, {
          domain,
          title: `Test ${domain} Entry`,
          description: 'Test description',
          metadata: sampleMetadata,
        })

        expect(result.domain).toBe(domain)
        expect(result.metadata).toEqual(sampleMetadata)
      })

      it(`should update ${domain} entry metadata`, async () => {
        const updatedMetadata = { ...sampleMetadata, updated: true }
        const mockUpdated = {
          id: `${domain}-1`,
          domain,
          title: `Updated ${domain}`,
          metadata: updatedMetadata,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        const mockQuery = {
          update: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: mockUpdated, error: null }),
        }
        mockClient.from.mockReturnValue(mockQuery)

        const result = await updateDomainEntry(mockClient as any, {
          id: `${domain}-1`,
          metadata: updatedMetadata,
        })

        expect(result.metadata).toHaveProperty('updated', true)
      })
    })
  }

  // Test all domains with representative metadata
  testDomainCRUD('financial', {
    accountName: 'Checking Account',
    accountType: 'Checking',
    balance: 5000,
    institution: 'Test Bank',
  })

  testDomainCRUD('health', {
    recordType: 'Medical',
    date: '2025-01-01',
    provider: 'Dr. Smith',
    notes: 'Annual checkup',
  })

  testDomainCRUD('insurance', {
    itemType: 'Insurance Policy',
    policyType: 'Auto',
    provider: 'State Farm',
    policyNumber: 'POL123456',
    premium: 1200,
    coverageAmount: 100000,
  })

  testDomainCRUD('home', {
    propertyType: 'Single Family',
    address: '123 Main St',
    squareFeet: 2000,
    yearBuilt: 2010,
    value: 350000,
  })

  testDomainCRUD('vehicles', {
    make: 'Toyota',
    model: 'Camry',
    year: 2022,
    vin: 'ABC123456789',
    mileage: 15000,
    value: 28000,
  })

  testDomainCRUD('appliances', {
    applianceType: 'Refrigerator',
    brand: 'Samsung',
    model: 'RF28R7351SG',
    purchaseDate: '2023-01-15',
    warrantyExpires: '2025-01-15',
  })

  testDomainCRUD('pets', {
    petType: 'Dog',
    name: 'Max',
    breed: 'Golden Retriever',
    age: 3,
    weight: 70,
    vetName: 'Dr. Johnson',
  })

  testDomainCRUD('relationships', {
    relationType: 'Friend',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '555-0123',
  })

  testDomainCRUD('digital', {
    itemType: 'Subscription',
    serviceName: 'Netflix',
    username: 'user@example.com',
    renewalDate: '2025-12-31',
    monthlyCost: 15.99,
  })

  testDomainCRUD('mindfulness', {
    activityType: 'Meditation',
    duration: 20,
    mood: 'Calm',
    notes: 'Morning meditation',
  })

  testDomainCRUD('fitness', {
    activityType: 'Running',
    duration: 30,
    distance: 5,
    caloriesBurned: 350,
    date: '2025-01-15',
  })

  testDomainCRUD('nutrition', {
    mealType: 'Breakfast',
    calories: 450,
    protein: 20,
    carbs: 50,
    fat: 15,
    date: '2025-01-15',
  })

  // Legal domain removed - now handled under insurance domain
  // testDomainCRUD('legal', {
  //   documentType: 'Contract',
  //   documentName: 'Employment Agreement',
  //   effectiveDate: '2025-01-01',
  //   expirationDate: '2026-01-01',
  //   parties: 'Employee, Employer',
  // })

  testDomainCRUD('miscellaneous', {
    itemType: 'Other',
    category: 'General',
    notes: 'Miscellaneous item',
  })
})

describe('Domain Metadata Validation', () => {
  it('should handle empty metadata', async () => {
    const mockInserted = {
      id: 'test-1',
      user_id: 'test-user',
      domain: 'miscellaneous',
      title: 'Test',
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const mockQuery = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: mockInserted, error: null }),
    }
    mockClient.from.mockReturnValue(mockQuery)

    const result = await createDomainEntry(mockClient as any, {
      domain: 'miscellaneous',
      title: 'Test',
      metadata: {},
    })

    expect(result.metadata).toEqual({})
  })

  it('should preserve complex nested metadata', async () => {
    const complexMetadata = {
      basic: 'value',
      nested: {
        level1: {
          level2: 'deep value',
        },
      },
      array: [1, 2, 3],
      boolean: true,
      number: 42,
    }

    const mockInserted = {
      id: 'test-1',
      user_id: 'test-user',
      domain: 'miscellaneous',
      title: 'Complex',
      metadata: complexMetadata,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const mockQuery = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: mockInserted, error: null }),
    }
    mockClient.from.mockReturnValue(mockQuery)

    const result = await createDomainEntry(mockClient as any, {
      domain: 'miscellaneous',
      title: 'Complex',
      metadata: complexMetadata,
    })

    expect(result.metadata).toEqual(complexMetadata)
  })
})
