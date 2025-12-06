#!/bin/bash

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 Creating Public Tunnel with Cloudflare"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if cloudflared is installed
if ! command -v cloudflared &> /dev/null; then
    echo "📦 Installing cloudflared..."
    brew install cloudflare/cloudflare/cloudflared
    echo "✅ Installed!"
    echo ""
fi

echo "🔌 Creating tunnel to localhost:3000..."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 COPY THE URL YOU SEE AND UPDATE TWILIO WEBHOOKS:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Copy the URL (like: https://xyz.trycloudflare.com)"
echo "2. Go to: https://console.twilio.com/us1/develop/phone-numbers/manage/active"
echo "3. Click: +1 (727) 966-2653"
echo "4. Set webhooks:"
echo "   A call comes in: https://YOUR-URL/api/voice/twiml"
echo "   Call status: https://YOUR-URL/api/voice/status"
echo "5. Click Save"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Start tunnel
cloudflared tunnel --url http://localhost:3000






