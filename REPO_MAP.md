# 🗺️ LifeHub Repository Map

## Architecture Overview

```
LifeHub
├── Frontend (Next.js 14 App Router)
├── Backend (API Routes)
├── Database (Supabase PostgreSQL)
└── Tests (Playwright + Jest)
```

---

## 📁 Directory Structure

### `/app` - Next.js Application
```
app/
├── page.tsx                    # Homepage / Command Center
├── layout.tsx                  # Root layout with providers
├── globals.css                 # Global styles
│
├── domains/                    # Domain management
│   ├── [domainId]/            # Dynamic domain pages
│   ├── financial/             # Financial domain
│   ├── health/                # Health domain
│   ├── vehicles/              # Vehicles domain
│   └── insurance/             # Insurance domain
│
├── api/                        # Backend API routes
│   ├── domain-entries/        # CRUD for domain_entries
│   ├── documents/             # Document upload & OCR
│   ├── ai-assistant/          # AI chat endpoints
│   ├── ai-concierge/          # Voice AI endpoints
│   ├── vapi/                  # VAPI integration
│   ├── plaid/                 # Banking integration
│   ├── gmail/                 # Gmail integration
│   ├── calendar/              # Google Calendar
│   └── notifications/         # Notification system
│
├── ai-assistant/              # AI Assistant page
├── concierge/                 # AI Concierge page
├── call-history/              # Call history page
├── finance/                   # Finance management
├── health/                    # Health tracking
├── pets/                      # Pet management
└── tools/                     # Utility calculators
```

### `/components` - React Components
```
components/
├── ui/                        # ShadCN UI primitives
│   ├── button.tsx
│   ├── dialog.tsx
│   ├── card.tsx
│   ├── back-button.tsx        # Global back button
│   └── smart-scanner.tsx      # Document scanner
│
├── dashboard/                 # Dashboard components
│   ├── command-center-redesigned.tsx
│   ├── customizable-dashboard.tsx
│   └── notification-hub.tsx
│
├── domain-cards/              # Domain-specific cards
├── finance/                   # Financial components
├── health/                    # Health components
├── insurance/                 # Insurance components
├── pets/                      # Pet components
│
├── ai-assistant-popup-clean.tsx
├── ai-concierge-popup-final.tsx
├── navigation/
│   └── main-nav.tsx           # Main navigation
│
└── providers/                 # React Context providers
```

### `/lib` - Utilities & Hooks
```
lib/
├── providers/                 # Context providers
│   ├── data-provider.tsx      # Main data context
│   ├── supabase-sync-provider.tsx
│   ├── notification-provider.tsx
│   └── finance-provider.tsx
│
├── hooks/                     # Custom hooks
│   ├── use-domain-entries.ts  # Domain CRUD hook
│   ├── use-data.ts
│   └── use-user-preferences.ts
│
├── utils/                     # Utility functions
│   ├── idb-cache.ts           # IndexedDB cache
│   ├── dev-geolocation-stub.ts
│   └── toast.tsx
│
├── document-saver.ts          # Document upload logic
├── notifications.ts           # Notification utils
└── achievements.ts            # Achievement system
```

### `/supabase` - Database
```
supabase/
└── migrations/                # SQL migrations
    ├── create_domain_entries_table.sql
    ├── migrate_domains_to_domain_entries_v2.sql
    ├── 20251025_domain_entries_common_indexes.sql
    └── 20251025_dashboard_aggregates.sql
```

### `/e2e` - End-to-End Tests
```
e2e/
├── 01-command-center.spec.ts  # Dashboard tests
├── 02-domains.spec.ts         # Domain page tests
├── 03-upload.spec.ts          # Upload functionality tests
└── 04-ai-assistant.spec.ts    # AI features tests
```

### `/scripts` - Automation Scripts
```
scripts/
├── generate-test-data.ts      # Test data generator
├── run-qa-tests.sh            # Full QA test runner
└── ensure-notification-settings.ts
```

---

## 🗄️ Database Schema

### Core Tables

#### `domain_entries` (Primary Data Table)
```sql
CREATE TABLE domain_entries (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  domain TEXT NOT NULL,              -- 'financial', 'health', etc.
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',       -- Domain-specific data
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Indexes:**
- `domain_entries_user_id_idx` - User lookups
- `domain_entries_domain_idx` - Domain filtering
- `domain_entries_user_domain_updated_at_idx` - Composite index
- Partial indexes for high-traffic domains (vehicles, financial, health, pets)

#### `tasks`
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY,
  user_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT false,
  priority TEXT,
  due_date TIMESTAMPTZ,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### `habits`
```sql
CREATE TABLE habits (
  id UUID PRIMARY KEY,
  user_id UUID,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  frequency TEXT,
  streak INTEGER DEFAULT 0,
  last_completed_at TIMESTAMPTZ
);
```

#### `bills`
```sql
CREATE TABLE bills (
  id UUID PRIMARY KEY,
  user_id UUID,
  title TEXT NOT NULL,
  amount NUMERIC,
  due_date TIMESTAMPTZ,
  category TEXT,
  status TEXT,
  recurring BOOLEAN DEFAULT false,
  metadata JSONB
);
```

#### `documents`
```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY,
  user_id UUID,
  title TEXT NOT NULL,
  category TEXT,
  file_url TEXT,
  extracted_text TEXT,
  extracted_data JSONB,
  document_type TEXT,
  confidence NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### `notifications`
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id UUID,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT,
  priority TEXT,
  read BOOLEAN DEFAULT false,
  dismissed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### `notification_settings`
```sql
CREATE TABLE notification_settings (
  id UUID PRIMARY KEY,
  user_id UUID UNIQUE,
  enabled BOOLEAN DEFAULT true,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  preferences JSONB
);
```

### Specialized Tables

- `insurance_policies` - Insurance policy data
- `vehicles` - Vehicle information
- `pets` - Pet profiles
- `health_medications` - Medication tracking
- `health_records` - Medical records
- `finance_transactions` - Financial transactions
- `plaid_items` - Plaid banking connections
- `call_history` - VAPI call logs
- `relationships` - Family/relationship data
- `travel_bookings` - Travel information

---

## 🔌 API Routes

### Domain Management
- `GET /api/domain-entries` - List entries
- `POST /api/domain-entries` - Create entry
- `GET /api/domain-entries/[id]` - Get entry
- `PUT /api/domain-entries/[id]` - Update entry
- `DELETE /api/domain-entries/[id]` - Delete entry

### Document Management
- `POST /api/documents/upload` - Upload document
- `POST /api/documents/smart-scan` - AI document scanning
- `POST /api/documents/upload-to-drive` - Google Drive upload
- `GET /api/documents` - List documents

### AI Features
- `POST /api/ai-assistant/chat` - AI chat
- `POST /api/ai-assistant/analyze-image` - Image analysis
- `POST /api/ai-concierge/smart-call` - Smart calling
- `POST /api/ai-concierge/make-call` - Make phone call
- `POST /api/vapi/webhook` - VAPI webhooks
- `POST /api/vapi/outbound-call` - Outbound calls

### Integrations
- `POST /api/plaid/create-link-token` - Plaid auth
- `POST /api/plaid/exchange-token` - Exchange token
- `GET /api/plaid/get-transactions` - Get transactions
- `POST /api/calendar/sync` - Sync Google Calendar
- `GET /api/gmail/suggestions` - Gmail suggestions
- `POST /api/drive/upload` - Upload to Drive

### Notifications
- `POST /api/notifications/generate` - Generate notifications
- `GET /api/notifications` - List notifications
- `POST /api/notifications/actions` - Mark read/dismissed

### User Settings
- `GET /api/user-settings` - Get user preferences
- `POST /api/user-settings` - Save preferences

---

## 🎨 Key Components

### Data Providers
1. **DataProvider** (`lib/providers/data-provider.tsx`)
   - Central data management
   - Supabase integration
   - Real-time subscriptions
   - IndexedDB caching

2. **SupabaseSyncProvider**
   - Real-time sync
   - Offline support
   - Conflict resolution

3. **NotificationProvider**
   - Notification management
   - Scheduling
   - Quiet hours

### UI Components
1. **SmartScanner** (`components/ui/smart-scanner.tsx`)
   - Document upload
   - AI extraction
   - Domain routing

2. **BackButton** (`components/ui/back-button.tsx`)
   - Global navigation
   - Route-based visibility

3. **CommandCenter** (`components/dashboard/command-center-redesigned.tsx`)
   - Dashboard metrics
   - Domain cards
   - Quick actions

### AI Components
1. **AIAssistantPopupClean**
   - Chat interface
   - Message history
   - Simulated responses

2. **AIConciergePopupFinal**
   - Voice commands
   - Business search
   - Call management

---

## 🔄 Data Flow

### Read Flow
```
User → Component → useData() → DataProvider → Supabase
                                    ↓
                              IndexedDB Cache
                                    ↓
                                UI Update
```

### Write Flow
```
User → Component → useData() → DataProvider → Supabase
                                                  ↓
                                          Real-time Event
                                                  ↓
                                          All Clients Update
```

### Upload Flow
```
User → SmartScanner → AI Processing → DocumentSaver → Supabase
                                                          ↓
                                                   domain_entries
                                                          ↓
                                                   Storage Bucket
```

---

## 🧪 Test Coverage

### Unit Tests (`__tests__/`)
- Domain entry hooks
- Utility functions
- Data transformations

### Integration Tests (`e2e/`)
- Command Center metrics
- Domain pages
- Upload functionality
- AI features

### API Tests
- Endpoint availability
- Response validation
- Error handling

---

## 🚀 Deployment

### Environment Variables
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI Services
GEMINI_API_KEY=
OPENAI_API_KEY=

# Voice AI
NEXT_PUBLIC_VAPI_KEY=
NEXT_PUBLIC_VAPI_ASSISTANT_ID=

# Banking
PLAID_CLIENT_ID=
PLAID_SECRET=

# Google
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

### Build Commands
```bash
npm run build      # Production build
npm run start      # Start production server
npm run dev        # Development server
```

---

## 📊 Performance

### Optimizations
- ✅ IndexedDB caching for instant load
- ✅ Real-time debouncing (300ms)
- ✅ Narrowed Supabase selects
- ✅ Database indexes on hot paths
- ✅ IDB-first hydration
- ✅ Lazy loading for heavy components

### Metrics
- Initial load: < 3s
- Time to interactive: < 5s
- Real-time update latency: < 500ms
- Upload processing: 2-5s

---

## 🔐 Security

### Row Level Security (RLS)
All tables have RLS policies:
```sql
-- Example policy
CREATE POLICY "Users can view their own entries"
  ON domain_entries
  FOR SELECT
  USING (auth.uid() = user_id);
```

### Authentication
- Supabase Auth
- JWT tokens
- Session management
- OAuth integrations

---

## 📝 Development Workflow

1. **Feature Development**
   - Create component
   - Add API route if needed
   - Update types
   - Add tests

2. **Database Changes**
   - Create migration
   - Test locally
   - Deploy to Supabase

3. **Testing**
   - Write unit tests
   - Add E2E tests
   - Run QA suite

4. **Deployment**
   - Build locally
   - Run tests
   - Deploy to Vercel

---

**Last Updated**: October 26, 2025  
**Version**: 1.0.0  
**Status**: ✅ Production Ready





