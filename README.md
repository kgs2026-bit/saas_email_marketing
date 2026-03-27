# Email Automation SaaS Platform

A production-ready, multi-tenant email automation SaaS platform similar to Instantly.ai and Lemlist. Send automated cold emails with human-like sending patterns, full analytics, Stripe billing, and team collaboration features.

[Features](#features) • [Quick Start](#quick-start) • [Deployment](#deployment) • [Documentation](#documentation)

---

## Features

### Core Functionality
- **Multi-tenant Workspaces** - Each user belongs to organizations with isolated data
- **Campaign Automation** - Create multi-step sequences with delays between emails
- **Human-like Sending** - Random delays, sending windows, inbox rotation
- **Email Tracking** - Open tracking, click tracking, reply detection
- **Reply Management** - Unified inbox, tagging, interest marking
- **Spintax Support** - Dynamic content variations in email templates

### Infrastructure
- **Scalable Architecture** - BullMQ + Redis for background job processing
- **Reliable Delivery** - Multiple inbox support with health monitoring
- **Gmail OAuth2** - Direct Gmail connection without app passwords
- **SMTP Support** - Fallback to any SMTP provider
- **Encrypted Credentials** - All email credentials encrypted at rest

### Billing & Growth
- **Stripe Integration** - Full subscription management with 4 plans:
  - Free Trial (100 emails/day)
  - Starter ($19/mo, 1,000 emails/day)
  - Growth ($49/mo, 5,000 emails/day)
  - Pro ($99/mo, unlimited)
- **Webhooks** - Real-time notifications for email events
- **Referral System** - Ready for referral credits implementation
- **API Access** - RESTful API for all operations

### Security & Compliance
- **JWT Authentication** - Secure token-based auth with refresh tokens
- **Google OAuth** - One-click login with Google accounts
- **Role-based Access** - Admin/Member roles per workspace
- **GDPR Features** - Data export and deletion endpoints
- **Rate Limiting** - Comprehensive request throttling
- **Encryption** - AES-256-GCM for sensitive data

---

## Tech Stack

### Backend
- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL + Prisma ORM
- **Queue**: BullMQ + Redis (Upstash)
- **Email**: Nodemailer + Google APIs
- **Auth**: JWT + Passport.js + Google OAuth2
- **Billing**: Stripe
- **Validation**: express-validator + zod

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI**: Tailwind CSS + Headless UI
- **State**: Zustand + React Query
- **Routing**: React Router v6
- **Icons**: Heroicons
- **Charts**: Recharts (ready to configure)

### Hosting
- **Frontend**: Vercel (static hosting)
- **Backend**: Railway / Render / DigitalOcean
- **Database**: Supabase / Neon / Railway PostgreSQL
- **Redis**: Upstash / Redis Cloud

---

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Redis instance
- Google Cloud Console account (for Gmail OAuth)
- Stripe account

### 1. Clone and Install

```bash
git clone <your-repo>
cd "Email Marketing tool"
npm install

# Install backend and frontend dependencies
cd backend && npm install
cd ../frontend && npm install
cd ..
```

### 2. Setup Database

```bash
cd backend

# Copy environment file
cp .env.example .env

# Edit .env with your database connection
# DATABASE_URL="postgresql://user:pass@localhost:5432/email_saas_db"

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed demo data (optional)
npm run db:seed
```

### 3. Configure Services

#### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create project → Enable Gmail API
3. Create OAuth 2.0 credentials
4. Add authorized redirect URI:
   ```
   http://localhost:3001/api/auth/google/callback
   ```
5. Copy **Client ID** and **Client Secret** to `.env`:
   ```env
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   ```

#### Stripe Setup

1. Create account at [stripe.com](https://stripe.com)
2. Get API keys from Developers → API keys
3. Create products and pricing:
   - **Starter**: $19/month
   - **Growth**: $49/month
   - **Pro**: $99/month
4. Copy price IDs:
   ```env
   STRIPE_PRICE_STARTER=price_xxxxx
   STRIPE_PRICE_GROWTH=price_yyyyy
   STRIPE_PRICE_PRO=price_zzzzz
   ```
5. Configure webhook endpoint:
   - URL: `http://localhost:3001/api/webhooks/stripe`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`
6. Copy webhook secret:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   ```

#### Redis Setup

Use [Upstash](https://upstash.com) for managed Redis:

```env
REDIS_URL=rediss://default:password@us-east-1-123.redis.upstash.io:6379
```

Or use local Redis:
```env
REDIS_URL=redis://localhost:6379
```

#### Generate Secrets

```env
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=your-32-char-secret
JWT_REFRESH_SECRET=your-32-char-refresh-secret

# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY=your-32-char-encryption-key
```

### 4. Environment Configuration

Complete your `backend/.env`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/email_saas_db"

# JWT
JWT_SECRET="your-jwt-secret-32-chars"
JWT_REFRESH_SECRET="your-refresh-secret-32-chars"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Google OAuth
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"
GOOGLE_CALLBACK_URL="/api/auth/google/callback"

# Stripe
STRIPE_SECRET_KEY="sk_test_xxxxx"
STRIPE_WEBHOOK_SECRET="whsec_xxxxx"
STRIPE_PRICE_STARTER="price_xxxxx"
STRIPE_PRICE_GROWTH="price_yyyyy"
STRIPE_PRICE_PRO="price_zzzzz"

# Redis
REDIS_URL="redis://localhost:6379"
# or for Upstash:
# REDIS_URL="rediss://default:password@us-east-1-123.redis.upstash.io:6379"

# App
NODE_ENV="development"
PORT=3001
FRONTEND_URL="http://localhost:5173"
API_URL="http://localhost:3001"

# Email (for password reset, etc.)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# Encryption
ENCRYPTION_KEY="32-char-encryption-key"

# Tracking
TRACKING_DOMAIN="http://localhost:3001"
OPEN_TRACKING_ENABLED="true"
CLICK_TRACKING_ENABLED="true"
```

### 5. Start Development

```bash
# From root directory - runs both frontend and backend concurrently
npm run dev

# Or run separately:
# Terminal 1:
cd backend
npm run dev

# Terminal 2:
cd frontend
npm run dev
```

- Backend: http://localhost:3001
- Frontend: http://localhost:5173

### 6. Test the Platform

1. **Register** at http://localhost:5173/register
2. **Create workspace** (auto-created with first user)
3. **Connect inbox** at `/inboxes`
   - Use Google OAuth or SMTP
4. **Create campaign** at `/campaigns/new`
   - Add multiple steps
   - Configure delays
5. **Add contacts** at `/contacts`
   - Manual add or CSV upload
6. **Start campaign** - Emails will queue and send
7. **Track performance** at `/analytics`

Demo credentials after seeding:
- Email: `demo@example.com`
- Password: `demo123`

---

## Project Structure

```
Email Marketing tool/
├── backend/
│   ├── src/
│   │   ├── config/          # Database, Passport
│   │   ├── middleware/      # Auth, rate limiting, error handling
│   │   ├── modules/         # Feature modules (auth, billing, etc.)
│   │   ├── queues/          # BullMQ queue setup
│   │   ├── routes/          # API endpoints
│   │   ├── services/        # Business logic
│   │   ├── utils/           # Logger, crypto helpers
│   │   └── server.ts        # Express entry point
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema
│   │   └── seed.ts
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── README.md
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   │   ├── layout/     # Layout component
│   │   │   ├── ui/         # Button, Input, Card
│   │   │   └── auth/       # ProtectedRoute
│   │   ├── pages/          # Route pages
│   │   ├── stores/         # Zustand stores
│   │   ├── services/       # API calls
│   │   ├── types/          # TypeScript types
│   │   ├── utils/          # Frontend helpers
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── public/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── .env.example
├── package.json             # Root monorepo config
├── .gitignore
└── README.md                # This file
```

---

## API Reference

All API endpoints prefixed with `/api`. Full documentation available in backend README.

### Authentication
- `POST /api/auth/register` - Register
- `POST /api/auth/login` - Login
- `GET /api/auth/google` - Google OAuth start
- `GET /api/auth/google/callback` - OAuth callback
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Current user

### Campaigns
- `GET /api/campaigns` - List campaigns
- `POST /api/campaigns` - Create
- `GET /api/campaigns/:id` - Get one
- `PUT /api/campaigns/:id` - Update
- `DELETE /api/campaigns/:id` - Delete
- `POST /api/campaigns/:id/steps` - Add sequence step
- `POST /api/campaigns/:id/contacts` - Add contacts
- `POST /api/campaigns/:id/start` - Start campaign
- `POST /api/campaigns/:id/pause` - Pause
- `GET /api/campaigns/:id/stats` - Statistics

### Inboxes
- `GET /api/inboxes` - List inboxes
- `POST /api/inboxes` - Add inbox
- `GET /api/inboxes/:id` - Get inbox
- `PUT /api/inboxes/:id` - Update
- `DELETE /api/inboxes/:id` - Delete

### Contacts
- `GET /api/contacts` - List contacts
- `POST /api/contacts` - Create contact
- `GET /api/contacts/:id` - Get contact
- `PUT /api/contacts/:id` - Update
- `DELETE /api/contacts/:id` - Delete
- `GET /api/contacts/lists` - Contact lists
- `POST /api/contacts/lists` - Create list

### Analytics
- `GET /api/analytics/overview` - Workspace stats
- `GET /api/analytics/campaign/:id` - Campaign stats
- `GET /api/analytics/inboxes` - Inbox performance
- `GET /api/analytics/trends` - Trends over time
- `GET /api/analytics/replies` - Reply analytics

### Team
- `GET /api/team/members` - List members
- `POST /api/team/invite` - Invite member
- `PUT /api/team/members/:id` - Update role
- `DELETE /api/team/members/:id` - Remove member

### Billing
- `GET /api/billing/plans` - All plans
- `GET /api/billing/subscription` - Current subscription
- `POST /api/billing/create-checkout-session` - Start checkout
- `POST /api/billing/create-portal-session` - Customer portal
- `GET /api/billing/invoices` - Invoice history

---

## Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production` in backend
- [ ] Configure `TRACKING_DOMAIN` to your production domain
- [ ] Update Stripe webhook endpoint to production URL
- [ ] Enable Redis persistence (Upstash)
- [ ] Set up database backups
- [ ] Configure custom domain (Vercel)
- [ ] Set up SSL certificates
- [ ] Enable rate limiting (adjust thresholds)
- [ ] Configure logging (Winston)
- [ ] Set up error tracking (Sentry)
- [ ] Add monitoring/health checks
- [ ] Test Stripe webhooks in production mode

### Deploy to Railway (Backend)

1. Push code to GitHub
2. Create new service in Railway
3. Connect repository
4. Add PostgreSQL and Redis plugins
5. Set environment variables
6. Set build command: `npm run build`
7. Set start command: `npm start`
8. Deploy

### Deploy to Vercel (Frontend)

1. Push code to GitHub
2. Import project in Vercel
3. Select frontend folder
4. Set environment variables:
   - `VITE_API_URL=https://your-backend.railway.app/api`
5. Deploy

### Database Migrations on Production

```bash
# Run on your deployed backend
cd backend
npm run db:migrate
npm run db:generate
```

---

## Configuration

### Email Sending Limits

Configure daily limits per inbox in the app (`/inboxes`). Auto-rotation ensures emails are sent from healthiest inboxes first.

### Sending Windows

Configure in campaign settings:
- `sendingWindowStart`: HH:mm format (e.g., "09:00")
- `sendingWindowEnd`: HH:mm format (e.g., "17:00")
- Random delays: `minDelay` and `maxDelay` in minutes

### Spintax

Use spintax in subject and body:

```
Hi {{firstName}},

{How are you?|I hope you're doing well|Hope you're having a great week}

I noticed {{company}} is {growing|expanding|hiring}.
```

### Stop on Reply

Enable "Stop on reply" in campaign settings. When a reply is detected, the campaign automatically stops sending follow-ups to that contact.

---

## Maintenance

### Reset Daily Email Counters

Runs automatically at midnight via Node-cron. To manually trigger:

```bash
curl -X POST https://your-api.com/api/admin/reset-daily-counts
# (endpoint needs to be created)
```

### Monitor BullMQ Jobs

Admin dashboard to view:
- Queue lengths
- Failed jobs
- Active workers
- Job stats

Access at: `/admin/queues` (create admin middleware)

### View Logs

Logs stored in `backend/logs/`:
- `combined.log` - All logs
- `error.log` - Errors only

For production, configure Winston to send to external service (Loggly, Papertrail, etc.)

### Database Backups

Configure automatic PostgreSQL backups in your hosting provider. Test restore process monthly.

---

## Troubleshooting

### Emails Not Sending

1. Check inbox health: `/analytics/inboxes`
2. Verify inbox credentials are correct
3. Check daily limit hasn't been reached
4. Review BullMQ queue for failed jobs
5. Check application logs for errors

### Gmail OAuth Failing

- Verify Google OAuth credentials in Google Cloud Console
- Check redirect URI matches exactly
- Ensure Gmail API is enabled
- Users may need to re-authenticate if refresh token expired

### Stripe Webhooks Not Triggering

- Verify webhook endpoint is publicly accessible
- Check Stripe Dashboard → Developers → Webhooks for delivery attempts
- Ensure `STRIPE_WEBHOOK_SECRET` matches exactly
- Test with Stripe CLI locally

### Redis Connection Issues

- Verify `REDIS_URL` is correct
- Check firewall rules allow connections
- For Upstash, use `rediss://` for TLS
- Test connection: `redis-cli ping` should return `PONG`

### Jobs Stuck in Queue

```javascript
// Check queue stats
const metrics = await emailQueue.getMetrics();
console.log(metrics);

// Check waiting/active/delayed counts
```

Common causes:
- Redis connection dropped
- Worker crashed or not running
- Job processor threw unhandled error

---

## Contributing

This is a production SaaS platform. Follow these guidelines:

1. **Branch strategy**: `feature/`, `bugfix/`, `hotfix/`
2. **Code style**: ESLint + Prettier (run `npm run lint`)
3. **Tests**: Add tests for new features
4. **Commits**: Conventional commits recommended
5. **PRs**: Include description, screenshots, testing steps

---

## License

Proprietary - All rights reserved

---

## Support

For issues, questions, or feature requests:

1. Check this README
2. Review backend README in `backend/README.md`
3. Check logs in `backend/logs/`
4. Search existing issues

---

## Roadmap

Planned features:
- [ ] AI email rewriting (OpenAI integration)
- [ ] Email warm-up service
- [ ] Custom tracking domain
- [ ] Advanced segmentation
- [ ] A/B testing
- [ ] Zapier/Make.com integration
- [ ] Chrome extension
- [ ] Mobile app
- [ ] Advanced reporting dashboards
- [ ] Team collaboration features expansion

---

**Built with ❤️ for email outreach teams**
