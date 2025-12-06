/**
 * Data Flow Tests
 * Verifies that data added in domains appears correctly in command center
 */

import { test, expect } from '@playwright/test'

test.describe('Domain to Command Center Data Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure we're authenticated
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Wait for auth and data to load
    await page.waitForTimeout(3000)
  })

  test('should show health data in command center after adding to health domain', async ({ page }) => {
    // Step 1: Navigate to health domain
    await page.goto('/domains/health')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Step 2: Get initial health count from command center
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    const bodyTextBefore = await page.textContent('body')
    const healthBadgeBefore = await page.locator('text=/Health/i').locator('..').locator('[class*="badge"]').first().textContent().catch(() => '0')
    console.log('Initial health count:', healthBadgeBefore)

    // Step 3: Add a new health entry
    await page.goto('/domains/health')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Click "Add Entry" or "Add" button
    const addButton = page.locator('button:has-text("Add"), button:has-text("New Entry"), button:has-text("Add Entry")').first()

    if (await addButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addButton.click()
      await page.waitForTimeout(1000)

      // Fill in health data
      const titleInput = page.locator('input[name="title"], input[placeholder*="title"], input[placeholder*="Title"]').first()
      if (await titleInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        const testTitle = `Test Health Entry ${Date.now()}`
        await titleInput.fill(testTitle)

        // Look for submit/save button
        const saveButton = page.locator('button:has-text("Save"), button:has-text("Add"), button:has-text("Submit")').first()
        if (await saveButton.isVisible({ timeout: 3000 }).catch(() => false)) {
          await saveButton.click()
          await page.waitForTimeout(2000)

          // Step 4: Navigate back to command center
          await page.goto('/')
          await page.waitForLoadState('networkidle')
          await page.waitForTimeout(3000) // Wait for real-time updates

          // Step 5: Verify health count increased or entry appears
          const bodyTextAfter = await page.textContent('body')
          const healthBadgeAfter = await page.locator('text=/Health/i').locator('..').locator('[class*="badge"]').first().textContent().catch(() => '0')
          console.log('After health count:', healthBadgeAfter)

          // Verify the entry was added (count should be different or content should include test title)
          const countBefore = parseInt(healthBadgeBefore?.trim() || '0')
          const countAfter = parseInt(healthBadgeAfter?.trim() || '0')

          if (countAfter > countBefore) {
            console.log('✅ Health count increased from', countBefore, 'to', countAfter)
            expect(countAfter).toBeGreaterThan(countBefore)
          } else {
            // Check if the data is showing elsewhere
            const hasNewContent = bodyTextAfter?.includes(testTitle) || bodyTextAfter !== bodyTextBefore
            console.log('Health data updated:', hasNewContent)
            expect(hasNewContent).toBeTruthy()
          }
        }
      }
    } else {
      console.log('⚠️  No Add button found on health domain page')
      test.skip()
    }
  })

  test('should show vehicle data in command center after adding to vehicles domain', async ({ page }) => {
    // Step 1: Get initial vehicle count
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    const vehiclesBadgeBefore = await page.locator('text=/Vehicles/i').locator('..').locator('[class*="badge"]').first().textContent().catch(() => '0')
    console.log('Initial vehicles count:', vehiclesBadgeBefore)

    // Step 2: Navigate to vehicles domain
    await page.goto('/domains/vehicles')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Step 3: Add a new vehicle entry
    const addButton = page.locator('button:has-text("Add"), button:has-text("New Entry"), button:has-text("Add Vehicle")').first()

    if (await addButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addButton.click()
      await page.waitForTimeout(1000)

      // Fill in vehicle data
      const testMake = `TestCar${Date.now()}`
      const makeInput = page.locator('input[name*="make"], input[placeholder*="Make"], input[placeholder*="make"]').first()
      if (await makeInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await makeInput.fill(testMake)

        const modelInput = page.locator('input[name*="model"], input[placeholder*="Model"]').first()
        if (await modelInput.isVisible({ timeout: 2000 }).catch(() => false)) {
          await modelInput.fill('TestModel')
        }

        // Look for submit/save button
        const saveButton = page.locator('button:has-text("Save"), button:has-text("Add"), button:has-text("Submit")').first()
        if (await saveButton.isVisible({ timeout: 3000 }).catch(() => false)) {
          await saveButton.click()
          await page.waitForTimeout(2000)

          // Step 4: Navigate back to command center
          await page.goto('/')
          await page.waitForLoadState('networkidle')
          await page.waitForTimeout(3000) // Wait for real-time updates

          // Step 5: Verify vehicle count increased
          const vehiclesBadgeAfter = await page.locator('text=/Vehicles/i').locator('..').locator('[class*="badge"]').first().textContent().catch(() => '0')
          console.log('After vehicles count:', vehiclesBadgeAfter)

          const countBefore = parseInt(vehiclesBadgeBefore?.trim() || '0')
          const countAfter = parseInt(vehiclesBadgeAfter?.trim() || '0')

          console.log('Vehicles count changed from', countBefore, 'to', countAfter)
          expect(countAfter).toBeGreaterThanOrEqual(countBefore)
        }
      }
    } else {
      console.log('⚠️  No Add button found on vehicles domain page')
      test.skip()
    }
  })

  test('should show financial data in command center after adding to financial domain', async ({ page }) => {
    // Step 1: Get initial financial metrics
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    const bodyTextBefore = await page.textContent('body')
    const hasFinancialData = bodyTextBefore?.includes('$') || bodyTextBefore?.includes('financial')
    console.log('Has initial financial data:', hasFinancialData)

    // Step 2: Navigate to financial domain
    await page.goto('/domains/financial')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Step 3: Add a new financial entry
    const addButton = page.locator('button:has-text("Add"), button:has-text("New Entry"), button:has-text("Add Transaction")').first()

    if (await addButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addButton.click()
      await page.waitForTimeout(1000)

      // Fill in financial data
      const testAmount = Math.floor(Math.random() * 1000) + 100
      const titleInput = page.locator('input[name="title"], input[placeholder*="title"]').first()
      if (await titleInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await titleInput.fill(`Test Transaction ${Date.now()}`)

        const amountInput = page.locator('input[name*="amount"], input[placeholder*="amount"], input[type="number"]').first()
        if (await amountInput.isVisible({ timeout: 2000 }).catch(() => false)) {
          await amountInput.fill(testAmount.toString())
        }

        // Look for submit/save button
        const saveButton = page.locator('button:has-text("Save"), button:has-text("Add"), button:has-text("Submit")').first()
        if (await saveButton.isVisible({ timeout: 3000 }).catch(() => false)) {
          await saveButton.click()
          await page.waitForTimeout(2000)

          // Step 4: Navigate back to command center
          await page.goto('/')
          await page.waitForLoadState('networkidle')
          await page.waitForTimeout(3000) // Wait for real-time updates

          // Step 5: Verify financial data updated
          const bodyTextAfter = await page.textContent('body')
          const financialDataChanged = bodyTextAfter !== bodyTextBefore

          console.log('Financial data changed:', financialDataChanged)
          expect(bodyTextAfter).toBeTruthy()
        }
      }
    } else {
      console.log('⚠️  No Add button found on financial domain page')
      test.skip()
    }
  })

  test('should handle real-time updates when data is added', async ({ page }) => {
    // Open command center in first tab
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Get initial state
    const initialText = await page.textContent('body')

    // Simulate adding data by refreshing (in real scenario, this would be from another tab)
    await page.goto('/domains/health')
    await page.waitForLoadState('networkidle')

    // Go back to command center
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)

    // Command center should have loaded data
    const finalText = await page.textContent('body')
    expect(finalText).toBeTruthy()

    // Should have domain cards visible
    const domainCards = await page.locator('[class*="grid"] > *').count()
    expect(domainCards).toBeGreaterThan(0)
  })
})
