#!/bin/bash

# Automated QA Test Runner for LifeHub
# Runs all tests and generates comprehensive report

set -e

echo "🚀 LifeHub Automated QA Test Suite"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env.local exists
if [ ! -f .env.local ]; then
  echo -e "${RED}❌ .env.local not found${NC}"
  echo "Please create .env.local with your Supabase credentials"
  exit 1
fi

# Load environment variables
export $(cat .env.local | grep -v '^#' | xargs)

# Check required environment variables
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo -e "${RED}❌ Missing required environment variables${NC}"
  echo "Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY"
  exit 1
fi

echo -e "${GREEN}✅ Environment variables loaded${NC}"
echo ""

# Step 1: Generate test data
echo "📊 Step 1: Generating test data..."
echo "-----------------------------------"

if [ -z "$TEST_USER_ID" ]; then
  echo -e "${YELLOW}⚠️  TEST_USER_ID not set; will auto-detect from Supabase${NC}"
else
  echo "Using TEST_USER_ID: $TEST_USER_ID"
fi

# Run test data generator
node scripts/generate-test-data.mjs

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Test data generated successfully${NC}"
else
  echo -e "${RED}❌ Test data generation failed${NC}"
  exit 1
fi

echo ""

# Step 2: Start development server
echo "🖥️  Step 2: Starting development server..."
echo "-----------------------------------"

# Check if server is already running
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
  echo -e "${YELLOW}⚠️  Server already running on port 3000${NC}"
else
  echo "Starting Next.js dev server..."
  npm run dev > /dev/null 2>&1 &
  SERVER_PID=$!
  echo "Server PID: $SERVER_PID"
  
  # Wait for server to be ready
  echo "Waiting for server to start..."
  for i in {1..30}; do
    if curl -s http://localhost:3000 > /dev/null; then
      echo -e "${GREEN}✅ Server is ready${NC}"
      break
    fi
    sleep 1
    echo -n "."
  done
  echo ""
fi

echo ""

# Step 3: Run Playwright tests
echo "🎭 Step 3: Running Playwright tests..."
echo "-----------------------------------"

npx playwright test --reporter=html,list

TEST_EXIT_CODE=$?

echo ""

# Step 4: Generate report
echo "📋 Step 4: Generating test report..."
echo "-----------------------------------"

if [ $TEST_EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}✅ All tests passed!${NC}"
else
  echo -e "${RED}❌ Some tests failed${NC}"
fi

echo ""
echo "📊 Test Results:"
echo "  - HTML Report: playwright-report/index.html"
echo "  - Screenshots: test-results/"
echo ""

# Open report in browser (macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
  echo "Opening test report in browser..."
  open playwright-report/index.html
fi

# Step 5: Cleanup
echo "🧹 Step 5: Cleanup..."
echo "-----------------------------------"

if [ ! -z "$SERVER_PID" ]; then
  echo "Stopping development server (PID: $SERVER_PID)..."
  kill $SERVER_PID 2>/dev/null || true
fi

echo -e "${GREEN}✅ Cleanup complete${NC}"
echo ""

# Final summary
echo "===================================="
echo "🎉 QA Test Suite Complete"
echo "===================================="
echo ""

if [ $TEST_EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}✅ Status: PASSED${NC}"
  echo ""
  echo "Next steps:"
  echo "  1. Review test report: playwright-report/index.html"
  echo "  2. Check test data in Supabase"
  echo "  3. Verify all features work in browser"
  exit 0
else
  echo -e "${RED}❌ Status: FAILED${NC}"
  echo ""
  echo "Next steps:"
  echo "  1. Review test report: playwright-report/index.html"
  echo "  2. Check failed test screenshots"
  echo "  3. Fix issues and re-run tests"
  exit 1
fi

