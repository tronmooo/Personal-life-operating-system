# 🚀 Deployment Checklist - Real Business Integration

## Pre-Deployment Setup

### 1. Environment Variables

Copy `.env.local.example` to `.env.local` and configure:

```bash
# ✅ REQUIRED for real business search
GOOGLE_PLACES_API_KEY=AIza...

# ✅ REQUIRED for voice calls
TWILIO_ACCOUNT_SID=ACxxx...
TWILIO_AUTH_TOKEN=xxx...
TWILIO_PHONE_NUMBER=+1234567890

# ✅ REQUIRED for AI agent
OPENAI_API_KEY=sk-...

# ✅ REQUIRED for webhook security
PLAID_WEBHOOK_VERIFICATION_KEY=xxx...
TWILIO_AUTH_TOKEN=xxx... # Also used for webhook verification

# ✅ Already configured
NEXT_PUBLIC_SUPABASE_URL=https://jphpxqqilrjyypztkswc.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx...

# ✅ Optional but recommended
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

---

## Google Cloud Setup

### 1. Create Project
1. Go to: https://console.cloud.google.com/
2. Create new project: "LifeHub Business Search"
3. Enable billing

### 2. Enable APIs
```bash
# Places API
https://console.cloud.google.com/apis/library/places-backend.googleapis.com

# Places Details API  
https://console.cloud.google.com/apis/library/places-details-backend.googleapis.com
```

### 3. Create API Key
1. Go to: https://console.cloud.google.com/apis/credentials
2. Click "Create Credentials" → "API Key"
3. Restrict key:
   - **Application restrictions**: HTTP referrers or IP addresses
   - **API restrictions**: Select "Places API" and "Places Details API"
4. Copy key to `GOOGLE_PLACES_API_KEY`

### 4. Set Billing Alerts
1. Go to: https://console.cloud.google.com/billing/
2. Set alert at $50/month
3. Set hard cap at $100/month

---

## Twilio Setup

### 1. Account Configuration
1. Go to: https://console.twilio.com/
2. Verify phone number ownership
3. Add credit ($20 recommended for testing)

### 2. Get Credentials
```bash
# From: https://console.twilio.com/
TWILIO_ACCOUNT_SID=ACxxx...
TWILIO_AUTH_TOKEN=xxx...

# From: https://console.twilio.com/phone-numbers/
TWILIO_PHONE_NUMBER=+1234567890
```

### 3. Configure Webhooks
```bash
# Voice Status Webhook
https://your-domain.com/api/voice/status

# Enable signature validation (automatic with TWILIO_AUTH_TOKEN set)
```

---

## Database Setup

### 1. Required Tables

All tables should already exist. Verify:

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'businesses',
    'concierge_sessions',
    'concierge_calls',
    'user_locations'
  );
```

### 2. Create Missing Tables (if needed)

#### businesses table
```sql
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  place_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  category TEXT,
  rating DECIMAL(2,1),
  price_level INT,
  business_hours JSONB,
  website TEXT,
  pricing_data JSONB,
  last_called_at TIMESTAMP,
  cached_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_businesses_place_id ON businesses(place_id);
CREATE INDEX idx_businesses_cached_at ON businesses(cached_at);
```

#### user_locations table
```sql
CREATE TABLE IF NOT EXISTS user_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  city TEXT,
  state TEXT,
  address TEXT,
  zip_code TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_locations_user_id ON user_locations(user_id);
CREATE INDEX idx_user_locations_created_at ON user_locations(created_at DESC);

-- Enable RLS
ALTER TABLE user_locations ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see own locations
CREATE POLICY user_locations_select_policy ON user_locations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY user_locations_insert_policy ON user_locations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_locations_update_policy ON user_locations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY user_locations_delete_policy ON user_locations
  FOR DELETE USING (auth.uid() = user_id);
```

---

## Testing Before Deploy

### 1. Local Environment Test

```bash
# Start dev server
npm run dev

# In another terminal, run test script
node scripts/test-concierge.js
```

### 2. Manual API Test

```bash
# Get auth cookie from browser (DevTools → Application → Cookies)
export AUTH_COOKIE="sb-access-token=xxx..."

# Test with location
curl -X POST http://localhost:3000/api/concierge/initiate-calls \
  -H "Content-Type: application/json" \
  -H "Cookie: $AUTH_COOKIE" \
  -d '{
    "intent": "pizza",
    "businessCount": 2,
    "userLocation": {
      "latitude": 34.5008,
      "longitude": -117.2897
    },
    "details": {
      "size": "large",
      "toppings": "cheese"
    }
  }'

# Should return:
{
  "success": true,
  "sessionId": "uuid",
  "calls": [
    {
      "business": "Domino's Pizza",
      "phone": "+17609462323",
      "status": "initiated",
      "callId": "CAxx..."
    }
  ]
}
```

### 3. Verify Database Records

```sql
-- Check sessions
SELECT * FROM concierge_sessions 
ORDER BY created_at DESC 
LIMIT 5;

-- Check calls
SELECT 
  cc.*,
  cs.intent,
  cs.status as session_status
FROM concierge_calls cc
JOIN concierge_sessions cs ON cs.id = cc.session_id
ORDER BY cc.created_at DESC
LIMIT 10;

-- Check business cache
SELECT 
  place_id,
  name,
  phone,
  rating,
  cached_at
FROM businesses
ORDER BY cached_at DESC;
```

### 4. Check Twilio Console

1. Go to: https://console.twilio.com/monitor/logs/calls
2. Verify calls appear
3. Check call recordings
4. Review transcripts

---

## Deployment

### Option 1: Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard
# https://vercel.com/your-project/settings/environment-variables
```

### Option 2: Self-Hosted

```bash
# Build for production
npm run build

# Start production server
npm run start
```

---

## Post-Deployment Verification

### 1. Smoke Tests

Run through key user flows:

- [ ] User can search for pizza places
- [ ] System returns real businesses near user
- [ ] Twilio calls are initiated successfully
- [ ] Session/call records saved to database
- [ ] Business info cached for future requests

### 2. Monitor Logs

```bash
# Application logs
# Check for errors in:
- /api/concierge/initiate-calls
- /lib/services/business-search
- /lib/services/user-context-builder

# Google Cloud logs
# https://console.cloud.google.com/logs/
# Filter: resource.type="consumed_api"

# Twilio logs
# https://console.twilio.com/monitor/logs/
```

### 3. Cost Monitoring

```bash
# Google Places API
# https://console.cloud.google.com/apis/api/places-backend.googleapis.com/quotas

# Twilio usage
# https://console.twilio.com/usage/

# Supabase
# https://supabase.com/dashboard/project/jphpxqqilrjyypztkswc/settings/billing
```

---

## Rollback Plan

If issues arise:

### 1. Disable Real Business Search

Remove `GOOGLE_PLACES_API_KEY` from environment variables. System will automatically fall back to mock data.

```bash
# Production environment
unset GOOGLE_PLACES_API_KEY

# Or in .env.local
# GOOGLE_PLACES_API_KEY=
```

### 2. Restore Previous Version

```bash
# Vercel
vercel rollback

# Or redeploy previous commit
git checkout <previous-commit>
vercel --prod
```

### 3. Emergency Contact

- **Twilio Support**: https://support.twilio.com/
- **Google Cloud Support**: https://console.cloud.google.com/support
- **Supabase Support**: https://supabase.com/dashboard/support/new

---

## Monitoring & Alerts

### 1. Error Tracking

Set up alerts for:

- [ ] Google Places API errors (status != OK)
- [ ] Twilio call failures (status = failed)
- [ ] High latency on business search (>2s)
- [ ] Database errors on session/call creation

### 2. Cost Alerts

- [ ] Google Places API > $50/month
- [ ] Twilio usage > $100/month
- [ ] Supabase bandwidth > 100GB/month

### 3. Performance Metrics

Track:

- Average business search time
- Cache hit rate (target: >90%)
- Call success rate (target: >95%)
- User satisfaction ratings

---

## Security Checklist

### Pre-Deployment

- [x] Supabase service role key rotated (after security incident)
- [x] All API keys in environment variables (not hardcoded)
- [x] Plaid webhook signature validation enabled
- [x] Twilio webhook signature validation enabled
- [ ] Rate limiting configured for API routes
- [ ] CORS configured properly
- [ ] RLS policies enabled on all tables

### Post-Deployment

- [ ] Monitor for unauthorized API access
- [ ] Review API key usage patterns
- [ ] Check for suspicious call patterns
- [ ] Audit database access logs

---

## Common Issues & Solutions

### Issue: "No businesses found"

**Symptoms:**
- Request succeeds but returns empty array
- Google Places API returning 0 results

**Solutions:**
1. Check location is valid (not in middle of ocean)
2. Increase search radius (default: 20 miles)
3. Broaden search query ("restaurants" vs "italian restaurants")
4. Check Google Places API quota

### Issue: "Location required" error

**Symptoms:**
- Error: "Location required to search for businesses"
- User doesn't have location data

**Solutions:**
1. Have user pass `userLocation` in request
2. Add location to database:
```sql
INSERT INTO user_locations (user_id, latitude, longitude, city, state)
VALUES ('user-id', 34.5008, -117.2897, 'Apple Valley', 'CA');
```

### Issue: Calls not connecting

**Symptoms:**
- Business found but call fails
- Status = "failed" in response

**Solutions:**
1. Check Twilio account balance
2. Verify phone number is valid E.164 format
3. Check business is open (future feature)
4. Review Twilio error logs

### Issue: Getting mock data instead of real businesses

**Symptoms:**
- Always getting Domino's/Pizza Hut
- Console shows: "⚠️ Google Places API key not configured"

**Solutions:**
1. Set `GOOGLE_PLACES_API_KEY` in environment
2. Restart server: `npm run dev`
3. Verify API key is valid in Google Cloud Console
4. Ensure Places API is enabled

---

## Feature Flags (Future)

Consider adding feature flags for gradual rollout:

```typescript
// lib/feature-flags.ts
export const FEATURES = {
  REAL_BUSINESS_SEARCH: process.env.ENABLE_REAL_BUSINESS_SEARCH === 'true',
  BUSINESS_HOURS_CHECK: process.env.ENABLE_BUSINESS_HOURS === 'true',
  PRICING_CACHE: process.env.ENABLE_PRICING_CACHE === 'true',
}

// Then in code:
if (FEATURES.REAL_BUSINESS_SEARCH) {
  businesses = await businessSearch.searchBusinesses(...)
} else {
  businesses = getMockBusinesses(...)
}
```

---

## Success Criteria

Before marking deployment as complete:

- [ ] ✅ All environment variables set correctly
- [ ] ✅ Google Places API responding successfully
- [ ] ✅ Twilio calls connecting to real businesses
- [ ] ✅ Database records being created properly
- [ ] ✅ Cache system working (check hit rate)
- [ ] ✅ No errors in production logs (24h monitoring)
- [ ] ✅ Cost monitoring alerts configured
- [ ] ✅ Rollback plan tested and documented
- [ ] ✅ Security webhooks validated
- [ ] ✅ User acceptance testing passed

---

**DEPLOYMENT STATUS:** Ready for Production ✅

**Last Updated:** November 18, 2025  
**Next Review:** December 18, 2025



