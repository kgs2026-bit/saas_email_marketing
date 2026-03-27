# 🚀 Deployment Guide - Railway + Vercel

**Easiest way to deploy your SaaS platform for FREE (with paid upgrade options).**

We'll deploy:
- **Backend** → Railway.app
- **Frontend** → Vercel
- **Database** → Supabase (PostgreSQL)
- **Redis** → Upstash
- **Emails** → Gmail API

All have generous free tiers!

---

## 📦 Prerequisites

- [x] Code pushed to GitHub (you already have: `kgs2026-bit/saas_email_marketing`)
- [x] All free services set up (Supabase, Upstash, Google OAuth, Stripe)
- [x] Backend runs locally with Docker

---

## 🎯 Step 1: Deploy Backend to Railway

### 1.1 Create Railway Account

1. Go to https://railway.app
2. Click **"Start for Free"**
3. Sign up with **GitHub** (easiest)
4. Authorize Railway to access your repos

### 1.2 Create New Project

1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose repository: **`saas_email_marketing`**
4. Click **"Next"**

**Important Configuration:**
- **Root directory**: `/backend` (select this!)
- **Branch**: `main` (or `master`)
- **Build command**: `npm run build`
- **Start command**: `npm start`

### 1.3 Add PostgreSQL Database

1. In your Railway project dashboard
2. Click **"New"** → **"Database"**
3. Select **"PostgreSQL"**
4. Leave default settings
5. Click **"Create"**
6. Wait 30 seconds for database to provision

**Get Database URL:**
- Click on your PostgreSQL plugin
- Scroll to **"Connection"** tab
- Click **"Connect"**
- Copy the **"Connection URI"**

### 1.4 Add Redis

1. Click **"New"** → **"Database"**
2. Select **"Redis"**
3. Name it `redis`
4. Click **"Create"**
5. Wait 30 seconds

**Get Redis URL:**
- Click on Redis plugin
- Scroll to **"Connection"**
- Copy the **"Connection String"**

### 1.5 Set Environment Variables

In Railway project dashboard:

1. Click **"Variables"** tab
2. Click **"Add Variable"**

Add these variables (**replace placeholders with your actual values**):

```
DATABASE_URL=postgresql://postgres:[PASSWORD]@us-central.connect.rly.cloud:34018/railway?connection_limit=20
# Use the connection URI from your PostgreSQL plugin

JWT_SECRET=your-32-char-secret-from-local-env
JWT_REFRESH_SECRET=your-32-char-refresh-secret-from-local-env
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=/api/auth/google/callback

STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_signing_secret
STRIPE_PRICE_STARTER=price_xxxxx
STRIPE_PRICE_GROWTH=price_yyyyy
STRIPE_PRICE_PRO=price_zzzzz

REDIS_URL=rediss://default:default@redis.railway.app:34018
# Use the Redis connection string from plugin, change port to 6379 if needed

NODE_ENV=production
PORT=3001
FRONTEND_URL=https://your-frontend.vercel.app
API_URL=https://your-backend.railway.app

ENCRYPTION_KEY=your-32-char-encryption-key
TRACKING_DOMAIN=https://your-backend.railway.app
OPEN_TRACKING_ENABLED=true
CLICK_TRACKING_ENABLED=true

# Optional - for password reset emails
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
```

**Important:**
- Copy `DATABASE_URL` from PostgreSQL plugin (it already includes password)
- Copy `REDIS_URL` from Redis plugin
- Keep `JWT_SECRET`, `JWT_REFRESH_SECRET`, `ENCRYPTION_KEY` same as your local `.env`
- Update `FRONTEND_URL` and `API_URL` **after** you deploy frontend

### 1.6 Deploy

1. Railway will **auto-deploy** when you push to GitHub
2. Or trigger manual deploy:
   - Go to **"Deployments"** tab
   - Click **"Deploy"** button

**Wait 2-3 minutes** for build to complete.

### 1.7 Test Backend

Your backend URL will be:
```
https://your-project.railway.app
```

Or Railway shows it in the top bar. Copy it.

Test health check:
```
https://your-backend.railway.app/health
```

Should return: `{"status":"ok","timestamp":"..."}`

---

## 🎯 Step 2: Deploy Frontend to Vercel

### 2.1 Create Vercel Account

1. Go to https://vercel.com
2. Click **"Sign Up"**
3. Choose **"Continue with GitHub"**
4. Authorize Vercel

### 2.2 Import Project

1. Click **"Add New..."** → **"Project"**
2. Select repository: **`saas_email_marketing`**
3. Click **"Import"**

### 2.3 Configure Project

**Root Directory**: `frontend` ← IMPORTANT!

**Environment Variables**:
```
VITE_API_URL=https://your-backend.railway.app/api
```

**Build & Output Settings** (usually auto-detected):
- Framework Preset: **Vite**
- Build Command: `npm run build`
- Output Directory: `dist`

Leave everything else as default.

### 2.4 Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes
3. Vercel will give you a URL like: `https://saas-email-marketing.vercel.app`

**Copy your Vercel URL** - you'll need it for next steps.

---

## 🎯 Step 3: Update Environment Variables

Now that you have URLs, update them:

### 3.1 Update Railway Backend Variables

Go to your Railway project → Variables:

Update these:
```
FRONTEND_URL=https://your-app.vercel.app
API_URL=https://your-backend.railway.app
TRACKING_DOMAIN=https://your-backend.railway.app
```

Click **"Save"** → Railway will **auto-restart** your backend.

### 3.2 Update Vercel Frontend Variable

Go to Vercel → Your Project → Settings → Environment Variables:

Update:
```
VITE_API_URL=https://your-backend.railway.app/api
```

Redeploy: Click **"Deployments"** → **"..."** → **"Redeploy"**

---

## 🎯 Step 4: Update Google OAuth

Your Google OAuth still points to localhost. Update it:

1. Go to https://console.cloud.google.com
2. Select your project → **"APIs & Services"** → **"Credentials"**
3. Click on your OAuth 2.0 Client
4. Under **"Authorized redirect URIs"**, add:
   ```
   https://your-backend.railway.app/api/auth/google/callback
   ```
5. Click **"Save"**

---

## 🎯 Step 5: Update Stripe Webhook

Your Stripe webhook still points to localhost. Update it:

1. Go to https://dashboard.stripe.com
2. Click **"Developers"** → **"Webhooks"**
3. Click on your existing endpoint
4. Click **"Edit"**
5. Update URL to:
   ```
   https://your-backend.railway.app/api/webhooks/stripe
   ```
6. Click **"Save"**

Stripe may ask you to re-verify the endpoint - do it.

---

## 🎯 Step 6: Test Production Deployment

### 6.1 Check Everything is Running

- **Frontend**: https://your-app.vercel.app (should show landing page)
- **Backend health**: https://your-backend.railway.app/health (should show JSON)

### 6.2 Register & Test

1. Go to your Vercel URL
2. Click **"Start Free Trial"**
3. Register account
4. Try to connect Gmail inbox
5. Create a test campaign
6. **Do NOT** use Stripe in test mode yet (you'll be charged)

---

## 🎯 Step 7: Enable Stripe Test Mode (Optional for Testing)

**Test payments without real charges:**

1. Go to Stripe Dashboard → **"Developers"** → **"API keys"**
2. At top, toggle **"Viewing test data"** → **ON**
3. Your `STRIPE_SECRET_KEY` should start with `sk_test_` (already in Railway)
4. Test checkout flow:
   - Login to your app
   - Go to Billing
   - Click upgrade → Should see test checkout
   - Use test card: `4242 4242 4242 4242` (any future date, any CVC)

---

## 🎯 Step 8: Domain (Optional but Recommended)

### Custom Domain for Frontend

1. Vercel → Your Project → **"Settings"** → **"Domains"**
2. Add your custom domain (e.g., `app.yourcompany.com`)
3. Vercel will give you DNS records to add to your domain
4. Add to your domain registrar (GoDaddy, Namecheap, etc.)
5. Wait 10-30 minutes for propagation

### Update All URLs

After having custom domain, update:
- Railway `FRONTEND_URL` → `https://app.yourcompany.com`
- Vercel `VITE_API_URL` → `https://your-backend.railway.app/api`
- Google OAuth redirect URI
- Stripe webhook endpoint

---

## 🎯 Step 9: Monitoring & Maintenance

### View Logs

**Railway Backend:**
- Railway → Project → Deployments → Click latest → **"Logs"**

**Vercel Frontend:**
- Vercel → Project → Deployments → Click latest → **"Functions"** tab for logs

### Database Management

**Supabase:**
- Go to https://supabase.com → Your project
- Left menu → **"Table Editor"** to view data
- **"SQL Editor"** to run queries

**Backup:**
- Supabase automatically backs up
- Manual backup: SQL Editor → `pg_dump` or use export

### Reset Redis (if needed)

Railway → Your Redis plugin → **"Console"** tab → Run:
```bash
redis-cli FLUSHALL
```

---

## 🎯 Step 10: Go Live Checklist

Before allowing real users:

- [ ] All environment variables set correctly
- [ ] Stripe in **Live mode** (toggle OFF test mode)
- [ ] Stripe webhook updated to production endpoint
- [ ] Google OAuth has production domain
- [ ] Custom domain configured (optional but professional)
- [ ] Backend logs monitored for errors
- [ ] Test with real email campaign (small batch)
- [ ] Set up error alerting (optional)
- [ ] Database backups enabled (Supabase does this automatically)
- [ ] HTTPS everywhere (both Railway and Vercel provide automatically)

---

## 💰 Cost Estimates (Free tiers cover a lot!)

| Service | Free Tier | Cost When Scaling |
|---------|-----------|-------------------|
| Railway (Backend) | $5/month credit (enough for small) | $5-20/month |
| Vercel (Frontend) | Free (unlimited) | $20-40/month for Pro |
| Supabase (Database) | 500MB free, 2GB paid $25/mo | $25/month for 8GB |
| Upstash (Redis) | 10K commands/day free | $0.20/mo for more |
| Stipe | 2.9% + $0.30 per transaction | Same rate, no monthly fee |

**Total startup cost: $0-25/month**

---

## 🆘 Troubleshooting

### Backend won't start on Railway
- Check logs → Look for error
- Common: `DATABASE_URL` format wrong, missing env vars
- Make sure `npm run build` completes successfully

### Frontend can't connect to API
- Check `VITE_API_URL` in Vercel env vars
- Must be `https://your-backend.railway.app/api` (no trailing slash)
- Redeploy frontend after updating env vars

### Stripe webhooks failing
- Check Railway logs for signature verification errors
- Make sure webhook secret matches exactly
- Test webhook in Stripe → "Send test webhook"

### Database errors
- In Railway, make sure PostgreSQL plugin is attached to your project
- Check `DATABASE_URL` format (should be from Railway plugin)
- Run `npx prisma migrate deploy` in Railway console

### Google OAuth not working
- Update redirect URI in Google Cloud Console
- Must be exactly: `https://your-backend.railway.app/api/auth/google/callback`
- Gmail API must be enabled

### "Cannot find module" errors
- Railway might have old build → Clear cache and redeploy
- Or manually trigger fresh build

---

## 📞 Need Help?

1. **Check logs first** - 90% of issues are visible in logs
2. **Verify variables** - Most issues are missing/wrong env vars
3. **Test locally with Docker** - If it works locally, config is the issue
4. **Read Railway/Vercel docs** - They have excellent troubleshooting

---

## 🎉 Success Checklist

- [ ] Backend deployed to Railway
- [ ] Frontend deployed to Vercel
- [ ] Database (Supabase) connected
- [ ] Redis (Upstash) connected
- [ ] Google OAuth configured for production domain
- [ ] Stripe webhook pointing to production endpoint
- [ ] Environment variables set correctly
- [ ] App loads on Vercel URL
- [ ] Can register and login
- [ ] Can connect Gmail inbox
- [ ] Can create campaign
- [ ] Test payment works (Stripe test mode)
- [ ] SSL certificates active (automatic)

**All done? Your SaaS is LIVE! 🎊**

---

## 📚 Additional Resources

- Railway Docs: https://docs.railway.app
- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs
- Stripe Docs: https://stripe.com/docs

---

**Remember:**
1. Never share your secrets (`.env` file)
2. Use environment variables in Railway/Vercel, not `.env` in production
3. Monitor logs regularly
4. Set up alerts (optional)
5. Keep dependencies updated (`npm audit`)

**You built a real SaaS platform. Congratulations! 🚀**
