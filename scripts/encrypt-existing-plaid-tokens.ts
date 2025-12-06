/**
 * One-time migration script to encrypt existing Plaid access tokens
 * Run with: npx ts-node scripts/encrypt-existing-plaid-tokens.ts
 */

import { createClient } from '@supabase/supabase-js'
import { encryptToString } from '../lib/utils/encryption'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function encryptExistingTokens() {
  console.log('🔄 Starting Plaid token encryption migration...')

  try {
    // Fetch all linked accounts with tokens
    const { data: accounts, error } = await supabase
      .from('linked_accounts')
      .select('id, plaid_access_token')
      .not('plaid_access_token', 'is', null)

    if (error) {
      throw error
    }

    if (!accounts || accounts.length === 0) {
      console.log('✅ No accounts found. Nothing to migrate.')
      return
    }

    console.log(`📦 Found ${accounts.length} accounts to process`)

    let encrypted = 0
    let skipped = 0
    let errors = 0

    for (const account of accounts) {
      try {
        const token = account.plaid_access_token

        // Skip if already encrypted (contains colons which indicate encrypted format)
        if (token.includes(':')) {
          console.log(`⏭️  Account ${account.id}: Already encrypted, skipping`)
          skipped++
          continue
        }

        // Encrypt the token
        const encryptedToken = encryptToString(token)

        // Update the database
        const { error: updateError } = await supabase
          .from('linked_accounts')
          .update({ plaid_access_token: encryptedToken })
          .eq('id', account.id)

        if (updateError) {
          throw updateError
        }

        console.log(`✅ Account ${account.id}: Token encrypted`)
        encrypted++

      } catch (err: any) {
        console.error(`❌ Account ${account.id}: Failed -`, err.message)
        errors++
      }
    }

    console.log('\n📊 Migration Summary:')
    console.log(`   ✅ Encrypted: ${encrypted}`)
    console.log(`   ⏭️  Skipped: ${skipped}`)
    console.log(`   ❌ Errors: ${errors}`)
    console.log(`   📦 Total: ${accounts.length}`)

    if (errors > 0) {
      console.log('\n⚠️  Some tokens failed to encrypt. Please review errors above.')
      process.exit(1)
    } else {
      console.log('\n🎉 All tokens encrypted successfully!')
    }

  } catch (error: any) {
    console.error('❌ Migration failed:', error.message)
    process.exit(1)
  }
}

// Run migration
encryptExistingTokens()
  .then(() => {
    console.log('✅ Migration complete')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })
