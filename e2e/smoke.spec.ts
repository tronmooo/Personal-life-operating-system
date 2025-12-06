import { test, expect } from '@playwright/test'

test('home renders and navigates to finance page', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/LifeHub|Next.js|Home/i)
  await page.goto('/finance')
  await expect(page).toHaveURL(/\/finance/)
})





