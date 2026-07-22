# 🚀 Deployment Guide

Complete deployment guide for Equilibria V.2 to production.

## 📋 Prerequisites

- Node.js 20+
- npm or pnpm
- Vercel account (recommended) or similar platform
- Neon PostgreSQL database
- Domain name (optional)

---

## 🐳 Option 1: Vercel (Recommended)

### 1. Connect Repository

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
vercel link

# Deploy
vercel --prod
```

### 2. Environment Variables

Set these in Vercel Dashboard → Settings → Environment Variables:

| Variable | Value | Notes |
|----------|-------|-------|
| `DATABASE_URL` | `postgresql://...` | Neon connection string |
| `API_SECRET_KEY` | `generated-key` | Run `npm run key:generate` |
| `TELEGRAM_BOT_TOKEN` | `token` | From @BotFather |
| `NEXT_PUBLIC_APP_URL` | `https://your-domain.vercel.app` | Your Vercel URL |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | `key` | Optional for push |
| `VAPID_PRIVATE_KEY` | `key` | Optional for push |

### 3. Deploy

```bash
# Push to main branch
git push origin main

# Or deploy manually
vercel --prod
```

### 4. Custom Domain (Optional)

1. Go to Vercel Dashboard → Settings → Domains
2. Add your domain
3. Update DNS records as instructed

---

## 🐳 Option 2: Railway

### 1. Create Railway Project

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Create project
railway init

# Add PostgreSQL
railway add postgres
```

### 2. Configure

```bash
# Set environment variables
railway variables set DATABASE_URL=$(railway variables get DATABASE_URL)
railway variables set API_SECRET_KEY=your-generated-key
railway variables set TELEGRAM_BOT_TOKEN=your-token
```

### 3. Deploy

```bash
railway up
```

---

## 🐳 Option 3: Docker (Self-Hosted)

### 1. Create Dockerfile

```dockerfile
# Dockerfile
FROM node:20-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Run
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
```

### 2. Build & Run

```bash
docker build -t equilibria .
docker run -p 3000:3000 equilibria
```

---

## 📊 Post-Deployment Checklist

### Security

- [ ] HTTPS enabled
- [ ] Environment variables set
- [ ] API keys rotated from development
- [ ] Rate limiting enabled
- [ ] CORS configured
- [ ] Security headers set

### Database

- [ ] Migrations run
- [ ] Database indexes created
- [ ] Connection pooling configured
- [ ] Backups enabled

---

## 💾 Database Backup Strategy

### Railway PostgreSQL (Primary)

Railway provides automatic backups for PostgreSQL databases:
- **Automatic Backups:** Railway creates daily backups automatically
- **Retention:** Last 7 days of backups retained
- **Point-in-Time Recovery:** Available on Pro plans

To configure backup retention:
1. Go to Railway Dashboard → PostgreSQL → Backups
2. Set retention period
3. Test restore procedure regularly

### Backup Cron Job

The application includes automatic cleanup for rate limit entries to prevent database bloat:

**Endpoint:** `GET /api/cron/cleanup-rate-limit`

**Schedule:** Recommended every 5 minutes via Railway Cron or external scheduler

```bash
# Test manually
curl -H "X-Cron-Secret: $CRON_SECRET" \
  https://your-domain/api/cron/cleanup-rate-limit
```

**Response:**
```json
{
  "success": true,
  "message": "Cleanup completed successfully",
  "deletedEntries": 42,
  "executionTimeMs": 15,
  "timestamp": "2026-07-22T12:00:00.000Z"
}
```

### Disaster Recovery Checklist

1. **Daily Backups:** Railway automatic
2. **Point-in-Time Recovery:** Available within retention period
3. **Cross-Region Backup:** Neon as failover database configured
4. **Test Restore:** Quarterly restore test recommended

---

### Monitoring

- [ ] Health check endpoint working (`/api/health`)
- [ ] Error tracking active
- [ ] Logs being collected
- [ ] Uptime monitoring set up

### Telegram (Optional)

- [ ] Bot token set
- [ ] Webhook configured
- [ ] Bot tested with `/start`

### PWA

- [ ] Service worker registered
- [ ] Manifest configured
- [ ] HTTPS working (required for PWA)

---

## 🔍 Verification

### Test Health Endpoint

```bash
curl https://your-domain.vercel.app/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-06-10T12:00:00.000Z",
  "checks": {
    "database": { "status": "pass" },
    "api": { "status": "pass" },
    "memory": { "status": "pass" }
  }
}
```

### Test API

```bash
# Get transactions
curl https://your-domain.vercel.app/api/transactions

# Create transaction
curl -X POST https://your-domain.vercel.app/api/transactions \
  -F "amount=100000" \
  -F "type=EXPENSE" \
  -F "category=Makanan" \
  -F "description=Test" \
  -F "date=2026-06-10"
```

---

## 🔧 Troubleshooting

### Database Connection Failed

```
Error: P1001: Can't reach database server
```

**Solution:**
1. Check `DATABASE_URL` is correct
2. Verify Neon is not paused
3. Check SSL settings (`?sslmode=require`)

### Build Failed

```
Error: Module not found
```

**Solution:**
```bash
npm install
npm run build
```

### API Returns 500

1. Check logs: `vercel logs`
2. Test locally: `npm run dev`
3. Verify environment variables

### Telegram Not Working

1. Check bot token is correct
2. Verify webhook is set
3. Test bot with `/start`

---

## 📞 Support

For issues, check:
1. Vercel Deployment logs
2. Application logs (`/api/health`)
3. Neon database console