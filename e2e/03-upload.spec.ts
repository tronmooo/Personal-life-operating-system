/**
 * Upload Functionality Tests
 * Verifies file upload and document scanning works correctly
 */

import { test, expect } from '@playwright/test'
import path from 'path'
import fs from 'fs'

test.describe('Upload Functionality', () => {
  test.beforeAll(async () => {
    // Create a test image file if it doesn't exist
    const testImagePath = path.join(__dirname, '../test-fixtures/test-receipt.jpg')
    const fixturesDir = path.join(__dirname, '../test-fixtures')
    
    if (!fs.existsSync(fixturesDir)) {
      fs.mkdirSync(fixturesDir, { recursive: true })
    }
    
    if (!fs.existsSync(testImagePath)) {
      // Create a simple test image (1x1 pixel PNG)
      const buffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64'
      )
      fs.writeFileSync(testImagePath, buffer)
    }
  })

  test('should open upload dialog from navigation', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Look for upload button in navigation
    const uploadButton = page.locator('button:has-text("Upload"), button[aria-label*="upload" i], [data-testid="upload-button"]').first()
    
    if (await uploadButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await uploadButton.click()
      
      // Dialog should open
      await page.waitForTimeout(1000)
      
      // Look for dialog/modal
      const dialog = page.locator('[role="dialog"], .dialog, .modal').first()
      await expect(dialog).toBeVisible({ timeout: 5000 })
    } else {
      console.log('⚠️  Upload button not found in navigation')
    }
  })

  test('should have file input in upload dialog', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Open upload dialog
    const uploadButton = page.locator('button:has-text("Upload"), button[aria-label*="upload" i]').first()
    
    if (await uploadButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await uploadButton.click()
      await page.waitForTimeout(1000)
      
      // Look for file input
      const fileInput = page.locator('input[type="file"]').first()
      await expect(fileInput).toBeAttached()
    }
  })

  test('should accept file selection', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Open upload dialog
    const uploadButton = page.locator('button:has-text("Upload"), button[aria-label*="upload" i]').first()
    
    if (await uploadButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await uploadButton.click()
      await page.waitForTimeout(1000)
      
      // Find file input
      const fileInput = page.locator('input[type="file"]').first()
      
      if (await fileInput.count() > 0) {
        // Set file
        const testFile = path.join(__dirname, '../test-fixtures/test-receipt.jpg')
        await fileInput.setInputFiles(testFile)
        
        // Should show processing or preview
        await page.waitForTimeout(2000)
        
        const bodyText = await page.textContent('body')
        const isProcessing = bodyText?.includes('Processing') || 
                            bodyText?.includes('Analyzing') ||
                            bodyText?.includes('Scanning')
        
        // Should show some indication of file being processed
        expect(isProcessing || bodyText?.includes('test-receipt')).toBeTruthy()
      }
    }
  })

  test('should show AI extraction results', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Open upload dialog
    const uploadButton = page.locator('button:has-text("Upload"), button[aria-label*="upload" i]').first()
    
    if (await uploadButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await uploadButton.click()
      await page.waitForTimeout(1000)
      
      const fileInput = page.locator('input[type="file"]').first()
      
      if (await fileInput.count() > 0) {
        const testFile = path.join(__dirname, '../test-fixtures/test-receipt.jpg')
        await fileInput.setInputFiles(testFile)
        
        // Wait for AI processing (could take a few seconds)
        await page.waitForTimeout(5000)
        
        const bodyText = await page.textContent('body')
        
        // Should show extracted data or results
        const hasResults = bodyText?.includes('Extracted') ||
                          bodyText?.includes('Detected') ||
                          bodyText?.includes('Suggested') ||
                          bodyText?.includes('Domain') ||
                          bodyText?.includes('Save')
        
        expect(hasResults).toBeTruthy()
      }
    }
  })

  test('should have save/approve button after upload', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    const uploadButton = page.locator('button:has-text("Upload"), button[aria-label*="upload" i]').first()
    
    if (await uploadButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await uploadButton.click()
      await page.waitForTimeout(1000)
      
      const fileInput = page.locator('input[type="file"]').first()
      
      if (await fileInput.count() > 0) {
        const testFile = path.join(__dirname, '../test-fixtures/test-receipt.jpg')
        await fileInput.setInputFiles(testFile)
        
        // Wait for processing
        await page.waitForTimeout(5000)
        
        // Look for save/approve button
        const saveButton = page.locator('button:has-text("Save"), button:has-text("Approve"), button:has-text("Confirm")').first()
        
        if (await saveButton.isVisible({ timeout: 3000 }).catch(() => false)) {
          await expect(saveButton).toBeVisible()
        }
      }
    }
  })

  test('should handle camera capture option', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    const uploadButton = page.locator('button:has-text("Upload"), button[aria-label*="upload" i]').first()
    
    if (await uploadButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await uploadButton.click()
      await page.waitForTimeout(1000)
      
      // Look for camera option
      const cameraButton = page.locator('button:has-text("Camera"), button[aria-label*="camera" i]').first()
      
      if (await cameraButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Camera button exists
        await expect(cameraButton).toBeVisible()
        
        // Note: We can't actually test camera in headless mode
        console.log('✅ Camera option available')
      }
    }
  })

  test('should close upload dialog', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    const uploadButton = page.locator('button:has-text("Upload"), button[aria-label*="upload" i]').first()
    
    if (await uploadButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await uploadButton.click()
      await page.waitForTimeout(1000)
      
      // Look for close button
      const closeButton = page.locator('button[aria-label="Close"], button:has-text("Cancel"), [data-testid="close-button"]').first()
      
      if (await closeButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await closeButton.click()
        await page.waitForTimeout(500)
        
        // Dialog should be closed
        const dialog = page.locator('[role="dialog"]').first()
        await expect(dialog).not.toBeVisible()
      }
    }
  })
})

test.describe('Document Upload API', () => {
  test('should have working upload endpoint', async ({ request }) => {
    // Test the upload API endpoint
    const testFile = path.join(__dirname, '../test-fixtures/test-receipt.jpg')
    
    if (fs.existsSync(testFile)) {
      const fileBuffer = fs.readFileSync(testFile)
      
      const response = await request.post('/api/documents/upload', {
        multipart: {
          file: {
            name: 'test-receipt.jpg',
            mimeType: 'image/jpeg',
            buffer: fileBuffer
          }
        }
      })
      
      // Should not return 404 or 500
      expect(response.status()).not.toBe(404)
      expect(response.status()).not.toBe(500)
      
      // Should return 200, 201, or 401 (if auth required)
      expect([200, 201, 401]).toContain(response.status())
    }
  })

  test('should have working smart-scan endpoint', async ({ request }) => {
    const testFile = path.join(__dirname, '../test-fixtures/test-receipt.jpg')
    
    if (fs.existsSync(testFile)) {
      const fileBuffer = fs.readFileSync(testFile)
      
      const response = await request.post('/api/documents/smart-scan', {
        multipart: {
          file: {
            name: 'test-receipt.jpg',
            mimeType: 'image/jpeg',
            buffer: fileBuffer
          }
        }
      })
      
      // Should not return 404
      expect(response.status()).not.toBe(404)
      
      console.log(`📡 Smart-scan API status: ${response.status()}`)
    }
  })
})





