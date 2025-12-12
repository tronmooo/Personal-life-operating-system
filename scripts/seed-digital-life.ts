/**
 * Seed script for Digital Life subscriptions
 * Run with: npx tsx scripts/seed-digital-life.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

// Sample subscription data
const sampleSubscriptions = [
  {
    service_name: 'Netflix',
    category: 'streaming',
    cost: 15.99,
    frequency: 'monthly',
    status: 'active',
    next_due_date: '2025-01-14',
    start_date: '2020-02-01',
    payment_method: 'Visa ending in 4242',
    account_url: 'https://netflix.com',
    icon_color: '#E50914',
    icon_letter: 'N',
  },
  {
    service_name: 'Spotify',
    category: 'music',
    cost: 10.99,
    frequency: 'monthly',
    status: 'active',
    next_due_date: '2025-01-07',
    start_date: '2019-06-15',
    payment_method: 'Visa ending in 4242',
    account_url: 'https://spotify.com',
    icon_color: '#1DB954',
    icon_letter: 'S',
  },
  {
    service_name: 'ChatGPT Plus',
    category: 'ai_tools',
    cost: 20.00,
    frequency: 'monthly',
    status: 'active',
    next_due_date: '2025-01-11',
    start_date: '2023-03-01',
    payment_method: 'Visa ending in 4242',
    account_url: 'https://chat.openai.com',
    icon_color: '#10A37F',
    icon_letter: 'C',
  },
  {
    service_name: 'Disney+',
    category: 'streaming',
    cost: 13.99,
    frequency: 'monthly',
    status: 'active',
    next_due_date: '2025-01-17',
    start_date: '2021-11-12',
    payment_method: 'Mastercard ending in 5555',
    account_url: 'https://disneyplus.com',
    icon_color: '#113CCF',
    icon_letter: 'D',
  },
  {
    service_name: 'iCloud+',
    category: 'cloud_storage',
    cost: 2.99,
    frequency: 'monthly',
    status: 'active',
    next_due_date: '2025-01-20',
    start_date: '2019-09-01',
    payment_method: 'Apple Pay',
    account_url: 'https://icloud.com',
    icon_color: '#007AFF',
    icon_letter: 'i',
  },
  {
    service_name: 'Adobe Creative Cloud',
    category: 'software',
    cost: 54.99,
    frequency: 'monthly',
    status: 'active',
    next_due_date: '2025-01-25',
    start_date: '2018-04-01',
    payment_method: 'Visa ending in 4242',
    account_url: 'https://adobe.com',
    icon_color: '#FF0000',
    icon_letter: 'A',
  },
  {
    service_name: 'GitHub Copilot',
    category: 'ai_tools',
    cost: 10.00,
    frequency: 'monthly',
    status: 'active',
    next_due_date: '2025-01-12',
    start_date: '2022-10-01',
    payment_method: 'Visa ending in 4242',
    account_url: 'https://github.com/settings/copilot',
    icon_color: '#181717',
    icon_letter: 'G',
  },
  {
    service_name: 'Notion',
    category: 'productivity',
    cost: 8.00,
    frequency: 'monthly',
    status: 'active',
    next_due_date: '2025-01-08',
    start_date: '2020-05-01',
    payment_method: 'Visa ending in 4242',
    account_url: 'https://notion.so',
    icon_color: '#000000',
    icon_letter: 'N',
  },
  {
    service_name: 'PlayStation Plus',
    category: 'gaming',
    cost: 79.99,
    frequency: 'yearly',
    status: 'active',
    next_due_date: '2025-03-15',
    start_date: '2019-03-15',
    payment_method: 'Visa ending in 4242',
    account_url: 'https://playstation.com',
    icon_color: '#003791',
    icon_letter: 'P',
  },
  {
    service_name: 'Headspace',
    category: 'fitness',
    cost: 12.99,
    frequency: 'monthly',
    status: 'trial',
    next_due_date: '2025-01-18',
    start_date: '2024-12-18',
    trial_end_date: '2025-01-18',
    payment_method: 'Visa ending in 4242',
    account_url: 'https://headspace.com',
    icon_color: '#F47920',
    icon_letter: 'H',
  },
  {
    service_name: 'Hulu',
    category: 'streaming',
    cost: 7.99,
    frequency: 'monthly',
    status: 'paused',
    next_due_date: '2025-02-01',
    start_date: '2019-08-01',
    payment_method: 'Visa ending in 4242',
    account_url: 'https://hulu.com',
    icon_color: '#1CE783',
    icon_letter: 'H',
  },
  {
    service_name: 'HBO Max',
    category: 'streaming',
    cost: 15.99,
    frequency: 'monthly',
    status: 'cancelled',
    next_due_date: '2024-12-01',
    start_date: '2020-05-01',
    cancellation_date: '2024-11-25',
    payment_method: 'Visa ending in 4242',
    account_url: 'https://hbomax.com',
    icon_color: '#B10AFF',
    icon_letter: 'H',
  },
]

async function seedSubscriptions() {
  try {
    console.log('🌱 Starting Digital Life subscription seeding...\n')

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('❌ Authentication error. Please ensure you are logged in.')
      console.error('Run this script after authenticating in your app.')
      process.exit(1)
    }

    console.log(`✅ Authenticated as: ${user.email}\n`)

    // Check if subscriptions already exist
    const { data: existing, error: checkError } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', user.id)

    if (checkError) {
      console.error('❌ Error checking existing subscriptions:', checkError.message)
      process.exit(1)
    }

    if (existing && existing.length > 0) {
      console.log(`⚠️  Found ${existing.length} existing subscriptions`)
      console.log('   Skipping seed to avoid duplicates.')
      console.log('   Delete existing subscriptions first if you want to re-seed.\n')
      process.exit(0)
    }

    // Insert sample subscriptions
    console.log('📝 Inserting sample subscriptions...\n')

    for (const sub of sampleSubscriptions) {
      const { error: insertError } = await supabase
        .from('subscriptions')
        .insert({
          ...sub,
          user_id: user.id,
        })

      if (insertError) {
        console.error(`❌ Error inserting ${sub.service_name}:`, insertError.message)
      } else {
        const statusEmoji = 
          sub.status === 'active' ? '✅' :
          sub.status === 'trial' ? '🔄' :
          sub.status === 'paused' ? '⏸️' : '❌'
        console.log(`${statusEmoji} Added: ${sub.service_name} (${sub.category})`)
      }
    }

    // Fetch analytics
    console.log('\n📊 Fetching analytics...\n')
    
    const { data: analytics, error: analyticsError } = await supabase
      .from('subscription_analytics')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!analyticsError && analytics) {
      console.log('💰 Summary:')
      console.log(`   Monthly Total: $${analytics.monthly_total?.toFixed(2) || '0.00'}`)
      console.log(`   Yearly Total: $${analytics.yearly_total?.toFixed(2) || '0.00'}`)
      console.log(`   Active: ${analytics.active_count || 0}`)
      console.log(`   Trial: ${analytics.trial_count || 0}`)
      console.log(`   Paused: ${analytics.paused_count || 0}`)
      console.log(`   Cancelled: ${analytics.cancelled_count || 0}`)
    }

    console.log('\n✅ Seeding complete!')
    console.log('🚀 Visit http://localhost:3000/domains/digital to view your subscriptions\n')

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    process.exit(1)
  }
}

// Run the seed function
seedSubscriptions()


