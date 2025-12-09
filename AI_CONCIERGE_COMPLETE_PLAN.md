# AI Concierge - Complete Implementation Plan & User Guide

## 🎯 What the AI Concierge Does

The AI Concierge is your personal assistant that **makes phone calls on your behalf** to get quotes, book services, and handle business interactions. It:

1. ✅ **Knows your location** - Uses your saved address or browser location
2. ✅ **Knows who to call** - Finds nearby businesses based on your request
3. ✅ **Makes the calls** - Initiates multiple calls simultaneously to get the best quotes
4. ✅ **Shows results** - Displays call progress, quotes, and allows you to accept offers

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      USER INTERFACE                              │
│  AI Concierge Popup (Dialog)                                    │
│  ├── Chat Tab: Conversational AI                                │
│  ├── Tasks Tab: Active calls & progress                         │
│  ├── Quotes Tab: Received quotes & pricing                      │
│  └── Settings Tab: Location & preferences                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                     API LAYER                                    │
│  /api/concierge/chat         → AI conversation handler           │
│  /api/concierge/initiate-calls → Business search & call starter  │
│  /api/voice/initiate-call    → Individual call initiator        │
│  /api/user-location          → Location management              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   DATABASE (Supabase)                            │
│  concierge_sessions  → Tracks user requests                      │
│  concierge_calls     → Individual call records                   │
│  concierge_quotes    → Quotes received from businesses           │
│  user_locations      → Saved user addresses                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                 EXTERNAL SERVICES                                │
│  Google Places API   → Find nearby businesses                    │
│  Twilio Voice API    → Make phone calls                          │
│  OpenAI API          → AI conversation & intent detection        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📋 Complete User Flow

### Step 1: Set Your Location (First Time Setup)

**Why?** The concierge needs to know where you are to find nearby businesses.

**How:**
1. Open the AI Concierge (from dashboard)
2. Click the "Settings" tab
3. Either:
   - **Option A**: Click "Detect Current Location" (uses browser GPS)
   - **Option B**: Manually enter address, city, state, ZIP
4. Click "Save Location"

**What Happens:**
- Your location is saved to the `user_locations` table in Supabase
- The concierge can now find businesses within 20 miles of you

---

### Step 2: Start a Conversation

**Example Request:**
> "I need a large pepperoni pizza"

**What the AI Does:**
1. Detects your intent: `pizza`
2. Asks clarifying questions ONE AT A TIME:
   - "What size and toppings would you like?"
   - "What's your budget?"
   - "How many businesses should I call? (1, 3, or 5)"
3. Confirms before making calls:
   - "I'll call 3 pizza places near you and get quotes for a large pepperoni pizza under $20. Sound good?"

**Your Response:** "Yes" or "Proceed"

---

### Step 3: AI Makes the Calls

**What Happens Behind the Scenes:**

1. **Business Search** (`/api/concierge/initiate-calls`)
   - Uses Google Places API
   - Searches for businesses matching intent near your location
   - Filters to only include businesses with phone numbers

2. **Parallel Calls** (`/api/voice/initiate-call`)
   - Makes 3 simultaneous calls to different businesses
   - Each call uses Twilio Voice API
   - AI agent asks for quotes/availability on each call

3. **Database Tracking**
   - Creates a `concierge_session` record
   - Creates 3 `concierge_call` records
   - Updates call status in real-time

**UI Update:**
- Automatically switches to "Tasks" tab
- Shows call progress:
  - 🔵 **Initiated** → 🟡 **In Progress** → 🟢 **Completed**

---

### Step 4: Review Quotes

**What You See:**
- Switches to "Quotes" tab automatically when calls complete
- Displays received quotes sorted by price (lowest first)
- Each quote shows:
  - Business name
  - Price
  - Rating
  - Details
  - "Accept" button

**Example:**
```
🍕 Papa John's
   ⭐ 4.2 stars
   $14.99
   [Accept Quote]

🍕 Domino's Pizza
   ⭐ 4.5 stars
   $16.50
   [Accept Quote]

🍕 Local Pizza Co.
   ⭐ 4.8 stars
   $18.00
   [Accept Quote]
```

---

### Step 5: Accept a Quote

**What Happens:**
1. Click "Accept" on your preferred quote
2. Gets confirmation toast: "Quote accepted from Papa John's for $14.99"
3. AI adds confirmation to chat:
   > "Great! I've recorded your acceptance of the quote from Papa John's for $14.99. They'll contact you shortly to confirm the details."

---

## 🔧 Technical Implementation Details

### 1. Location Management

**File:** `app/api/user-location/route.ts`

```typescript
// GET - Load saved location
const response = await fetch('/api/user-location')
// Returns: { success: true, location: { latitude, longitude, city, state, address, zipCode } }

// POST - Save new location
await fetch('/api/user-location', {
  method: 'POST',
  body: JSON.stringify({
    latitude: 37.7749,
    longitude: -122.4194,
    city: 'San Francisco',
    state: 'CA',
    address: '123 Main St',
    zipCode: '94102'
  })
})
```

**Priority Order:**
1. Request payload `userLocation` (if provided)
2. Saved `user_locations` table (from Settings)
3. Browser geolocation (as fallback)
4. Error if none available

---

### 2. AI Conversation Flow

**File:** `app/api/concierge/chat/route.ts`

**System Prompt:**
```
You are an AI Concierge assistant that helps users order services and products by making phone calls on their behalf.

Your job is to:
1. Understand what the user wants (e.g., "pizza", "oil change", "plumber")
2. Ask clarifying questions ONE AT A TIME
3. Ask how many businesses they want you to call (1, 3, or 5) - default to 3
4. Confirm before making calls
5. NEVER make calls without explicit confirmation

When user confirms, respond with: "READY_TO_CALL|<intent>|<businessCount>"
```

**Intent Detection:**
- `pizza` → Pizza delivery/takeout
- `plumber` → Plumbing services
- `oil_change` → Auto maintenance
- `electrician` → Electrical services
- `dentist` → Dental appointments

---

### 3. Call Initiation

**File:** `app/api/concierge/initiate-calls/route.ts`

**Process:**
1. Authenticate user
2. Resolve user location (using priority order)
3. Find businesses using Google Places API
4. Initiate parallel calls to each business
5. Store session and call records in database
6. Return call list to UI

**Example Request:**
```json
{
  "intent": "pizza",
  "businessCount": 3,
  "details": { "size": "large", "budget": "$20" },
  "userLocation": { "lat": 37.7749, "lng": -122.4194 }
}
```

**Example Response:**
```json
{
  "success": true,
  "sessionId": "uuid-here",
  "calls": [
    {
      "business": "Papa John's",
      "phone": "+1-555-0101",
      "address": "123 Main St",
      "rating": 4.2,
      "callId": "CA1234...",
      "status": "initiated"
    },
    // ... 2 more
  ]
}
```

---

### 4. UI Components

**Main Component:** `components/ai-concierge-interface.tsx`

**Key State:**
```typescript
const [activeTab, setActiveTab] = useState('chat')
const [chatMessages, setChatMessages] = useState<Message[]>([])
const [calls, setCalls] = useState<Call[]>([])
const [quotes, setQuotes] = useState<Quote[]>([])
const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
const [conversationState, setConversationState] = useState<ConversationState>({
  intent: undefined,
  details: {},
  readyToCall: false
})
```

**Key Functions:**
- `handleSendMessage()` → Sends message to AI
- `initiateCalls()` → Triggers business search and calls
- `detectCurrentLocation()` → Uses browser geolocation
- `saveLocation()` → Persists location to database
- `acceptQuote()` → Records quote acceptance

---

## 🎛️ Configuration & Environment

### Required Environment Variables

```env
# OpenAI (for AI conversation)
OPENAI_API_KEY=sk-...

# Google Places (for business search)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...

# Twilio (for phone calls)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...

# Supabase (database)
NEXT_PUBLIC_SUPABASE_URL=https://jphpxqqilrjyypztkswc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

---

## 🧪 Testing the AI Concierge

### Manual Test Plan

1. **Test Location Setup**
   - [ ] Open AI Concierge
   - [ ] Go to Settings tab
   - [ ] Click "Detect Current Location"
   - [ ] Verify location is detected and displayed
   - [ ] Click "Save Location"
   - [ ] Verify success toast

2. **Test Manual Location Entry**
   - [ ] Enter address manually
   - [ ] Click "Save Location"
   - [ ] Verify data is saved
   - [ ] Reload page
   - [ ] Verify location persists

3. **Test AI Conversation**
   - [ ] Type: "I want pizza"
   - [ ] Verify AI asks for details
   - [ ] Answer questions
   - [ ] Verify AI confirms before calling

4. **Test Call Initiation**
   - [ ] Confirm with "yes"
   - [ ] Verify switch to Tasks tab
   - [ ] Verify 3 calls are shown
   - [ ] Verify call status updates

5. **Test Quotes Display**
   - [ ] Wait for calls to complete
   - [ ] Verify switch to Quotes tab
   - [ ] Verify quotes are sorted by price
   - [ ] Click "Accept" on a quote
   - [ ] Verify confirmation message

---

## 🐛 Troubleshooting

### Issue: "Location Required" Error

**Cause:** No location set in Settings and browser geolocation blocked

**Fix:**
1. Go to Settings tab
2. Manually enter your address
3. Click "Save Location"

### Issue: "No businesses found"

**Cause:** Intent not recognized or no businesses nearby

**Fix:**
1. Ensure your location is set correctly
2. Try a different search term (e.g., "pizza delivery" instead of "food")
3. Increase search radius in Settings (if available)

### Issue: Calls failing

**Cause:** Twilio credentials not configured or phone numbers invalid

**Fix:**
1. Check environment variables
2. Verify Twilio account has credit
3. Check Twilio dashboard for error logs

---

## 📊 Database Schema

### concierge_sessions
```sql
CREATE TABLE concierge_sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  intent TEXT NOT NULL,              -- e.g., "pizza", "plumber"
  details JSONB DEFAULT '{}',        -- User preferences
  business_count INTEGER DEFAULT 3,  -- Number of businesses to call
  status TEXT DEFAULT 'in_progress', -- in_progress, completed, failed
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### concierge_calls
```sql
CREATE TABLE concierge_calls (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES concierge_sessions(id),
  business_name TEXT NOT NULL,
  business_phone TEXT NOT NULL,
  call_id TEXT,                      -- Twilio Call SID
  status TEXT DEFAULT 'initiated',   -- initiated, in_progress, completed, failed
  error TEXT,
  quote_amount DECIMAL(10, 2),
  quote_details JSONB,
  transcript TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### user_locations
```sql
CREATE TABLE user_locations (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  city TEXT,
  state TEXT,
  address TEXT,
  zip_code TEXT,
  is_primary BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🚀 Future Enhancements

### Phase 2: Advanced Features
- [ ] Voice input (speak your request)
- [ ] Real-time call transcripts
- [ ] Call recordings playback
- [ ] Business ratings & reviews
- [ ] Price comparison graphs
- [ ] Scheduled callbacks
- [ ] Multi-language support

### Phase 3: Integrations
- [ ] Calendar integration (auto-schedule appointments)
- [ ] Payment processing (pay directly through app)
- [ ] Email confirmations
- [ ] SMS notifications
- [ ] Loyalty programs tracking

---

## 📝 Development Notes

### Key Files Modified
- `components/ai-concierge-interface.tsx` - Main UI component
- `components/ai-concierge-popup.tsx` - Dialog wrapper
- `app/api/concierge/chat/route.ts` - AI conversation handler
- `app/api/concierge/initiate-calls/route.ts` - Call initiator
- `app/api/user-location/route.ts` - Location management
- `supabase/migrations/20251118_concierge_tables.sql` - Database schema

### Testing Commands
```bash
# Type check
npm run type-check

# Lint
npm run lint

# Build
npm run build

# Run dev server
npm run dev
```

---

## ✅ Completion Checklist

- [x] Database tables created (concierge_sessions, concierge_calls, user_locations)
- [x] RLS policies configured for security
- [x] Location management UI implemented
- [x] AI chat conversation flow implemented
- [x] Business search integration working
- [x] Call initiation system ready
- [x] Tasks tab showing call progress
- [x] Quotes tab displaying received quotes
- [x] Settings tab for location/preferences
- [ ] End-to-end testing with real calls
- [ ] Production deployment

---

**Status:** ✅ READY FOR TESTING

The AI Concierge is now fully implemented and ready to make calls on your behalf. All backend infrastructure, database tables, API routes, and UI components are in place and functional.


































