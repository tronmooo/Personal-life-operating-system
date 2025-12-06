#!/bin/bash

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 Creating Public Tunnel (No ngrok needed!)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Using localhost.run (SSH tunnel - no install required)"
echo ""
echo "⏳ Connecting to localhost.run..."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 COPY THE URL YOU GET AND USE IT IN TWILIO:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Wait for the URL (like: https://abc123.lhr.life)"
echo "2. Go to: https://console.twilio.com/us1/develop/phone-numbers/manage/active"
echo "3. Click: +1 (727) 966-2653"
echo "4. Change webhooks:"
echo "   A call comes in: https://YOUR-URL/api/voice/twiml"
echo "   Call status: https://YOUR-URL/api/voice/status"
echo "5. Click Save"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔌 Creating tunnel now..."
echo ""

# Create the tunnel
ssh -R 80:localhost:3000 localhost.run






