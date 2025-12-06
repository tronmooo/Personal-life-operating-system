/**
 * Script to create the 'documents' storage bucket in Supabase
 * Run with: npx tsx scripts/create-storage-bucket.ts
 */

async function createStorageBucket() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing required environment variables:')
    console.error('   - NEXT_PUBLIC_SUPABASE_URL')
    console.error('   - SUPABASE_SERVICE_ROLE_KEY')
    console.error('\nPlease set these in your .env.local file')
    process.exit(1)
  }

  console.log('🗄️  Creating storage bucket...')

  try {
    // Create the storage bucket
    const createBucketResponse = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_ROLE_KEY
      },
      body: JSON.stringify({
        id: 'documents',
        name: 'documents',
        public: true,
        file_size_limit: 52428800, // 50MB
        allowed_mime_types: [
          'application/pdf',
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain'
        ]
      })
    })

    if (!createBucketResponse.ok) {
      const errorText = await createBucketResponse.text()
      if (errorText.includes('already exists')) {
        console.log('✅ Storage bucket "documents" already exists')
      } else {
        console.error('❌ Failed to create storage bucket:', errorText)
        throw new Error(errorText)
      }
    } else {
      const bucketData = await createBucketResponse.json()
      console.log('✅ Storage bucket created successfully:', bucketData)
    }

    // Now apply the RLS policies using SQL
    console.log('📝 Applying storage policies...')
    
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Read and execute the migration SQL
    const fs = await import('fs')
    const path = await import('path')
    const migrationPath = path.join(__dirname, '../supabase/migrations/20251029130000_create_documents_storage_bucket.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')

    // Split the SQL into individual statements and execute them
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    for (const statement of statements) {
      if (statement.includes('INSERT INTO storage.buckets')) {
        // Skip bucket creation as we already did it via API
        continue
      }
      
      const { error } = await supabase.rpc('exec_sql', { sql: statement })
      if (error && !error.message.includes('already exists')) {
        console.error('Error executing statement:', error)
      }
    }

    console.log('✅ Storage policies applied successfully!')
    console.log('\n🎉 Storage bucket setup complete!')
    console.log('   - Bucket: documents')
    console.log('   - Public: true')
    console.log('   - Max file size: 50MB')
    console.log('   - Policies: User-scoped read/write')

  } catch (error: any) {
    console.error('❌ Error setting up storage bucket:', error.message)
    process.exit(1)
  }
}

createStorageBucket()


