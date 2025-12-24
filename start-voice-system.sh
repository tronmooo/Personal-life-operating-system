#!/bin/bash
# LifeHub AI Voice Calling System - Startup Script

echo "🚀 Starting LifeHub AI Voice System..."
echo ""

cd "$(dirname "$0")"

# Kill any existing processes
pkill -f "voice-server.js" 2>/dev/null
pkill -f cloudflared 2>/dev/null
lsof -ti :3001 | xargs kill -9 2>/dev/null
sleep 2

# Start voice server
echo "📞 Starting Voice Server..."
node voice-server.js > /tmp/voice-server.log 2>&1 &
sleep 2

# Check if voice server started
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "   ✅ Voice Server running on port 3001"
else
    echo "   ❌ Voice Server failed to start"
    exit 1
fi

# Start tunnels
echo "🌐 Starting Cloudflare Tunnels..."
cloudflared tunnel --url http://localhost:3000 > /tmp/tunnel-app.log 2>&1 &
cloudflared tunnel --url http://localhost:3001 > /tmp/tunnel-voice.log 2>&1 &
sleep 8

# Get tunnel URLs
APP_URL=$(grep -o "https://[^|]*trycloudflare.com" /tmp/tunnel-app.log | head -1 | tr -d ' ')
VOICE_URL=$(grep -o "https://[^|]*trycloudflare.com" /tmp/tunnel-voice.log | head -1 | tr -d ' ')

if [ -z "$APP_URL" ] || [ -z "$VOICE_URL" ]; then
    echo "   ❌ Failed to get tunnel URLs"
    exit 1
fi

echo "   ✅ App Tunnel: $APP_URL"
echo "   ✅ Voice Tunnel: $VOICE_URL"

# Update TwiML route with new voice URL
sed -i '' "s|wss://[^']*trycloudflare.com|wss://${VOICE_URL#https://}|" app/api/voice/twiml/route.ts

# Update Twilio webhooks
echo "📱 Configuring Twilio..."
node setup-twilio-webhooks.js "$APP_URL" > /dev/null 2>&1
echo "   ✅ Twilio webhooks updated"

# Update test script
sed -i '' "s|APP_TUNNEL = '.*'|APP_TUNNEL = '$APP_URL'|" test-voice-call.js

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 AI VOICE SYSTEM READY!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "To make a test call:"
echo "  node test-voice-call.js +1YOURNUMBER"
echo ""
echo "To stop:"
echo "  pkill -f voice-server && pkill -f cloudflared"
echo ""









