# 🚀 Complete Setup Guide - Step by Step

**This guide is for non-technical users. Follow each step exactly.**

---

## 📋 What You'll Need

1. **GitHub account** (you have it: kgs2026-bit)
2. **Node.js installed** (check: open terminal, type `node --version`)
3. **PostgreSQL database** (we'll use free Supabase)
4. **Redis** (we'll use free Upstash)
5. **Google account** (for Gmail OAuth)
6. **Stripe account** (for payments)

---

## 🎯 Step 1: Create Repository on GitHub

1. Go to: https://github.com/kgs2026-bit
2. Click **"New"** button
3. Repository name: `saas_email_marketing`
4. **Check**: "Add a README file"
5. Click **"Create repository"**

---

## 🎯 Step 2: Install Prerequisites

### Install Node.js

1. Go to: https://nodejs.org
2. Download **LTS** version (not Current)
3. Run installer (keep all defaults)
4. **Verify**: Open new terminal, type:
   ```bash
   node --version
   ```
   Should show something like `v18.x.x` or `v20.x.x`

---

## 🎯 Step 3: Get PostgreSQL Database (FREE)

We'll use **Supabase** (free tier):

1. Go to: https://supabase.com
2. Click **"Start your project"**
3. Sign up with GitHub
4. Click **"New Project"**
5. Fill in:
   - **Organization**: Choose or create
   - **Project name**: `email-saas-db`
   - **Database Password**: Create strong password (SAVE IT!)
   - **Region**: Choose closest to you
6. Click **"Create new project"**
7. Wait 1-2 minutes for database to create

**Copy your Database URL:**

1. In Supabase dashboard, go to **Settings** (gear icon) → **Database**
2. Scroll to **"Connection string"**
3. Click **"URI"** tab
4. Copy the connection string (looks like):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```
5. **Save this** - you'll need it later

---

## 🎯 Step 4: Get Redis (FREE)

We'll use **Upstash** (free tier):

1. Go to: https://upstash.com
2. Click **"Sign Up"** (use GitHub)
3. After login, click **"Create Database"**
4. Fill in:
   - **Team**: Default
   - **Region**: Choose closest
5. Click **"Create Database"**
6. Wait 30 seconds

**Copy your Redis URL:**

1. In Upstash console, go to your database
2. Click **"Settings"** tab
3. Under **"Connection"**, copy the **"REDIS REST URL"**
4. It looks like: `https://us1-abc123.upstash.io:6379`
5. **Save this** - you'll need it

---

## 🎯 Step 5: Google OAuth Setup

1. Go to: https://console.cloud.google.com
2. Click **"Create Project"** or select existing
   - Name: `Email SaaS`
3. Click **"Create"** and wait

4. **Enable Gmail API:**
   - In left menu, click **"APIs & Services"** → **"Library"**
   - Search "Gmail API"
   - Click it → Click **"Enable"**

5. **Create OAuth Credentials:**
   - Left menu → **"APIs & Services"** → **"Credentials"**
   - Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
   - Application type: **"Web application"**
   - Name: `Email SaaS`
   - **Authorized redirect URIs**: Add this EXACT:
     ```
     http://localhost:3001/api/auth/google/callback
     ```
   - Click **"Create"**
6. **Copy these:**
   - **Client ID**
   - **Client Secret**
7. **Save both** - you'll need them

---

## 🎯 Step 6: Stripe Setup (for payments)

1. Go to: https://dashboard.stripe.com
2. Sign up (use same email as your Supabase/Google if possible)
3. Verify your email

4. **Get API Keys:**
   - Left menu → **"Developers"** → **"API keys"**
   - Copy **"Secret key"** (starts with `sk_test_`)
   - **Save it**

5. **Create Products & Prices:**
   - Left menu → **"Products"**
   - Click **"+ Add product"**

   **Product 1 - Starter:**
   - Name: `Starter`
   - Description: `Email Automation Starter Plan`
   - Pricing: One-time/Monthly → `$19.00`
   - Click **"Save product"**
   - Copy the **Price ID** (starts with `price_`)
   - **Save as `STRIPE_PRICE_STARTER`**

   Repeat for:
   - **Product 2 - Growth**: `$49.00` → Save as `STRIPE_PRICE_GROWTH`
   - **Product 3 - Pro**: `$99.00` → Save as `STRIPE_PRICE_PRO`

6. **Create Webhook Endpoint:**
   - Left menu → **"Developers"** → **"Webhooks"**
   - Click **"+ Add endpoint"**
   - Endpoint URL (for now, local testing):
     ```
     http://localhost:3001/api/webhooks/stripe
     ```
   - Select events:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
   - Click **"Add endpoint"**
   - **Copy the "Signing secret"** (starts with `whsec_`)
   - **Save it**

---

## 🎯 Step 7: Setup Environment Variables

We need to create a `.env` file with all your secrets.

**In your project folder** (`C:\Users\IBALL\Desktop\Email Marketing tool`):

1. Open **backend** folder
2. Copy `.env.example` to `.env`:
   ```bash
   # On Windows PowerShell:
   Copy-Item ".env.example" ".env"

   # Or manually: create new file named ".env" and copy contents from ".env.example"
   ```
3. **Edit `.env`** with your actual values:

```env
# Database (from Supabase)
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres"

# JWT Secrets (generate random strings - use website: https://www.uuidgenerator.net/version4)
JWT_SECRET="any-32-random-characters-secure-secret-key"
JWT_REFRESH_SECRET="another-32-random-characters-different-secret"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Google OAuth (from Step 5)
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_CALLBACK_URL="/api/auth/google/callback"

# Stripe (from Step 6)
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_signing_secret"
STRIPE_PRICE_STARTER="price_your_price_id_for_starter"
STRIPE_PRICE_GROWTH="price_your_price_id_for_growth"
STRIPE_PRICE_PRO="price_your_price_id_for_pro"

# Redis (from Upstash Step 4)
REDIS_URL="rediss://default:YOUR_PASSWORD@us1-abc123.upstash.io:6379"

# App Settings
NODE_ENV="development"
PORT="3001"
FRONTEND_URL="http://localhost:5173"
API_URL="http://localhost:3001"

# For sending password reset emails (optional - use your Gmail)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-gmail-app-password"

# Encryption key (32 chars)
ENCRYPTION_KEY="32-char-encryption-key-change-this"

# Tracking domain
TRACKING_DOMAIN="http://localhost:3001"
OPEN_TRACKING_ENABLED="true"
CLICK_TRACKING_ENABLED="true"
```

**Important:**
- Replace `YOUR_PASSWORD` with your actual database password from Supabase
- For `JWT_SECRET` and `JWT_REFRESH_SECRET`, use any random 32+ character strings (can copy from https://www.uuidgenerator.net/)
- For `ENCRYPTION_KEY`, use any 32-character string
- Replace all Stripe placeholders with actual values from Stripe
- Replace Redis URL with your Upstash URL and password

---

## 🎯 Step 8: Install & Run with Docker (Easiest)

If you have **Docker Desktop** installed:

```bash
# In your project folder
docker-compose up
```

This will start:
- PostgreSQL on port 5432
- Redis on port 6379
- Backend API on port 3001
- Frontend on port 5173

**Wait 30 seconds** for databases to initialize.

**Open browser:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001/health (should show `{"status":"ok"}`)

---

## 🎯 Step 9: Install & Run WITHOUT Docker

If you don't have Docker:

### 9a. Start Redis

If you have Redis installed:
```bash
redis-server
```

If not, you can skip Redis for now and use in-memory queue (edit `backend/src/queues/index.ts` to comment out Redis parts).

### 9b. Start PostgreSQL

Make sure PostgreSQL is running (Supabase is already running in cloud).

### 9c. Install Dependencies

```bash
# From project root
npm install

# Install backend dependencies
cd backend
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# (Optional) Seed demo data
npx prisma db seed

# Go back to root
cd ..

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 9d. Start Both Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

---

## 🎯 Step 10: Test It Works

1. Open http://localhost:5173
2. You should see the **landing page** with "Automate Your Cold Email Outreach"
3. Click **"Start Free Trial"**
4. Fill in registration form
5. Click **"Create account"**
6. You should be redirected to **Dashboard**

**Success!** The platform is working.

---

## 🎯 Step 11: Connect to GitHub

### Push Your Code

1. Open terminal in project folder
2. Initialize git (if not already):
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Email SaaS platform"
   ```
3. Connect to your GitHub repo:
   ```bash
   git remote add origin https://github.com/kgs2026-bit/saas_email_marketing.git
   git branch -M main
   git push -u origin main
   ```

---

## 🎯 Step 12: Deploy to Production (Optional)

### Deploy Backend to Railway

1. Go to https://railway.app
2. Sign up with GitHub
3. Click **"New Project"** → **"Deploy from GitHub repo"**
4. Select `saas_email_marketing`
5. Select **backend** folder as root
6. Add **PostgreSQL** plugin
7. Add **Redis** plugin (or use Upstash)
8. Set **Environment Variables** (same as your `.env`)
9. Click **"Deploy"**

### Deploy Frontend to Vercel

1. Go to https://vercel.com
2. Sign up with GitHub
3. Click **"New Project"**
4. Import `saas_email_marketing`
5. Set:
   - **Root directory**: `frontend`
   - **Environment Variable**: `VITE_API_URL=https://your-backend.railway.app/api`
6. Click **"Deploy"**

---

## 🔧 Important Configuration

After deployment, you MUST:

### 1. Update Google OAuth

- Go back to Google Cloud Console
- Edit OAuth client
- Add new redirect URI:
  ```
  https://your-frontend.vercel.app/auth/callback
  ```
- Save

### 2. Update Stripe Webhook

- In Stripe Dashboard → Webhooks
- Add new endpoint:
  ```
  https://your-backend.railway.app/api/webhooks/stripe
  ```
- Same events as before
- Copy new webhook secret to your production `.env`

### 3. Update Frontend API URL

- In Vercel dashboard, set `VITE_API_URL` to your Railway backend URL

---

## 🛠️ Common Issues & Fixes

### "Database connection error"
- Check `DATABASE_URL` in `.env`
- Make sure Supabase database is running
- Check if IP restrictions are blocking (Supabase: disable "Require SSL"?)

### "Redis connection refused"
- Check `REDIS_URL` in `.env`
- Make sure Upstash database is active
- Use `rediss://` for TLS connection

### "Module not found" errors
```bash
cd backend
rm -rf node_modules package-lock.json
npm install

cd ../frontend
rm -rf node_modules package-lock.json
npm install
```

### Ports already in use
Change `PORT` in `.env` (e.g., `3002`) and restart.

### Docker issues
```bash
# Rebuild
docker-compose down
docker-compose build --no-cache
docker-compose up
```

---

## 📱 What to Do After Setup

1. **Register** at your localhost frontend
2. **Create workspace** (automatic)
3. **Connect inbox** → Use **Google OAuth** (recommended)
4. **Create campaign** → Add 2-3 steps
5. **Add contacts** → Manual or CSV upload
6. **Start campaign** → Watch emails send!
7. **View analytics** → Track opens/clicks

---

## 🆘 Need Help?

1. **Check logs:**
   ```bash
   # Backend logs
   cd backend
   tail -f logs/combined.log
   ```

2. **Test API:**
   ```bash
   curl http://localhost:3001/health
   ```

3. **Reset database:**
   ```bash
   cd backend
   npx prisma migrate reset --force
   ```

4. **Clear Redis:**
   ```bash
   redis-cli FLUSHALL
   ```

---

## 📚 Files Structure

```
Email Marketing tool/
├── backend/              # Node.js API server
│   ├── src/
│   │   ├── routes/      # All API endpoints
│   │   ├── services/    # Business logic
│   │   ├── middleware/  # Auth, rate limiting
│   │   └── config/      # Database, passport
│   ├── prisma/
│   │   └── schema.prisma # Database structure
│   ├── Dockerfile
│   └── .env             # YOUR SECRETS FILE
├── frontend/             # React app
│   ├── src/
│   │   ├── pages/       # All pages
│   │   ├── components/  # UI components
│   │   └── stores/      # State management
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml   # Start everything at once
├── package.json         # Root (workspaces)
└── README.md           # Full documentation

```

---

## ✅ Checklist

- [ ] Node.js installed
- [ ] Supabase database created
- [ ] Upstash Redis created
- [ ] Google OAuth credentials
- [ ] Stripe account & API keys
- [ ] All environment variables set in `backend/.env`
- [ ] Dependencies installed (`npm install`)
- [ ] Prisma client generated (`npx prisma generate`)
- [ ] Database migrated (`npx prisma migrate dev`)
- [ ] App running (`docker-compose up` or `npm run dev`)
- [ ] Can access http://localhost:5173
- [ ] Can register and login
- [ ] Push to GitHub successful

---

## 🎉 You're Ready!

Once all checklist items are done, your SaaS platform is ready to:
- Accept users
- Send automated emails
- Process payments via Stripe
- Track analytics
- Scale to thousands of emails

**Take your time with each step. Double-check environment variables as they're the most common source of issues.**

Need help? Check the main README.md for detailed API docs and troubleshooting.
