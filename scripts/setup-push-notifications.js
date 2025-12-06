#!/usr/bin/env node

/**
 * Setup Script for Push Notifications
 * 
 * This script helps you set up push notifications by:
 * 1. Installing web-push dependency
 * 2. Generating VAPID keys
 * 3. Creating .env entries
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🔔 Setting up Push Notifications...\n')

// Step 1: Install web-push
console.log('📦 Installing web-push dependency...')
try {
  execSync('npm install web-push', { stdio: 'inherit' })
  console.log('✅ web-push installed successfully\n')
} catch (error) {
  console.error('❌ Failed to install web-push')
  process.exit(1)
}

// Step 2: Generate VAPID keys
console.log('🔑 Generating VAPID keys...')
try {
  const webpush = require('web-push')
  const vapidKeys = webpush.generateVAPIDKeys()
  
  console.log('✅ VAPID keys generated successfully\n')
  
  // Step 3: Create .env entries
  const envPath = path.join(process.cwd(), '.env.local')
  const envEntries = `
# Push Notification VAPID Keys (Generated ${new Date().toISOString()})
NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}
VAPID_PRIVATE_KEY=${vapidKeys.privateKey}
VAPID_EMAIL=admin@lifehub.com
CRON_SECRET=${generateRandomSecret()}
`

  if (fs.existsSync(envPath)) {
    // Append to existing .env.local
    const existingEnv = fs.readFileSync(envPath, 'utf8')
    
    // Check if VAPID keys already exist
    if (existingEnv.includes('NEXT_PUBLIC_VAPID_PUBLIC_KEY')) {
      console.log('⚠️  VAPID keys already exist in .env.local')
      console.log('   If you want to regenerate them, remove the old entries first.\n')
    } else {
      fs.appendFileSync(envPath, envEntries)
      console.log('✅ VAPID keys added to .env.local\n')
    }
  } else {
    // Create new .env.local
    fs.writeFileSync(envPath, envEntries)
    console.log('✅ Created .env.local with VAPID keys\n')
  }
  
  // Display the keys
  console.log('📋 Your VAPID Keys:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`Public Key:  ${vapidKeys.publicKey}`)
  console.log(`Private Key: ${vapidKeys.privateKey}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  
  console.log('✅ Setup complete!')
  console.log('\n📝 Next steps:')
  console.log('   1. Restart your development server')
  console.log('   2. Go to Settings in your app')
  console.log('   3. Enable push notifications')
  console.log('   4. Test with "Send Test Notification" button\n')
  
  console.log('🚀 For production deployment:')
  console.log('   1. Add these environment variables to Vercel/your host')
  console.log('   2. Set up cron job to call /api/notifications/cron')
  console.log('   3. Configure CRON_SECRET for security\n')
  
} catch (error) {
  console.error('❌ Error generating VAPID keys:', error.message)
  console.error('\nTry manually:')
  console.error('  npx web-push generate-vapid-keys')
  process.exit(1)
}

/**
 * Generate a random secret for cron authentication
 */
function generateRandomSecret(length = 32) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}



