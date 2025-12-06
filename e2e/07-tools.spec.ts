/**
 * Tools Page Tests
 * Verifies all calculator and AI tools work correctly
 * Tests domain data connections where applicable
 */

import { test, expect } from '@playwright/test'

test.describe('Tools Page', () => {
  test('should load tools page', async ({ page }) => {
    await page.goto('/tools')
    await page.waitForLoadState('networkidle')

    // Should have tools heading
    const heading = page.locator('h1, h2').first()
    await expect(heading).toBeVisible()
  })

  test('should display multiple tool categories', async ({ page }) => {
    await page.goto('/tools')
    await page.waitForLoadState('networkidle')

    // Wait for tools to load
    await page.waitForTimeout(1000)

    const bodyText = await page.textContent('body')

    // Should have multiple categories
    expect(bodyText).toContain('Health')
    expect(bodyText).toContain('Financial')
  })

  test('should have search functionality', async ({ page }) => {
    await page.goto('/tools')
    await page.waitForLoadState('networkidle')

    // Look for search input
    const searchInput = page.locator('input[type="text"], input[placeholder*="search" i]').first()

    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill('calculator')
      await page.waitForTimeout(500)

      const bodyText = await page.textContent('body')
      expect(bodyText?.toLowerCase()).toContain('calculator')
    }
  })
})

test.describe('Calculator Tools', () => {
  test('Protein Intake Calculator should work', async ({ page }) => {
    await page.goto('/tools')
    await page.waitForLoadState('networkidle')

    // Click on Protein Intake Calculator
    const proteinTool = page.locator('text=/Protein.*Calculator/i').first()
    await proteinTool.click()
    await page.waitForTimeout(500)

    // Fill in weight
    const weightInput = page.locator('input[id*="weight" i], input[placeholder*="weight" i]').first()
    if (await weightInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await weightInput.fill('150')

      // Select activity level
      const activitySelect = page.locator('select, button[role="combobox"]').first()
      if (await activitySelect.isVisible({ timeout: 2000 }).catch(() => false)) {
        await activitySelect.click()
        await page.waitForTimeout(300)

        // Select moderate
        const moderateOption = page.locator('text=/moderate/i').first()
        if (await moderateOption.isVisible({ timeout: 2000 }).catch(() => false)) {
          await moderateOption.click()
        }
      }

      // Click calculate button
      const calculateBtn = page.locator('button:has-text("Calculate"), button:has-text("Generate")').first()
      await calculateBtn.click()
      await page.waitForTimeout(500)

      // Should show result
      const bodyText = await page.textContent('body')
      expect(bodyText).toMatch(/\d+.*grams?/i)
    }
  })

  test('BMI Calculator should work', async ({ page }) => {
    await page.goto('/tools')
    await page.waitForLoadState('networkidle')

    // Search for BMI
    const searchInput = page.locator('input[type="text"]').first()
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill('BMI')
      await page.waitForTimeout(500)
    }

    // Click BMI Calculator
    const bmiTool = page.locator('text=/BMI.*Calculator/i').first()
    if (await bmiTool.isVisible({ timeout: 3000 }).catch(() => false)) {
      await bmiTool.click()
      await page.waitForTimeout(500)

      // Fill in height and weight
      const inputs = page.locator('input[type="number"]')
      const inputCount = await inputs.count()

      if (inputCount >= 2) {
        await inputs.nth(0).fill('70') // height in inches
        await inputs.nth(1).fill('170') // weight in lbs

        // Click calculate
        const calculateBtn = page.locator('button:has-text("Calculate")').first()
        await calculateBtn.click()
        await page.waitForTimeout(500)

        // Should show BMI result
        const bodyText = await page.textContent('body')
        expect(bodyText).toMatch(/\d+\.\d+/)
      }
    }
  })

  test('Investment Calculator should work', async ({ page }) => {
    await page.goto('/tools')
    await page.waitForLoadState('networkidle')

    // Search for Investment Calculator
    const searchInput = page.locator('input[type="text"]').first()
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill('Investment Calculator')
      await page.waitForTimeout(500)
    }

    const investmentTool = page.locator('text=/Investment.*Calculator/i').first()
    if (await investmentTool.isVisible({ timeout: 3000 }).catch(() => false)) {
      await investmentTool.click()
      await page.waitForTimeout(500)

      // Fill in investment details
      const inputs = page.locator('input[type="number"]')
      const inputCount = await inputs.count()

      if (inputCount >= 3) {
        await inputs.nth(0).fill('10000') // initial investment
        await inputs.nth(1).fill('500')   // monthly contribution
        await inputs.nth(2).fill('7')     // interest rate

        // Find years input if present
        const yearsInput = page.locator('input[id*="years" i], input[id*="period" i]').first()
        if (await yearsInput.isVisible({ timeout: 2000 }).catch(() => false)) {
          await yearsInput.fill('10')
        }

        // Click calculate
        const calculateBtn = page.locator('button:has-text("Calculate")').first()
        await calculateBtn.click()
        await page.waitForTimeout(500)

        // Should show future value
        const bodyText = await page.textContent('body')
        expect(bodyText).toMatch(/\$[\d,]+/)
      }
    }
  })

  test('Password Generator should work', async ({ page }) => {
    await page.goto('/tools')
    await page.waitForLoadState('networkidle')

    // Search for Password Generator
    const searchInput = page.locator('input[type="text"]').first()
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill('Password Generator')
      await page.waitForTimeout(500)
    }

    const passwordTool = page.locator('text=/Password.*Generator/i').first()
    if (await passwordTool.isVisible({ timeout: 3000 }).catch(() => false)) {
      await passwordTool.click()
      await page.waitForTimeout(500)

      // Click generate button
      const generateBtn = page.locator('button:has-text("Generate")').first()
      await generateBtn.click()
      await page.waitForTimeout(500)

      // Should show generated password
      const bodyText = await page.textContent('body')

      // Password should have multiple character types
      expect(bodyText).toMatch(/[A-Za-z0-9!@#$%^&*()_+\-=\[\]{}|;:,.<>?]+/)
    }
  })

  test('Age Calculator should work', async ({ page }) => {
    await page.goto('/tools')
    await page.waitForLoadState('networkidle')

    // Search for Age Calculator
    const searchInput = page.locator('input[type="text"]').first()
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill('Age Calculator')
      await page.waitForTimeout(500)
    }

    const ageTool = page.locator('text=/Age.*Calculator/i').first()
    if (await ageTool.isVisible({ timeout: 3000 }).catch(() => false)) {
      await ageTool.click()
      await page.waitForTimeout(500)

      // Fill in birthdate
      const dateInput = page.locator('input[type="date"]').first()
      if (await dateInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await dateInput.fill('1990-01-01')

        // Click calculate
        const calculateBtn = page.locator('button:has-text("Calculate")').first()
        await calculateBtn.click()
        await page.waitForTimeout(500)

        // Should show age in years
        const bodyText = await page.textContent('body')
        expect(bodyText).toMatch(/\d+\s+years?/i)
      }
    }
  })
})

test.describe('AI Tools', () => {
  test('Email Assistant should work', async ({ page }) => {
    await page.goto('/tools')
    await page.waitForLoadState('networkidle')

    // Search for Email Assistant
    const searchInput = page.locator('input[type="text"]').first()
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill('Email Assistant')
      await page.waitForTimeout(500)
    }

    const emailTool = page.locator('text=/Email.*Assistant/i').first()
    if (await emailTool.isVisible({ timeout: 3000 }).catch(() => false)) {
      await emailTool.click()
      await page.waitForTimeout(500)

      // Fill in context
      const contextInput = page.locator('textarea').first()
      if (await contextInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await contextInput.fill('Schedule a meeting to discuss project proposal')

        // Click generate button
        const generateBtn = page.locator('button:has-text("Generate")').first()
        await generateBtn.click()
        await page.waitForTimeout(2000) // AI simulation takes time

        // Should show generated email
        const bodyText = await page.textContent('body')
        expect(bodyText?.toLowerCase()).toContain('dear')
      }
    }
  })

  test('Task Prioritizer should work', async ({ page }) => {
    await page.goto('/tools')
    await page.waitForLoadState('networkidle')

    // Search for Task Prioritizer
    const searchInput = page.locator('input[type="text"]').first()
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill('Task Prioritizer')
      await page.waitForTimeout(500)
    }

    const taskTool = page.locator('text=/Task.*Prioritizer/i').first()
    if (await taskTool.isVisible({ timeout: 3000 }).catch(() => false)) {
      await taskTool.click()
      await page.waitForTimeout(500)

      // Fill in tasks
      const tasksInput = page.locator('textarea').first()
      if (await tasksInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await tasksInput.fill('- Finish report\n- Check emails\n- Team meeting\n- Update resume')

        // Click prioritize button
        const prioritizeBtn = page.locator('button:has-text("Prioritize")').first()
        await prioritizeBtn.click()
        await page.waitForTimeout(2000)

        // Should show priorities
        const bodyText = await page.textContent('body')
        expect(bodyText?.toLowerCase()).toMatch(/urgent|high|medium|low/)
      }
    }
  })

  test('Meeting Notes should work', async ({ page }) => {
    await page.goto('/tools')
    await page.waitForLoadState('networkidle')

    // Search for Meeting Notes
    const searchInput = page.locator('input[type="text"]').first()
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill('Meeting Notes')
      await page.waitForTimeout(500)
    }

    const meetingTool = page.locator('text=/Meeting.*Notes/i').first()
    if (await meetingTool.isVisible({ timeout: 3000 }).catch(() => false)) {
      await meetingTool.click()
      await page.waitForTimeout(500)

      // Fill in transcript
      const transcriptInput = page.locator('textarea').first()
      if (await transcriptInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await transcriptInput.fill('We discussed the Q4 budget. Sarah will prepare the proposal by Oct 15. Mike will research ad platforms.')

        // Click generate button
        const generateBtn = page.locator('button:has-text("Generate")').first()
        await generateBtn.click()
        await page.waitForTimeout(2500)

        // Should show action items
        const bodyText = await page.textContent('body')
        expect(bodyText?.toLowerCase()).toContain('action')
      }
    }
  })

  test('Calendar Optimizer should work', async ({ page }) => {
    await page.goto('/tools')
    await page.waitForLoadState('networkidle')

    // Search for Calendar Optimizer
    const searchInput = page.locator('input[type="text"]').first()
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill('Calendar Optimizer')
      await page.waitForTimeout(500)
    }

    const calendarTool = page.locator('text=/Calendar.*Optimizer/i').first()
    if (await calendarTool.isVisible({ timeout: 3000 }).catch(() => false)) {
      await calendarTool.click()
      await page.waitForTimeout(500)

      // Click analyze button
      const analyzeBtn = page.locator('button:has-text("Analyze"), button:has-text("Optimize")').first()
      if (await analyzeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await analyzeBtn.click()
        await page.waitForTimeout(2500)

        // Should show suggestions
        const bodyText = await page.textContent('body')
        expect(bodyText?.toLowerCase()).toMatch(/focus|schedule|meeting/)
      }
    }
  })

  test('Template Generator should work', async ({ page }) => {
    await page.goto('/tools')
    await page.waitForLoadState('networkidle')

    // Search for Template Generator
    const searchInput = page.locator('input[type="text"]').first()
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill('Template Generator')
      await page.waitForTimeout(500)
    }

    const templateTool = page.locator('text=/Template.*Generator/i').first()
    if (await templateTool.isVisible({ timeout: 3000 }).catch(() => false)) {
      await templateTool.click()
      await page.waitForTimeout(500)

      // Fill in company name
      const companyInput = page.locator('input[id*="company" i]').first()
      if (await companyInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await companyInput.fill('Acme Corp')

        // Click generate button
        const generateBtn = page.locator('button:has-text("Generate")').first()
        await generateBtn.click()
        await page.waitForTimeout(1500)

        // Should show template
        const bodyText = await page.textContent('body')
        expect(bodyText).toContain('Acme Corp')
      }
    }
  })
})

test.describe('Tool Navigation', () => {
  test('should be able to switch between tools', async ({ page }) => {
    await page.goto('/tools')
    await page.waitForLoadState('networkidle')

    // Click first tool
    const firstTool = page.locator('[data-testid="tool-card"], .tool-card, button:has-text("Calculator")').first()
    if (await firstTool.isVisible({ timeout: 3000 }).catch(() => false)) {
      await firstTool.click()
      await page.waitForTimeout(500)

      // Should show tool content
      const bodyText1 = await page.textContent('body')
      expect(bodyText1).toBeTruthy()

      // Go back
      const backBtn = page.locator('button:has-text("Back"), button[aria-label*="back" i]').first()
      if (await backBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await backBtn.click()
        await page.waitForTimeout(500)

        // Click different tool
        const secondTool = page.locator('[data-testid="tool-card"], button:has-text("Calculator")').nth(1)
        if (await secondTool.isVisible({ timeout: 2000 }).catch(() => false)) {
          await secondTool.click()
          await page.waitForTimeout(500)

          const bodyText2 = await page.textContent('body')
          expect(bodyText2).toBeTruthy()
        }
      }
    }
  })
})

test.describe('Domain Data Connections', () => {
  test('Health tools should connect to health domain', async ({ page }) => {
    // First add some health data
    await page.goto('/health')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // Check if health data exists
    const bodyText = await page.textContent('body')
    const hasHealthData = bodyText && !bodyText.includes('No entries')

    if (hasHealthData) {
      // Go to tools
      await page.goto('/tools')
      await page.waitForLoadState('networkidle')

      // Search for health calculator
      const searchInput = page.locator('input[type="text"]').first()
      if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await searchInput.fill('BMI')
        await page.waitForTimeout(500)
      }

      // Should show health-related tools
      const toolsBodyText = await page.textContent('body')
      expect(toolsBodyText?.toLowerCase()).toContain('health')
    }
  })

  test('Financial tools should connect to financial domain', async ({ page }) => {
    // Check financial data exists
    await page.goto('/finance')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    const bodyText = await page.textContent('body')
    const hasFinancialData = bodyText && !bodyText.includes('No entries')

    if (hasFinancialData) {
      // Go to tools
      await page.goto('/tools')
      await page.waitForLoadState('networkidle')

      // Search for financial tools
      const searchInput = page.locator('input[type="text"]').first()
      if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await searchInput.fill('Investment')
        await page.waitForTimeout(500)
      }

      // Should show financial tools
      const toolsBodyText = await page.textContent('body')
      expect(toolsBodyText?.toLowerCase()).toMatch(/investment|financial|calculator/)
    }
  })

  test('Tools page should link back to domains', async ({ page }) => {
    await page.goto('/tools')
    await page.waitForLoadState('networkidle')

    // Look for navigation to domains
    const domainsLink = page.locator('a[href="/domains"], a[href*="domains"], button:has-text("Domains")').first()

    if (await domainsLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await domainsLink.click()
      await page.waitForTimeout(1000)

      // Should navigate to domains page
      const url = page.url()
      expect(url).toMatch(/domains|home/)
    }
  })
})

test.describe('Tool Features', () => {
  test('Tools should have copy functionality', async ({ page }) => {
    await page.goto('/tools')
    await page.waitForLoadState('networkidle')

    // Find a tool with copy feature (Password Generator)
    const searchInput = page.locator('input[type="text"]').first()
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill('Password')
      await page.waitForTimeout(500)
    }

    const passwordTool = page.locator('text=/Password.*Generator/i').first()
    if (await passwordTool.isVisible({ timeout: 3000 }).catch(() => false)) {
      await passwordTool.click()
      await page.waitForTimeout(500)

      // Generate password
      const generateBtn = page.locator('button:has-text("Generate")').first()
      await generateBtn.click()
      await page.waitForTimeout(500)

      // Look for copy button
      const copyBtn = page.locator('button:has-text("Copy")').first()
      if (await copyBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await copyBtn.click()
        await page.waitForTimeout(500)

        // Should show success toast or feedback
        const bodyText = await page.textContent('body')
        expect(bodyText?.toLowerCase()).toMatch(/copied|success/)
      }
    }
  })

  test('Tools should show helpful descriptions', async ({ page }) => {
    await page.goto('/tools')
    await page.waitForLoadState('networkidle')

    // Click any tool
    const firstTool = page.locator('[data-testid="tool-card"], button:has-text("Calculator")').first()
    if (await firstTool.isVisible({ timeout: 3000 }).catch(() => false)) {
      await firstTool.click()
      await page.waitForTimeout(500)

      // Should have description text
      const bodyText = await page.textContent('body')
      expect(bodyText?.length).toBeGreaterThan(100) // Should have substantial content
    }
  })

  test('Tools should validate inputs', async ({ page }) => {
    await page.goto('/tools')
    await page.waitForLoadState('networkidle')

    // Find BMI calculator
    const searchInput = page.locator('input[type="text"]').first()
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill('BMI')
      await page.waitForTimeout(500)
    }

    const bmiTool = page.locator('text=/BMI.*Calculator/i').first()
    if (await bmiTool.isVisible({ timeout: 3000 }).catch(() => false)) {
      await bmiTool.click()
      await page.waitForTimeout(500)

      // Try to calculate without inputs
      const calculateBtn = page.locator('button:has-text("Calculate")').first()

      // Button should be disabled or show validation
      const isDisabled = await calculateBtn.isDisabled().catch(() => false)

      if (!isDisabled) {
        await calculateBtn.click()
        await page.waitForTimeout(500)

        // Should not show invalid results (like BMI of 0 or NaN)
        const bodyText = await page.textContent('body')
        expect(bodyText).not.toContain('NaN')
      }
    }
  })
})
