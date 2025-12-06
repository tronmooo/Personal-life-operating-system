#!/bin/bash

###############################################################################
# APPLY SCHEMA FIX - Create Missing Tables in Supabase
# Uses Supabase CLI and service role key from .cursor/rules/h.mdc
###############################################################################

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║     SUPABASE SCHEMA FIX - CREATE MISSING TABLES              ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Supabase configuration
PROJECT_REF="jphpxqqilrjyypztkswc"
SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwaHB4cXFpbHJqeXlwenRrc3djIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDU4NzM4MCwiZXhwIjoyMDcwMTYzMzgwfQ.TTjNfgcHS0eODi-50B1Fp2nuiB49DttKEMJH_TOPJIg"

# Check if SQL file exists
if [ ! -f "APPLY_THIS_SQL_NOW.sql" ]; then
    echo "❌ Error: APPLY_THIS_SQL_NOW.sql not found!"
    exit 1
fi

echo "📝 SQL file found: APPLY_THIS_SQL_NOW.sql"
echo ""

# Method 1: Try using supabase CLI
if command -v supabase &> /dev/null; then
    echo "🔄 Method 1: Using Supabase CLI..."
    echo ""
    
    # Try to link to the project
    supabase link --project-ref $PROJECT_REF 2>/dev/null
    
    # Try to push the migration
    if supabase db push --db-url "postgresql://postgres:$SERVICE_ROLE_KEY@db.$PROJECT_REF.supabase.co:5432/postgres" < APPLY_THIS_SQL_NOW.sql; then
        echo ""
        echo "✅ Migration applied successfully via CLI!"
        exit 0
    else
        echo "⚠️  CLI method failed, trying alternative..."
        echo ""
    fi
fi

# Method 2: Manual instructions
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║     MANUAL APPLICATION REQUIRED                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo "The automated methods are not available."
echo "Please apply the SQL manually (takes < 2 minutes):"
echo ""
echo "📋 STEP-BY-STEP INSTRUCTIONS:"
echo ""
echo "1. Open your browser and go to:"
echo "   https://supabase.com/dashboard/project/$PROJECT_REF"
echo ""
echo "2. Click 'SQL Editor' in the left sidebar"
echo ""
echo "3. Click 'New query' button"
echo ""
echo "4. Open this file in your editor:"
echo "   APPLY_THIS_SQL_NOW.sql"
echo ""
echo "5. Copy ALL contents (Cmd+A, Cmd+C)"
echo ""
echo "6. Paste into the SQL Editor"
echo ""
echo "7. Click 'Run' button (or press Cmd+Enter)"
echo ""
echo "8. You should see: Success! 3 tables created"
echo ""
echo "✅ VERIFICATION:"
echo ""
echo "After running the SQL, verify tables exist:"
echo "  - Go to 'Table Editor' in Supabase Dashboard"
echo "  - Look for: health_metrics, insurance_policies, insurance_claims"
echo ""
echo "Then test in your app:"
echo "  - Restart dev server: npm run dev"
echo "  - Navigate to: http://localhost:3000/domains/health"
echo "  - Try adding a health metric"
echo "  - Navigate to: http://localhost:3000/domains/insurance"
echo "  - Try adding an insurance policy"
echo ""
echo "📄 Documentation: See HOW_TO_APPLY_SCHEMA_FIX.md for detailed guide"
echo ""

