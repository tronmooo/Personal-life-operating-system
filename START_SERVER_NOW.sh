#!/bin/bash

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Starting OpenAI Realtime Voice Agent Server"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if server.js exists
if [ ! -f server.js ]; then
    echo "❌ server.js not found!"
    exit 1
fi

# Check if .env.local has Twilio creds
if ! grep -q "TWILIO_ACCOUNT_SID=ACbe0fd20294a9" .env.local 2>/dev/null; then
    echo "⚠️  Twilio credentials not found in .env.local"
    echo "Run: ./add-to-env.sh first"
    exit 1
fi

echo "✅ server.js found"
echo "✅ Twilio credentials configured"
echo ""
echo "Starting server with WebSocket support..."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 AFTER SERVER STARTS:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Open a NEW TERMINAL and run:"
echo ""
echo "   ssh -R 80:localhost:3000 localhost.run"
echo ""
echo "Copy the URL and update Twilio webhooks!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Start the server
node server.js






