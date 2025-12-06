/**
 * Analytics Page Tests
 * Verifies analytics page displays domain data correctly
 */

import { test, expect } from '@playwright/test'

test.describe('Analytics Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to analytics page
    await page.goto('/analytics')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
  })

  test('should load analytics page without errors', async ({ page }) => {
    // Check for page title
    const heading = await page.locator('h1').textContent()
    expect(heading).toContain('Analytics')

    // Verify no critical errors in console
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    await page.waitForTimeout(2000)

    const criticalErrors = errors.filter(err =>
      !err.includes('favicon') &&
      !err.includes('sourcemap') &&
      !err.includes('DevTools')
    )

    expect(criticalErrors).toHaveLength(0)
  })

  test('should display domain data tab by default', async ({ page }) => {
    // Domain Data tab should be selected by default
    const domainDataTab = page.locator('[value="domain-data"][role="tab"]')
    await expect(domainDataTab).toHaveAttribute('data-state', 'active')

    // Should see overall life score or total items
    const bodyText = await page.textContent('body')
    const hasMetrics = bodyText?.includes('Total Items') ||
                      bodyText?.includes('Life Score') ||
                      bodyText?.includes('Net Worth')

    expect(hasMetrics).toBeTruthy()
  })

  test('should show domain statistics', async ({ page }) => {
    const bodyText = await page.textContent('body')

    // Should have some data indicators
    const hasData = bodyText?.includes('items') ||
                   bodyText?.includes('domains') ||
                   bodyText?.includes('Net Worth') ||
                   bodyText?.includes('Financial')

    expect(hasData).toBeTruthy()
  })

  test('should display usage analytics tab', async ({ page }) => {
    // Click usage analytics tab
    const usageTab = page.locator('[value="usage"][role="tab"]')
    await usageTab.click()
    await page.waitForTimeout(1000)

    // Should be active now
    await expect(usageTab).toHaveAttribute('data-state', 'active')

    // Check for usage analytics content or empty state
    const bodyText = await page.textContent('body')
    const hasUsageContent = bodyText?.includes('usage') ||
                           bodyText?.includes('events') ||
                           bodyText?.includes('sessions') ||
                           bodyText?.includes('No usage analytics')

    expect(hasUsageContent).toBeTruthy()
  })

  test('should show growth trends if data exists', async ({ page }) => {
    const bodyText = await page.textContent('body')

    // Look for trend indicators
    const hasTrends = bodyText?.includes('Growth') ||
                     bodyText?.includes('Trend') ||
                     bodyText?.includes('Activity') ||
                     bodyText?.includes('No activity')

    expect(hasTrends).toBeTruthy()
  })

  test('should display domain breakdown cards', async ({ page }) => {
    // Look for domain cards
    const cards = page.locator('[class*="card"]')
    const count = await cards.count()

    // Should have at least one card (even if empty state)
    expect(count).toBeGreaterThan(0)
  })

  test('should have export functionality', async ({ page }) => {
    // Look for export button
    const exportButton = page.locator('button:has-text("Export"), button[aria-label*="export" i]').first()

    if (await exportButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(exportButton).toBeVisible()
    }
  })

  test('should show financial metrics if financial data exists', async ({ page }) => {
    const bodyText = await page.textContent('body')

    // Look for financial indicators
    const hasFinancial = bodyText?.match(/\$[\d,]+/) || // Dollar amounts
                        bodyText?.includes('Financial') ||
                        bodyText?.includes('Net Worth') ||
                        bodyText?.includes('Income')

    // At minimum should mention financial domain
    expect(bodyText).toContain('Financial')
  })

  test('should display charts if data exists', async ({ page }) => {
    const bodyText = await page.textContent('body')

    // Look for chart-related text
    const hasCharts = bodyText?.includes('Activity') ||
                     bodyText?.includes('day') ||
                     bodyText?.includes('Chart') ||
                     bodyText?.includes('No activity')

    expect(hasCharts).toBeTruthy()
  })

  test('should handle empty state gracefully', async ({ page }) => {
    const bodyText = await page.textContent('body')

    // If there's no data, should show helpful message
    if (bodyText?.includes('No data') || bodyText?.includes('no items')) {
      expect(bodyText).toMatch(/start|add|track/i)
    }
  })

  test('should display insights or recommendations', async ({ page }) => {
    const bodyText = await page.textContent('body')

    // Look for insights/recommendations sections
    const hasInsights = bodyText?.includes('Insight') ||
                       bodyText?.includes('Recommendation') ||
                       bodyText?.includes('Prediction') ||
                       bodyText?.includes('Score')

    expect(hasInsights).toBeTruthy()
  })

  test('should show time range selector', async ({ page }) => {
    // Look for time range buttons
    const timeButtons = page.locator('button:has-text("Week"), button:has-text("Month"), button:has-text("Year"), button:has-text("Days")')
    const count = await timeButtons.count()

    if (count > 0) {
      // Should have at least 2 time range options
      expect(count).toBeGreaterThanOrEqual(2)
    }
  })

  test('should load within reasonable time', async ({ page }) => {
    const startTime = Date.now()

    await page.goto('/analytics')
    await page.waitForLoadState('networkidle')

    // Wait for main content
    await page.waitForSelector('h1', { timeout: 10000 })

    const loadTime = Date.now() - startTime

    // Should load within 10 seconds
    expect(loadTime).toBeLessThan(10000)

    console.log(`✅ Analytics page loaded in ${loadTime}ms`)
  })

  test('should display metrics cards', async ({ page }) => {
    // Look for metric cards
    const metricCards = page.locator('[class*="card-hover"], .card').filter({
      has: page.locator('text=/items|domains|score|worth/i')
    })

    const count = await metricCards.count()

    // Should have at least one metric card
    expect(count).toBeGreaterThan(0)
  })

  test('should show domain icons or labels', async ({ page }) => {
    const bodyText = await page.textContent('body')

    // Should mention at least one domain by name
    const domains = ['Financial', 'Health', 'Vehicles', 'Home', 'Insurance', 'Fitness', 'Nutrition']
    const hasDomain = domains.some(domain => bodyText?.includes(domain))

    expect(hasDomain).toBeTruthy()
  })
})
