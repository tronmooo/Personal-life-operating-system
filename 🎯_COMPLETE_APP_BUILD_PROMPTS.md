# 🎯 Complete LifeHub App - Build Prompts

## Overview
This document contains **all the prompts** needed to rebuild the entire LifeHub Personal Life Operating System from scratch. Each section represents a major prompt or series of prompts that would create the full application.

---

## 📋 Table of Contents
1. [Initial Setup & Architecture](#1-initial-setup--architecture)
2. [Authentication & User Management](#2-authentication--user-management)
3. [Database Schema & Supabase](#3-database-schema--supabase)
4. [Core Provider System](#4-core-provider-system)
5. [Navigation & UI Framework](#5-navigation--ui-framework)
6. [Domain System (21 Life Domains)](#6-domain-system-21-life-domains)
7. [AI Assistant & Chat](#7-ai-assistant--chat)
8. [Voice AI Integration](#8-voice-ai-integration)
9. [Document Scanning & OCR](#9-document-scanning--ocr)
10. [Financial Integration (Plaid)](#10-financial-integration-plaid)
11. [Calendar & Gmail Integration](#11-calendar--gmail-integration)
12. [Specialized Domain Features](#12-specialized-domain-features)
13. [Notifications & Reminders](#13-notifications--reminders)
14. [AI Concierge & Outbound Calling](#14-ai-concierge--outbound-calling)
15. [Data Visualization & Charts](#15-data-visualization--charts)
16. [Command Palette & Quick Actions](#16-command-palette--quick-actions)
17. [Cloud Sync & Multi-Device](#17-cloud-sync--multi-device)
18. [Testing & Deployment](#18-testing--deployment)

---

## 1. Initial Setup & Architecture

### Prompt 1.1: Project Foundation
```
Create a Next.js 14 application called "LifeHub" - a comprehensive personal life operating system. 

Requirements:
- Use Next.js 14 with App Router
- TypeScript for type safety
- Tailwind CSS for styling
- Shadcn/ui for component library
- Supabase for backend (auth, database, storage)
- Support for 21 different life domains
- Dark mode support

Project Structure:
- app/ - Next.js app directory
- components/ - Reusable UI components
- lib/ - Utilities, providers, helpers
- types/ - TypeScript type definitions
- public/ - Static assets

Create the basic folder structure and essential configuration files:
- package.json with all dependencies
- tsconfig.json
- tailwind.config.ts
- next.config.js
- .env.local template

Include these key dependencies:
- @supabase/auth-helpers-nextjs
- @supabase/supabase-js
- recharts (for visualizations)
- date-fns (date handling)
- lucide-react (icons)
- react-hook-form
- zod (validation)
```

### Prompt 1.2: Theme System
```
Implement a comprehensive theme system with:
- Dark/light mode toggle
- Custom color palette with gradient support
- CSS custom properties for theming
- Theme persistence in localStorage
- Smooth transitions between themes

Color Scheme:
- Primary: Purple/Blue gradient (#667eea to #764ba2)
- Secondary: Teal/Green gradient
- Accent colors for each of 21 domains
- Proper contrast ratios for accessibility

Create:
- ThemeProvider component
- Theme toggle button
- Global CSS with theme variables
- Utility functions for theme management
```

---

## 2. Authentication & User Management

### Prompt 2.1: Supabase Authentication
```
Implement complete authentication system using Supabase Auth:

Features:
- Email/password authentication
- Google OAuth
- Password reset flow
- Email verification
- Protected routes
- Session management
- User profile management

Create these pages:
- /auth - Authentication page with sign in/sign up forms
- /auth/callback - OAuth callback handler
- /auth/reset-password - Password reset
- /profile - User profile management

Components needed:
- AuthProvider (context for auth state)
- ProtectedRoute wrapper
- SignInForm
- SignUpForm
- ProfileEditor

Include middleware for:
- Automatic session refresh
- Route protection
- Redirect logic (signed in users away from /auth)
```

### Prompt 2.2: User Preferences & Onboarding
```
Create user onboarding and preferences system:

Onboarding Wizard:
- Welcome screen
- Domain selection (which areas of life to track)
- Data import options
- Quick tutorial
- Initial goal setting

User Preferences:
- Notification settings
- Display preferences
- Data sync options
- Privacy settings
- Export/backup options

Create:
- WelcomeWizard component with multi-step form
- UserPreferences data model
- Preferences storage in Supabase
- Settings page at /settings
```

---

## 3. Database Schema & Supabase

### Prompt 3.1: Core Database Tables
```
Design and implement comprehensive Supabase database schema:

Core Tables:
1. domains - Generic storage for all domain data
   - id (uuid, primary key)
   - user_id (uuid, foreign key to auth.users)
   - domain_name (text)
   - data (jsonb)
   - created_at, updated_at (timestamptz)

2. users - Extended user profile
   - id (uuid, matches auth.users.id)
   - full_name, avatar_url
   - preferences (jsonb)
   - onboarding_completed (boolean)

3. documents - File uploads
   - id, user_id
   - file_path, file_name, mime_type
   - metadata (jsonb with OCR data)
   - domain, category
   - uploaded_at

4. reminders - Notifications and alerts
   - id, user_id
   - title, description
   - due_date, priority, status
   - related_domain, related_id

5. external_connections - API integrations
   - id, user_id
   - provider (plaid, google, etc.)
   - access_token, refresh_token
   - metadata, status

Enable Row Level Security (RLS) on all tables with policies:
- Users can only access their own data
- Automatic user_id filtering
```

### Prompt 3.2: Domain-Specific Tables
```
Create specialized tables for high-traffic domains:

Pets Domain:
- pets (id, user_id, name, species, breed, photo_url, metadata)
- pet_vaccinations (id, pet_id, vaccine_name, date, next_due, photo)
- pet_documents (id, pet_id, document_name, file_url, extracted_text)
- pet_costs (id, pet_id, cost_type, amount, date, description)

Nutrition Domain:
- nutrition_meals (id, user_id, meal_name, meal_type, calories, protein, carbs, fats, meal_time)
- nutrition_water_logs (id, user_id, amount_ml, log_time)

Fitness Domain:
- fitness_activities (id, user_id, activity_type, duration_minutes, calories_burned, steps, start_time)
- fitness_workouts (id, user_id, workout_name, exercises jsonb, duration)

Home Domain:
- homes (id, user_id, address, property_type, purchase_price, current_value)
- home_assets (id, home_id, asset_name, category, purchase_price, estimated_value)
- home_maintenance (id, home_id, task_name, priority, status, due_date)
- home_projects (id, home_id, project_name, status, estimated_cost, actual_cost)

Vehicles:
- vehicles (id, user_id, make, model, year, vin, current_mileage)
- vehicle_maintenance (id, vehicle_id, service_type, last_service_date, next_due)
- vehicle_costs (id, vehicle_id, cost_type, amount, date)
- vehicle_warranties (id, vehicle_id, warranty_name, provider, expiry_date)

Relationships:
- relationships (id, user_id, name, relationship_type, birthday, email, phone, notes)
- relationship_reminders (id, person_id, reminder_date, title, is_completed)

Financial (beyond Plaid):
- finance_transactions (id, user_id, type, category, amount, date, description)
- bills (id, user_id, title, amount, due_date, recurring, status)
- goals (id, user_id, title, target_amount, current_amount, deadline)

Apply RLS policies to all tables.
```

### Prompt 3.3: Storage Buckets
```
Set up Supabase Storage buckets:

Buckets:
1. documents - User uploaded files
   - Public read, authenticated write
   - File size limit: 50MB
   - Allowed types: PDF, images, documents

2. photos - Images only
   - Optimized for images
   - Automatic image optimization
   - Thumbnail generation

3. avatars - User profile pictures
   - Small size limit (5MB)
   - Public read access

Create helper functions:
- uploadFile(bucket, file, path)
- getPublicUrl(bucket, path)
- deleteFile(bucket, path)
- listFiles(bucket, prefix)

Implement these in lib/supabase-storage.ts
```

---

## 4. Core Provider System

### Prompt 4.1: Data Provider
```
Create a centralized DataProvider for all app data:

Location: lib/providers/data-provider.tsx

Features:
- Centralized state management for all 21 domains
- Real-time data sync with Supabase
- Optimistic UI updates
- Event-driven updates (custom events for data changes)
- Caching and performance optimization

Context API:
```typescript
interface DataContextType {
  data: Record<Domain, DomainData[]>
  loading: boolean
  error: string | null
  
  // CRUD operations
  getData: (domain: Domain) => DomainData[]
  addData: (domain: Domain, item: Partial<DomainData>) => Promise<void>
  updateData: (domain: Domain, id: string, updates: Partial<DomainData>) => Promise<void>
  deleteData: (domain: Domain, id: string) => Promise<void>
  
  // Batch operations
  addBatch: (domain: Domain, items: Partial<DomainData>[]) => Promise<void>
  
  // Reload
  reloadDomain: (domain: Domain) => Promise<void>
  reloadAll: () => Promise<void>
}
```

Implementation:
- Load all user data on mount
- Dispatch custom events ('data-updated', 'domain-data-updated')
- Handle offline mode gracefully
- Implement retry logic for failed operations
```

### Prompt 4.2: Finance Provider
```
Create specialized FinanceProvider for financial data:

Location: lib/providers/finance-provider.tsx

Features:
- Manage transactions, accounts, budgets, bills
- Plaid integration
- Transaction categorization
- Budget tracking
- Net worth calculation
- Bill due date reminders

Context API:
```typescript
interface FinanceContextType {
  transactions: Transaction[]
  accounts: Account[]
  bills: Bill[]
  budgets: Budget[]
  goals: FinancialGoal[]
  netWorth: number
  
  // Operations
  addTransaction: (transaction: Transaction) => Promise<void>
  addBill: (bill: Bill) => Promise<void>
  markBillAsPaid: (billId: string) => Promise<void>
  updateBudget: (budget: Budget) => Promise<void>
  
  // Plaid
  linkedAccounts: PlaidAccount[]
  syncPlaidAccounts: () => Promise<void>
}
```

Integration with Plaid for automatic transaction import.
```

### Prompt 4.3: Health Provider
```
Create HealthProvider for health and wellness data:

Location: lib/providers/health-provider.tsx

Features:
- Track vitals (weight, blood pressure, heart rate)
- Medication reminders
- Doctor appointments
- Medical records
- Allergies and conditions
- Health goals

Context API:
```typescript
interface HealthContextType {
  metrics: HealthMetric[]
  medications: Medication[]
  appointments: Appointment[]
  records: MedicalRecord[]
  allergies: string[]
  conditions: string[]
  
  addMetric: (metric: HealthMetric) => Promise<void>
  addMedication: (medication: Medication) => Promise<void>
  scheduleAppointment: (appointment: Appointment) => Promise<void>
  uploadRecord: (record: MedicalRecord, file?: File) => Promise<void>
}
```

Include medication reminder system and appointment notifications.
```

---

## 5. Navigation & UI Framework

### Prompt 5.1: Main Navigation
```
Create a sophisticated navigation system:

Location: components/navigation/main-nav.tsx

Features:
- Top navigation bar with logo
- Domain quick links with icons
- Search functionality
- User profile dropdown
- Notification bell with count
- Theme toggle
- Mobile-responsive hamburger menu

Navigation Items:
- Dashboard
- 21 Domain Icons (each with unique color)
- Command Center
- AI Chat
- Settings
- Profile

Implement:
- Active route highlighting
- Breadcrumb navigation
- Back button for nested pages
- Keyboard shortcuts (Cmd+K for search)
```

### Prompt 5.2: Domain Grid & Switcher
```
Create domain selection interface:

Location: components/domains/domain-grid.tsx

Features:
- 21 domain cards in responsive grid
- Each domain has:
  - Unique icon and gradient
  - Name and description
  - Quick stats/KPIs
  - Last updated time
- Click to navigate to domain page
- Hover effects and animations

Domain Categories:
1. **Personal Life**
   - Health, Fitness, Nutrition, Sleep, Mindfulness
   
2. **Relationships**
   - Relationships, Pets, Social

3. **Finance & Career**
   - Financial, Career, Business, Insurance

4. **Home & Property**
   - Home, Vehicles, Appliances, Collectibles

5. **Growth & Learning**
   - Education, Skills, Personal Growth, Digital Life

6. **Miscellaneous**
   - Miscellaneous, Documents

Create:
- DomainGrid component
- DomainCard component
- Domain routing logic
```

---

## 6. Domain System (21 Life Domains)

### Prompt 6.1: Domain Configuration System
```
Create a flexible domain configuration system:

Location: types/domains.ts

Define domain structure:
```typescript
export type Domain = 
  | 'health' | 'fitness' | 'nutrition' | 'sleep' | 'mindfulness'
  | 'financial' | 'career' | 'business' | 'insurance'
  | 'home' | 'vehicles' | 'appliances' | 'collectibles'
  | 'education' | 'skills' | 'personal-growth' | 'digital-life'
  | 'relationships' | 'pets' | 'social'
  | 'miscellaneous'

interface DomainConfig {
  id: Domain
  name: string
  icon: LucideIcon
  color: string
  gradient: string
  description: string
  fields: FieldConfig[]
  categories?: string[]
  features: string[]
}
```

Create DOMAIN_CONFIGS object with configuration for all 21 domains including:
- Custom fields for each domain
- Validation rules
- Display options
- Quick log templates
```

### Prompt 6.2: Generic Domain Page
```
Create a universal domain detail page:

Location: app/domains/[domainId]/page.tsx

Features:
- Tab navigation (Overview, Add, Visualizations, Documents)
- List view of all items in domain
- Add/Edit/Delete operations
- Filter and search
- Sort options
- Export data
- Visualizations specific to domain

Components:
- Domain header with stats
- Data table/list
- Add item dialog (dynamic form based on domain config)
- Edit dialog
- Delete confirmation
- Empty state with onboarding

Handle special cases for domains with custom UIs:
- Pets → Custom pet profiles
- Vehicles → Vehicle tracker
- Mindfulness → Meditation app
- Relationships → Contact manager
```

### Prompt 6.3: Domain Quick Log System
```
Create quick log functionality for rapid data entry:

Location: components/domain-quick-log.tsx

Features:
- Floating button or sidebar widget
- Quick entry forms for each domain
- Voice input support
- AI-assisted data entry
- Recent entries list
- Keyboard shortcuts

Templates by domain:
- Fitness: Quick workout log
- Nutrition: Quick meal log
- Health: Quick vitals
- Finance: Quick transaction
- etc.

Implement smart defaults and autocomplete.
```

---

## 7. AI Assistant & Chat

### Prompt 7.1: AI Chat Interface
```
Create an AI-powered chat assistant:

Location: components/ai/ai-chat-box.tsx

Features:
- Chat interface with message history
- Support for text and voice input
- AI can access all user data (with permission)
- Can perform actions:
  - Add data to any domain
  - Create reminders
  - Search across domains
  - Answer questions about data
  - Provide insights and recommendations
- Streaming responses
- Code syntax highlighting
- Copy responses
- Regenerate answers

AI Capabilities:
- Data analysis (spending trends, fitness progress)
- Smart suggestions (upcoming bills, maintenance due)
- Natural language queries ("Show my spending last month")
- Action execution ("Add $50 grocery expense")
- Calendar integration ("What's my schedule tomorrow?")

Use OpenAI API with custom system prompt that includes:
- User context
- Available domains and data
- Allowed actions
- Data privacy rules
```

### Prompt 7.2: AI Data Logging
```
Implement AI-powered data logging:

Location: lib/ai-logger.ts

Features:
- Parse natural language input
- Extract relevant data fields
- Identify correct domain
- Handle ambiguity with clarifying questions
- Multi-domain logging in one request

Examples:
- "I went for a 5k run and burned 350 calories"
  → Adds to fitness domain

- "Paid $150 for car insurance"
  → Adds to financial domain

- "Rex got rabies vaccine today at Dr. Smith's"
  → Adds to pets domain

Create API route: /api/ai/log-data

Integration with GPT-4 for parsing and validation.
```

### Prompt 7.3: AI Insights & Recommendations
```
Build AI insights engine:

Location: lib/ai/insights-engine.ts

Features:
- Analyze user data across all domains
- Generate personalized insights:
  - Financial: Spending patterns, savings opportunities
  - Health: Trends, goal progress
  - Fitness: Performance improvements
  - Home: Maintenance schedules
- Predictive analytics
- Goal recommendations
- Risk alerts

Dashboard widgets:
- AI Insights card
- Anomaly detection
- Trend predictions
- Action recommendations

Implement daily/weekly summary emails.
```

---

## 8. Voice AI Integration

### Prompt 8.1: Voice Input System
```
Implement voice-to-text for data entry:

Location: components/voice/voice-data-entry.tsx

Features:
- Microphone button in navigation
- Real-time speech-to-text
- Multi-language support
- Noise cancellation
- Offline mode with Web Speech API fallback

Use:
- Deepgram API for high-accuracy transcription
- Web Speech API as fallback
- Custom wake word detection

Integration points:
- Chat interface
- Quick log
- Add data dialogs
- Search
```

### Prompt 8.2: AI Voice Assistant (VAPI)
```
Integrate VAPI.ai for conversational AI:

Location: components/voice/vapi-assistant.tsx

Features:
- Voice conversations with AI assistant
- Natural language understanding
- Can perform all app functions via voice
- Hands-free operation
- Continuous conversation mode

Capabilities:
- "Add a task"
- "What's my net worth?"
- "Show my upcoming bills"
- "Log today's workout"
- "Schedule maintenance for my car"

Setup:
- VAPI account and API key
- Custom assistant configuration
- Function calling for app actions
- Voice selection

Create:
- Voice button in nav
- Voice session management
- Conversation history
- Settings for voice preferences
```

### Prompt 8.3: AI Concierge Calling
```
Build AI concierge for outbound calls:

Location: components/concierge/ai-concierge.tsx

Features:
- Make phone calls on user's behalf
- Schedule appointments
- Get quotes from businesses
- Cancel services
- Handle customer service calls
- Real-time call transcription

Use Cases:
- "Call plumbers near me and get quotes"
- "Schedule car maintenance appointment"
- "Cancel my gym membership"

Integration:
- Twilio for phone calls
- ElevenLabs for AI voice
- Custom call scripts
- Call recordings and transcripts

Create:
- Call interface
- Call history
- Contact suggestions
- Script templates
```

---

## 9. Document Scanning & OCR

### Prompt 9.1: Universal Document Scanner
```
Create document upload and scanning system:

Location: components/universal/document-upload-scanner.tsx

Features:
- Upload PDF, images, documents
- Take photos with camera
- OCR text extraction using Tesseract.js
- Automatic metadata extraction:
  - Dates (issue, expiration)
  - Names
  - ID numbers
  - Amounts
- Document categorization
- Preview with highlights

Use cases:
- Medical records → Health domain
- Receipts → Financial domain
- Insurance cards → Insurance domain
- Vaccination records → Pets domain
- Titles/deeds → Home domain

Create:
- DocumentUploadScanner component
- OCR processing worker
- Metadata extraction logic
- Document viewer
```

### Prompt 9.2: Smart Document Organization
```
Implement intelligent document management:

Location: components/documents/smart-organizer.tsx

Features:
- Automatic categorization
- Duplicate detection
- Expiration tracking
- Search with OCR text
- Tags and labels
- Folder structure
- Share/export options

AI Features:
- Extract key information
- Suggest categories
- Create reminders for expirations
- Link to related domains

Create:
- Documents dashboard
- Search interface
- Category browser
- Expiration alerts
```

### Prompt 9.3: Meal Photo Analysis
```
Create food photo analyzer for nutrition tracking:

Location: components/nutrition/meal-photo-analyzer.tsx

Features:
- Take/upload food photos
- AI identifies food items
- Estimates nutrition (calories, macros)
- Suggests portion sizes
- Multi-item detection

Integration:
- OpenAI Vision API or Google Cloud Vision
- Custom nutrition database
- Barcode scanning for packaged foods

Create:
- Photo capture interface
- Food identification
- Nutrition estimation
- Save to nutrition domain
```

---

## 10. Financial Integration (Plaid)

### Prompt 10.1: Plaid Bank Connection
```
Integrate Plaid for bank account linking:

Location: lib/plaid-integration.ts

Features:
- Link bank accounts
- Import transactions automatically
- Real-time balance updates
- Multiple account support
- Secure token management

Setup:
- Plaid Link component
- Webhook handling
- Token exchange
- Account syncing

Create API routes:
- /api/plaid/create-link-token
- /api/plaid/exchange-public-token
- /api/plaid/sync-transactions
- /api/plaid/webhooks

Store:
- linked_accounts table
- transactions table
- Access tokens (encrypted)
```

### Prompt 10.2: Transaction Management
```
Build comprehensive transaction system:

Location: components/finance-simple/transactions-view.tsx

Features:
- List all transactions (manual + Plaid)
- Smart categorization
- Custom categories
- Split transactions
- Recurring transaction detection
- Search and filters
- Export to CSV

AI Features:
- Auto-categorize transactions
- Detect recurring bills
- Identify unusual spending
- Budget recommendations

Create:
- Transaction list component
- Category editor
- Bulk editing
- Transaction details modal
```

### Prompt 10.3: Budget & Goals System
```
Implement budgeting and financial goals:

Location: components/finance-simple/budget-view.tsx

Features:
- Monthly budgets by category
- Budget vs actual comparison
- Spending trends
- Savings goals with progress
- Net worth tracking over time
- Bill reminders
- Income tracking

Visualizations:
- Budget progress bars
- Spending pie charts
- Net worth line graph
- Cash flow waterfall

Create:
- Budget manager
- Goal tracker
- Bill manager
- Reports dashboard
```

---

## 11. Calendar & Gmail Integration

### Prompt 11.1: Google Calendar Integration
```
Integrate Google Calendar for event management:

Location: lib/integrations/google-calendar.ts

Features:
- OAuth2 authentication
- Import all calendars
- Two-way sync
- Create events from app
- Reminders sync
- Recurring events

Sync with domains:
- Doctor appointments → Health
- Car service → Vehicles
- Pet vet visits → Pets
- Bill due dates → Financial

Create:
- Google auth flow
- Calendar sync service
- Event creation from domains
- Calendar view in app

API routes:
- /api/calendar/auth
- /api/calendar/sync
- /api/calendar/create-event
```

### Prompt 11.2: Gmail Smart Parsing
```
Build Gmail integration for automatic data extraction:

Location: lib/integrations/gmail-parser.ts

Features:
- OAuth2 Gmail access
- Scan emails for relevant data
- Extract:
  - Bills and invoices
  - Shipping notifications
  - Appointment confirmations
  - Receipts
  - Insurance updates
- Create domain entries automatically
- User review before saving

Parsers for:
- Financial transactions
- Medical appointments
- Travel bookings
- Subscriptions
- Deliveries

Create:
- Gmail auth flow
- Email scanning service
- Data extraction rules
- Review interface
- /api/gmail/* routes
```

### Prompt 11.3: Email Notifications
```
Implement email notification system:

Location: lib/notifications/email-sender.ts

Features:
- Daily/weekly summaries
- Bill due reminders
- Goal milestones
- Anomaly alerts
- System notifications

Email types:
- Daily digest
- Weekly report
- Monthly review
- Custom alerts

Use:
- Resend or SendGrid
- Email templates
- Unsubscribe management
- Preference center
```

---

## 12. Specialized Domain Features

### Prompt 12.1: Pets Domain Complete System
```
Build comprehensive pet management:

Location: app/pets/[petId]/page.tsx

Features:
- Pet profiles with photos
- Vaccination tracking with reminders
- Vet visit history
- Medication schedules
- Weight tracking
- Cost tracking
- Documents (vet records, adoption papers)
- AI vet chat for questions

Tabs:
- Profile
- Vaccinations
- Documents
- Costs
- AI Vet
- Health Records

Create:
- Pet list page
- Pet detail page with tabs
- Add pet wizard
- Vaccination scheduler
- Cost tracker
- Document uploader

Include photo upload and display.
```

### Prompt 12.2: Vehicle Tracker AutoTrack
```
Create advanced vehicle management:

Location: components/domain-profiles/vehicle-tracker-autotrack.tsx

Features:
- Multiple vehicle support
- Maintenance tracking
- Mileage logging
- Cost tracking (fuel, repairs, insurance)
- Warranty management
- Service reminders
- Value estimation
- Resale tracking

Dashboard showing:
- Current mileage
- Next service due
- Total costs
- Cost per mile
- Upcoming renewals

Create:
- Vehicle dashboard
- Maintenance logger
- Cost tracker
- Service history
- Warranty manager
```

### Prompt 12.3: Home Management System
```
Build comprehensive home management:

Location: components/home/home-manager.tsx

Features:
- Multiple properties
- Asset inventory
- Maintenance schedules
- Project tracking
- Cost tracking
- Document storage
- Home value tracking
- Tax/insurance tracking

For each home:
- Overview dashboard
- Asset inventory (appliances, furniture, etc.)
- Maintenance calendar
- Projects (renovations, repairs)
- Documents (deed, insurance, warranties)
- Bills (mortgage, utilities, HOA)

Create:
- Property selector
- Asset manager
- Maintenance scheduler
- Project tracker
- Document vault
```

### Prompt 12.4: Relationships Manager
```
Create relationship and contact management:

Location: components/relationships/relationships-manager.tsx

Features:
- Contact profiles
- Birthday reminders
- Last contact tracking
- Gift ideas and history
- Important dates
- Notes and memories
- Communication history
- Relationship strength meter

Contact types:
- Best Friend
- Friend
- Family
- Partner
- Colleague
- Acquaintance
- Mentor

Create:
- Contact list
- Contact detail page
- Birthday calendar
- Reminder system
- Gift tracker
- Interaction logger
```

### Prompt 12.5: Mindfulness App
```
Build full-featured mindfulness application:

Location: components/mindfulness/mindfulness-app-full.tsx

Features:
- Meditation timer
- Guided sessions
- Breath exercises
- Mood tracking
- Gratitude journal
- Progress statistics
- Streak tracking
- Reminders

Practice types:
- Breathing exercises
- Body scan
- Loving-kindness
- Walking meditation
- Guided imagery
- Journaling

Create:
- Session player
- Timer
- Practice library
- Mood logger
- Journal entries
- Statistics dashboard
```

---

## 13. Notifications & Reminders

### Prompt 13.1: Notification System
```
Build comprehensive notification system:

Location: components/notifications/notification-center.tsx

Features:
- In-app notifications
- Push notifications (PWA)
- Email notifications
- SMS notifications (optional)
- Notification preferences per domain
- Snooze functionality
- Action buttons in notifications

Notification types:
- Reminders (bills, appointments, maintenance)
- Alerts (unusual spending, health metrics)
- Updates (new features, system messages)
- AI insights
- Goal milestones

Create:
- Notification bell with count
- Notification list
- Notification preferences
- Notification scheduler
- Push subscription manager
```

### Prompt 13.2: Smart Reminder Engine
```
Create intelligent reminder system:

Location: lib/reminders/smart-scheduler.ts

Features:
- Auto-create reminders from data:
  - Bills due in 3 days
  - Car maintenance due
  - Prescription refills
  - Pet vaccinations
  - Home maintenance
  - Birthdays
  - Anniversaries
- Smart timing (don't remind late at night)
- Recurring reminders
- Snooze options
- Priority levels

Create:
- Reminder scheduler (cron jobs)
- Reminder templates
- Smart suggestions
- /api/reminders routes
```

---

## 14. AI Concierge & Outbound Calling

### Prompt 14.1: Call Interface & Management
```
Build AI concierge call system:

Location: components/concierge/call-manager.tsx

Features:
- Initiate outbound calls
- Real-time call status
- Call recording
- Transcription
- Summary generation
- Follow-up actions

Use cases:
- Get service quotes
- Schedule appointments
- Cancel subscriptions
- Customer service
- Information gathering

Create:
- Call interface
- Call history
- Recordings player
- Transcripts viewer
- Business finder integration
```

### Prompt 14.2: Business Search & Selection
```
Implement business finder for calling:

Location: components/concierge/business-search.tsx

Features:
- Search nearby businesses
- Filter by category
- View business details
- See reviews and ratings
- Select for calling
- Save favorites

Integration:
- Google Places API
- Yelp API
- Business hours
- Contact info
- Categories

Create:
- Search interface
- Map view
- Business cards
- Filter options
- Selection for calling
```

---

## 15. Data Visualization & Charts

### Prompt 15.1: Domain Visualizations
```
Create visualization system for all domains:

Location: components/domains/domain-visualizations.tsx

Chart types by domain:
- Financial: Net worth line, spending pie, budget bars
- Health: Weight line, BP line, vitals trends
- Fitness: Calories burned, steps, activity pie
- Nutrition: Calories line, macro pie, meal frequency
- Home: Property value, maintenance costs, project timeline
- Vehicles: Mileage, costs, maintenance timeline

Use recharts library with:
- Responsive design
- Interactive tooltips
- Custom colors per domain
- Export functionality
- Time range filters

Create:
- Chart component library
- Domain-specific chart configs
- Data aggregation helpers
- Chart selector
```

### Prompt 15.2: Command Center Dashboard
```
Build unified command center:

Location: app/command/page.tsx

Features:
- Overview of all 21 domains
- Key metrics per domain
- Recent activity feed
- Upcoming reminders
- Quick actions
- AI insights panel
- Custom layouts

Widgets:
- Financial snapshot
- Health summary
- Fitness progress
- Upcoming events
- Due bills
- Maintenance tasks
- Pet reminders
- Goal progress

Create:
- Widget system
- Drag-and-drop layout
- Save custom layouts
- Real-time updates
```

---

## 16. Command Palette & Quick Actions

### Prompt 16.1: Command Palette
```
Implement command palette (Cmd+K):

Location: components/command-palette.tsx

Features:
- Global search across all domains
- Quick actions
- Navigation shortcuts
- Recent items
- Fuzzy search
- Keyboard navigation

Commands:
- "Add [domain] entry"
- "Go to [page]"
- "Search [query]"
- "Open [document]"
- "Call [contact]"
- "Set reminder"

Create:
- Command palette UI
- Search engine
- Action registry
- Keyboard shortcuts
- Command suggestions
```

### Prompt 16.2: Quick Add Widget
```
Create floating quick add widget:

Location: components/quick-add-widget.tsx

Features:
- Floating button
- Quick entry forms
- Voice input
- Recently used domains
- Smart suggestions
- Keyboard shortcuts

Forms for:
- Transaction
- Task
- Meal
- Workout
- Note
- Reminder

Create:
- Floating button
- Quick forms
- Domain selector
- Recent entries
```

---

## 17. Cloud Sync & Multi-Device

### Prompt 17.1: Real-time Sync System
```
Implement real-time data synchronization:

Location: lib/sync/realtime-sync.ts

Features:
- Supabase Realtime subscriptions
- Optimistic updates
- Conflict resolution
- Offline support
- Background sync
- Multi-device coordination

Sync:
- All domain data
- User preferences
- Notification state
- Draft entries

Create:
- Sync manager
- Conflict resolver
- Offline queue
- Sync status indicator
```

### Prompt 17.2: Offline Mode
```
Build offline-first capabilities:

Location: lib/offline/offline-manager.ts

Features:
- Local data caching (IndexedDB)
- Offline operation
- Queue operations
- Sync when online
- Conflict detection
- Offline indicator

Create:
- Cache manager
- Operation queue
- Sync reconciliation
- Storage management
- Network detector
```

---

## 18. Testing & Deployment

### Prompt 18.1: Testing Suite
```
Create comprehensive test suite:

Tests needed:
- Unit tests for utilities
- Component tests (React Testing Library)
- Integration tests for data flow
- E2E tests (Playwright)
- API route tests

Test coverage for:
- Authentication flow
- Data CRUD operations
- API integrations
- Payment processing
- File uploads
- Real-time sync

Setup:
- Jest configuration
- Testing utilities
- Mock data generators
- CI/CD integration
```

### Prompt 18.2: Deployment Setup
```
Prepare for production deployment:

Deployment checklist:
1. Environment variables
2. Database migrations
3. Storage bucket setup
4. API key configuration
5. Domain configuration
6. SSL certificates
7. Error monitoring (Sentry)
8. Analytics (Posthog/Plausible)
9. Performance monitoring
10. Backup strategy

Platforms:
- Vercel (hosting)
- Supabase (backend)
- Cloudflare (CDN)

Create:
- Deployment scripts
- Environment templates
- Migration runner
- Health check endpoints
- Status page
```

---

## 🎯 Implementation Order

Recommended build sequence:

### Phase 1: Foundation (Week 1-2)
1. Project setup & configuration
2. Authentication system
3. Basic database schema
4. Core providers (Data, Theme)
5. Navigation structure

### Phase 2: Core Features (Week 3-4)
6. Domain system framework
7. Generic domain pages
8. Data visualizations
9. Document upload/OCR
10. Command palette

### Phase 3: AI Integration (Week 5-6)
11. AI chat assistant
12. AI data logging
13. Voice input
14. AI insights engine

### Phase 4: External Integrations (Week 7-8)
15. Plaid financial integration
16. Google Calendar sync
17. Gmail parsing
18. Voice AI (VAPI)

### Phase 5: Specialized Domains (Week 9-10)
19. Pets complete system
20. Vehicle tracker
21. Home management
22. Relationships manager
23. Mindfulness app
24. Financial dashboard

### Phase 6: Advanced Features (Week 11-12)
25. AI Concierge calling
26. Notification system
27. Real-time sync
28. Offline mode
29. Command center dashboard

### Phase 7: Polish & Launch (Week 13-14)
30. Testing suite
31. Performance optimization
32. Mobile responsiveness
33. Accessibility
34. Documentation
35. Deployment

---

## 💡 Key Technologies & APIs

### Core Stack
- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Shadcn/ui** - Component library
- **Supabase** - Backend (auth, DB, storage, realtime)

### AI & Voice
- **OpenAI GPT-4** - AI assistant, data logging
- **Deepgram** - Speech-to-text
- **VAPI.ai** - Voice conversations
- **ElevenLabs** - Text-to-speech
- **Tesseract.js** - OCR

### Integrations
- **Plaid** - Bank connections
- **Google Calendar API** - Calendar sync
- **Gmail API** - Email parsing
- **Google Places API** - Business search
- **Twilio** - Phone calls

### Data & Visualization
- **Recharts** - Charts and graphs
- **date-fns** - Date handling
- **zod** - Validation
- **react-hook-form** - Forms

### Utilities
- **Lucide React** - Icons
- **clsx** - Class names
- **nanoid** - ID generation
- **crypto-js** - Encryption

---

## 📚 Additional Resources

### Documentation to Reference
- Next.js App Router docs
- Supabase docs (Auth, Database, Storage, Realtime)
- OpenAI API docs
- Plaid Quickstart
- Google OAuth setup
- VAPI.ai documentation

### Design Inspiration
- Modern SaaS dashboards
- Personal finance apps (Mint, YNAB)
- Health tracking apps
- Notion-style interfaces

---

## 🎉 Final Notes

This comprehensive prompt set covers the **entire LifeHub application**. Each prompt can be executed independently but should follow the recommended implementation order for best results.

**Total Development Time**: ~14 weeks for MVP with 1-2 developers

**Lines of Code**: ~50,000+ LOC

**Components**: 150+ React components

**API Routes**: 50+ endpoints

**Database Tables**: 30+ tables

**AI Integration Points**: 15+ AI features

This is a **production-grade** personal life operating system with features rivaling or exceeding commercial applications.



















