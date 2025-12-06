#!/bin/bash

# Plaid Banking Integration Setup Script
# This script helps you set up the Plaid integration

echo "🏦 ===== Plaid Banking Integration Setup ====="
echo ""

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
  echo "❌ .env.local file not found!"
  echo "   Creating .env.local..."
  touch .env.local
fi

# Check if Plaid keys are already set
if grep -q "PLAID_CLIENT_ID" .env.local && grep -q "PLAID_SECRET" .env.local; then
  echo "✅ Plaid credentials found in .env.local"
else
  echo "📝 Setting up Plaid credentials..."
  echo ""
  echo "   Go to: https://dashboard.plaid.com/team/keys"
  echo "   (Create a free account if you don't have one)"
  echo ""
  read -p "   Enter your PLAID_CLIENT_ID: " plaid_client_id
  read -p "   Enter your PLAID_SECRET: " plaid_secret
  
  echo "" >> .env.local
  echo "# Plaid Banking Integration" >> .env.local
  echo "PLAID_CLIENT_ID=$plaid_client_id" >> .env.local
  echo "PLAID_SECRET=$plaid_secret" >> .env.local
  echo "PLAID_ENV=sandbox" >> .env.local
  
  echo "✅ Plaid credentials added to .env.local"
fi

echo ""
echo "🗄️  Setting up database..."
echo ""

# Check if Supabase CLI is available
if command -v supabase &> /dev/null; then
  echo "   Running migration..."
  supabase db push
  echo "✅ Migration complete!"
else
  echo "⚠️  Supabase CLI not found."
  echo ""
  echo "   OPTION 1 - Install CLI (recommended):"
  echo "   $ brew install supabase/tap/supabase"
  echo "   $ supabase db push"
  echo ""
  echo "   OPTION 2 - Manual migration:"
  echo "   1. Go to: https://supabase.com/dashboard/project/_/sql/new"
  echo "   2. Copy contents of: supabase/migrations/20250121_plaid_banking.sql"
  echo "   3. Paste and run in SQL editor"
fi

echo ""
echo "🎉 ===== Setup Complete! ====="
echo ""
echo "📋 Next Steps:"
echo "   1. Restart your development server"
echo "   2. Go to: http://localhost:3000/finance"
echo "   3. Click 'Link Bank Account'"
echo "   4. Use sandbox credentials:"
echo "      Username: user_good"
echo "      Password: pass_good"
echo ""
echo "💡 Tip: The sandbox environment has 100+ mock transactions for testing!"
echo ""



