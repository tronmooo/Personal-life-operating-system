#!/bin/bash

# Copy Gmail scopes to clipboard for easy pasting

SCOPES="https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.appdata"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 COPYING SCOPES TO CLIPBOARD"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Copy to clipboard (works on macOS)
echo "$SCOPES" | pbcopy

echo "✅ Scopes copied to clipboard!"
echo ""
echo "Now follow these 3 steps:"
echo ""
echo "1. Sign in to Supabase Dashboard (opening in 3 seconds...)"
echo "2. Navigate to: Authentication → Providers → Google"
echo "3. Paste (Cmd+V) into the 'Scopes' field and click Save"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Opening browser..."
sleep 3

# Open Supabase dashboard
open "https://supabase.com/dashboard/project/jphpxqqilrjyypztkswc/auth/providers"

echo ""
echo "✅ Browser opened! The scopes are in your clipboard - just paste them!"
echo ""



























