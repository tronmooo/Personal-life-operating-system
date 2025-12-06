# ⚠️ IMMEDIATE SECURITY FIXES REQUIRED

**Generated**: November 13, 2025  
**Priority**: CRITICAL - DO NOT DEPLOY TO PRODUCTION WITHOUT THESE FIXES

---

## 🚨 STOP AND READ THIS FIRST

Your codebase has **3 CRITICAL** and **5 HIGH** severity security vulnerabilities that MUST be fixed before deployment.

**Estimated Time to Fix Critical Issues**: 4-6 hours  
**Recommended Team**: 2 developers

---

## 🔴 CRITICAL ISSUE #1: HARDCODED SERVICE ROLE KEY

### Risk Level: 9.8/10 - COMPLETE DATABASE COMPROMISE

**What's Wrong:**
You have the Supabase service role key hardcoded in **7 script files**. This key gives FULL DATABASE ACCESS and bypasses all security policies.

**Files to Fix:**
```
scripts/update-storage-bucket.ts:8
scripts/create-storage-bucket.ts:8
scripts/add-column-direct.ts:8
scripts/apply-warranty-migration.ts:9
apply-schema-migration.ts:20
scripts/run-migrations.ts:14
scripts/debug-dashboard-data.ts:14
```

### ✅ IMMEDIATE FIX (30 minutes):

**Step 1: Rotate the key in Supabase** (DO THIS FIRST!)
```bash
# 1. Go to: https://supabase.com/dashboard/project/jphpxqqilrjyypztkswc/settings/api
# 2. Click "Service Role" key
# 3. Click "Rotate Key" button
# 4. Copy the NEW service role key
```

**Step 2: Add new key to .env.local**
```bash
# Add to .env.local:
SUPABASE_SERVICE_ROLE_KEY=your_new_key_here
```

**Step 3: Fix all scripts** (example for one file):
```typescript
// BEFORE (DANGEROUS):
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'

// AFTER (SAFE):
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required')
}
```

**Step 4: Run this command to apply the fix to all files:**
```bash
# Replace the hardcoded key with environment variable
find . -type f \( -name "*.ts" -o -name "*.js" \) \
  -exec sed -i '' 's/const SUPABASE_SERVICE_ROLE_KEY = .*/const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY/g' {} +
```

**Step 5: Check Git history**
```bash
# Search for the exposed key in Git history:
git log --all -p | grep 'eyJhbGc' | head -20

# If found, you MUST clean Git history:
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch scripts/*.ts" \
  --prune-empty --tag-name-filter cat -- --all
```

---

## 🔴 CRITICAL ISSUE #2: CREDENTIALS FILE EXPOSED

### Risk Level: 9.1/10 - API KEYS IN VERSION CONTROL

**What's Wrong:**
The file `🔑_SUPABASE_CREDENTIALS.txt` contains Supabase credentials and is NOT in .gitignore. If you've already committed it, it's in Git history forever (unless you clean it).

### ✅ IMMEDIATE FIX (10 minutes):

```bash
# Step 1: Add to .gitignore
echo "🔑_SUPABASE_CREDENTIALS.txt" >> .gitignore

# Step 2: Check if already committed
git log --all -- "🔑_SUPABASE_CREDENTIALS.txt"

# Step 3: If committed, remove from history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch 🔑_SUPABASE_CREDENTIALS.txt" \
  --prune-empty --tag-name-filter cat -- --all

# Step 4: Delete the file
rm "🔑_SUPABASE_CREDENTIALS.txt"

# Step 5: Force push (if remote exists and you have permission)
# ⚠️ COORDINATE WITH TEAM FIRST!
git push origin --force --all
```

---

## 🔴 CRITICAL ISSUE #3: WIDE-OPEN CORS

### Risk Level: 8.2/10 - ANY WEBSITE CAN CALL YOUR APIs

**What's Wrong:**
All Supabase Edge Functions have `Access-Control-Allow-Origin: *` which means ANY website can call them and steal user data.

**Files to Fix:**
```
supabase/functions/process-document/index.ts
supabase/functions/manage-budget/index.ts
supabase/functions/manage-habit/index.ts
supabase/functions/sync-domain/index.ts
supabase/functions/manage-task/index.ts
supabase/functions/sync-all-data/index.ts
```

### ✅ IMMEDIATE FIX (20 minutes):

**Step 1: Create a CORS utility file:**
```bash
# Create: supabase/functions/_shared/cors.ts
```

```typescript
// supabase/functions/_shared/cors.ts
export function getCorsHeaders(requestOrigin?: string | null) {
  const allowedOrigins = [
    'https://yourdomain.com',
    'https://www.yourdomain.com',
    ...(Deno.env.get('NODE_ENV') === 'development' 
      ? ['http://localhost:3000', 'http://127.0.0.1:3000'] 
      : []
    )
  ]

  const origin = allowedOrigins.includes(requestOrigin || '') 
    ? requestOrigin 
    : allowedOrigins[0]

  return {
    'Access-Control-Allow-Origin': origin || allowedOrigins[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
    'Access-Control-Max-Age': '86400',
  }
}
```

**Step 2: Update each function:**
```typescript
// BEFORE:
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  // ...
}

// AFTER:
import { getCorsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'))
  
  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  
  // ... rest of your code
})
```

---

## 🟠 HIGH PRIORITY FIXES (2-4 hours)

### 1. UPDATE next-auth (5 minutes)

```bash
npm install next-auth@^4.24.12
npm test
```

### 2. FIX XSS IN MARKDOWN RENDERER (30 minutes)

**File**: `components/editor/rich-text-editor.tsx:365`

```typescript
// Add this import at the top:
import DOMPurify from 'dompurify'

// Update the renderMarkdown function:
const renderMarkdown = (text: string) => {
  let html = text
  
  // ... your markdown processing ...
  
  // ADD THIS LINE BEFORE RETURNING:
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'br', 'code', 'pre'],
    ALLOWED_ATTR: ['href', 'class'],
    ALLOW_DATA_ATTR: false
  })
}
```

### 3. PROTECT ADMIN ROUTES (20 minutes)

**File**: `middleware.ts`

```typescript
// Remove these from publicApiPaths:
'/api/admin',        // 🔴 CRITICAL: Admin must be protected!
'/api/data',         // User data - needs auth
'/api/calls',        // Call history - needs auth
'/api/ai/therapy-chat', // Health data - needs auth

// Add admin check:
if (req.nextUrl.pathname.startsWith('/api/admin') && session) {
  // Check if user is admin
  const { data: userData } = await supabase
    .from('user_settings')
    .select('is_admin')
    .eq('user_id', session.user.id)
    .single()
  
  if (!userData?.is_admin) {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    )
  }
}
```

### 4. ADD TABLE WHITELIST TO MCP (15 minutes)

**File**: `app/api/mcp/execute/route.ts`

```typescript
// Add at the top of handleSupabaseMCP function:
const ALLOWED_TABLES = [
  'domain_entries',
  'notifications',
  'notification_settings',
  'documents',
  'user_settings',
  'dashboard_layouts',
  // Add other safe tables
]

case 'query_table': {
  const { table, filters, limit = 50 } = parameters
  
  // ADD THIS CHECK:
  if (!ALLOWED_TABLES.includes(table)) {
    return NextResponse.json(
      { error: `Forbidden table: ${table}` },
      { status: 403 }
    )
  }
  
  // ... rest of code
}
```

### 5. ADD SECURITY HEADERS (15 minutes)

**File**: `next.config.js`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
  },
  // ADD THIS:
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      }
    ]
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'localhost:3001'],
    },
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
```

---

## 🧪 VERIFICATION CHECKLIST

After making fixes, verify:

```bash
# 1. Check for remaining hardcoded secrets:
grep -r "eyJhbGc" . --exclude-dir=node_modules --exclude-dir=.next

# 2. Verify environment variables are set:
cat .env.local | grep SUPABASE_SERVICE_ROLE_KEY

# 3. Test authentication:
curl http://localhost:3000/api/admin -H "Authorization: Bearer invalid"
# Should return 401 Unauthorized

# 4. Test CORS:
curl -H "Origin: https://evil.com" http://localhost:3000/api/data
# Should NOT return data

# 5. Run security audit:
npm audit --audit-level=moderate

# 6. Build and test:
npm run build
npm run start
```

---

## 📋 BEFORE DEPLOYING TO PRODUCTION

- [ ] All 3 CRITICAL issues fixed and verified
- [ ] All 5 HIGH priority issues fixed
- [ ] Service role key rotated
- [ ] Git history cleaned (if needed)
- [ ] Security headers tested
- [ ] Authentication tested on all protected routes
- [ ] CORS tested with unauthorized origins
- [ ] npm audit shows 0 critical/high vulnerabilities
- [ ] Build succeeds: `npm run build`
- [ ] Tests pass: `npm test`

---

## 🆘 NEED HELP?

1. **Read the full report**: `SECURITY_AUDIT_REPORT.md`
2. **Questions about a specific issue**: Search the issue number in the full report
3. **Stuck on a fix**: Review the "Remediation" section in the full report

---

## 📞 EMERGENCY CONTACTS

If credentials are already compromised:
1. Rotate ALL API keys immediately (Supabase, OpenAI, VAPI, Plaid, etc.)
2. Check access logs for unauthorized activity
3. Force logout all users
4. Review all data access in the last 30 days
5. Document the incident

---

**TIME ESTIMATE**: 4-6 hours for all CRITICAL + HIGH fixes  
**TEAM SIZE**: 2 developers recommended  
**NEXT STEPS**: Read full report for complete remediation plan

**DO NOT SKIP THESE FIXES - YOUR USER DATA DEPENDS ON IT!**



