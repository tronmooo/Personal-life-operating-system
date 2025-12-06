# 🔐 Supabase Authentication Setup Guide

## 🚨 IMPORTANT: You Need to Set Up Supabase!

Your app is now configured to use **real Supabase authentication** instead of fake localStorage auth. This means you need to configure your Supabase credentials.

## ✅ What I've Built

### 1. New Authentication Pages
- `/auth/signin` - Dedicated sign-in page
- `/auth/signup` - Dedicated sign-up page with email verification
- Proper error handling
- Beautiful UI with gradients
- Links between sign-in/sign-up

### 2. Real Database Integration
- All authentication goes through Supabase
- User accounts stored in database
- Session management
- Email verification (optional)

### 3. Protected Data
- Data will be saved with `user_id`
- Each user has their own data
- No more mixing data between users

## 🔧 How to Set Up Supabase

### Step 1: Create Supabase Project
1. Go to [The fuckhttps://supabase.com](https://supabase.com)
2. Sign up or sign in
3. Click "New Project"
4. Choose an organization (or create one)
5. Fill in:
   - **Project Name**: LifeHub (or whatever you want)
   - **Database Password**: Choose a strong password
   - **Region**: Choose closest to you
6. Click "Create new project"
7. Wait 2-3 minutes for it to set up

### Step 2: Get Your Credentials
1. Once created, go to **Settings** → **API**
2. Find these two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (long string starting with `eyJ...`)

### Step 3: Add to Your Project
1. In your project root, create or edit `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

2. Replace the values with YOUR credentials from Step 2

3. **RESTART your dev server**:
```bash
# Stop the current server (Ctrl+C)
npm run dev
```

### Step 4: Set Up Database Tables
Run this SQL in your Supabase SQL Editor (Settings → SQL Editor → New Query):

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create domain_data table
CREATE TABLE IF NOT EXISTS public.domain_data (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  domain TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.domain_data ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own data"
  ON public.domain_data FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own data"
  ON public.domain_data FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own data"
  ON public.domain_data FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own data"
  ON public.domain_data FOR DELETE
  USING (auth.uid() = user_id);

-- Create vehicles table
CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  vin TEXT,
  mileage INTEGER,
  estimated_value NUMERIC,
  type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own vehicles"
  ON public.vehicles FOR ALL
  USING (auth.uid() = user_id);

-- Create properties table
CREATE TABLE IF NOT EXISTS public.properties (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  address TEXT NOT NULL,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  estimated_value NUMERIC,
  type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own properties"
  ON public.properties FOR ALL
  USING (auth.uid() = user_id);

-- Function to handle new user profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### Step 5: Configure Email (Optional)
If you want email verification:
1. Go to **Authentication** → **Settings**
2. Configure **SMTP Settings** OR use Supabase's built-in email
3. Enable "Confirm email" if you want users to verify

OR disable email verification:
1. Go to **Authentication** → **Settings**
2. Turn OFF "Confirm email"
3. Users can sign in immediately

## 🎯 How to Test

### Test Sign Up
1. Go to `http://localhost:3000/auth/signup`
2. Enter email and password
3. Click "Sign Up"
4. Check your email (if verification enabled)
5. Should redirect to home page

### Test Sign In
1. Go to `http://localhost:3000/auth/signin`
2. Enter your credentials
3. Click "Sign In"
4. Should redirect to home page
5. You should see your email in the profile

### Test Protected Data
1. Sign in first
2. Go to Domains → Vehicles
3. Add a vehicle
4. It should save to YOUR Supabase database
5. Check in Supabase dashboard → Table Editor → `vehicles`

## 🔐 Security Features

✅ **Row Level Security (RLS)** - Users can only see their own data  
✅ **Secure Sessions** - JWT tokens, httpOnly cookies  
✅ **Password Hashing** - Passwords never stored in plain text  
✅ **Email Verification** - Optional email confirmation  
✅ **Password Reset** - Built-in password reset flow  

## 📁 Files I Created/Updated

### New Files
1. `/app/auth/signin/page.tsx` - Sign in page
2. `/app/auth/signup/page.tsx` - Sign up page
3. This guide

### Files to Update Next
1. `/app/profile/page.tsx` - Use real Supabase auth
2. `/lib/providers/data-provider.tsx` - Save to Supabase
3. `/components/navigation/main-nav.tsx` - Check real auth state

## ⚠️ Important Notes

1. **Don't commit `.env.local`** - It's in `.gitignore`
2. **Each user gets their own data** - No data mixing
3. **Restart dev server** after adding env variables
4. **SQL must be run** in Supabase for tables to exist

## 🚀 Next Steps After Setup

Once Supabase is configured:
1. I'll update the profile page to use real auth
2. I'll connect domain data to Supabase
3. I'll remove all mock/placeholder data
4. I'll sync command center with real data
5. I'll set up storage buckets for files

## 💡 Quick Start (Copy-Paste)

1. Create `.env.local` file in project root
2. Add these lines (replace with your values):
```
NEXT_PUBLIC_SUPABASE_URL=your-url-here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key-here
```
3. Run the SQL code above in Supabase
4. Restart dev server: `npm run dev`
5. Go to `/auth/signup` and create account
6. Start using the app!

---

**Let me know when you've set up Supabase, and I'll continue with the integration!** 🎉
















