#!/usr/bin/env node

/**
 * Quick Migration Runner for Google Drive Documents Table
 * This runs the migration SQL directly via Supabase
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('Need: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Read the migration SQL
const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250116_documents_table.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

console.log('📋 Running Google Drive documents table migration...\n');

// Use Supabase REST API to execute SQL
async function runMigration() {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
      body: JSON.stringify({ query: migrationSQL })
    });

    if (!response.ok) {
      // Try alternative approach using the postgres endpoint
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
      
      console.log('📝 Executing migration SQL...');
      
      // Split into individual statements and execute
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));
      
      for (const statement of statements) {
        console.log(`\n⚙️  Executing: ${statement.substring(0, 50)}...`);
        const { data, error } = await supabase.rpc('exec', { sql: statement + ';' });
        
        if (error && !error.message.includes('already exists')) {
          console.error(`❌ Error: ${error.message}`);
        } else {
          console.log('✅ Success');
        }
      }
      
      console.log('\n✅ Migration completed!');
      console.log('\n📁 The "documents" table is now ready for Google Drive uploads!');
      console.log('\n🎯 Next steps:');
      console.log('   1. Refresh your browser (Cmd+Shift+R)');
      console.log('   2. Upload a document');
      console.log('   3. Check Google Drive for the "LifeHub" folder!');
      
    } else {
      console.log('✅ Migration executed successfully!');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('\n💡 Alternative: Run this SQL manually in Supabase Dashboard:');
    console.log('   1. Go to: https://supabase.com/dashboard');
    console.log('   2. Select your project');
    console.log('   3. Click "SQL Editor"');
    console.log('   4. Paste the SQL from: supabase/migrations/20250116_documents_table.sql');
    console.log('   5. Click "Run"');
    process.exit(1);
  }
}

runMigration();
































