#!/bin/bash

# Test a specific domain's CRUD operations
# Usage: bash scripts/test-specific-domain.sh health

DOMAIN=$1

if [ -z "$DOMAIN" ]; then
    echo "❌ Please provide a domain name"
    echo "Usage: bash scripts/test-specific-domain.sh <domain>"
    echo ""
    echo "Available domains:"
    echo "  - financial"
    echo "  - health"
    echo "  - insurance"
    echo "  - home"
    echo "  - vehicles"
    echo "  - pets"
    echo "  - relationships"
    echo "  - digital"
    echo "  - fitness"
    echo "  - nutrition"
    echo "  - legal"
    echo "  - miscellaneous"
    exit 1
fi

echo "🧪 Testing $DOMAIN domain CRUD operations..."
echo ""

# Run unit tests for domain
echo "1. Running unit tests..."
npm test -- __tests__/domains/all-domains-crud.test.ts -t "$DOMAIN" --passWithNoTests

# Run E2E tests for domain
echo ""
echo "2. Running E2E tests..."
npm run e2e -- e2e/08-all-domains-crud.spec.ts -g "$DOMAIN"

echo ""
echo "✅ Domain testing complete!"
