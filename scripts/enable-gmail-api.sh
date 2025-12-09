#!/bin/bash

echo "🔍 Checking Gmail API Status..."
echo ""
echo "Your current token ONLY has these scopes:"
echo "  - userinfo.email"
echo "  - userinfo.profile"  
echo "  - openid"
echo ""
echo "MISSING:"
echo "  ❌ gmail.readonly"
echo "  ❌ gmail.modify"
echo "  ❌ calendar"
echo "  ❌ drive"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 FIX: Enable Gmail API in Google Cloud Console"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Go to: https://console.cloud.google.com/apis/library/gmail.googleapis.com"
echo "2. Select your project (Client ID: 516494714417-8vs9okiovp5kkhiksqlrbbp2d77u)"
echo "3. Click 'ENABLE'"
echo ""
echo "Opening browser..."
sleep 2

# Open Gmail API page
open "https://console.cloud.google.com/apis/library/gmail.googleapis.com"

echo ""
echo "After enabling Gmail API:"
echo "1. Sign out of your app"
echo "2. Sign back in"
echo "3. Gmail sync will work!"
echo ""






























