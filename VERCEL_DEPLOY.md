# 🚀 Deploy to Vercel in 5 Minutes

**Super simple guide. Just copy-paste, click buttons.**

---

## 📋 What You Need

1. **GitHub repository** (you have: `kgs2026-bit/saas_email_marketing`)
2. **Vercel account** (free)

---

## ✅ Step 1: Push Code to GitHub

If you haven't pushed yet, run these commands in **Command Prompt**:

```cmd
cd "C:\Users\IBALL\Desktop\Email Marketing tool"
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/kgs2026-bit/saas_email_marketing.git
git branch -M main
git push -u origin main
```

**Or use the GitHub website:**
1. Go to https://github.com/kgs2026-bit/saas_email_marketing
2. Click "upload an existing file"
3. Drag the entire "Email Marketing tool" folder
4. Click "Commit changes"

---

## ✅ Step 2: Deploy to Vercel (2 minutes)

### 2.1 Sign up / Log in

1. Go to: https://vercel.com
2. Click **"Sign Up"**
3. Choose **"Continue with GitHub"**
4. Authorize Vercel

### 2.2 Import Project

1. Click **"Add New..."** → **"Project"**
2. Select repository: **`saas_email_marketing`**
3. Click **"Import"**

### 2.3 Configure Project

**Important settings:**

- **Root Directory**: Keep as is (it will detect both backend/frontend)
- **Build and Output Settings**:
  - Vercel should auto-detect
  - If not, manually configure:

```
Framework Preset: Other
Build Command: npm install && npm run build
Output Directory: frontend/dist
```

### 2.4 Environment Variables

Click **"Environment Variables"** and add these:

**Name:** `VITE_API_URL`
**Value:** `https://your-backend.railway.app/api` ← Change this later

For now, you can leave it as a placeholder. We'll update it later.

### 2.5 Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes
3. Vercel gives you a URL like: `https://saas-email-marketing.vercel.app`

**🎉 Your frontend is live!**

---

## ⚠️ Step 3: Deploy Backend (Needed for Full Functionality)

The frontend is ready, but to send real emails and process payments, you need the **backend**.

### Easiest Way: Railway (Free)

1. Go to: https://railway.app
2. Sign up with GitHub
3. Click **"New Project"**
4. Click **"Deploy from GitHub repo"**
5. Select: `saas_email_marketing`
6. **Root directory**: Type `/backend` (very important!)
7. Click **"Deploy"**

**Add Database & Redis:**

Railway will automatically add PostgreSQL. You also need to add Redis:
1. In your project, click **"+"** → **"Database"** → **"Redis"**
2. Wait 30 seconds for it to provision

**Set Environment Variables:**

Go to your Railway project → **"Variables"** tab → Add these:

```
DATABASE_URL=postgresql://postgres:[PASSWORD]@containers.us-west-2.railway.app:6543/railway
# Use the connection string from your PostgreSQL plugin in Railway
# Format is usually: postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/railway

JWT_SECRET=your-random-32-char-string-here
JWT_REFRESH_SECRET=another-random-32-char-string
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
REDIS_URL=rediss://default:[PASSWORD]@redis.railway.app:6379
# Use connection string from your Redis plugin

NODE_ENV=production
PORT=3001
FRONTEND_URL=https://your-app.vercel.app
API_URL=https://your-backend.railway.app

ENCRYPTION_KEY=another-32-char-string
TRACKING_DOMAIN=https://your-backend.railway.app
```

**Where to get values:**
- `DATABASE_URL`: Railway PostgreSQL plugin → Connection tab → URI
- `REDIS_URL`: Railway Redis plugin → Connection tab
- `GOOGLE_*`: From Google Cloud Console (see below)
- JWT/ENCRYPTION: Generate random strings (https://www.uuidgenerator.net/version4)

**Deploy:**

Railway auto-deploys when you push or when you first create the project.

**Get your backend URL:**
- At top of Railway dashboard: `https://your-project.railway.app`

---

## 🔄 Step 4: Connect Everything

### 4.1 Update Vercel with Backend URL

1. Go to Vercel dashboard
2. Your project → **Settings** → **Environment Variables**
3. Update `VITE_API_URL` to: `https://your-backend.railway.app/api`
4. Redeploy: **Deployments** → **"..."** → **"Redeploy"**

### 4.2 Update Google OAuth

1. Go to: https://console.cloud.google.com
2. Your project → **APIs & Services** → **Credentials**
3. Click your OAuth 2.0 Client
4. Add redirect URI:
   ```
   https://your-backend.railway.app/api/auth/google/callback
   ```
5. Save

### 4.3 Update Stripe Webhook

1. Go to: https://dashboard.stripe.com
2. Developers → **Webhooks**
3. Edit your endpoint
4. Change URL to:
   ```
   https://your-backend.railway.app/api/webhooks/stripe
   ```
5. Save

---

## ✅ Step 5: Test Everything

1. **Frontend**: `https://your-app.vercel.app`
   - Should load landing page
   - Can register/login

2. **Backend**: `https://your-backend.railway.app/health`
   - Should show: `{"status":"ok"}`

3. **Test flow:**
   - Register account
   - Try Google login (if configured)
   - Create campaign
   - Add contact
   - Start campaign (emails won't actually send without Gmail setup, but UI works)

---

## 🆘 If Something Doesn't Work

### Backend fails to start on Railway
- Check **Logs** tab in Railway project
- Most likely: missing environment variable
- Verify all `VARIABLES` are set correctly

### Frontend can't connect to backend
- Verify `VITE_API_URL` in Vercel points to correct Railway URL
- Redeploy frontend after updating env var

### CORS error
- Make sure `FRONTEND_URL` in Railway backend is set to your Vercel URL
- Redeploy backend after changing

### Database error
- Wait 2 minutes for Railway PostgreSQL to fully provision
- Check `DATABASE_URL` format (copy exactly from Railway)

---

## 🎉 You're Done!

After following these steps, you have:
- ✅ Frontend on Vercel (https://your-app.vercel.app)
- ✅ Backend on Railway (https://your-backend.railway.app)
- ✅ Database on Railway PostgreSQL
- ✅ Redis on Railway Redis
- ✅ Ready for real users!

---

## 📋 Quick Checklist

- [ ] Code pushed to GitHub
- [ ] Vercel project created (frontend)
- [ ] Railway project created (backend)
- [ ] Railway PostgreSQL attached
- [ ] Railway Redis attached
- [ ] All environment variables set in Railway
- [ ] Vercel `VITE_API_URL` set to Railway backend
- [ ] Google OAuth redirect added
- [ ] Stripe webhook URL updated
- [ ] Frontend loads
- [ ] Can register/login
- [ ] Can create campaign

---

## 💡 Next Steps

1. **Configure Google OAuth** for real emails
2. **Set up Stripe** for payments
3. **Test with your own email** first
4. **Invite beta testers**
5. **Monitor logs** for errors
6. **Custom domain** (optional, Vercel/Railway support)

---

## 📖 Need Help?

**Most common issues:**
1. **"Cannot find module"** → Wait 5 minutes, Railway is still installing
2. **Database error** → Check `DATABASE_URL` matches Railway's exactly
3. **404 on API** → Verify backend URL in Vercel `VITE_API_URL`
4. **CORS error** → Check `FRONTEND_URL` in Railway env vars

**Check logs:**
- Railway: Project → Deployments → Latest → Logs
- Vercel: Project → Deployments → Latest → Functions

---

## 🎯 Simplified Version (If You Just Want UI)

If you want to see the UI **RIGHT NOW** without any setup:

1. Open this file location: `C:\Users\IBALL\Desktop\Email Marketing tool\frontend`
2. Double-click `index.html` (might work partially)
3. Or use Python (see DEMO_README.md)

**Best option:** Just push to Vercel - it literally takes 5 minutes and you get a live URL to share!

---

**Need help with a specific step? Tell me which step you're on and I'll walk you through it!**
