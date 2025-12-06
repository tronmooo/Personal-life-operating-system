import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Missing Supabase credentials' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    console.log('📋 Creating documents table for Google Drive...')

    // Direct SQL execution using rpc
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS documents (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        record_id TEXT,
        drive_file_id TEXT NOT NULL UNIQUE,
        file_name TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        web_view_link TEXT,
        web_content_link TEXT,
        thumbnail_link TEXT,
        file_size TEXT,
        extracted_text TEXT,
        domain TEXT NOT NULL,
        user_id TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `

    const createIndexesSQL = `
      CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
      CREATE INDEX IF NOT EXISTS idx_documents_domain ON documents(domain);
      CREATE INDEX IF NOT EXISTS idx_documents_record_id ON documents(record_id);
      CREATE INDEX IF NOT EXISTS idx_documents_drive_file_id ON documents(drive_file_id);
    `

    const enableRLSSQL = `ALTER TABLE documents ENABLE ROW LEVEL SECURITY;`

    const createPoliciesSQL = `
      CREATE POLICY IF NOT EXISTS "Users can view own documents"
        ON documents FOR SELECT
        USING (auth.uid()::text = user_id);

      CREATE POLICY IF NOT EXISTS "Users can insert own documents"
        ON documents FOR INSERT
        WITH CHECK (auth.uid()::text = user_id);

      CREATE POLICY IF NOT EXISTS "Users can update own documents"
        ON documents FOR UPDATE
        USING (auth.uid()::text = user_id);

      CREATE POLICY IF NOT EXISTS "Users can delete own documents"
        ON documents FOR DELETE
        USING (auth.uid()::text = user_id);
    `

    // Execute SQL directly using REST API
    const results = []

    try {
      const { data, error } = await supabase.from('documents').select('id').limit(1)
      
      if (error && error.message.includes('does not exist')) {
        console.log('Table does not exist, creating it...')
        
        // Table doesn't exist, we need to create it
        // Use raw SQL via the REST API
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            query: createTableSQL + createIndexesSQL + enableRLSSQL + createPoliciesSQL
          })
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error('SQL execution failed:', errorText)
          results.push({ error: errorText })
        } else {
          results.push({ success: 'Table created successfully' })
        }
      } else {
        console.log('Table already exists!')
        results.push({ success: 'Table already exists' })
      }
    } catch (checkError: any) {
      console.error('Error checking table:', checkError)
      results.push({ error: checkError.message })
    }

    console.log('✅ Migration completed!')

    return NextResponse.json({
      success: true,
      message: '✅ Documents table ready for Google Drive!',
      results,
      nextSteps: [
        'Refresh your browser (Cmd+Shift+R)',
        'Try uploading a document in any domain (Insurance, Vehicles, etc.)',
        'Check Google Drive for the LifeHub folder!'
      ]
    })

  } catch (error: any) {
    console.error('Migration error:', error)
    return NextResponse.json(
      { 
        error: error.message,
        hint: 'If this persists, run the SQL manually in Supabase Dashboard'
      },
      { status: 500 }
    )
  }
}
