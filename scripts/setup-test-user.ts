/**
 * Setup Test User for E2E Tests
 * Creates a test user in Supabase for Playwright tests
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables')
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set')
  process.exit(1)
}

const email = process.env.TEST_USER_EMAIL || 'e2e@test.com'
const password = process.env.TEST_USER_PASSWORD || 'Test1234!'

async function setupTestUser() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  console.log('🔧 Setting up test user for E2E tests...')
  console.log(`📧 Email: ${email}`)

  try {
    // Try to get existing user
    const listRes = await supabase.auth.admin.listUsers()
    const listError = listRes.error
    const users = (listRes.data?.users ?? []) as Array<{ id: string; email?: string | null }>

    if (listError) {
      console.error('❌ Error listing users:', listError.message)
      process.exit(1)
    }

    const existingUser = users.find(u => u.email === email)

    if (existingUser) {
      console.log('✅ Test user already exists:', existingUser.id)
      console.log('🔑 User ID:', existingUser.id)
      return
    }

    // Create new user
    console.log('📝 Creating new test user...')
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name: 'E2E Test User'
      }
    })

    if (error) {
      console.error('❌ Error creating user:', error.message)
      process.exit(1)
    }

    console.log('✅ Test user created successfully!')
    console.log('🔑 User ID:', data.user?.id)
    console.log('')
    console.log('Test user credentials:')
    console.log(`  Email: ${email}`)
    console.log(`  Password: ${password}`)
    console.log('')
    console.log('✅ Setup complete! You can now run Playwright tests.')

  } catch (error: any) {
    console.error('❌ Unexpected error:', error.message)
    process.exit(1)
  }
}

setupTestUser()
