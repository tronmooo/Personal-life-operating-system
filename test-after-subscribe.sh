#!/bin/bash

echo "🧪 Testing Property Price API After RapidAPI Subscription"
echo "========================================================="
echo ""

# Test addresses
addresses=(
  "1600 Pennsylvania Avenue NW, Washington, DC 20500"
  "123 Main St, Tampa, FL 33607"
  "456 Oak Ave, Los Angeles, CA 90001"
)

echo "Testing 3 addresses to verify API is returning REAL data..."
echo ""

for address in "${addresses[@]}"; do
  echo "📍 Testing: $address"
  echo ""
  
  response=$(curl -s -X POST http://localhost:3000/api/zillow-scrape \
    -H "Content-Type: application/json" \
    -d "{\"address\": \"$address\"}")
  
  # Extract key info using grep and basic parsing
  value=$(echo "$response" | grep -o '"estimatedValue":[0-9]*' | grep -o '[0-9]*')
  source=$(echo "$response" | grep -o '"source":"[^"]*"' | sed 's/"source":"//; s/"$//')
  confidence=$(echo "$response" | grep -o '"confidence":"[^"]*"' | sed 's/"confidence":"//; s/"$//')
  
  if [[ $source == *"Realty Mole"* ]] || [[ $source == *"Real Estate"* ]]; then
    echo "✅ SUCCESS! Getting REAL data from API"
  else
    echo "⚠️  Using fallback estimate (subscribe to APIs for real data)"
  fi
  
  echo "   Price: \$$value"
  echo "   Source: $source"
  echo "   Confidence: $confidence"
  echo ""
  echo "-----------------------------------------------------------"
  echo ""
done

echo "🎉 Test Complete!"
echo ""
echo "If you see 'Location-Based' as source:"
echo "  → Make sure you subscribed to the APIs (see SUBSCRIBE_NOW.md)"
echo "  → Wait 1-2 minutes after subscribing"
echo "  → Restart dev server: npm run dev"
echo ""
echo "If you see 'Realty Mole' or 'Real Estate' as source:"
echo "  → ✅ YOU'RE GETTING REAL DATA! 🎉"
echo ""



































