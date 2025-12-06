#!/bin/bash

# Manual Concierge Test Script
# 
# Usage:
#   1. Get your auth cookie from browser DevTools → Application → Cookies
#   2. Look for: sb-access-token
#   3. Run: AUTH_COOKIE="your-token-here" bash scripts/test-concierge-manual.sh

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║   CONCIERGE MANUAL TEST (With Authentication)            ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

if [ -z "$AUTH_COOKIE" ]; then
  echo "❌ ERROR: AUTH_COOKIE not set"
  echo ""
  echo "Please run:"
  echo "  1. Open http://localhost:3000 in browser"
  echo "  2. Open DevTools (F12)"
  echo "  3. Go to Application → Cookies"
  echo "  4. Copy the value of 'sb-access-token'"
  echo "  5. Run: AUTH_COOKIE='paste-token-here' bash scripts/test-concierge-manual.sh"
  echo ""
  exit 1
fi

echo "✅ Auth cookie found"
echo "🧪 Testing pizza order..."
echo ""

curl -X POST http://localhost:3000/api/concierge/initiate-calls \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=$AUTH_COOKIE" \
  -d '{
    "intent": "pizza",
    "businessCount": 2,
    "userLocation": {
      "latitude": 34.5008,
      "longitude": -117.2897
    },
    "details": {
      "size": "large",
      "toppings": "cheese"
    }
  }' | jq '.'

echo ""
echo "✅ Test complete!"



