#!/usr/bin/env node
/**
 * Clear all IndexedDB data to eliminate stale/phantom entries
 * This fixes the issue where UI shows 257 items but database only has 91
 */

console.log(`
╔═══════════════════════════════════════════════════════╗
║       Clear All Stale IndexedDB Data                 ║
╚═══════════════════════════════════════════════════════╝

🔍 Problem: UI shows stale data from old IndexedDB entries
✅ Solution: Clear ALL IndexedDB data and force reload from Supabase

📝 Steps:
1. Open your app in Chrome: http://localhost:3000
2. Open DevTools (F12 or Cmd+Option+I)
3. Go to Console tab
4. Copy/paste this code and press Enter:

╔═══════════════════════════════════════════════════════╗
`)

console.log(`
╚═══════════════════════════════════════════════════════╝

🚫 The legacy browser-based cleanup flow relied on localStorage and has been retired.

✅ New approach:
1. Run Supabase-backed verification: npm run verify:all
2. If counts are off, use the admin dashboard (Tools → Data Integrity) to trigger a server-side resync.
3. As a last resort, run the Supabase maintenance script: tsx scripts/verify-schema-tables.ts

📌 Why the change?
- All production data lives in Supabase—not localStorage or IndexedDB.
- Deleting browser storage could reintroduce stale migrations or cause mismatched caches.

If you still need to inspect legacy browser data (e.g., during QA), enable the legacy flag:
  window.__ENABLE_LEGACY_MIGRATION__ = true
And refresh the page. Remember to disable it afterwards.

Need help? Reach out in the #lifehub-ops channel.
`)

process.exit(0)





