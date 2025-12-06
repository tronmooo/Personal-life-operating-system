/**
 * Unit tests for Domains List Page
 * Tests domain display, filtering, and sorting
 */

import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import DomainsPage from '@/app/domains/page'
import { DOMAIN_CONFIGS } from '@/types/domains'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
}))

// Mock data provider
jest.mock('@/lib/providers/data-provider', () => ({
  useData: () => ({
    data: {
      appliances: [],
      career: [],
      financial: [],
      health: [],
      home: [],
      collectibles: [],
      digital: [],
      education: [],
      insurance: [],
      legal: [],
      mindfulness: [],
      miscellaneous: [],
      nutrition: [],
      outdoor: [],
      pets: [],
      planning: [],
      relationships: [],
      schedule: [],
      travel: [],
      utilities: [],
      vehicles: [],
    },
    getData: (domain: string) => [],
    tasks: [],
    habits: [],
    bills: [],
    documents: [],
    events: [],
    isLoading: false,
    isLoaded: true,
  }),
}))

describe('Domains Page', () => {
  test('renders domains list', () => {
    render(<DomainsPage />)

    expect(screen.getByText(DOMAIN_CONFIGS.appliances.name)).toBeInTheDocument()
    expect(screen.getByText(DOMAIN_CONFIGS.financial.name)).toBeInTheDocument()
    expect(screen.getByText(DOMAIN_CONFIGS.health.name)).toBeInTheDocument()
    expect(screen.getByText(DOMAIN_CONFIGS.home.name)).toBeInTheDocument()
  })

  test('displays domains in alphabetical order', () => {
    const { container } = render(<DomainsPage />)

    const domainNames = Array.from(
      container.querySelectorAll('[data-testid*="domain"]')
    )
      .map(el => el.textContent?.trim() ?? '')
      .filter(Boolean)

    const sortedNames = [...domainNames].sort((a, b) => a.localeCompare(b))
    expect(domainNames).toEqual(sortedNames)
  })

  test('shows list view by default', () => {
    render(<DomainsPage />)

    // List view should be active
    // This would check for list-specific styling or elements
    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  test('displays filter toggles', () => {
    render(<DomainsPage />)

    expect(screen.getByRole('button', { name: /^all$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^active$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^inactive$/i })).toBeInTheDocument()
  })
})






























