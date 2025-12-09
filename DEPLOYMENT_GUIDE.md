# LifeHub Production Deployment Guide

## Prerequisites

- [ ] Node.js 20+ installed
- [ ] npm/pnpm installed
- [ ] Supabase project created
- [ ] Vercel account (or preferred hosting)
- [ ] Domain name (optional)
- [ ] API keys for integrations (OpenAI, Google, etc.)

## 1. Environment Variables

Create `.env.production` with all required variables:

### Required Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI Services
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_GEMINI_API_KEY=...

# Google Services (Optional)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_DRIVE_API_KEY=...
GOOGLE_CALENDAR_API_KEY=...
GOOGLE_GMAIL_API_KEY=...

# Monitoring
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
NEXT_PUBLIC_VERCEL_ANALYTICS=true
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-...

# Security
NEXTAUTH_SECRET=generate-random-string-here
NEXTAUTH_URL=https://your-domain.com

# Optional
NEXT_PUBLIC_APP_VERSION=1.0.0
NODE_ENV=production
```

### Generate Secrets

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## 2. Database Setup

### Run Migrations

```bash
# Apply all migrations to production database
npx supabase db push --db-url "postgresql://..."

# Or use Supabase Dashboard
# Dashboard → SQL Editor → paste migration SQL → Run
```

### Verify Migrations

```sql
-- Check migration history
SELECT * FROM supabase_migrations.schema_migrations ORDER BY version DESC;

-- Check RLS policies
SELECT * FROM pg_policies WHERE schemaname = 'public';

-- Check indexes
SELECT tablename, indexname FROM pg_indexes WHERE schemaname = 'public';
```

### Initialize Materialized Views

```sql
-- Refresh materialized views
SELECT refresh_dashboard_stats();
```

## 3. Vercel Deployment

### Option A: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod

# Set environment variables
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add OPENAI_API_KEY production
# ... add all required env vars
```

### Option B: GitHub Integration

1. Push code to GitHub
2. Connect repository to Vercel
3. Configure environment variables in Vercel Dashboard
4. Deploy automatically on push

### Vercel Configuration

Create `vercel.json`:

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key"
  },
  "build": {
    "env": {
      "NODE_OPTIONS": "--max-old-space-size=6144"
    }
  },
  "functions": {
    "app/api/**/*": {
      "memory": 1024,
      "maxDuration": 30
    }
  }
}
```

## 4. Build & Deploy Process

### Pre-Deployment Checklist

```bash
# 1. Run all checks
npm run validate

# 2. Type check
npm run type-check

# 3. Lint
npm run lint

# 4. Test
npm run test

# 5. Build locally
npm run build

# 6. Check bundle size
npm run build -- --profile

# 7. Security audit
npm audit --production
```

### Deployment Script

Create `scripts/deploy.sh`:

```bash
#!/bin/bash
set -e

echo "🚀 Starting deployment..."

# Pre-deployment checks
echo "1️⃣ Running pre-deployment checks..."
npm run validate

# Build
echo "2️⃣ Building application..."
npm run build

# Run migrations (if needed)
echo "3️⃣ Checking database migrations..."
# Add migration commands if using a custom migration system

# Deploy
echo "4️⃣ Deploying to Vercel..."
vercel --prod

# Post-deployment checks
echo "5️⃣ Running post-deployment checks..."
# Add health check commands

echo "✅ Deployment complete!"
```

Make executable:
```bash
chmod +x scripts/deploy.sh
```

## 5. Post-Deployment

### Health Checks

Create `app/api/health/route.ts`:

```typescript
export async function GET() {
  const checks = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.NEXT_PUBLIC_APP_VERSION,
    database: await checkDatabase(),
    redis: await checkRedis(),
    ai: await checkAI(),
  }
  
  const allHealthy = Object.values(checks).every(
    v => v === 'ok' || typeof v === 'string'
  )
  
  return new Response(JSON.stringify(checks), {
    status: allHealthy ? 200 : 503,
    headers: { 'Content-Type': 'application/json' },
  })
}
```

### Monitoring Setup

1. **Sentry:**
   - Create project at sentry.io
   - Copy DSN to `NEXT_PUBLIC_SENTRY_DSN`
   - Configure alerts

2. **Vercel Analytics:**
   - Enable in Vercel Dashboard
   - Add `NEXT_PUBLIC_VERCEL_ANALYTICS=true`

3. **Google Analytics:**
   - Create property at analytics.google.com
   - Add `NEXT_PUBLIC_GA_MEASUREMENT_ID`

4. **Uptime Monitoring:**
   - Use UptimeRobot, Better Uptime, or similar
   - Monitor: `/api/health`, `/`, `/api/*`

### Performance Monitoring

```bash
# Install Lighthouse CI
npm install -g @lhci/cli

# Run Lighthouse
lhci autorun --collect.url=https://your-domain.com
```

## 6. CDN & Caching

### Vercel Edge Network

Automatically configured. Customize in `next.config.js`:

```javascript
async headers() {
  return [
    {
      source: '/static/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
  ]
}
```

### Image Optimization

```javascript
// next.config.js
images: {
  domains: ['your-supabase-project.supabase.co'],
  formats: ['image/avif', 'image/webp'],
  minimumCacheTTL: 60,
}
```

## 7. Database Optimization

### Connection Pooling

Supabase automatically handles connection pooling. For direct connections:

```javascript
// lib/supabase-server.ts
const connectionString = process.env.DATABASE_URL + '?pgbouncer=true'
```

### Query Optimization

```sql
-- Enable pg_stat_statements
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Monitor slow queries
SELECT 
  query,
  mean_exec_time,
  calls
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC
LIMIT 20;
```

### Scheduled Jobs

Use Vercel Cron or Supabase pg_cron:

```javascript
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/refresh-stats",
      "schedule": "*/5 * * * *"
    },
    {
      "path": "/api/cron/cleanup",
      "schedule": "0 2 * * *"
    }
  ]
}
```

## 8. Backup & Recovery

### Database Backups

Supabase Pro includes daily backups. For additional backups:

```bash
# Manual backup
pg_dump "postgresql://..." > backup-$(date +%Y%m%d).sql

# Restore
psql "postgresql://..." < backup-20250125.sql
```

### Automated Backups Script

```bash
#!/bin/bash
# scripts/backup-db.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
DB_URL="postgresql://..."

pg_dump "$DB_URL" | gzip > "$BACKUP_DIR/backup_$DATE.sql.gz"

# Upload to S3 (optional)
aws s3 cp "$BACKUP_DIR/backup_$DATE.sql.gz" s3://your-bucket/backups/

# Keep only last 30 days
find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed: backup_$DATE.sql.gz"
```

## 9. SSL/TLS

### Vercel

Automatic HTTPS with free SSL certificates.

### Custom Domain

```bash
# Add domain in Vercel Dashboard
vercel domains add your-domain.com

# Configure DNS
# Type: A, Name: @, Value: 76.76.21.21
# Type: CNAME, Name: www, Value: cname.vercel-dns.com
```

## 10. Security Hardening

### Security Headers

Already configured in `next.config.js`. Verify:

```bash
# Check security headers
curl -I https://your-domain.com

# Or use online tool
# https://securityheaders.com/
```

### Rate Limiting

Production rate limiting with Upstash Redis:

```bash
# Install Upstash Redis
npm install @upstash/redis @upstash/ratelimit

# Add to .env.production
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

### DDoS Protection

Vercel includes basic DDoS protection. For enhanced protection:

- Enable Cloudflare (optional)
- Configure rate limits
- Set up WAF rules

## 11. CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
  VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm test
      - run: npm audit --production

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npx vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

## 12. Monitoring & Alerts

### Set Up Alerts

**Sentry Alerts:**
- Error rate spikes
- New error types
- Performance degradation

**Vercel Alerts:**
- Deployment failures
- Build errors
- Function timeouts

**Custom Alerts:**
```javascript
// lib/monitoring/alerts.ts
export async function sendAlert(message: string, severity: 'info' | 'warning' | 'critical') {
  // Send to Slack, Discord, email, etc.
  await fetch(process.env.ALERT_WEBHOOK_URL, {
    method: 'POST',
    body: JSON.stringify({ message, severity }),
  })
}
```

## 13. Performance Optimization

### Bundle Analysis

```bash
# Analyze bundle size
ANALYZE=true npm run build

# View report at
# .next/analyze/client.html
# .next/analyze/server.html
```

### Code Splitting

Already implemented in `lib/utils/lazy-load.tsx`. Verify chunks:

```bash
ls -lh .next/static/chunks/
```

### Image Optimization

```bash
# Optimize images before upload
npm install -g sharp-cli
sharp input.jpg -o output.webp
```

## 14. Rollback Strategy

### Vercel

```bash
# List deployments
vercel list

# Rollback to previous deployment
vercel rollback [deployment-url]

# Or use Vercel Dashboard
# Deployments → Select previous → Promote to Production
```

### Database Rollback

```bash
# Restore from backup
psql "postgresql://..." < backup-20250124.sql

# Or use Supabase Dashboard
# Database → Backups → Restore
```

## 15. Post-Launch Checklist

- [ ] All environment variables set
- [ ] Database migrations applied
- [ ] Health check endpoint working
- [ ] Monitoring configured (Sentry, Analytics)
- [ ] Alerts set up
- [ ] SSL certificate active
- [ ] Custom domain configured
- [ ] Backups scheduled
- [ ] Performance baseline recorded
- [ ] SEO meta tags configured
- [ ] robots.txt and sitemap.xml present
- [ ] Privacy policy and terms of service published
- [ ] GDPR compliance verified
- [ ] User authentication tested
- [ ] Payment integration tested (if applicable)
- [ ] Email delivery tested

## 16. Maintenance

### Regular Tasks

**Daily:**
- Check error rates in Sentry
- Monitor uptime and performance
- Review critical alerts

**Weekly:**
- Review analytics
- Check slow queries
- Update dependencies (security patches)

**Monthly:**
- Rotate API keys
- Review and clean logs
- Analyze costs
- Update documentation

**Quarterly:**
- Security audit
- Performance audit
- Dependency major updates
- User feedback review

### Update Process

```bash
# Update dependencies
npm update
npm outdated

# Test updates
npm run test
npm run build

# Deploy
./scripts/deploy.sh
```

## 17. Troubleshooting

### Common Issues

**Build Failures:**
```bash
# Clear Next.js cache
rm -rf .next

# Clear node_modules
rm -rf node_modules package-lock.json
npm install
```

**Database Connection Issues:**
```bash
# Test connection
psql "postgresql://..."

# Check connection pool
SELECT count(*) FROM pg_stat_activity;
```

**High Memory Usage:**
```javascript
// next.config.js
env: {
  NODE_OPTIONS: '--max-old-space-size=8192'
}
```

## 18. Support & Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Vercel Docs](https://vercel.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Sentry Docs](https://docs.sentry.io/)

## 🎉 Deployment Complete!

Your LifeHub application is now live in production. Monitor closely for the first 24-48 hours and be ready to respond to any issues.

**Production URL:** https://your-domain.com  
**Dashboard:** https://vercel.com/dashboard  
**Monitoring:** https://sentry.io/  
**Database:** https://app.supabase.com/

---

**Last Updated:** 2025-11-25  
**Version:** 1.0.0



































