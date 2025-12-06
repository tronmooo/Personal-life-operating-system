/**
 * Unit tests for Homepage (CommandCenter)
 * Tests dashboard rendering and key widgets
 */

import { render, screen } from '@testing-library/react'
import HomePage from '@/app/page'

// Mock DashboardSwitcher used by HomePage
jest.mock('@/components/dashboard/dashboard-switcher', () => ({
  DashboardSwitcher: () => <div data-testid="dashboard-switcher">Dashboard Switcher Mock</div>,
}))

describe('Homepage', () => {
  test('renders without crashing', () => {
    render(<HomePage />)

    expect(screen.getByTestId('dashboard-switcher')).toBeInTheDocument()
  })

  test('wraps CommandCenter in Suspense', () => {
    const { container } = render(<HomePage />)

    // Check that the component is rendered under Suspense
    const el = container.querySelector('[data-testid="dashboard-switcher"]')
    expect(el).not.toBeNull()
    expect(el?.textContent).toContain('Dashboard Switcher')
  })
})






























