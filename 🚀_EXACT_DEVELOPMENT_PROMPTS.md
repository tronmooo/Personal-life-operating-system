# 🚀 EXACT Development Prompts - LifeHub Complete Build

## ⚡ How to Use This Document
Each prompt below is **copy-paste ready**. Give these to an AI assistant **in order** to build your entire app with all wiring, data flow, and displays working correctly.

---

## 🏗️ PHASE 1: Foundation & Setup

### Prompt 1: Initialize Project
```
Create a Next.js 14 app called "LifeHub" with the following exact setup:

1. Initialize with TypeScript, Tailwind CSS, and App Router
2. Install these exact dependencies:
   - @supabase/auth-helpers-nextjs
   - @supabase/supabase-js  
   - @supabase/ssr
   - recharts
   - date-fns
   - lucide-react
   - react-hook-form
   - zod
   - clsx
   - tailwind-merge

3. Set up Shadcn/ui with these components:
   - button, card, dialog, input, label, select, tabs, table, toast

4. Create this exact folder structure:
   /app
     /api
     /auth
     /domains
     /pets
     /finance
     /health
     /home
   /components
     /ui
     /navigation
     /ai
     /pets
     /finance
     /health
   /lib
     /providers
     /utils
   /types

5. Create .env.local template with:
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   OPENAI_API_KEY=
   DEEPGRAM_API_KEY=

Show me the package.json and all config files.
```

### Prompt 2: Supabase Configuration
```
Set up Supabase integration with EXACT configuration:

1. Create lib/supabase/client.ts:
   - Export createBrowserClient() function
   - Export createServerClient() function
   - Handle cookie management properly

2. Create lib/supabase/server.ts:
   - Server-side client with cookies() from next/headers
   - Proper TypeScript types

3. Create middleware.ts in root:
   - Refresh Supabase session on every request
   - Update session cookie
   - Handle auth redirects

4. Show me EXACT code for all three files with proper error handling.
```

### Prompt 3: Database Schema - Complete
```
Create the COMPLETE Supabase database schema with ALL tables:

Execute this EXACT SQL (show me the complete migration):

-- Core Tables
CREATE TABLE domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  domain_name text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Pets Tables
CREATE TABLE pets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  species text NOT NULL,
  breed text,
  birth_date date,
  weight numeric,
  photo_url text,
  microchip_number text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE pet_vaccinations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pet_id uuid REFERENCES pets(id) ON DELETE CASCADE NOT NULL,
  vaccine_name text NOT NULL,
  administered_date date NOT NULL,
  next_due_date date,
  veterinarian text,
  photo_url text,
  notes text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE pet_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pet_id uuid REFERENCES pets(id) ON DELETE CASCADE NOT NULL,
  cost_type text NOT NULL CHECK (cost_type IN ('food', 'vet', 'grooming', 'supplies', 'boarding', 'training', 'other')),
  amount numeric NOT NULL,
  date date NOT NULL,
  description text,
  vendor text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Nutrition Tables
CREATE TABLE nutrition_meals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  meal_name text NOT NULL,
  meal_type text CHECK (meal_type IN ('Breakfast', 'Lunch', 'Dinner', 'Snack', 'Other')),
  meal_time timestamptz DEFAULT now(),
  calories numeric DEFAULT 0,
  protein numeric DEFAULT 0,
  carbs numeric DEFAULT 0,
  fats numeric DEFAULT 0,
  fiber numeric DEFAULT 0,
  photo_url text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE nutrition_water_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount_ml numeric NOT NULL,
  log_time timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Fitness Tables
CREATE TABLE fitness_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  activity_type text NOT NULL,
  activity_name text,
  start_time timestamptz NOT NULL,
  duration_minutes integer,
  calories_burned numeric DEFAULT 0,
  steps integer DEFAULT 0,
  distance_km numeric,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Home Tables
CREATE TABLE homes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  address text NOT NULL,
  property_type text,
  purchase_price numeric,
  current_value numeric,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE home_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  home_id uuid REFERENCES homes(id) ON DELETE CASCADE,
  asset_name text NOT NULL,
  category text,
  purchase_price numeric,
  estimated_value numeric,
  photo_url text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE home_maintenance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  home_id uuid REFERENCES homes(id) ON DELETE CASCADE,
  task_name text NOT NULL,
  priority text CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
  status text DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Completed', 'Overdue')),
  due_date date,
  completed_date date,
  cost numeric DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on ALL tables
ALTER TABLE domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE pet_vaccinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE pet_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_water_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE fitness_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE homes ENABLE ROW LEVEL SECURITY;
ALTER TABLE home_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE home_maintenance ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies (Users can only access their own data)
CREATE POLICY "Users can manage their own domains" ON domains FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own pets" ON pets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage pet vaccinations" ON pet_vaccinations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage pet costs" ON pet_costs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage meals" ON nutrition_meals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage water logs" ON nutrition_water_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage fitness activities" ON fitness_activities FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage homes" ON homes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage home assets" ON home_assets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage home maintenance" ON home_maintenance FOR ALL USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_pets_user_id ON pets(user_id);
CREATE INDEX idx_pet_vaccinations_pet_id ON pet_vaccinations(pet_id);
CREATE INDEX idx_nutrition_meals_user_id ON nutrition_meals(user_id);
CREATE INDEX idx_fitness_activities_user_id ON fitness_activities(user_id);

Give me the complete SQL migration file and confirm all tables are created.
```

---

## 🔐 PHASE 2: Authentication (Working Session)

### Prompt 4: Complete Auth System
```
Build a COMPLETE authentication system that WORKS with Supabase:

1. Create app/auth/page.tsx:
   - Sign in/sign up toggle
   - Email/password fields
   - Google OAuth button
   - Proper error handling
   - Redirect to /domains after success

2. Create app/auth/callback/route.ts:
   - Handle OAuth callback
   - Exchange code for session
   - Set cookies properly
   - Redirect to /domains

3. Create components/auth/auth-form.tsx:
   - Working email/password auth
   - Form validation with Zod
   - Loading states
   - Error messages

4. Test that:
   - Sign up creates user
   - Sign in works
   - Session persists
   - Protected routes work

Show me COMPLETE working code for all auth files with proper error handling and redirects.
```

---

## 🎯 PHASE 3: Core Data Provider (The Brain)

### Prompt 5: DataProvider with ALL Wiring
```
Create lib/providers/data-provider.tsx that is the CENTRAL data hub:

This provider MUST:
1. Load ALL user data from Supabase on mount
2. Provide CRUD functions for ALL domains
3. Dispatch events when data changes
4. Handle optimistic updates
5. Work with BOTH generic 'domains' table AND specific tables

EXACT TypeScript interface:
```typescript
interface DataContextType {
  // Data state
  data: Record<string, any[]>
  loading: boolean
  error: string | null
  
  // Generic domain operations (works with 'domains' table)
  getData: (domain: string) => any[]
  addData: (domain: string, item: any) => Promise<void>
  updateData: (domain: string, id: string, updates: any) => Promise<void>
  deleteData: (domain: string, id: string) => Promise<void>
  reloadDomain: (domain: string) => Promise<void>
  
  // Specific domain getters
  getPets: () => Promise<any[]>
  getMeals: () => Promise<any[]>
  getActivities: () => Promise<any[]>
  getHomes: () => Promise<any[]>
}
```

Implementation MUST:
- On mount: Load from 'domains' table for all generic domains
- Load from specific tables (pets, nutrition_meals, fitness_activities, etc.)
- Dispatch 'data-updated' event after ANY change
- Dispatch 'pets-data-updated', 'nutrition-data-updated', etc.
- Save to correct table (use specific tables when available, fallback to domains)

CRITICAL: Show me the COMPLETE provider code with:
- Full CRUD implementation
- Event dispatching
- Error handling
- Loading states
- Table routing logic (which data goes to which table)
```

### Prompt 6: API Routes for ALL Tables
```
Create API routes for EVERY table with COMPLETE CRUD:

1. app/api/pets/route.ts
   - GET /api/pets - List all user's pets
   - GET /api/pets?petId=X - Get single pet
   - POST /api/pets - Create pet
   - PUT /api/pets - Update pet
   - DELETE /api/pets?petId=X - Delete pet

2. app/api/pets/vaccinations/route.ts
   - GET - List vaccinations for pet
   - POST - Add vaccination
   - DELETE - Remove vaccination

3. app/api/pets/costs/route.ts
   - GET - List costs for pet
   - POST - Add cost
   - DELETE - Remove cost

4. app/api/nutrition/meals/route.ts
   - GET - List meals
   - POST - Add meal
   - PUT - Update meal
   - DELETE - Delete meal

5. app/api/fitness/activities/route.ts
   - GET - List activities
   - POST - Add activity
   - DELETE - Delete activity

6. app/api/homes/route.ts
   - GET - List homes
   - POST - Add home
   - PUT - Update home
   - DELETE - Delete home

7. app/api/homes/assets/route.ts
   - GET - List assets for home
   - POST - Add asset
   - DELETE - Delete asset

8. app/api/homes/maintenance/route.ts
   - GET - List maintenance tasks
   - POST - Add task
   - PUT - Update task
   - DELETE - Delete task

EACH route MUST:
- Check authentication (session)
- Validate user_id matches session
- Handle errors properly
- Return consistent JSON format
- Include TypeScript types

Show me COMPLETE code for ALL 8 API route files.
```

---

## 🐾 PHASE 4: Pets Domain (Complete & Working)

### Prompt 7: Pets - Complete Implementation
```
Build the COMPLETE pets domain with ALL features working:

1. app/pets/page.tsx
   - List ALL user's pets from database
   - Load using: fetch('/api/pets')
   - Show pet cards with photo, name, species
   - Click card → Navigate to /pets/[petId]
   - "Add Pet" button → Opens dialog
   - Display counts: vaccinations, costs

2. components/pets/add-pet-dialog.tsx
   - Form with: name, species, breed, birth_date, weight, microchip_number
   - On submit: POST to /api/pets
   - After success: Reload pets list
   - Show loading state
   - Handle errors

3. app/pets/[petId]/page.tsx
   - Load pet: fetch(`/api/pets?petId=${petId}`)
   - Tabs: Profile, Vaccinations, Costs, Documents
   - Delete pet button

4. components/pets/profile-tab.tsx
   - Display pet info
   - Upload photo button
   - Photo upload flow:
     * Select image
     * Upload to /api/upload
     * Update pet: PUT /api/pets with photo_url
     * Show new photo

5. components/pets/vaccinations-tab.tsx
   - List vaccinations: fetch(`/api/pets/vaccinations?petId=${petId}`)
   - Add vaccination form
   - POST to /api/pets/vaccinations
   - Delete button for each

6. components/pets/costs-tab.tsx
   - List costs: fetch(`/api/pets/costs?petId=${petId}`)
   - Add cost form
   - POST to /api/pets/costs
   - Show total costs
   - Delete button

CRITICAL: Show COMPLETE working code for ALL 6 files with:
- Proper data fetching
- Loading states
- Error handling
- Optimistic updates
- Data refresh after changes
```

### Prompt 8: File Upload System
```
Create universal file upload that WORKS:

1. app/api/upload/route.ts:
   - Accept FormData with 'file'
   - Upload to Supabase Storage 'documents' bucket
   - Return public URL
   - Handle errors

2. Usage in components:
```typescript
const handleUpload = async (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  
  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData
  })
  
  const { url } = await res.json()
  return url
}
```

Show COMPLETE upload API route with Supabase Storage integration.
```

---

## 🍽️ PHASE 5: Nutrition Domain (Complete & Working)

### Prompt 9: Nutrition - Complete Implementation
```
Build COMPLETE nutrition tracking with meals and water:

1. app/nutrition/page.tsx or components/nutrition/dashboard-view.tsx
   - Tabs: Meals, Water, Goals
   - Show today's totals: calories, protein, carbs, fats
   - Chart: Calories over last 7 days

2. components/nutrition/meals-view.tsx
   - List meals: fetch('/api/nutrition/meals')
   - Group by meal_type (Breakfast, Lunch, Dinner, Snack)
   - Show each meal: name, time, calories, macros
   - "Add Meal" button → Opens dialog
   - "Add via Photo/PDF" → Opens scanner
   - Delete button for each meal

3. components/nutrition/add-meal-dialog.tsx
   - Form: meal_name, meal_type, calories, protein, carbs, fats, fiber
   - POST to /api/nutrition/meals
   - After success: Reload meals
   - Reset form

4. Integration with DocumentUploadScanner:
   - Button: "Add via Photo/PDF"
   - Scanner extracts text with OCR
   - Parse calories, protein, carbs, fats, fiber from text
   - Auto-fill meal form or save directly

5. components/nutrition/water-view.tsx
   - Show today's water intake
   - Goal progress bar (2000ml default)
   - Quick add buttons: 250ml, 500ml, 1000ml
   - POST to /api/nutrition/water
   - List today's logs

Show COMPLETE code for all 5 components with:
- Data fetching
- Forms that work
- Charts using recharts
- Proper state management
```

---

## 💪 PHASE 6: Fitness Domain (Complete & Working)

### Prompt 10: Fitness - Complete Implementation
```
Build COMPLETE fitness tracking:

1. components/fitness/dashboard-tab.tsx
   - Today's stats: Steps, Calories, Activities
   - Charts:
     * Calories Burned (last 7 days) - bar chart
     * Steps Progress - line chart
     * Activity Distribution - pie chart
   - Load: fetch('/api/fitness/activities')

2. components/fitness/activities-list.tsx
   - List all activities
   - Show: activity_type, duration, calories, steps, date
   - Filter by date range
   - Sort options

3. components/fitness/add-activity-dialog.tsx
   - Form:
     * activity_type (dropdown: Running, Walking, Cycling, Gym, Yoga, Swimming)
     * activity_name
     * start_time (datetime picker)
     * duration_minutes
     * calories_burned
     * steps
     * distance_km
   - POST to /api/fitness/activities
   - Success: Reload activities

4. API route: app/api/fitness/activities/route.ts
   - GET: Return all user's activities
   - POST: Create activity
   - DELETE: Remove activity
   - Filter by date range (query params)

Show COMPLETE code with working charts and data flow.
```

---

## 🏠 PHASE 7: Home Domain (Complete & Working)

### Prompt 11: Home Management - Complete
```
Build COMPLETE home/property management:

1. app/home/page.tsx
   - List all homes: fetch('/api/homes')
   - Show cards: address, property_type, current_value
   - "Add Home" button
   - Click home → Navigate to /home/[homeId]

2. app/home/[homeId]/page.tsx
   - Tabs: Overview, Assets, Maintenance, Projects, Documents
   - Load home: fetch(`/api/homes?homeId=${homeId}`)
   - Show home details

3. components/home/assets-tab.tsx
   - List assets: fetch(`/api/homes/assets?homeId=${homeId}`)
   - Show: asset_name, category, value, photo
   - Add asset form (with photo upload)
   - POST to /api/homes/assets
   - Delete button

4. components/home/maintenance-tab.tsx
   - List tasks: fetch(`/api/homes/maintenance?homeId=${homeId}`)
   - Show: task_name, priority, status, due_date
   - Filter by status
   - Add task form
   - Mark complete button
   - PUT to update status

5. Create API routes:
   - /api/homes/route.ts (CRUD homes)
   - /api/homes/assets/route.ts (CRUD assets)
   - /api/homes/maintenance/route.ts (CRUD tasks)

Show COMPLETE working code for all files.
```

---

## 📊 PHASE 8: Data Visualization System

### Prompt 12: Charts That Actually Work
```
Create a reusable chart system using recharts:

1. components/charts/line-chart.tsx
   - Props: data, xKey, yKey, title, color
   - Responsive
   - Tooltip with formatting
   - Grid and axes

2. components/charts/bar-chart.tsx
   - Props: data, xKey, yKey, title, color
   - Vertical bars
   - Tooltips

3. components/charts/pie-chart.tsx
   - Props: data, nameKey, valueKey, title, colors
   - Legend
   - Percentage labels

4. Usage examples for each domain:
   - Financial: Net worth line chart
   - Health: Weight tracking line chart
   - Fitness: Calories bar chart, Activity pie chart
   - Nutrition: Calorie intake line chart

5. Data aggregation helpers:
```typescript
// lib/utils/chart-helpers.ts
export function aggregateByDate(items: any[], dateField: string, valueField: string) {
  // Group by date and sum values
}

export function last7Days() {
  // Return array of last 7 dates
}

export function getLast7DaysData(items: any[], dateField: string, valueField: string) {
  // Return data for last 7 days
}
```

Show COMPLETE chart components and helper functions that work with real data.
```

---

## 🎨 PHASE 9: Navigation & UI Polish

### Prompt 13: Navigation That Works
```
Build COMPLETE navigation system:

1. components/navigation/main-nav.tsx
   - Top navigation bar
   - Logo (left)
   - Links: Dashboard, Domains, Finance, Health, Pets, Home
   - Right side: Search, Notifications, Profile dropdown
   - Active link highlighting
   - Mobile hamburger menu

2. components/navigation/domain-nav.tsx
   - Show all 21 domains in a grid or sidebar
   - Each domain: icon, name, color
   - Click → Navigate to /domains/[domainId]
   - Show unread count badges

3. components/dashboard/domain-grid.tsx
   - 21 domain cards
   - Each shows: icon, name, quick stats
   - Hover effects
   - Click to navigate

4. Breadcrumbs:
   - Show current path
   - Clickable navigation
   - Back button where appropriate

Show COMPLETE navigation code with proper routing.
```

---

## 🤖 PHASE 10: AI Integration (Smart Features)

### Prompt 14: AI Chat Assistant
```
Build AI chat that can ADD data to domains:

1. components/ai/ai-chat-box.tsx
   - Chat interface
   - Message history
   - Input with send button
   - Streaming responses
   - Loading states

2. app/api/ai/chat/route.ts
   - POST endpoint
   - Send message to OpenAI GPT-4
   - System prompt includes:
     * User's data summary
     * Available domains
     * Available actions (add to domain)
   - Parse AI response for actions
   - Execute actions (call domain APIs)
   - Return response

3. Action execution:
```typescript
// AI says: "I've added a workout to your fitness log"
// Parse JSON: { action: "add", domain: "fitness", data: {...} }
// Execute: await fetch('/api/fitness/activities', { method: 'POST', body: JSON.stringify(data) })
```

4. Example commands:
   - "Add $50 grocery expense" → Adds to financial
   - "Log 30 minute run, 300 calories" → Adds to fitness
   - "I fed Rex today" → Adds to pets

Show COMPLETE AI chat with action execution.
```

### Prompt 15: AI Data Logging
```
Create AI-powered data entry:

1. app/api/ai/log-data/route.ts
   - Accept natural language input
   - Use GPT-4 to parse into structured data
   - Identify which domain
   - Extract field values
   - Save to correct API endpoint
   - Return success message

2. Example prompts:
   - "Ran 5k in 30 minutes" → fitness activity
   - "Had chicken salad for lunch, 450 calories" → nutrition meal
   - "Changed oil in Toyota, $45" → vehicle maintenance
   - "Rex vet appointment next Tuesday at 2pm" → pet reminder

3. Integration in UI:
   - Voice button → Transcribe → Send to AI log
   - Quick add widget → AI parse → Save
   - Chat → Extract actions → Execute

Show COMPLETE implementation with OpenAI integration.
```

---

## 📸 PHASE 11: Document Scanning (OCR Working)

### Prompt 16: Document Scanner with OCR
```
Build document scanner that EXTRACTS data:

1. components/universal/document-upload-scanner.tsx
   - Upload PDF, image, or take photo
   - Use Tesseract.js for OCR
   - Extract text from document
   - Display extracted text
   - Allow editing
   - Save with metadata

2. Smart extraction:
```typescript
// Extract patterns from OCR text
function extractDate(text: string): Date | null
function extractAmount(text: string): number | null
function extractNames(text: string): string[]
```

3. Domain-specific extraction:
   - Receipts: amount, vendor, items
   - Medical: patient name, date, provider, medications
   - Pet records: pet name, vaccine, date, vet
   - Insurance: policy number, dates, coverage

4. Usage in domains:
   - Nutrition: Upload meal receipt → Extract items and calories
   - Pets: Upload vaccine record → Auto-fill vaccination form
   - Finance: Upload receipt → Create transaction

Show COMPLETE scanner component with working OCR.
```

---

## 💰 PHASE 12: Financial Integration (Plaid Working)

### Prompt 17: Plaid Bank Connection
```
Integrate Plaid for automatic transaction import:

1. Setup Plaid:
   - Install @plaid/plaid
   - Get API keys (sandbox mode)
   - Create Link token endpoint

2. app/api/plaid/create-link-token/route.ts
   - Create Plaid Link token
   - Return to frontend

3. app/api/plaid/exchange-token/route.ts
   - Exchange public_token for access_token
   - Store access_token in database
   - Fetch initial transactions

4. app/api/plaid/sync-transactions/route.ts
   - Sync new transactions
   - Store in database
   - Categorize automatically

5. components/finance/plaid-link-button.tsx
   - Open Plaid Link
   - Handle success
   - Save access token
   - Load transactions

6. Display:
   - Show all transactions (manual + Plaid)
   - Show account balances
   - Calculate net worth

Show COMPLETE Plaid integration with data flow.
```

---

## 🔔 PHASE 13: Notifications & Reminders

### Prompt 18: Notification System
```
Build COMPLETE notification system:

1. Database table:
```sql
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text,
  priority text CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  read boolean DEFAULT false,
  action_url text,
  created_at timestamptz DEFAULT now()
);
```

2. components/notifications/notification-bell.tsx
   - Bell icon with unread count badge
   - Dropdown list of notifications
   - Mark as read
   - Click → Navigate to action_url

3. app/api/notifications/route.ts
   - GET: List user's notifications
   - POST: Create notification
   - PUT: Mark as read
   - DELETE: Delete notification

4. Auto-create notifications for:
   - Bills due in 3 days
   - Pet vaccinations due
   - Home maintenance due
   - Appointments tomorrow
   - Low account balance
   - Goal milestones reached

5. Notification scheduler:
   - Check daily for due items
   - Create notifications
   - Send emails (optional)

Show COMPLETE notification system.
```

---

## 🎯 PHASE 14: Command Center (Unified Dashboard)

### Prompt 19: Command Center Dashboard
```
Build unified dashboard showing ALL domains:

1. app/command/page.tsx
   - Grid of all 21 domains
   - Each domain card shows:
     * Icon and name
     * Key stats (e.g., "5 pets", "$1,234 net worth", "3 due tasks")
     * Last activity timestamp
     * Quick actions
   - Click card → Navigate to domain

2. Load data for ALL domains:
```typescript
useEffect(() => {
  async function loadAllData() {
    const [pets, meals, activities, homes, accounts] = await Promise.all([
      fetch('/api/pets').then(r => r.json()),
      fetch('/api/nutrition/meals').then(r => r.json()),
      fetch('/api/fitness/activities').then(r => r.json()),
      fetch('/api/homes').then(r => r.json()),
      fetch('/api/finance/accounts').then(r => r.json()),
    ])
    
    // Set states...
  }
  loadAllData()
}, [])
```

3. Quick stats calculations:
   - Total pets
   - Today's calories
   - This week's workouts
   - Net worth
   - Upcoming due items (bills, maintenance)

4. Recent activity feed:
   - Last 10 actions across all domains
   - "Added Rex to pets"
   - "Logged lunch - 650 calories"
   - "Paid electric bill - $120"

Show COMPLETE command center with real data.
```

---

## 🎤 PHASE 15: Voice Input (Optional but Cool)

### Prompt 20: Voice Data Entry
```
Add voice input for hands-free data entry:

1. Install @deepgram/sdk or use Web Speech API

2. components/voice/voice-button.tsx
   - Microphone button
   - Start/stop recording
   - Real-time transcription
   - Send to AI for parsing

3. Integration:
```typescript
const handleVoiceInput = async (transcript: string) => {
  // Send to AI to parse
  const response = await fetch('/api/ai/log-data', {
    method: 'POST',
    body: JSON.stringify({ input: transcript })
  })
  
  const { domain, data } = await response.json()
  
  // Save to correct domain
  await fetch(`/api/${domain}`, {
    method: 'POST',
    body: JSON.stringify(data)
  })
}
```

4. Use cases:
   - "Add workout: ran 3 miles, 25 minutes"
   - "Log meal: chicken breast, broccoli, 400 calories"
   - "Paid car insurance $180"

Show voice input component with AI parsing.
```

---

## ✅ PHASE 16: Testing & Verification

### Prompt 21: Test ALL Features
```
Create a comprehensive test checklist:

Test EACH domain:
1. Pets:
   - [ ] Add pet works
   - [ ] Pet shows in list
   - [ ] Click pet opens profile
   - [ ] Upload photo works
   - [ ] Add vaccination works
   - [ ] Add cost works
   - [ ] Delete pet works

2. Nutrition:
   - [ ] Add meal works
   - [ ] Meal shows in list
   - [ ] Calories calculate correctly
   - [ ] Charts show data
   - [ ] Delete meal works

3. Fitness:
   - [ ] Add activity works
   - [ ] Activity shows in list
   - [ ] Charts populate
   - [ ] Stats calculate correctly

4. Home:
   - [ ] Add home works
   - [ ] Add asset works
   - [ ] Add maintenance works
   - [ ] All show in lists

5. Finance:
   - [ ] Add transaction works
   - [ ] Plaid connection works
   - [ ] Accounts show
   - [ ] Net worth calculates

Create automated tests or manual test script for EVERY feature.
```

---

## 🚨 CRITICAL ISSUES TO FIX

### Prompt 22: Fix Common Issues
```
Debug and fix these common problems:

1. "Data not showing after adding":
   - Check if API route returns success
   - Check if component reloads data
   - Check if event listeners work
   - Add console.log to trace data flow

2. "Can't add data - not authenticated":
   - Verify session exists
   - Check middleware refreshes session
   - Test auth on each API route
   - Add better error messages

3. "Charts showing empty":
   - Check data format matches chart component
   - Verify data aggregation functions
   - Test with sample data
   - Add fallbacks for empty states

4. "Photos not uploading":
   - Test /api/upload endpoint directly
   - Check Supabase storage bucket exists
   - Verify RLS policies allow uploads
   - Add error handling

5. "Navigation not working":
   - Check route files exist
   - Verify Link components use correct paths
   - Test dynamic routes [id]
   - Add loading states

Show fixes for EACH issue with code examples.
```

---

## 🎁 BONUS: Polish & Features

### Prompt 23: Add Polish
```
Add finishing touches:

1. Loading states everywhere:
   - Skeleton loaders while fetching
   - Spinner buttons while saving
   - Progress bars for uploads

2. Empty states:
   - Friendly messages when no data
   - Call-to-action buttons
   - Illustrations or icons

3. Error handling:
   - Toast notifications for errors
   - Retry buttons
   - Helpful error messages

4. Animations:
   - Smooth transitions
   - Fade in/out
   - Slide animations

5. Mobile responsive:
   - Test on mobile viewport
   - Touch-friendly buttons
   - Collapsible navigation

6. Dark mode:
   - Theme toggle
   - Proper color contrast
   - Persist preference

Show examples of each polish element.
```

---

## 🎯 DEPLOYMENT READY

### Prompt 24: Deploy to Production
```
Prepare for deployment:

1. Environment variables:
   - Add all API keys to Vercel
   - Set up production Supabase project
   - Configure domain

2. Database setup:
   - Run all migrations
   - Set up backups
   - Configure RLS policies

3. Build check:
   - Run `npm run build`
   - Fix any build errors
   - Test production build locally

4. Deploy:
   - Push to GitHub
   - Connect to Vercel
   - Deploy
   - Test live site

5. Post-deploy:
   - Test all features in production
   - Monitor errors
   - Check performance
   - Set up analytics

Show deployment checklist and commands.
```

---

## 📋 SUMMARY: Complete Build Order

Give these prompts IN THIS EXACT ORDER:

### Week 1: Foundation
- Prompt 1-3: Setup, Supabase, Database
- Prompt 4: Auth system
- Prompt 5-6: DataProvider & API routes

### Week 2: Core Domains
- Prompt 7-8: Pets (complete)
- Prompt 9: Nutrition (complete)
- Prompt 10: Fitness (complete)
- Prompt 11: Home (complete)

### Week 3: UI & Features
- Prompt 12: Charts
- Prompt 13: Navigation
- Prompt 14-15: AI features
- Prompt 16: Document scanning

### Week 4: Integrations
- Prompt 17: Plaid
- Prompt 18: Notifications
- Prompt 19: Command center
- Prompt 20: Voice (optional)

### Week 5: Testing & Launch
- Prompt 21: Testing
- Prompt 22: Bug fixes
- Prompt 23: Polish
- Prompt 24: Deploy

---

## ✨ Key Success Factors

1. **Follow prompts in order** - Each builds on previous
2. **Test after each prompt** - Don't move forward with broken features
3. **Use TypeScript** - Types catch errors early
4. **Check authentication** - Most issues are auth-related
5. **Verify data flow** - Trace from form → API → database → display
6. **Add logging** - Console.log liberally during development
7. **Handle errors** - Every API call needs try/catch
8. **Show loading states** - Better UX
9. **Reload after mutations** - Refresh data after add/edit/delete
10. **Test with real data** - Don't rely on mock data

---

## 🎯 Expected Result

After completing ALL prompts, you'll have:
- ✅ 21 working life domains
- ✅ Complete CRUD for all data
- ✅ Charts and visualizations
- ✅ AI-powered features
- ✅ Document scanning with OCR
- ✅ Bank integration (Plaid)
- ✅ Notifications system
- ✅ Voice input
- ✅ Mobile responsive
- ✅ Production ready

**Total Development Time**: 4-5 weeks
**Lines of Code**: ~40,000
**API Routes**: 50+
**Components**: 150+
**Database Tables**: 30+

This is your COMPLETE app rebuild guide! 🚀



















