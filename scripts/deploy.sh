#!/bin/bash
#
# Production Deployment Script
# Runs pre-deployment checks and deploys to Vercel
#

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}  LifeHub Production Deployment${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}\n"

# Step 1: Pre-flight checks
echo -e "${BLUE}1️⃣  Running pre-flight checks...${NC}"

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
  echo -e "${RED}❌ Node.js 20+ required. Current: v$NODE_VERSION${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Node.js version check passed${NC}"

# Check if package.json exists
if [ ! -f "package.json" ]; then
  echo -e "${RED}❌ package.json not found${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Package.json found${NC}"

# Check if .env.production exists (warning only)
if [ ! -f ".env.production" ]; then
  echo -e "${YELLOW}⚠️  .env.production not found (will use Vercel env vars)${NC}"
fi

echo ""

# Step 2: Install dependencies
echo -e "${BLUE}2️⃣  Installing dependencies...${NC}"
npm ci --quiet || {
  echo -e "${RED}❌ Failed to install dependencies${NC}"
  exit 1
}
echo -e "${GREEN}✓ Dependencies installed${NC}\n"

# Step 3: Lint
echo -e "${BLUE}3️⃣  Running linter...${NC}"
npm run lint || {
  echo -e "${RED}❌ Linting failed${NC}"
  exit 1
}
echo -e "${GREEN}✓ Linting passed${NC}\n"

# Step 4: Type check
echo -e "${BLUE}4️⃣  Type checking...${NC}"
npm run type-check || {
  echo -e "${RED}❌ Type check failed${NC}"
  exit 1
}
echo -e "${GREEN}✓ Type check passed${NC}\n"

# Step 5: Tests
echo -e "${BLUE}5️⃣  Running tests...${NC}"
npm run test:ci || {
  echo -e "${RED}❌ Tests failed${NC}"
  exit 1
}
echo -e "${GREEN}✓ Tests passed${NC}\n"

# Step 6: Security audit
echo -e "${BLUE}6️⃣  Security audit...${NC}"
npm audit --production --audit-level=high || {
  echo -e "${YELLOW}⚠️  Security vulnerabilities found${NC}"
  echo -e "${YELLOW}   Review and fix before deploying${NC}"
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
}
echo -e "${GREEN}✓ Security audit passed${NC}\n"

# Step 7: Build
echo -e "${BLUE}7️⃣  Building application...${NC}"
npm run build || {
  echo -e "${RED}❌ Build failed${NC}"
  exit 1
}
echo -e "${GREEN}✓ Build completed${NC}\n"

# Step 8: Deploy to Vercel
echo -e "${BLUE}8️⃣  Deploying to Vercel...${NC}"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
  echo -e "${YELLOW}⚠️  Vercel CLI not found. Installing...${NC}"
  npm install -g vercel
fi

# Deploy
if [ "$1" == "--preview" ]; then
  echo -e "${YELLOW}Deploying preview build...${NC}"
  vercel || {
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
  }
else
  echo -e "${GREEN}Deploying to production...${NC}"
  vercel --prod || {
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
  }
fi

echo -e "${GREEN}✓ Deployment successful${NC}\n"

# Step 9: Post-deployment checks
echo -e "${BLUE}9️⃣  Post-deployment checks...${NC}"

# Wait for deployment to be live
sleep 5

# Get deployment URL (assuming latest deployment)
DEPLOYMENT_URL=$(vercel ls --yes | head -n 1 | awk '{print $1}')

if [ -n "$DEPLOYMENT_URL" ]; then
  # Health check
  echo -e "Checking health endpoint..."
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://$DEPLOYMENT_URL/api/health" || echo "000")
  
  if [ "$HTTP_CODE" == "200" ]; then
    echo -e "${GREEN}✓ Health check passed${NC}"
  else
    echo -e "${YELLOW}⚠️  Health check returned HTTP $HTTP_CODE${NC}"
  fi
fi

echo ""

# Success!
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ Deployment Complete!${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}\n"

if [ -n "$DEPLOYMENT_URL" ]; then
  echo -e "🔗 URL: ${BLUE}https://$DEPLOYMENT_URL${NC}"
fi

echo -e "\n📊 Next steps:"
echo -e "  1. Monitor Vercel dashboard for deployment status"
echo -e "  2. Check Sentry for any errors"
echo -e "  3. Test critical user flows"
echo -e "  4. Verify analytics are tracking"
echo ""

exit 0































