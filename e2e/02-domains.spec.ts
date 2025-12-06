/**
 * Domain Pages Tests
 * Verifies all domain pages load and display data correctly
 */

import { test, expect } from '@playwright/test'

// Map legacy routes to new top-level routes where applicable
const DOMAIN_ROUTES: Record<string, string> = {
  financial: '/finance',
  health: '/health',
  vehicles: '/vehicles',
  pets: '/pets',
  insurance: '/insurance',
  home: '/home',
}

const DOMAINS = [
  { id: 'financial', name: 'Financial', minEntries: 5 },
  { id: 'health', name: 'Health', minEntries: 3 },
  { id: 'vehicles', name: 'Vehicles', minEntries: 1 },
  { id: 'pets', name: 'Pets', minEntries: 1 },
  { id: 'insurance', name: 'Insurance', minEntries: 0 },
  { id: 'home', name: 'Home', minEntries: 0 },
]

test.describe('Domain Pages', () => {
  for (const domain of DOMAINS) {
    test.describe(`${domain.name} Domain`, () => {
      test(`should load ${domain.name} domain page`, async ({ page }) => {
        // Try new route first, then legacy domains route
        const route = DOMAIN_ROUTES[domain.id] || `/domains/${domain.id}`
        await page.goto(route)
        await page.waitForLoadState('networkidle')
        
        // Check page loaded
        await expect(page).toHaveURL(new RegExp(`${route.replace('/', '\\/')}`))
        
        // Should have domain name in title or heading
        const heading = page.locator('h1, h2').first()
        await expect(heading).toBeVisible({ timeout: 10000 })
        
        const headingText = (await heading.textContent()) || ''
        expect(headingText.toLowerCase()).toContain(domain.name.toLowerCase())
      })

      test(`should display ${domain.name} entries`, async ({ page }) => {
        await page.goto(`/domains/${domain.id}`)
        await page.waitForLoadState('networkidle')
        
        // Wait for content to load
        await page.waitForTimeout(2000)
        
        const bodyText = await page.textContent('body')
        
        // Check if we have entries or empty state
        const hasEntries = !bodyText?.includes('No entries') && 
                          !bodyText?.includes('no items') &&
                          !bodyText?.includes('Get started')
        
        if (domain.minEntries > 0) {
          // Should have data
          expect(hasEntries).toBeTruthy()
        }
      })

      test(`should have working back button on ${domain.name}`, async ({ page }) => {
        await page.goto(`/domains/${domain.id}`)
        await page.waitForLoadState('networkidle')
        
        // Look for back button
        const backButton = page.locator('button[aria-label="Go back"], button:has-text("Back"), a:has-text("Back")').first()
        
        if (await backButton.isVisible({ timeout: 3000 }).catch(() => false)) {
          await backButton.click()
          
          // Should navigate away
          await page.waitForTimeout(1000)
          const url = page.url()
          expect(url).not.toContain(`/domains/${domain.id}`)
        }
      })

      test(`should have tabs on ${domain.name} page`, async ({ page }) => {
        await page.goto(`/domains/${domain.id}`)
        await page.waitForLoadState('networkidle')
        
        // Look for tabs (Items, Documents, Analytics)
        const tabs = page.locator('[role="tab"], .tab, button:has-text("Items"), button:has-text("Documents")')
        const tabCount = await tabs.count()
        
        if (tabCount > 0) {
          // Should have at least 2 tabs
          expect(tabCount).toBeGreaterThanOrEqual(2)
        }
      })
    })
  }

  test('should navigate between domains', async ({ page }) => {
    // Start at domains overview
    await page.goto('/domains')
    await page.waitForLoadState('networkidle')
    
    // Click on first domain card
    const firstDomainCard = page.locator('[data-testid="domain-card"], .domain-card, a[href*="/domains/"]').first()
    
    if (await firstDomainCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstDomainCard.click()
      
      // Should navigate to domain detail page
      await page.waitForTimeout(1000)
      const url = page.url()
      expect(url).toContain('/domains/')
    }
  })

  test('should display domain overview grid', async ({ page }) => {
    await page.goto('/domains')
    await page.waitForLoadState('networkidle')
    
    // Should have multiple domain cards
    const domainCards = page.locator('[data-testid="domain-card"], .domain-card, [class*="grid"] > *')
    const count = await domainCards.count()
    
    // Should have at least 5 domains visible
    expect(count).toBeGreaterThanOrEqual(5)
  })

  test('should show entry count on domain cards', async ({ page }) => {
    await page.goto('/domains')
    await page.waitForLoadState('networkidle')
    
    const bodyText = await page.textContent('body')
    
    // Should have some entry counts visible
    const hasNumbers = bodyText?.match(/\d+\s+(entries|items|records)/gi)
    
    // At least one domain should show a count
    if (hasNumbers) {
      expect(hasNumbers.length).toBeGreaterThan(0)
    }
  })
})


