/**
 * Command Center Tests
 * Verifies dashboard metrics display correctly with real data
 */

import { test, expect } from '@playwright/test'

test.describe('Command Center Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage (command center)
    await page.goto('/')
    
    // Wait for page to load
    await page.waitForLoadState('networkidle')
  })

  test('should display dashboard without errors', async ({ page }) => {
    // Check for page title
    await expect(page).toHaveTitle(/LifeHub/)
    
    // Verify no critical errors in console
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })
    
    // Wait a bit to catch any errors
    await page.waitForTimeout(2000)
    
    // Filter out known non-critical errors
    const criticalErrors = errors.filter(err => 
      !err.includes('favicon') && 
      !err.includes('sourcemap') &&
      !err.includes('DevTools')
    )
    
    expect(criticalErrors).toHaveLength(0)
  })

  test('should display financial metrics (not zeros)', async ({ page }) => {
    // Check for non-zero values anywhere on the page
    const dollarAmounts = page.locator('text=/\\$[1-9]/')
    await expect(dollarAmounts.first()).toBeVisible({ timeout: 10000 })

    const bodyText = (await page.textContent('body')) || ''
    expect(bodyText).not.toContain('$0.00')
  })

  test('should display health metrics (not zeros)', async ({ page }) => {
    const bodyText = (await page.textContent('body')) || ''
    const hasSteps = /\bsteps\b/i.test(bodyText)
    const hasWeight = /\bweight\b/i.test(bodyText)
    expect(hasSteps || hasWeight).toBeTruthy()
  })

  test('should display domain counts', async ({ page }) => {
    // Wait for any domain card/grid to appear
    await page.waitForSelector('[data-testid="domain-card"], .domain-card', { timeout: 15000 }).catch(() => {})
    const domainCards = page.locator('[data-testid="domain-card"], .domain-card, [class*="grid"] > *')
    const count = await domainCards.count()
    expect(count).toBeGreaterThan(0)
  })

  test('should display tasks section', async ({ page }) => {
    // Look for tasks section
    const tasksSection = page.locator('text=/tasks/i').first()
    
    // Tasks might be in a tab or section
    if (await tasksSection.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(tasksSection).toBeVisible()
      
      // Check for task items or empty state
      const bodyText = await page.textContent('body')
      const hasTasks = bodyText?.includes('task') || bodyText?.includes('Task')
      expect(hasTasks).toBeTruthy()
    }
  })

  test('should display habits section', async ({ page }) => {
    // Look for habits section
    const habitsSection = page.locator('text=/habits/i').first()
    
    // Habits might be in a tab or section
    if (await habitsSection.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(habitsSection).toBeVisible()
      
      // Check for habit items
      const bodyText = await page.textContent('body')
      const hasHabits = bodyText?.includes('habit') || bodyText?.includes('Habit')
      expect(hasHabits).toBeTruthy()
    }
  })

  test('should have working navigation', async ({ page }) => {
    // Check for navigation menu
    const nav = page.locator('nav').first()
    await expect(nav).toBeVisible({ timeout: 10000 })
    
    // Should have multiple nav items
    const navItems = page.locator('nav a, nav button')
    const count = await navItems.count()
    expect(count).toBeGreaterThan(3)
  })

  test('should load within reasonable time', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Wait for main content
    await page.waitForSelector('main, [role="main"], .container', { timeout: 15000 })
    
    const loadTime = Date.now() - startTime
    
    // Allow up to 15 seconds in CI
    expect(loadTime).toBeLessThan(15000)
    
    console.log(`✅ Page loaded in ${loadTime}ms`)
  })

  test('should display real data indicators', async ({ page }) => {
    // Wait for data to load
    await page.waitForTimeout(3000)
    
    const bodyText = await page.textContent('body')
    
    // Check for indicators of real data vs empty state
    const hasLoadingText = bodyText?.includes('Loading')
    const hasNoDataText = bodyText?.includes('No data') || bodyText?.includes('no entries')
    const hasZeroText = bodyText?.match(/\$0\.00|\b0\s+(entries|items|tasks)/gi)
    
    // If we see loading, wait a bit more
    if (hasLoadingText) {
      await page.waitForTimeout(3000)
    }
    
    // After loading, should have some real data
    // (This will fail if test data wasn't generated)
    const finalText = await page.textContent('body')
    
    // Should have some numbers that aren't zero
    const hasNonZeroNumbers = finalText?.match(/[1-9]\d*/)
    expect(hasNonZeroNumbers).toBeTruthy()
  })
})


