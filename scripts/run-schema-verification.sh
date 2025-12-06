#!/bin/bash

###############################################################################
# Master Schema Verification & Data Seeding Script
# Runs all verification and seeding scripts in sequence
###############################################################################

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║       MASTER VERIFICATION - SCHEMA & DATA VALIDATION         ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Verify tables exist
echo "═══════════════════════════════════════════════════════════════"
echo "STEP 1: Verify Tables Exist"
echo "═══════════════════════════════════════════════════════════════"
echo ""

npx ts-node scripts/verify-schema-tables.ts

if [ $? -ne 0 ]; then
    echo ""
    echo -e "${RED}❌ Table verification failed!${NC}"
    echo -e "${YELLOW}📋 The required tables don't exist yet.${NC}"
    echo ""
    echo "Please apply the SQL migration first:"
    echo "1. Open: https://supabase.com/dashboard/project/jphpxqqilrjyypztkswc"
    echo "2. Go to: SQL Editor"
    echo "3. Paste: Contents of APPLY_THIS_SQL_NOW.sql"
    echo "4. Click: Run"
    echo "5. Re-run this script"
    echo ""
    exit 1
fi

echo ""
echo -e "${GREEN}✅ All tables verified!${NC}"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "STEP 2: Seed Health Data (Optional)"
echo "═══════════════════════════════════════════════════════════════"
echo ""

read -p "Do you want to seed health test data? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    npx ts-node scripts/seed-health-data.ts
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Health data seeded successfully!${NC}"
    else
        echo -e "${RED}❌ Health data seeding failed${NC}"
    fi
else
    echo -e "${YELLOW}⏩ Skipped health data seeding${NC}"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "STEP 3: Seed Insurance Data (Optional)"
echo "═══════════════════════════════════════════════════════════════"
echo ""

read -p "Do you want to seed insurance test data? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    npx ts-node scripts/seed-insurance-data.ts
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Insurance data seeded successfully!${NC}"
    else
        echo -e "${RED}❌ Insurance data seeding failed${NC}"
    fi
else
    echo -e "${YELLOW}⏩ Skipped insurance data seeding${NC}"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "✅ VERIFICATION COMPLETE!"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "1. Start dev server: npm run dev"
echo "2. Test health domain: http://localhost:3000/domains/health"
echo "3. Test insurance domain: http://localhost:3000/domains/insurance"
echo "4. Use Chrome DevTools to verify data display"
echo ""

