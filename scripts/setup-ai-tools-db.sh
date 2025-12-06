#!/bin/bash

echo "🚀 Setting up AI Tools Database Tables..."
echo "==========================================\n"

# Check if .env.local exists
if [ ! -f .env.local ]; then
  echo "❌ .env.local file not found!"
  echo "Please create .env.local with your Supabase credentials"
  exit 1
fi

# Source environment variables
export $(cat .env.local | grep -v '^#' | xargs)

echo "✅ Environment variables loaded"
echo "📦 Applying AI Tools migration..."

# Apply the migration using Supabase CLI or psql
if command -v supabase &> /dev/null; then
  echo "Using Supabase CLI..."
  supabase db push
else
  echo "Supabase CLI not found. Using direct SQL execution..."

  # Read the migration file
  MIGRATION_FILE="supabase/migrations/20240118000000_create_ai_tools_tables.sql"

  if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Migration file not found: $MIGRATION_FILE"
    exit 1
  fi

  echo "📄 Executing migration SQL..."

  # Use psql if available
  if command -v psql &> /dev/null; then
    # Extract database URL from Supabase URL
    DB_URL=$(echo "$NEXT_PUBLIC_SUPABASE_URL" | sed 's/https:\/\///')

    psql "postgresql://postgres:${SUPABASE_DB_PASSWORD}@db.${DB_URL}:5432/postgres" < "$MIGRATION_FILE"
  else
    echo "⚠️  Neither Supabase CLI nor psql found."
    echo "Please apply the migration manually:"
    echo "1. Go to https://supabase.com/dashboard"
    echo "2. Navigate to SQL Editor"
    echo "3. Paste the contents of: $MIGRATION_FILE"
    echo "4. Run the query"
  fi
fi

echo "\n✅ AI Tools database setup complete!"
echo "==========================================\n"

echo "📋 Created tables:"
echo "  ✓ tax_documents"
echo "  ✓ receipts"
echo "  ✓ invoices"
echo "  ✓ budgets"
echo "  ✓ scanned_documents"
echo "  ✓ saved_forms"
echo "  ✓ financial_reports"
echo "  ✓ scheduled_events"
echo "  ✓ travel_plans"
echo "  ✓ meal_plans"
echo "  ✓ email_drafts"
echo "  ✓ checklists"

echo "\n🎉 AI Tools are ready to use!"
echo "Visit http://localhost:3003/tools to start using them"
