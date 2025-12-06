import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  globalSetup: './playwright.global-setup.ts',
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
    storageState: './.auth/storage-state.json',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})




