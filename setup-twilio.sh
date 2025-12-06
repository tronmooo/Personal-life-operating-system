#!/bin/bash

# Twilio Voice Agent Setup Helper Script

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎤 Twilio Voice Agent Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local not found!"
    echo "Creating .env.local from env.example..."
    cp env.example .env.local
    echo "✅ .env.local created"
fi

echo "📋 Your Twilio Information (from screenshots):"
echo "   Account SID: ACbe0fd20294a9"
echo "   Phone Number: +17279662653"
echo ""

# Check if Twilio vars are in .env.local
if grep -q "TWILIO_ACCOUNT_SID" .env.local; then
    echo "✅ Twilio credentials already in .env.local"
else
    echo "Adding Twilio credentials to .env.local..."
    cat >> .env.local << 'EOL'

# =============================================================================
# TWILIO VOICE AGENT (OpenAI Realtime API)
# =============================================================================
TWILIO_ACCOUNT_SID=ACbe0fd20294a9
TWILIO_AUTH_TOKEN=YOUR_FULL_AUTH_TOKEN_HERE
TWILIO_PHONE_NUMBER=+17279662653
EOL
    echo "✅ Twilio credentials added to .env.local"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⚠️  ACTION REQUIRED - You need to:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1️⃣  Get your full Auth Token:"
echo "   • Go to: https://console.twilio.com/"
echo "   • Click 'Show' next to Auth Token"
echo "   • Copy the ENTIRE token"
echo "   • Edit .env.local and replace YOUR_FULL_AUTH_TOKEN_HERE"
echo ""
echo "2️⃣  Install and run ngrok:"
echo "   npm install -g ngrok"
echo "   ngrok http 3000"
echo ""
echo "3️⃣  Update Twilio webhooks:"
echo "   • Go to: https://console.twilio.com/us1/develop/phone-numbers/manage/active"
echo "   • Click: +1 (727) 966-2653"
echo "   • Set 'A call comes in' to: https://YOUR-NGROK-URL/api/voice/twiml"
echo "   • Set 'Call status changes' to: https://YOUR-NGROK-URL/api/voice/status"
echo "   • Click Save"
echo ""
echo "4️⃣  Start the server:"
echo "   node server.js"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📖 For detailed instructions, see:"
echo "   QUICK_START_VOICE_AGENT.md"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"






