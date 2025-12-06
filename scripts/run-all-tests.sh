#!/bin/bash

# LifeHub Comprehensive Test Runner
# Runs all tests: unit, integration, and E2E

set -e  # Exit on error

echo "🧪 LifeHub Comprehensive Test Suite"
echo "===================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results tracking
UNIT_TESTS_PASSED=false
E2E_TESTS_PASSED=false
LINT_PASSED=false

# Function to print section headers
print_section() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# Function to check if dev server is running
check_dev_server() {
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# 1. Run linting first
print_section "1. Running Linter"
echo "Checking code quality and localStorage usage..."
if npm run lint:ci; then
    echo -e "${GREEN}✅ Linting passed${NC}"
    LINT_PASSED=true
else
    echo -e "${RED}❌ Linting failed${NC}"
    LINT_PASSED=false
fi

# 2. Run type checking
print_section "2. Running Type Check"
echo "Checking TypeScript types..."
if npm run type-check; then
    echo -e "${GREEN}✅ Type check passed${NC}"
else
    echo -e "${RED}❌ Type check failed${NC}"
    exit 1
fi

# 3. Run unit tests (Jest)
print_section "3. Running Unit Tests (Jest)"
echo "Testing individual components, hooks, and utilities..."
if npm test -- --coverage --passWithNoTests; then
    echo -e "${GREEN}✅ Unit tests passed${NC}"
    UNIT_TESTS_PASSED=true
else
    echo -e "${RED}❌ Unit tests failed${NC}"
    UNIT_TESTS_PASSED=false
fi

# 4. Start dev server for E2E tests if not running
print_section "4. Preparing E2E Test Environment"
if check_dev_server; then
    echo -e "${GREEN}✅ Dev server already running on port 3000${NC}"
    SERVER_STARTED_BY_SCRIPT=false
else
    echo -e "${YELLOW}⚠️  Dev server not running. Starting dev server...${NC}"
    npm run dev > /dev/null 2>&1 &
    DEV_SERVER_PID=$!
    SERVER_STARTED_BY_SCRIPT=true

    echo "Waiting for server to start..."
    for i in {1..30}; do
        if check_dev_server; then
            echo -e "${GREEN}✅ Dev server started successfully${NC}"
            break
        fi
        if [ $i -eq 30 ]; then
            echo -e "${RED}❌ Dev server failed to start${NC}"
            exit 1
        fi
        sleep 2
        echo -n "."
    done
fi

# 5. Run E2E tests (Playwright)
print_section "5. Running E2E Tests (Playwright)"
echo "Testing complete user workflows..."
if npm run e2e; then
    echo -e "${GREEN}✅ E2E tests passed${NC}"
    E2E_TESTS_PASSED=true
else
    echo -e "${RED}❌ E2E tests failed${NC}"
    E2E_TESTS_PASSED=false
fi

# Clean up: Stop dev server if we started it
if [ "$SERVER_STARTED_BY_SCRIPT" = true ]; then
    echo ""
    echo "Stopping dev server..."
    kill $DEV_SERVER_PID 2>/dev/null || true
    echo -e "${GREEN}✅ Dev server stopped${NC}"
fi

# Print test summary
print_section "Test Summary"
echo "Results:"
echo ""

if [ "$LINT_PASSED" = true ]; then
    echo -e "  ${GREEN}✅ Linting${NC}"
else
    echo -e "  ${RED}❌ Linting${NC}"
fi

if [ "$UNIT_TESTS_PASSED" = true ]; then
    echo -e "  ${GREEN}✅ Unit Tests${NC}"
else
    echo -e "  ${RED}❌ Unit Tests${NC}"
fi

if [ "$E2E_TESTS_PASSED" = true ]; then
    echo -e "  ${GREEN}✅ E2E Tests${NC}"
else
    echo -e "  ${RED}❌ E2E Tests${NC}"
fi

echo ""

# Exit with appropriate code
if [ "$LINT_PASSED" = true ] && [ "$UNIT_TESTS_PASSED" = true ] && [ "$E2E_TESTS_PASSED" = true ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed${NC}"
    exit 1
fi
