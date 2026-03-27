# 📊 System Architecture - Simple Explanation

## 🏗️ How It All Fits Together

```
┌─────────────────────────────────────────────────────────────────┐
│                         YOUR USERS                               │
│  (Sales teams, marketers, companies)                           │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React App)                         │
│  • Landing Page                                                │
│  • Dashboard                                                  │
│  • Campaign Builder                                           │
│  • Analytics                                                 │
│  • Settings                                                  │
│                                                                │
│  Hosted: Vercel (https://your-app.vercel.app)                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
               API Calls (HTTPS)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (Node.js API)                       │
│  • User Authentication (JWT + Google OAuth)                   │
│  • Workspace Management (Multi-tenant)                        │
│  • Campaign Logic                                             │
│  • Email Sending Service                                     │
│  • Stripe Billing                                            │
│  • Analytics                                                │
│                                                                │
│  Hosted: Railway (https://your-backend.railway.app)           │
└────────────────────────────┬────────────────────────────────────┘
                             │
                ┌────────────┴────────────┐
                ▼                         ▼
    ┌─────────────────────┐  ┌────────────────────────┐
    │   PostgreSQL        │  │   Redis (Queue)        │
    │   (Supabase)        │  │   (Upstash)            │
    │                     │  │                        │
    │  • Users            │  │  • Pending emails     │
    │  • Workspaces       │  │  • Campaign jobs      │
    │  • Campaigns        │  │  • Schedules          │
    │  • Contacts         │  │  • Retry failed jobs  │
    │  • Email logs       │  │                        │
    │  • Subscriptions    │  └──────────┬─────────────┘
    └─────────────────────┘             │
                                        │
                                        ▼
                             ┌────────────────────────┐
                             │   Email Workers        │
                             │   (BullMQ Workers)     │
                             │                        │
                             │  • Pull jobs from     │
                             │    Redis queue        │
                             │  • Send emails via    │
                             │    Nodemailer         │
                             │  • Track opens/clicks │
                             │  • Update database    │
                             └──────────┬─────────────┘
                                        │
                                        ▼
                             ┌────────────────────────┐
                             │   Email Providers      │
                             │                        │
                             │  • Gmail (OAuth2)      │
                             │  • Any SMTP server     │
                             └────────────────────────┘
```

---

## 🔄 Data Flow Example: Sending a Campaign Email

### 1. User creates campaign
```
Frontend → Backend API → Database (store campaign)
```

### 2. User adds contacts
```
Frontend → Backend API → Database (store contacts)
```

### 3. User hits "Start Campaign"
```
Frontend → Backend API
   ↓
CampaignService.startCampaign()
   ↓
For each contact:
   Create job in Redis queue
   (emailQueue.add('SEND_CAMPAIGN_EMAIL', ...))
   ↓
Database: status = PENDING
```

### 4. Worker picks up job
```
Email Worker (background process)
   ↓
job.data = { campaignId, contactId, workspaceId }
   ↓
Fetch from database:
   - Campaign details (steps, from email)
   - Contact details (name, email)
   - Select healthy inbox (rotate)
   ↓
Process spintax: {{firstName}} → actual name
   ↓
Add random delay (human-like)
   ↓
Send email via Nodemailer
   ↓
Log to database: EmailLog (type: SENT)
   ↓
Update inbox: sentCountToday++
   ↓
If more steps remaining:
   Schedule next job with delay
   (emailQueue.add with delay)
```

### 5. Tracking email open
```
Recipient opens email
   ↓
<img src="https://your-backend/track/open/TRACKING_ID" />
   ↓
GET /track/open/:trackingId
   ↓
Find EmailLog by trackingId
   ↓
Update: openedAt = now, type = OPENED
   ↓
Return 1x1 transparent pixel
```

### 6. Analytics
```
User views Analytics page
   ↓
Frontend → GET /api/analytics/overview
   ↓
Aggregate EmailLogs
   ↓
Calculate rates: openRate, clickRate, replyRate
   ↓
Return JSON → Display charts
```

---

## 🔐 Authentication Flow

### Email/Password Registration
```
Frontend: User enters email/password
   ↓
POST /api/auth/register
   ↓
1. Check if email exists
2. Hash password (bcrypt)
3. Create User + Workspace (transaction)
4. Create WorkspaceMember (role: ADMIN)
5. Generate JWT token
6. Return { user, workspace, accessToken, refreshToken }
   ↓
Frontend stores tokens in localStorage
   ↓
User is now logged in
```

### Google OAuth Flow
```
Frontend: Click "Sign in with Google"
   ↓
GET /api/auth/google
   ↓
Passport.js redirects to Google
   ↓
User logs in on Google
   ↓
Google redirects to callback URL with code
   ↓
Passport exchanges code for access token
   ↓
GET user profile from Google
   ↓
Find or create User in database
   ↓
Create Workspace if new user
   ↓
Generate JWT tokens
   ↓
Redirect to frontend: /auth/callback?token=xxx
   ↓
Frontend stores tokens, redirects to dashboard
```

### Token Refresh
```
Access token expires (15 minutes)
   ↓
API call returns 401
   ↓
Frontend intercepts 401
   ↓
POST /api/auth/refresh with refreshToken
   ↓
Verify refresh token in DB (Session table)
   ↓
Generate new access token + new refresh token
   ↓
Return { accessToken, refreshToken }
   ↓
Frontend updates localStorage
   ↓
Retry original API call
```

---

## 💳 Billing Flow with Stripe

### User upgrades plan
```
Frontend: Click "Upgrade to Starter"
   ↓
POST /api/billing/create-checkout-session
   ↓
1. Get/create Stripe Customer
2. Create Stripe Checkout Session
   - customer: (from Stripe or create new)
   - line_items: [{ price: STRIPE_PRICE_STARTER }]
   - mode: subscription
   - success_url: /workspace/:slug/billing?success=true
   - cancel_url: /workspace/:slug/billing?canceled=true
   - metadata: { workspaceId, userId }
   ↓
Return { sessionId, url }
   ↓
Frontend: redirect to Stripe checkout URL
   ↓
User enters payment on Stripe
   ↓
Stripe processes payment
   ↓
Stripe sends webhook to /api/webhooks/stripe
   ↓
handleCheckoutSessionCompleted()
   ↓
Update workspace.plan = STARTER
Create Subscription record
   ↓
User sees success on return to app
```

### Stripe webhook events we handle:
- `checkout.session.completed` → Upgrade plan immediately
- `customer.subscription.updated` → Handle plan changes, cancellations
- `customer.subscription.deleted` → Downgrade to FREE
- `invoice.payment_succeeded` → Extend subscription period
- `invoice.payment_failed` → Mark as PAST_DUE

---

## 🗄️ Database Structure (Key Tables)

```
users
  id, email, name, passwordHash, googleId, avatarUrl

workspaces
  id, name, slug, ownerId, plan, stripeCustomerId, stripeSubscriptionId

workspace_members
  userId, workspaceId, role (ADMIN/MEMBER)

campaigns
  id, workspaceId, name, slug, fromName, fromEmail, subject,
  status (DRAFT/ACTIVE/PAUSED/COMPLETED),
  sendingWindowStart/End, minDelay, maxDelay, stopOnReply

campaign_steps
  campaignId, stepNumber, subject, body,
  delayHours, delayDays, delayMinutes, isEnabled

contacts
  id, workspaceId, email, firstName, lastName, fullName,
  company, position, status

campaign_contacts
  campaignId, contactId, status (PENDING/IN_PROGRESS/COMPLETED/STOPPED),
  lastSentAt, nextSendAt

inboxes
  id, workspaceId, email, provider (GMAIL/SMTP),
  encryptedCreds, oauthToken, refreshToken,
  dailyLimit, sentCountToday, lastSentAt, isActive, healthScore

email_logs
  id, workspaceId, campaignId, inboxId, contactId, stepId,
  type (SENT/OPENED/CLICKED/BOUNCED/REPLY),
  sentAt, openedAt, clickedAt, bouncedAt, replyDetectedAt,
  trackingId, messageId

subscriptions
  id, workspaceId, stripeCustomerId, stripeSubscriptionId,
  plan, status, currentPeriodStart, currentPeriodEnd, cancelAtPeriodEnd
```

---

## 🔄 Queue System (BullMQ)

### Why we need queues:
- Campaigns may send 10,000+ emails
- Don't want to block HTTP requests
- Need retry logic for failed emails
- Need to schedule delays between emails

### How queues work:

```
Redis stores:
  email-queue:waiting         ← Jobs waiting to be sent
  email-queue:active          ← Jobs currently being processed
  email-queue:delayed         ← Scheduled for future
  email-queue:failed          ← Jobs that failed

Worker processes:
  1. Pull job from Redis queue
  2. Execute sendEmailJob(data)
  3. If success → remove from queue
  4. If fail → requeue (max 3 attempts with exponential backoff)
  5. After 3 fails → move to failed queue
```

### Job types:
- `SEND_EMAIL` - Single email send
- `SEND_CAMPAIGN_EMAIL` - Part of campaign sequence
- `START_CAMPAIGN` - Triggered when user clicks "Start"
- `PROCESS_REPLY` - Check inbox for replies

---

## 🔐 Security Layers

1. **JWT Authentication** - All API routes except public ones require valid token
2. **Workspace Middleware** - Every request checks user has access to that workspace
3. **Rate Limiting** - Prevent abuse (100 requests/15min, 5 login attempts/hour)
4. **Encryption** - Email credentials encrypted with AES-256-GCM
5. **SQL Injection Prevention** - Prisma ORM parameterized queries
6. **CORS** - Only allow frontend origin
7. **Helmet** - Security headers
8. **Plan Limits** - Middleware checks user hasn't exceeded plan limits
9. **Role Checks** - Admin-only routes protected

---

## 📈 Scalability Considerations

### Horizontal Scaling
- **Backend**: Railway can auto-scale (run multiple instances)
- **Redis**: Upstash handles partitioning
- **Database**: Supabase/Neon can scale (consider connection pooling)

### Optimizations for Scale:
1. **Connection pooling** (already in Prisma)
2. **Redis for sessions** (instead of database)
3. **Queue batching** - Process multiple emails per job
4. **Inbox rotation** - Distribute load across inboxes
5. **Health scoring** - Route emails to healthiest inboxes
6. **Rate limiting** - Prevent abuse

### Bottlenecks to watch:
- **Database queries** - Add indexes on foreign keys
- **Redis memory** - Monitor queue size
- **Email provider limits** - Gmail has daily limits (~1500/day for most accounts)
- **Network I/O** - Bulk sending can hit SMTP rate limits

---

## 📱 Frontend Architecture

### State Management (Zustand)
```
AuthStore:
  - user
  - workspaces[]
  - currentWorkspace
  - isAuthenticated
  - login(), logout(), register()

Persistence: localStorage
```

### API Layer (Axios)
```
api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { Authorization: `Bearer ${token}` }
})

Interceptor:
  - 401 → try refresh token
  - If refresh fails → logout
```

### Routing (React Router v6)
```
/                → LandingPage
/login           → LoginPage (redirect if auth)
/register        → RegisterPage (redirect if auth)
/dashboard       → ProtectedRoute + Layout + DashboardPage
/campaigns       → ProtectedRoute + Layout + CampaignsPage
/campaigns/:id   → ProtectedRoute + Layout + CampaignDetailPage
/inboxes         → ProtectedRoute + Layout + InboxesPage
/contacts        → ProtectedRoute + Layout + ContactsPage
/analytics       → ProtectedRoute + Layout + AnalyticsPage
/team            → ProtectedRoute + Layout + TeamPage
/billing         → ProtectedRoute + Layout + BillingPage
/settings        → ProtectedRoute + Layout + SettingsPage
```

---

## 🎯 What Happens When Something Fails

### Email sending fails (SMTP error)
1. Worker catches error
2. BullMQ retries (exponential backoff: 1min, 2min, 4min)
3. After 3 attempts → job goes to failed queue
4. Logged with error details
5. EmailLog.type still = SENT (but with error field)
6. User sees failed count in analytics

### Stripe webhook fails
1. Stripe retries for 3 days with exponential backoff
2. Webhook endpoint is idempotent (handles duplicate events)
3. Check stripe event ID to prevent double-processing

### Database connection lost
1. Prisma auto-reconnects
2. Queued jobs fail → retry
3. After repeated failures, alerts (if monitoring set up)

---

## 📊 Analytics Data Sources

| Metric | Source |
|--------|--------|
| Emails sent | COUNT(EmailLog.type = 'SENT') |
| Opens | COUNT(EmailLog.type = 'OPENED') |
| Clicks | COUNT(EmailLog.type = 'CLICKED') |
| Replies | COUNT(EmailLog.type = 'REPLY') |
| Bounces | COUNT(EmailLog.type = 'BOUNCED') |
| Open rate | (Opens / Sent) × 100 |
| Click rate | (Clicks / Sent) × 100 |
| Reply rate | (Replies / Sent) × 100 |
| Bounce rate | (Bounces / Sent) × 100 |

All calculated in real-time from EmailLog table (can be heavy, consider materialized views for production).

---

## 🎉 Ready to Scale

This architecture is **production-ready** and can handle:
- **Thousands of users** (multi-tenant)
- **Millions of emails per month** (with proper inbox provisioning)
- **Real-time analytics** (with proper indexing)
- **99.9% uptime** (with proper hosting and monitoring)

**Start small → Test thoroughly → Scale gradually.**

---

## 📖 More Details

See individual documentation files:
- `README.md` - Full API documentation
- `SETUP.md` - Detailed setup with explanations
- `QUICKSTART.md` - Fast start guide
- `DEPLOYMENT.md` - Production deployment steps
- `CHECKLIST.md` - Complete pre-launch checklist
