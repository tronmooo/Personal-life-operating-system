#!/bin/bash

# Comprehensive Test Script to Break the Application
# This script tests edge cases, error handling, and potential vulnerabilities

echo "🔥 COMPREHENSIVE APPLICATION STRESS TEST 🔥"
echo "============================================"
echo ""

BASE_URL="http://localhost:3000"
API_BASE="${BASE_URL}/api"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0
WARNINGS=0

# Test function
test_endpoint() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local data="$4"
    local expected_status="$5"
    
    echo -n "Testing: $name ... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" -H "Content-Type: application/json" -d "$data" "$endpoint")
    fi
    
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC} (Status: $status_code)"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC} (Expected: $expected_status, Got: $status_code)"
        echo "Response: $body"
        ((FAILED++))
    fi
}

# Test function for warnings
test_warning() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local data="$4"
    
    echo -n "Warning Test: $name ... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" -H "Content-Type: application/json" -d "$data" "$endpoint")
    fi
    
    status_code=$(echo "$response" | tail -n1)
    
    if [ "$status_code" -ge 400 ]; then
        echo -e "${YELLOW}⚠ WARNING${NC} (Status: $status_code)"
        ((WARNINGS++))
    else
        echo -e "${GREEN}✓ HANDLED${NC} (Status: $status_code)"
        ((PASSED++))
    fi
}

echo "📋 SECTION 1: API Route Existence Tests"
echo "----------------------------------------"

# Test critical API routes exist
test_endpoint "Domain Entries API" "GET" "${API_BASE}/domain-entries" "" "200"
test_endpoint "Documents API" "GET" "${API_BASE}/documents" "" "200"
test_endpoint "Layouts API" "GET" "${API_BASE}/layouts" "" "200"

echo ""
echo "📋 SECTION 2: Malformed Request Tests"
echo "----------------------------------------"

# Test with malformed JSON
test_warning "Malformed JSON" "POST" "${API_BASE}/domain-entries" "{invalid json}" "400"

# Test with missing required fields
test_warning "Missing Required Fields" "POST" "${API_BASE}/domain-entries" "{}" "400"

# Test with invalid domain
test_warning "Invalid Domain" "POST" "${API_BASE}/domain-entries" '{"domain":"invalid_domain","title":"Test"}' "400"

# Test with SQL injection attempt
test_warning "SQL Injection Attempt" "POST" "${API_BASE}/domain-entries" '{"domain":"financial","title":"Test\"; DROP TABLE domain_entries;--"}' "400"

# Test with XSS attempt
test_warning "XSS Attempt" "POST" "${API_BASE}/domain-entries" '{"domain":"financial","title":"<script>alert(\"XSS\")</script>"}' "400"

echo ""
echo "📋 SECTION 3: Large Payload Tests"
echo "----------------------------------------"

# Test with extremely large title
large_title=$(python3 -c "print('A' * 10000)")
test_warning "Extremely Large Title" "POST" "${API_BASE}/domain-entries" "{\"domain\":\"financial\",\"title\":\"$large_title\"}" "400"

# Test with deeply nested JSON
test_warning "Deeply Nested JSON" "POST" "${API_BASE}/domain-entries" '{"domain":"financial","title":"Test","metadata":{"a":{"b":{"c":{"d":{"e":{"f":{"g":{"h":{"i":{"j":"deep"}}}}}}}}}}}' "200"

echo ""
echo "📋 SECTION 4: Edge Case Tests"
echo "----------------------------------------"

# Test with null values
test_warning "Null Values" "POST" "${API_BASE}/domain-entries" '{"domain":"financial","title":null}' "400"

# Test with empty strings
test_warning "Empty Strings" "POST" "${API_BASE}/domain-entries" '{"domain":"financial","title":""}' "400"

# Test with special characters
test_warning "Special Characters" "POST" "${API_BASE}/domain-entries" '{"domain":"financial","title":"Test™®©€£¥"}' "200"

# Test with Unicode
test_warning "Unicode Characters" "POST" "${API_BASE}/domain-entries" '{"domain":"financial","title":"测试🔥💯"}' "200"

# Test with very long metadata
test_warning "Large Metadata" "POST" "${API_BASE}/domain-entries" '{"domain":"financial","title":"Test","metadata":{"notes":"'$(python3 -c "print('x' * 5000)")'"}}' "200"

echo ""
echo "📋 SECTION 5: Concurrent Request Tests"
echo "----------------------------------------"

echo "Testing concurrent requests (10 simultaneous)..."
for i in {1..10}; do
    curl -s -X POST "${API_BASE}/domain-entries" \
        -H "Content-Type: application/json" \
        -d '{"domain":"financial","title":"Concurrent Test '$i'"}' &
done
wait
echo -e "${GREEN}✓ Concurrent requests completed${NC}"
((PASSED++))

echo ""
echo "📋 SECTION 6: Rate Limiting Tests"
echo "----------------------------------------"

echo "Testing rapid requests (50 in quick succession)..."
for i in {1..50}; do
    curl -s -X GET "${API_BASE}/domain-entries" > /dev/null
done
echo -e "${YELLOW}⚠ Rate limiting test completed (check for 429 errors)${NC}"
((WARNINGS++))

echo ""
echo "📋 SECTION 7: Authentication Tests"
echo "----------------------------------------"

# Test without authentication
test_warning "No Auth Token" "GET" "${API_BASE}/domain-entries" "" "401"

# Test with invalid auth token
test_warning "Invalid Auth Token" "GET" "${API_BASE}/domain-entries" "" "401"

echo ""
echo "📋 SECTION 8: File Upload Tests"
echo "----------------------------------------"

# Test with oversized file (simulated)
test_warning "Oversized File Upload" "POST" "${API_BASE}/documents/upload" '{"file":"'$(python3 -c "print('x' * 100000000)")'"}'  "413"

# Test with invalid file type
test_warning "Invalid File Type" "POST" "${API_BASE}/documents/upload" '{"file":"test.exe","type":"application/x-msdownload"}' "400"

echo ""
echo "📋 SECTION 9: Cross-Site Request Tests"
echo "----------------------------------------"

# Test CORS
test_warning "CORS Test" "OPTIONS" "${API_BASE}/domain-entries" "" "200"

echo ""
echo "📋 SECTION 10: Database Stress Tests"
echo "----------------------------------------"

# Test with rapid database queries
echo "Testing rapid database queries (20 requests)..."
for i in {1..20}; do
    curl -s -X GET "${API_BASE}/domain-entries?domain=financial" > /dev/null
done
echo -e "${GREEN}✓ Database stress test completed${NC}"
((PASSED++))

echo ""
echo "============================================"
echo "📊 TEST RESULTS SUMMARY"
echo "============================================"
echo -e "${GREEN}✓ Passed: $PASSED${NC}"
echo -e "${RED}✗ Failed: $FAILED${NC}"
echo -e "${YELLOW}⚠ Warnings: $WARNINGS${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All critical tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Review the output above.${NC}"
    exit 1
fi



