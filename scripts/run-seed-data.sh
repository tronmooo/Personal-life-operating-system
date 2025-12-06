#!/bin/bash

# LifeHub - Run Comprehensive Seed Data Script
# This script helps you populate your account with sample data

echo "🌱 LifeHub Seed Data Generator"
echo "=============================="
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ Error: .env.local file not found"
    echo "Please create .env.local with your Supabase credentials"
    exit 1
fi

# Source environment variables
export $(cat .env.local | grep -v '^#' | xargs)

if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Error: Missing Supabase credentials in .env.local"
    echo "Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
    exit 1
fi

echo "✅ Supabase credentials loaded"
echo ""

# Check for user ID argument
if [ -z "$1" ]; then
    echo "📝 No user ID provided. Getting authenticated users..."
    echo ""
    echo "To get your user ID:"
    echo "  1. Log in to your LifeHub account"
    echo "  2. Open browser console and run: supabase.auth.getUser().then(({data}) => console.log(data.user.id))"
    echo "  3. Copy the UUID and run: ./scripts/run-seed-data.sh <USER_ID>"
    echo ""
    echo "Or run with test user: npm run seed-data <USER_ID>"
    exit 1
fi

USER_ID=$1

echo "🎯 Target User ID: $USER_ID"
echo "⏳ Generating comprehensive seed data..."
echo ""

# Run the TypeScript script
npx tsx scripts/comprehensive-seed-data.ts "$USER_ID"

exit_code=$?

if [ $exit_code -eq 0 ]; then
    echo ""
    echo "✅ Seed data generation complete!"
    echo "🔗 Log in with user ID: $USER_ID"
else
    echo ""
    echo "❌ Seed data generation failed with exit code: $exit_code"
    exit $exit_code
fi
