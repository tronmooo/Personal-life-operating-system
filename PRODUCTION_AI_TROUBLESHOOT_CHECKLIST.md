# 🛠️ LIFE-HUB.ME Production AI Troubleshooting & Deployment Checklist

Use this checklist when AI features fail in production (LIFE-HUB.ME) but succeed locally. Complete items in order to ensure deployment parity, surface environment mismatches, and capture actionable errors before and after deploying fixes.

## 1) Fast Triage (before redeploying)

- [ ] Confirm the production build succeeds locally: `npm run build`.
- [ ] Validate core quality gates: `npm run lint`, `npm run type-check`, and `npm test` (or `npm run test:ai-commands` for AI-only validation).
- [ ] Verify Supabase connectivity with production credentials: `npm run verify:schema` (or `npm run verify:all` if schema issues suspected).
- [ ] Check that `.env.production` (or deployed env vars) matches working `.env.local` values for:
  - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (DB/auth)
  - `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` (AI providers)
  - `NEXTAUTH_URL`, `NEXTAUTH_SECRET` (auth/session)
  - Any feature-flag or proxy variables used in hosting platform.
- [ ] Confirm the production domain is set everywhere (`NEXT_PUBLIC_APP_URL=https://life-hub.me` in env and OAuth callbacks).

## 2) Deploy safely to LIFE-HUB.ME

- [ ] Build and deploy with the same commit that passed the checks above.
- [ ] Run migrations or seed scripts against production only if needed, and verify Supabase project settings before applying (`supabase-schema.sql`, `supabase-cloud-sync-table.sql`).
- [ ] After deploy, warm up the app by hitting the AI endpoints/flows you expect customers to use.
- [ ] Enable feature flags/maintenance mode toggle if your platform supports phased rollouts.

## 3) Capture errors in production

- [ ] Open browser DevTools on LIFE-HUB.ME and reproduce the failing AI flows; capture console errors and network responses (look for 401/403/429/5xx, missing CORS headers, or blocked websocket requests).
- [ ] Check server logs from the hosting provider for Next.js Route Handlers / API routes, focusing on AI requests and Supabase activity.
- [ ] Verify monitoring/alerting (e.g., Sentry) is receiving errors; if not, ensure DSN is set in production env.
- [ ] Confirm rate limits/status with OpenAI/Anthropic dashboards; ensure production keys are active and not restricted by IP or billing caps.

## 4) Parity checks between local and production

- [ ] Compare environment variables line-by-line (local vs production) for AI, auth, and Supabase keys.
- [ ] Ensure OAuth redirect URIs include `https://life-hub.me` and match NextAuth provider settings.
- [ ] Confirm Supabase Row Level Security policies in production match the expected schema (run `npm run verify:schema` and check policies in the Supabase dashboard).
- [ ] Validate storage bucket CORS settings and public access rules if AI depends on uploaded files.
- [ ] Check that Edge/Server runtime settings are consistent (e.g., Node vs Edge) for AI route handlers.

## 5) Functional AI validation in production

- [ ] Run `npm run test:ai-commands` against production APIs (configure env to point at LIFE-HUB.ME) or execute equivalent smoke tests manually.
- [ ] Exercise each AI pathway end-to-end: command palette, AI chat assistants, document OCR, and any domain-specific AI tools.
- [ ] Verify fallback providers (OpenAI → Anthropic) respond correctly when toggled.
- [ ] Confirm prompts/responses are not blocked by content filters or missing model names.

## 6) Data consistency & caching

- [ ] Clear browser cache and local storage on LIFE-HUB.ME; retest AI features.
- [ ] Check CDN/edge cache rules so API responses and `/.well-known` files are not cached incorrectly.
- [ ] Validate Supabase replication/cron jobs (if any) to ensure fresh data for AI context.

## 7) Rollback & communication

- [ ] If errors persist, rollback to the last known good deployment and document the diff between commits.
- [ ] Notify stakeholders with the failing scenarios, captured logs, and env/key discrepancies.
- [ ] Track all follow-up tasks in an incident ticket, including required schema or config fixes.
