#!/usr/bin/env node

/**
 * Apply RLS Migration via Supabase SQL Editor
 */

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const migrationPath = join(__dirname, '../supabase/migrations/20251026_add_rls_policies.sql')
const migrationSQL = readFileSync(migrationPath, 'utf-8')

console.log('╔════════════════════════════════════════════════════════════════╗')
console.log('║         🔐 RLS Migration Instructions                         ║')
console.log('╚════════════════════════════════════════════════════════════════╝\n')

console.log('To apply the RLS (Row Level Security) migration:\n')

console.log('1️⃣  Open Supabase SQL Editor:')
console.log('   👉 https://supabase.com/dashboard/project/jphpxqqilrjyypztkswc/sql/new\n')

console.log('2️⃣  Copy the SQL below (everything between the dashed lines):\n')

console.log('─'.repeat(70))
console.log(migrationSQL)
console.log('─'.repeat(70))

console.log('\n3️⃣  Paste into the SQL Editor and click "Run"\n')

console.log('4️⃣  You should see messages like:')
console.log('   ✅ "Success. No rows returned"')
console.log('   ✅ "ALTER TABLE"')
console.log('   ✅ "CREATE POLICY"\n')

console.log('5️⃣  Once complete, restart your dev server:\n')
console.log('   npm run dev\n')

console.log('═'.repeat(70))
console.log('Why is this needed?')
console.log('═'.repeat(70))
console.log('RLS (Row Level Security) ensures:')
console.log('  ✅ Users can only see their OWN data')
console.log('  ✅ Data is properly isolated between users')
console.log('  ✅ Your app is production-ready and secure\n')

console.log('After applying, your authentication issues should be FIXED! 🎉\n')
