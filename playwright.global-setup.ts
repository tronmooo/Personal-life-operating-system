import { chromium, FullConfig } from '@playwright/test'
import fs from 'fs'
import path from 'path'

async function globalSetup(config: FullConfig) {
  const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'
  const storageDir = path.resolve(process.cwd(), '.auth')
  const storageStatePath = path.join(storageDir, 'storage-state.json')

  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true })
  }

  const email = process.env.TEST_USER_EMAIL || 'e2e@test.com'
  const password = process.env.TEST_USER_PASSWORD || 'Test1234!'

  const browser = await chromium.launch()
  const context = await browser.newContext({ baseURL })

  // Visit home once to ensure state is initialized
  const page = await context.newPage()
  await page.goto('/')
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {})

  // Navigate to sign-in and perform UI login (works with NextAuth or custom pages)
  try {
    await page.goto('/auth/signin', { waitUntil: 'domcontentloaded' })
    // Try common email/password selectors
    const emailSelectors = [
      'input[name="email"]',
      'input[type="email"]',
      'input[placeholder*="email" i]'
    ]
    const passwordSelectors = [
      'input[name="password"]',
      'input[type="password"]',
      'input[placeholder*="password" i]'
    ]
    const submitSelectors = [
      'button[type="submit"]',
      'button:has-text("Sign in")',
      'button:has-text("Log in")'
    ]

    let emailBox = null
    for (const sel of emailSelectors) {
      const loc = page.locator(sel)
      if (await loc.first().isVisible().catch(() => false)) { emailBox = loc.first(); break }
    }
    let passwordBox = null
    for (const sel of passwordSelectors) {
      const loc = page.locator(sel)
      if (await loc.first().isVisible().catch(() => false)) { passwordBox = loc.first(); break }
    }
    let submitBtn = null
    for (const sel of submitSelectors) {
      const loc = page.locator(sel)
      if (await loc.first().isVisible().catch(() => false)) { submitBtn = loc.first(); break }
    }

    if (emailBox && passwordBox && submitBtn) {
      await emailBox.fill(email)
      await passwordBox.fill(password)
      await submitBtn.click()
      // Wait for redirect to any authenticated page
      await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {})
    } else {
      // If no login form, continue; app might be publicly accessible
      console.warn('⚠️  Login form not found on /auth/signin; proceeding without UI login')
    }
  } catch (e) {
    console.warn('⚠️  UI login step failed; proceeding with whatever state is available')
  }

  await context.storageState({ path: storageStatePath })
  await browser.close()
}

export default globalSetup
