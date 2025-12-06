/**
 * Script to update the 'documents' storage bucket configuration
 * Run with: npx tsx scripts/update-storage-bucket.ts
 */

async function updateStorageBucket() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing required environment variables:')
    console.error('   - NEXT_PUBLIC_SUPABASE_URL')
    console.error('   - SUPABASE_SERVICE_ROLE_KEY')
    console.error('\nPlease set these in your .env.local file')
    process.exit(1)
  }

  console.log('🔧 Updating storage bucket configuration...')

  try {
    // Update the storage bucket to allow more file types
    const updateBucketResponse = await fetch(`${SUPABASE_URL}/storage/v1/bucket/documents`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_ROLE_KEY
      },
      body: JSON.stringify({
        public: true,
        file_size_limit: 52428800, // 50MB
        allowed_mime_types: null // Allow all file types
      })
    })

    if (!updateBucketResponse.ok) {
      const errorText = await updateBucketResponse.text()
      console.error('❌ Failed to update storage bucket:', errorText)
      throw new Error(errorText)
    }

    const bucketData = await updateBucketResponse.json()
    console.log('✅ Storage bucket updated successfully:', bucketData)

    console.log('\n🎉 Storage bucket configuration updated!')
    console.log('   - Bucket: documents')
    console.log('   - Public: true')
    console.log('   - Max file size: 50MB')
    console.log('   - Allowed file types: ALL')

  } catch (error: any) {
    console.error('❌ Error updating storage bucket:', error.message)
    process.exit(1)
  }
}

updateStorageBucket()


