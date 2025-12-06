# 🚀 Phase 5 Implementation Guide

## Overview
This document outlines the complete implementation of Phase 5B (Log Visualizations), 5C (AI Insights 2.0), and 5D (Supabase Backend).

---

## 📊 Phase 5B: Universal Log Visualizations

### Components to Create:

#### 1. `/components/log-visualizations/log-chart-renderer.tsx`
**Purpose**: Universal chart renderer for all log types

**Features**:
- Auto-detects log type and renders appropriate chart
- Supports: Line, Bar, Pie, Area, Heatmap
- Time range filtering
- Export functionality
- Responsive design

#### 2. `/components/log-visualizations/financial-log-charts.tsx`
**Charts**:
- Expense breakdown (Pie chart by category)
- Income vs Expenses (Bar chart)
- Daily spending trend (Line chart)
- Category spending over time (Area chart)

#### 3. `/components/log-visualizations/health-log-charts.tsx`
**Charts**:
- Weight trend (Line chart with goal line)
- Blood pressure (Dual-line chart: systolic/diastolic)
- Water intake (Bar chart daily totals)
- Symptom frequency (Pie chart)

#### 4. `/components/log-visualizations/nutrition-log-charts.tsx`
**Charts**:
- Daily calories (Line chart vs goal)
- Macro distribution (Pie chart: P/C/F)
- Meal timing heatmap
- Weekly nutrition summary

#### 5. `/components/log-visualizations/fitness-log-charts.tsx`
**Charts**:
- Workout duration bars (Weekly)
- Steps line chart (With 10k goal)
- Workout type distribution (Pie)
- Calories burned trend (Area)

#### 6. `/components/log-visualizations/pet-log-charts.tsx`
**Charts** (per pet):
- Feeding times heatmap
- Weight trend line
- Vet costs over time (Bar)
- Health metrics dashboard

---

## 🧠 Phase 5C: AI Insights 2.0

### New AI Features:

#### 1. `/lib/ai/correlation-engine.ts`
**Cross-Domain Pattern Detection**:
```typescript
interface Correlation {
  metric1: string
  metric2: string
  correlation: number // -1 to 1
  confidence: number // 0 to 1
  insight: string
}

Examples:
- Sleep hours vs Workout performance
- Spending vs Mood scores  
- Meal quality vs Energy levels
- Pet activity vs Your schedule
```

#### 2. `/lib/ai/predictive-analytics.ts`
**Forecasting Engine**:
```typescript
interface Prediction {
  metric: string
  predicted_value: number
  confidence: number
  date: Date
  reasoning: string
}

Predictions:
- Next month's bills (based on historical data)
- Weight goal achievement date
- Budget overruns
- Habit streak likelihood
```

#### 3. `/lib/ai/anomaly-detector.ts`
**Pattern Deviation Detection**:
```typescript
interface Anomaly {
  type: 'spending' | 'health' | 'habit' | 'pet'
  severity: 'low' | 'medium' | 'high'
  description: string
  detected_at: Date
  recommendation: string
}

Detects:
- Spending 50%+ above average
- Missed 3+ routine activities
- Health metrics 20%+ out of range
- Pet behavior changes
```

#### 4. `/lib/ai/recommendation-engine.ts`
**Smart Suggestions**:
```typescript
interface Recommendation {
  category: string
  priority: 'low' | 'medium' | 'high'
  title: string
  description: string
  action: string
  impact: string
}

Recommendations:
- "Best workout time: 6-7 AM (87% completion rate)"
- "Tuesdays are your most productive days"
- "Increase emergency fund by $500/month"
- "Pet checkup due in 2 weeks"
```

#### 5. `/components/ai/cross-domain-insights.tsx`
**UI Component** showing all AI insights:
- Correlation cards
- Prediction timeline
- Anomaly alerts
- Recommendations list

---

## ☁️ Phase 5D: Supabase Backend

### Setup Steps:

#### 1. Create Supabase Project
```bash
# Visit: https://supabase.com
# Create new project
# Note: Project URL and anon key
```

#### 2. Environment Variables
Create `/Users/robertsennabaum/new project/.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

#### 3. Database Schema
Run in Supabase SQL Editor:
```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Domains table
CREATE TABLE domains (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  domain_name TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Logs table
CREATE TABLE logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  domain_id UUID REFERENCES domains,
  log_type TEXT NOT NULL,
  data JSONB NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Pet profiles
CREATE TABLE pet_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  profile_data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Documents
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  domain_id UUID REFERENCES domains,
  file_path TEXT,
  metadata JSONB DEFAULT '{}',
  ocr_data JSONB,
  uploaded_at TIMESTAMP DEFAULT NOW()
);

-- Reminders
CREATE TABLE reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  due_date TIMESTAMP,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'pending',
  data JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pet_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- RLS Policies (users can only access their own data)
CREATE POLICY "Users can view own domains" ON domains
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own domains" ON domains
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own domains" ON domains
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own domains" ON domains
  FOR DELETE USING (auth.uid() = user_id);

-- Repeat for other tables
CREATE POLICY "Users can view own logs" ON logs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own logs" ON logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- (Add similar policies for pet_profiles, documents, reminders)

-- Indexes for performance
CREATE INDEX idx_domains_user_id ON domains(user_id);
CREATE INDEX idx_logs_user_id ON logs(user_id);
CREATE INDEX idx_logs_timestamp ON logs(timestamp DESC);
CREATE INDEX idx_logs_domain_id ON logs(domain_id);
CREATE INDEX idx_pet_profiles_user_id ON pet_profiles(user_id);
```

#### 4. Supabase Client Setup
Create `/lib/supabase/client.ts`:
```typescript
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'

// Client-side Supabase client (for components)
export const supabase = createClientComponentClient()

// Server-side Supabase client (for API routes)
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

#### 5. Auth Provider
Create `/lib/supabase/auth-provider.tsx`:
```typescript
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from './client'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  signInWithGoogle: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    })
    if (error) throw error
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, signIn, signUp, signOut, signInWithGoogle }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
```

#### 6. Data Migration Tool
Create `/lib/supabase/migrate.ts`:
```typescript
import { supabase } from './client'

export async function migrateLocalStorageToSupabase(userId: string) {
  const migrations = []

  // Migrate domains data
  const domainsData = Object.keys(localStorage)
    .filter(key => key.startsWith('lifehub-domain-'))
    .map(key => {
      const domainName = key.replace('lifehub-domain-', '')
      const data = JSON.parse(localStorage.getItem(key) || '{}')
      return { user_id: userId, domain_name: domainName, data }
    })

  if (domainsData.length > 0) {
    const { error } = await supabase.from('domains').insert(domainsData)
    if (error) console.error('Domain migration error:', error)
    else migrations.push(`Migrated ${domainsData.length} domains`)
  }

  // Migrate logs
  const logsData = Object.keys(localStorage)
    .filter(key => key.startsWith('lifehub-logs-'))
    .flatMap(key => {
      const logs = JSON.parse(localStorage.getItem(key) || '[]')
      const domain = key.replace('lifehub-logs-', '')
      return logs.map((log: any) => ({
        user_id: userId,
        log_type: log.type,
        data: log.data,
        timestamp: log.timestamp,
        metadata: { domain }
      }))
    })

  if (logsData.length > 0) {
    const { error } = await supabase.from('logs').insert(logsData)
    if (error) console.error('Logs migration error:', error)
    else migrations.push(`Migrated ${logsData.length} log entries`)
  }

  // Migrate pet profiles
  const petProfiles = localStorage.getItem('lifehub-pet-profiles')
  if (petProfiles) {
    const pets = JSON.parse(petProfiles)
    const petsData = pets.map((pet: any) => ({
      user_id: userId,
      name: pet.name,
      type: pet.type,
      profile_data: pet
    }))

    const { error } = await supabase.from('pet_profiles').insert(petsData)
    if (error) console.error('Pet profiles migration error:', error)
    else migrations.push(`Migrated ${petsData.length} pet profiles`)
  }

  return migrations
}
```

#### 7. Real-time Sync Hook
Create `/lib/supabase/use-sync.ts`:
```typescript
import { useEffect } from 'react'
import { supabase } from './client'
import { useAuth } from './auth-provider'

export function useRealtimeSync() {
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return

    // Subscribe to changes in logs table
    const logsSubscription = supabase
      .channel('logs_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'logs',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Logs changed:', payload)
          // Update local state/localStorage
          // Trigger re-fetch or update
        }
      )
      .subscribe()

    return () => {
      logsSubscription.unsubscribe()
    }
  }, [user])
}
```

---

## 🎯 Implementation Order

### Week 1 - Days 1-2: Log Visualizations
1. Create log-chart-renderer.tsx (universal)
2. Add financial-log-charts.tsx
3. Add health-log-charts.tsx
4. Add nutrition-log-charts.tsx
5. Add fitness-log-charts.tsx
6. Add pet-log-charts.tsx
7. Integrate into Analytics tab for each domain

### Week 1 - Days 3-4: AI Insights 2.0
1. Build correlation-engine.ts (pattern detection)
2. Build predictive-analytics.ts (forecasting)
3. Build anomaly-detector.ts (deviation alerts)
4. Build recommendation-engine.ts (smart suggestions)
5. Create cross-domain-insights.tsx UI component
6. Add to Insights page

### Week 1 - Day 5: Supabase Setup
1. Create Supabase project
2. Run database schema SQL
3. Set up environment variables
4. Create supabase/client.ts
5. Create auth-provider.tsx

### Week 2 - Days 1-2: Supabase Integration
1. Create migrate.ts (LocalStorage → Supabase)
2. Create use-sync.ts (real-time sync hook)
3. Add "Sync to Cloud" button in settings
4. Test authentication flow

### Week 2 - Days 3-5: Testing & Polish
1. Test all visualizations
2. Test AI insights accuracy
3. Test data sync
4. Fix bugs
5. Performance optimization
6. Documentation

---

## 📚 Resources

### Supabase Docs:
- https://supabase.com/docs
- https://supabase.com/docs/guides/auth
- https://supabase.com/docs/guides/database
- https://supabase.com/docs/guides/realtime

### Recharts Docs:
- https://recharts.org/en-US/api

### Example Code:
See implementation files in:
- `/components/log-visualizations/`
- `/lib/ai/`
- `/lib/supabase/`

---

**Ready to build! 🚀**

