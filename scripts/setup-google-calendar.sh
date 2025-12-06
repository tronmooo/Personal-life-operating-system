#!/bin/bash

# Google Calendar Setup Script for Lifehub
# Run this after initial OAuth setup

echo "🚀 Setting up Google Calendar Integration..."
echo ""

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
  echo "❌ Error: .env.local not found!"
  echo "Please create .env.local with your credentials first."
  exit 1
fi

# Check for required env vars
if ! grep -q "GOOGLE_CLIENT_ID" .env.local; then
  echo "❌ Error: GOOGLE_CLIENT_ID not found in .env.local"
  exit 1
fi

if ! grep -q "GOOGLE_CLIENT_SECRET" .env.local; then
  echo "❌ Error: GOOGLE_CLIENT_SECRET not found in .env.local"
  exit 1
fi

echo "✅ Environment variables found"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install next-auth@latest @auth/supabase-adapter googleapis
echo "✅ Dependencies installed"
echo ""

# Create database migration (if not exists)
echo "📊 Database migration ready at:"
echo "   supabase/migrations/20250116_calendar_sync_log.sql"
echo ""
echo "⚠️  IMPORTANT: Run this migration in Supabase Dashboard:"
echo "   https://supabase.com/dashboard/project/YOUR_PROJECT/sql"
echo ""

# Generate NEXTAUTH_SECRET if not present
if ! grep -q "NEXTAUTH_SECRET" .env.local; then
  echo "🔐 Generating NEXTAUTH_SECRET..."
  SECRET=$(openssl rand -base64 32 | tr -d /=+ | cut -c1-32)
  echo "NEXTAUTH_SECRET=$SECRET" >> .env.local
  echo "✅ NEXTAUTH_SECRET added to .env.local"
fi

# Add NEXTAUTH_URL if not present
if ! grep -q "NEXTAUTH_URL" .env.local; then
  echo "NEXTAUTH_URL=http://localhost:3000" >> .env.local
  echo "✅ NEXTAUTH_URL added to .env.local"
fi

# Add CRON_SECRET if not present
if ! grep -q "CRON_SECRET" .env.local; then
  CRON_SECRET=$(openssl rand -base64 32 | tr -d /=+ | cut -c1-32)
  echo "CRON_SECRET=$CRON_SECRET" >> .env.local
  echo "✅ CRON_SECRET added to .env.local"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📋 Next steps:"
echo ""
echo "1. Add Supabase callback to Google Console:"
echo "   https://console.cloud.google.com/apis/credentials"
echo "   Add redirect URI: https://YOUR_PROJECT.supabase.co/auth/v1/callback"
echo ""
echo "2. Configure Google provider in Supabase Dashboard:"
echo "   https://supabase.com/dashboard/project/YOUR_PROJECT/auth/providers"
echo "   Enable Google and add your Client ID & Secret"
echo ""
echo "3. Run the database migration (see SQL file above)"
echo ""
echo "4. Restart your dev server:"
echo "   npm run dev"
echo ""
echo "5. Test it out:"
echo "   - Sign in with Google"
echo "   - Visit /calendar to see your events"
echo ""
echo "✨ Happy syncing!"
































