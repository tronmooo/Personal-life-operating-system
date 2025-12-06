#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo "======================================"
echo "🔍 Checking .env.local configuration"
echo "======================================"
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo -e "${RED}❌ .env.local file not found!${NC}"
    echo ""
    echo "Creating .env.local from env.example..."
    cp env.example .env.local
    echo -e "${GREEN}✅ Created .env.local${NC}"
    echo ""
    echo "⚠️  You need to add your actual API keys to .env.local"
    echo "   Open .env.local and fill in your credentials"
    exit 1
fi

echo -e "${GREEN}✅ .env.local exists${NC}"
echo ""

# Check for NEXTAUTH_URL
if grep -q "^NEXTAUTH_URL=" .env.local; then
    NEXTAUTH_URL=$(grep "^NEXTAUTH_URL=" .env.local | cut -d '=' -f2)
    echo -e "${GREEN}✅ NEXTAUTH_URL is set: $NEXTAUTH_URL${NC}"
else
    echo -e "${RED}❌ NEXTAUTH_URL is missing!${NC}"
    echo ""
    echo "Adding NEXTAUTH_URL to .env.local..."
    echo "" >> .env.local
    echo "# NextAuth Configuration (REQUIRED for Google Sign-In)" >> .env.local
    echo "NEXTAUTH_URL=http://localhost:3000" >> .env.local
    echo -e "${GREEN}✅ Added NEXTAUTH_URL=http://localhost:3000${NC}"
fi

# Check for NEXTAUTH_SECRET
if grep -q "^NEXTAUTH_SECRET=" .env.local; then
    echo -e "${GREEN}✅ NEXTAUTH_SECRET is set${NC}"
else
    echo -e "${YELLOW}⚠️  NEXTAUTH_SECRET is missing!${NC}"
    echo ""
    echo "Generating a secure NEXTAUTH_SECRET..."
    SECRET=$(openssl rand -base64 32)
    echo "NEXTAUTH_SECRET=$SECRET" >> .env.local
    echo -e "${GREEN}✅ Added NEXTAUTH_SECRET${NC}"
fi

# Check for Google OAuth credentials
if grep -q "^GOOGLE_CLIENT_ID=" .env.local; then
    echo -e "${GREEN}✅ GOOGLE_CLIENT_ID is set${NC}"
else
    echo -e "${YELLOW}⚠️  GOOGLE_CLIENT_ID is missing or commented out${NC}"
    echo "   You need to add your Google OAuth Client ID"
fi

if grep -q "^GOOGLE_CLIENT_SECRET=" .env.local; then
    echo -e "${GREEN}✅ GOOGLE_CLIENT_SECRET is set${NC}"
else
    echo -e "${YELLOW}⚠️  GOOGLE_CLIENT_SECRET is missing or commented out${NC}"
    echo "   You need to add your Google OAuth Client Secret"
fi

echo ""
echo "======================================"
echo "✨ Configuration check complete!"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Make sure all required variables are set in .env.local"
echo "2. Restart your server: Ctrl+C then 'npm run dev'"
echo "3. Try signing in with Google again"
echo ""
































