# ✅ PRE-DEPLOYMENT CHECKLIST

**Check off each item as you complete it.**

---

## 📋 Phase 1: Initial Setup

- [ ] Node.js installed (check: `node --version`)
- [ ] Docker Desktop installed (optional but recommended)
- [ ] GitHub account (you have: kgs2026-bit)
- [ ] Repository created on GitHub (name: `saas_email_marketing`)
- [ ] Code is in the repository folder

---

## 📋 Phase 2: Free Services Setup

### PostgreSQL Database
- [ ] Created Supabase account
- [ ] Created project
- [ ] Copied Database URL (from Settings → Database)
- [ ] Database URL pasted in `backend/.env` at `DATABASE_URL=`

### Redis Cache
- [ ] Created Upstash account
- [ ] Created Redis database
- [ ] Copied Redis REST URL
- [ ] Redis URL pasted in `backend/.env` at `REDIS_URL=`
- [ ] Changed `rediss://` to `redis://` if needed (use `rediss://` for TLS)

### Google OAuth
- [ ] Created Google Cloud Project
- [ ] Enabled Gmail API
- [ ] Created OAuth 2.0 credentials
- [ ] Added localhost redirect URI: `http://localhost:3001/api/auth/google/callback`
- [ ] Copied Client ID
- [ ] Copied Client Secret
- [ ] Both pasted in `backend/.env`

### Stripe
- [ ] Created Stripe account
- [ ] Verified email
- [ ] Copied Secret Key (starts with `sk_test_`)
- [ ] Copied Webhook Signing Secret (starts with `whsec_`)
- [ ] Created 3 products (Starter $19, Growth $49, Pro $99)
- [ ] Copied 3 Price IDs
- [ ] Created webhook endpoint with all 5 events
- [ ] All 4 values pasted in `backend/.env`

---

## 📋 Phase 3: Environment Variables

In `backend/.env`:

- [ ] `DATABASE_URL` - filled from Supabase
- [ ] `JWT_SECRET` - any 32+ char random string
- [ ] `JWT_REFRESH_SECRET` - any 32+ char random string (different from above)
- [ ] `GOOGLE_CLIENT_ID` - from Google Cloud
- [ ] `GOOGLE_CLIENT_SECRET` - from Google Cloud
- [ ] `STRIPE_SECRET_KEY` - from Stripe
- [ ] `STRIPE_WEBHOOK_SECRET` - from Stripe
- [ ] `STRIPE_PRICE_STARTER` - from Stripe product
- [ ] `STRIPE_PRICE_GROWTH` - from Stripe product
- [ ] `STRIPE_PRICE_PRO` - from Stripe product
- [ ] `REDIS_URL` - from Upstash
- [ ] `ENCRYPTION_KEY` - any 32-char string
- [ ] `TRACKING_DOMAIN` - `http://localhost:3001` (for now)
- [ ] `FRONTEND_URL` - `http://localhost:5173`
- [ ] `API_URL` - `http://localhost:3001`
- [ ] Optional: `SMTP_USER` and `SMTP_PASS` for password reset emails

---

## 📋 Phase 4: Install Dependencies

- [ ] Run `npm install` in project root
- [ ] Backend `npm install` completed
- [ ] Frontend `npm install` completed

---

## 📋 Phase 5: Build Setup

- [ ] Run `cd backend && npx prisma generate`
- [ ] Run `cd backend && npx prisma migrate dev`
- [ ] Optional: `cd backend && npx prisma db seed` (creates demo user)

---

## 📋 Phase 6: Start Application

Choose ONE method:

### Method A: Docker (Easiest)
- [ ] Docker Desktop is running
- [ ] Run `docker-compose up`
- [ ] Wait 30 seconds
- [ ] Open http://localhost:5173 - landing page shows

### Method B: Manual
- [ ] PostgreSQL/Redis is running
- [ ] Terminal 1: `cd backend && npm run dev`
- [ ] Terminal 2: `cd frontend && npm run dev`
- [ ] Open http://localhost:5173 - landing page shows

---

## 📋 Phase 7: Basic Testing

- [ ] Can see landing page at http://localhost:5173
- [ ] Can register new account
- [ ] Can login with email/password
- [ ] Can add Gmail inbox (OAuth flow works)
- [ ] Can create campaign
- [ ] Can add contacts
- [ ] Can start campaign (emails queue)
- [ ] `/health` endpoint returns `{"status":"ok"}`

---

## 📋 Phase 8: Deploy to Railway

- [ ] Code pushed to GitHub
- [ ] Railway account created
- [ ] Created new project from GitHub
- [ ] Root directory set to `/backend`
- [ ] Added PostgreSQL plugin
- [ ] Got PostgreSQL connection URL from Railway
- [ ] Got Redis connection URL from Railway
- [ ] Set all environment variables in Railway
- [ ] Build completed successfully
- [ ] App is running
- [ ] Health check passes: `https://your-backend.railway.app/health`

---

## 📋 Phase 9: Deploy to Vercel

- [ ] Vercel account created
- [ ] Imported `saas_email_marketing` repo
- [ ] Root directory set to `/frontend`
- [ ] Set `VITE_API_URL` environment variable
- [ ] Build completed successfully
- [ ] App is running
- [ ] Can see landing page

---

## 📋 Phase 10: Post-Deployment Configuration

- [ ] Updated Railway `FRONTEND_URL` to Vercel URL
- [ ] Updated Railway `API_URL` to Railway URL
- [ ] Updated Vercel `VITE_API_URL` to Railway API URL
- [ ] Redeployed both Railway and Vercel
- [ ] Updated Google OAuth redirect URI to production URL
- [ ] Tested Google login on production
- [ ] Updated Stripe webhook URL to production
- [ ] Verified Stripe webhook works

---

## 📋 Phase 11: Production Test

- [ ] Can access Vercel URL
- [ ] Can register/login on production
- [ ] Can add Gmail inbox (OAuth works in production)
- [ ] Can create campaign
- [ ] Can add contacts
- [ ] Can start campaign
- [ ] Billing page shows (test mode still)
- [ ] Everything works as expected

---

## 📋 Phase 12: Stripe Live Mode (Optional)

**Only when ready for real payments:**

- [ ] Stripe account fully verified
- [ ] Bank account connected
- [ ] Updated Railway `STRIPE_SECRET_KEY` to live key (starts with `sk_live_`)
- [ ] Created live products with prices
- [ ] Updated `STRIPE_PRICE_*` to live price IDs
- [ ] Updated Stripe webhook to live endpoint
- [ ] Tested real payment (use real card once)
- [ ] Live mode enabled in Stripe dashboard

---

## 🎉 FINAL CHECKLIST SUMMARY

**Before you tell users it's ready:**

- [ ] All services configured (Supabase, Upstash, Google, Stripe)
- [ ] All environment variables set correctly
- [ ] Database migrations run
- [ ] Backend deployed and healthy
- [ ] Frontend deployed and loading
- [ ] User registration works
- [ ] Google OAuth works (production domain)
- [ ] Campaign creation works
- [ ] Email sending works (test with your own Gmail)
- [ ] Analytics tracking works (open/click)
- [ ] Billing UI works (test mode)
- [ ] Stripe webhooks configured
- [ ] Error handling works (check logs)
- [ ] HTTPS everywhere (automatic with Railway/Vercel)

---

## 💡 Tips

1. **Use test mode** in Stripe until you're 100% ready
2. **Test with your own email** first before letting anyone else use it
3. **Monitor logs** for first few days to catch any issues
4. **Set up database backups** (Supabase does auto-backups)
5. **Keep your .env file safe** - never commit it
6. **Use different secrets** for dev vs production

---

**Once all checklists are complete → Your SaaS is LIVE and ready for users! 🚀**

---

## 📞 Quick Commands Reference

```bash
# Local development
docker-compose up                    # Start everything (Docker)
cd backend && npm run dev           # Start backend only
cd frontend && npm run dev          # Start frontend only

# Database
cd backend && npx prisma migrate dev     # Run migrations
cd backend && npx prisma studio          # Open database GUI
cd backend && npx prisma db seed         # Seed demo data

# Build
cd backend && npm run build            # Build backend
cd frontend && npm run build           # Build frontend

# Docker
docker-compose logs -f backend         # View backend logs
docker-compose down                    # Stop everything
docker-compose build --no-cache        # Rebuild images

# GitHub
git add . && git commit -m "Update" && git push   # Push changes

# Railway
railway up                              # Deploy via CLI (if installed)
```

---

**Documentation:**
- Full setup: `QUICKSTART.md`
- Deployment: `DEPLOYMENT.md`
- API docs: `README.md` (backend section)
