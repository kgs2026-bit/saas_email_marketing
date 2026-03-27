# 🚀 QUICK START - Get Running in 15 Minutes

**No technical knowledge needed. Just follow these steps exactly.**

---

## 📍 Before You Start

You should have:
- [x] Node.js installed (check: open terminal → `node --version`)
- [x] Docker Desktop installed (recommended) OR able to run commands

If not Node.js: https://nodejs.org (download LTS version)
If not Docker: https://www.docker.com/products/docker-desktop

---

## ⚡ FASTEST METHOD (Using Docker - Recommended)

**This starts everything with one command.**

### Step 1: Copy Environment Template

```bash
# In your project folder
cd backend
Copy-Item ".env.example" ".env"  # Windows PowerShell
# OR: cp .env.example .env  # Mac/Linux
```

### Step 2: Get Free Services (15 min total)

**You need these FREE accounts:**

1. **Supabase** (Free PostgreSQL database, 10 min)
   - https://app.supabase.com/project-new
   - Create project → Copy **Database URL**
   - Paste in `backend/.env` at `DATABASE_URL=`

2. **Upstash** (Free Redis, 5 min)
   - https://console.upstash.com/redis
   - Create database → Copy **REDIS REST URL**
   - Paste in `backend/.env` at `REDIS_URL=`

3. **Google Cloud** (Gmail OAuth, 10 min)
   - https://console.cloud.google.com
   - Create project → Enable Gmail API
   - Create OAuth credentials → Copy **Client ID & Secret**
   - Paste in `backend/.env` at `GOOGLE_CLIENT_ID=` and `GOOGLE_CLIENT_SECRET=`

4. **Stripe** (Payments, 5 min)
   - https://dashboard.stripe.com/apikeys
   - Copy **Secret key** → `STRIPE_SECRET_KEY=`
   - Go Products → Create 3 products ($19, $49, $99) → Copy Price IDs → `STRIPE_PRICE_*`
   - Go Developers → Webhooks → Add endpoint: `http://localhost:3001/api/webhooks/stripe`
   - Copy **Signing secret** → `STRIPE_WEBHOOK_SECRET=`

### Step 3: Generate Secrets (2 min)

For `JWT_SECRET` and `JWT_REFRESH_SECRET` and `ENCRYPTION_KEY`:

- Use https://www.uuidgenerator.net/version4
- Copy any UUID (32 characters)
- Paste these 3 times with different values

Example:
```
JWT_SECRET="a1b2c3d4-e5f6-7890-abcd-ef1234567890"
JWT_REFRESH_SECRET="b2c3d4e5-f6a7-8901-bcde-f23456789012"
ENCRYPTION_KEY="c3d4e5f6-a7b8-9012-cdef-345678901234"
```

### Step 4: Start Everything

```bash
# In your project folder
docker-compose up
```

**Wait 30 seconds** for everything to start.

### Step 5: Test It

Open browser → http://localhost:5173

You should see the landing page with "Automate Your Cold Email Outreach".

Click "Start Free Trial" → Register → See dashboard.

**🎉 You're done!**

---

## 🔧 IF Docker Doesn't Work (Alternative)

### 1. Start PostgreSQL & Redis manually

If you have them installed:
```bash
# Terminal 1: PostgreSQL (if you have it locally)
# If using Supabase (cloud), skip - it's already running

# Terminal 2: Redis
redis-server
```

### 2. Install and Run Backend

```bash
cd backend

# Install
npm install

# Generate Prisma
npx prisma generate

# Run migrations
npx prisma migrate dev

# Start backend
npm run dev
```

### 3. Install and Run Frontend (new terminal)

```bash
cd frontend

# Install
npm install

# Start frontend
npm run dev
```

Open browser → http://localhost:5173

---

## 🎯 What to Do After It's Running

### 1. Register an Account
- Go to http://localhost:5173/register
- Create account (email/password or use Google)

### 2. Connect Gmail Inbox
- Login → Click "Inboxes" in sidebar
- Click "Add Inbox"
- Choose "Gmail" and click "Connect with Google"
- Authorize → Done!

### 3. Create First Campaign
- Click "Campaigns" → "New Campaign"
- Fill in: Name, From Name, From Email, Subject, Body
- Add 2-3 steps (use "Add Step")
- Save

### 4. Add Contacts
- Click "Contacts"
- "Add Contacts" → Fill in email, name, company
- Or "Upload CSV" (use a simple CSV with email,firstName,lastName)

### 5. Start Campaign
- Go to campaign detail
- Click "Start"
- Watch emails queue and send!

---

## 🆘 Troubleshooting

### "Module not found" errors
```bash
cd backend
rm -rf node_modules
npm install
cd ../frontend
rm -rf node_modules
npm install
```

### Database connection error
- Check `DATABASE_URL` in `.env`
- Make sure Supabase project is active
- Test connection: `psql "your-url-here"`

### Redis error
- Check `REDIS_URL` in `.env`
- For Upstash: use `rediss://` (with SSL)
- Test: `redis-cli ping` should return `PONG`

### Port already in use
Change `PORT=3001` to `PORT=3002` in `.env` and restart.

### Docker images won't build
```bash
docker-compose down
docker system prune -f
docker-compose build --no-cache
docker-compose up
```

### "Cannot find module '@prisma/client'"
```bash
cd backend
npx prisma generate
```

---

## 📖 Next Steps

1. **Read SETUP.md** for details on:
   - Production deployment
   - Stripe webhook configuration
   - Google OAuth for production
   - Security checklist

2. **Test all features:**
   - [ ] User registration/login
   - [ ] Google OAuth login
   - [ ] Create workspace
   - [ ] Add inbox (Gmail)
   - [ ] Create campaign with 3 steps
   - [ ] Add 5 contacts
   - [ ] Start campaign
   - [ ] Send test email to yourself
   - [ ] Check analytics
   - [ ] View open/click tracking

3. **Deploy to production** (see DEPLOYMENT.md):
   - Backend: Railway/Render
   - Frontend: Vercel
   - Database: Supabase/Neon
   - Redis: Upstash

---

## 📞 Quick Reference

**Local URLs:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- Health check: http://localhost:3001/health

**Docker commands:**
```bash
docker-compose up          # Start everything
docker-compose down       # Stop everything
docker-compose logs -f    # View logs
docker-compose build      # Rebuild images
```

**Database commands:**
```bash
cd backend
npx prisma migrate dev    # Run new migrations
npx prisma studio         # Open database GUI (http://localhost:5555)
npx prisma db seed        # Seed demo data
```

---

## ✅ You Got This!

The platform is fully built. You just need to:
1. Get the free services (15 min)
2. Fill in credentials (5 min)
3. Start it up (2 min)

**Total time: ~25 minutes to a running SaaS platform!**

---

## 📚 More Documentation

- **README.md** - Full docs, API reference
- **SETUP.md** - Detailed setup with explanations
- **backend/README.md** - Backend-specific info

Problems? Check logs first:
```bash
docker-compose logs backend    # Backend logs
docker-compose logs frontend   # Frontend logs
```
