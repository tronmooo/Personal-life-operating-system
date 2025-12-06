#!/bin/bash
# Quick Test Script for AI Assistant Commands
# Tests a few commands from each domain to verify functionality

echo "🧪 AI Assistant Quick Test"
echo "=========================="
echo ""
echo "This script will test AI commands across all domains"
echo "Make sure your dev server is running on http://localhost:3000"
echo ""
read -p "Press Enter to start testing..."

# Base URL
API_URL="http://localhost:3000/api/ai-assistant/chat"

# Function to test a command
test_command() {
  local domain=$1
  local command=$2
  
  echo ""
  echo "📝 Testing $domain: \"$command\""
  
  response=$(curl -s -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -d "{\"message\": \"$command\", \"userData\": {}, \"conversationHistory\": []}")
  
  # Check if saved
  if echo "$response" | grep -q '"saved":true'; then
    echo "   ✅ Command saved successfully"
  else
    echo "   ❌ Command NOT saved"
  fi
  
  # Show response
  echo "   Response: $(echo $response | jq -r '.response' 2>/dev/null || echo $response)"
  
  sleep 1
}

echo ""
echo "Starting tests..."
echo "================="

# Test each domain
test_command "health" "I weigh 175 pounds"
test_command "fitness" "walked 30 minutes"
test_command "nutrition" "drank 20 oz water"
test_command "financial" "spent \$35 on groceries"
test_command "vehicles" "oil change \$120 today"
test_command "property" "house worth \$450000"
test_command "pets" "fed the dog"
test_command "career" "interview at Amazon tomorrow"
test_command "education" "studied 2 hours for math"
test_command "relationships" "called Mom"
test_command "travel" "planning trip to Paris"
test_command "mindfulness" "meditated 20 minutes"
test_command "hobbies" "played guitar 30 minutes"
test_command "insurance" "paid \$200 for health insurance"
test_command "legal" "signed lease agreement"
test_command "appliances" "serviced the washer for \$80"
test_command "digital" "subscribed to Netflix \$15 per month"
test_command "home" "paid \$120 for electricity bill"

echo ""
echo "=========================="
echo "✅ Quick test complete!"
echo ""
echo "Next steps:"
echo "1. Check browser console for detailed logs"
echo "2. Navigate to each domain page to verify entries"
echo "3. Test CRUD operations (view, edit, delete)"
echo "4. Run full test suite: npm run test:ai-commands"
echo ""

