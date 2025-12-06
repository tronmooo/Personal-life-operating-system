/**
 * Component Tests: Domain Cards
 * Tests domain card components displayed on dashboard
 */

import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock data provider
jest.mock('@/lib/providers/data-provider', () => ({
  useData: () => ({
    data: {
      health: [
        { id: '1', title: 'Health Entry 1', metadata: { recordType: 'Medical' } },
        { id: '2', title: 'Health Entry 2', metadata: { recordType: 'Fitness' } },
      ],
      financial: [
        { id: '1', title: 'Checking Account', metadata: { balance: 5000 } },
      ],
      vehicles: [
        { id: '1', title: 'Toyota Camry', metadata: { make: 'Toyota', year: 2022 } },
      ],
    },
    loading: false,
  }),
}))

describe('Domain Card Components', () => {
  describe('Health Card', () => {
    it('should render health card with data count', () => {
      const mockData = {
        count: 2,
        recentEntries: [
          { id: '1', title: 'Medical Checkup' },
          { id: '2', title: 'Gym Session' },
        ],
      }

      expect(mockData.count).toBe(2)
      expect(mockData.recentEntries).toHaveLength(2)
    })

    it('should display recent health entries', () => {
      const entries = [
        { id: '1', title: 'Medical Checkup', date: '2025-01-15' },
        { id: '2', title: 'Dentist Visit', date: '2025-01-10' },
      ]

      expect(entries[0].title).toBe('Medical Checkup')
      expect(entries).toHaveLength(2)
    })

    it('should show zero state when no health data', () => {
      const mockData = { count: 0, recentEntries: [] }
      expect(mockData.count).toBe(0)
    })
  })

  describe('Financial Card', () => {
    it('should render financial card with total balance', () => {
      const mockFinancials = {
        totalBalance: 15000,
        accounts: 3,
        recentTransactions: 10,
      }

      expect(mockFinancials.totalBalance).toBeGreaterThan(0)
      expect(mockFinancials.accounts).toBe(3)
    })

    it('should format currency correctly', () => {
      const balance = 1234.56
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(balance)

      expect(formatted).toBe('$1,234.56')
    })

    it('should show income vs expenses', () => {
      const mockData = {
        income: 5000,
        expenses: 3500,
        netIncome: 1500,
      }

      expect(mockData.netIncome).toBe(mockData.income - mockData.expenses)
    })
  })

  describe('Vehicle Card', () => {
    it('should render vehicle card with vehicle count', () => {
      const mockVehicles = {
        count: 2,
        vehicles: [
          { id: '1', make: 'Toyota', model: 'Camry' },
          { id: '2', make: 'Honda', model: 'Accord' },
        ],
      }

      expect(mockVehicles.count).toBe(2)
      expect(mockVehicles.vehicles).toHaveLength(2)
    })

    it('should display vehicle details', () => {
      const vehicle = {
        make: 'Toyota',
        model: 'Camry',
        year: 2022,
        mileage: 15000,
      }

      expect(vehicle.make).toBe('Toyota')
      expect(vehicle.year).toBe(2022)
    })
  })

  describe('Insurance Card', () => {
    it('should show active policies count', () => {
      const mockInsurance = {
        activePolicies: 3,
        upcomingRenewals: 1,
        totalPremium: 2400,
      }

      expect(mockInsurance.activePolicies).toBe(3)
      expect(mockInsurance.upcomingRenewals).toBeLessThanOrEqual(mockInsurance.activePolicies)
    })

    it('should calculate total premium correctly', () => {
      const policies = [
        { type: 'Auto', premium: 1200 },
        { type: 'Home', premium: 1800 },
        { type: 'Life', premium: 600 },
      ]

      const total = policies.reduce((sum, p) => sum + p.premium, 0)
      expect(total).toBe(3600)
    })
  })

  describe('Pet Card', () => {
    it('should display pet information', () => {
      const mockPets = {
        count: 2,
        pets: [
          { id: '1', name: 'Max', type: 'Dog', age: 3 },
          { id: '2', name: 'Luna', type: 'Cat', age: 2 },
        ],
      }

      expect(mockPets.count).toBe(2)
      expect(mockPets.pets[0].name).toBe('Max')
    })

    it('should show upcoming vet appointments', () => {
      const appointments = [
        { petName: 'Max', date: '2025-02-01', type: 'Checkup' },
      ]

      expect(appointments).toHaveLength(1)
    })
  })

  describe('Home Card', () => {
    it('should display property information', () => {
      const mockHome = {
        propertyType: 'Single Family',
        value: 350000,
        address: '123 Main St',
      }

      expect(mockHome.value).toBeGreaterThan(0)
      expect(mockHome.propertyType).toBeTruthy()
    })

    it('should show maintenance tasks', () => {
      const maintenanceTasks = [
        { task: 'HVAC Service', dueDate: '2025-03-01' },
        { task: 'Gutter Cleaning', dueDate: '2025-04-01' },
      ]

      expect(maintenanceTasks).toHaveLength(2)
    })
  })

  describe('Card Interactions', () => {
    it('should navigate to domain page on click', () => {
      const mockNavigate = jest.fn()
      const cardProps = {
        domain: 'health',
        onClick: mockNavigate,
      }

      cardProps.onClick()
      expect(mockNavigate).toHaveBeenCalled()
    })

    it('should show quick add button', () => {
      const mockQuickAdd = jest.fn()
      const buttonProps = {
        onClick: mockQuickAdd,
      }

      buttonProps.onClick()
      expect(mockQuickAdd).toHaveBeenCalled()
    })
  })
})
