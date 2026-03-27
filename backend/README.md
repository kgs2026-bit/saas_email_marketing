# Email Automation SaaS - Backend API

Production-ready Node.js + Express + TypeScript backend for email automation platform.

## Features

- Multi-tenant workspace architecture
- JWT authentication with Google OAuth
- Stripe billing integration with subscription management
- Gmail OAuth2 + SMTP email sending
- BullMQ + Redis background job processing
- Campaign automation with sequences
- Email tracking (opens, clicks)
- Reply management
- Team collaboration features
- Analytics dashboard
- Rate limiting and security

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Queue**: BullMQ + Redis (Upstash)
- **Email**: Nodemailer + Gmail API
- **Auth**: JWT + Passport.js
- **Billing**: Stripe
- **Validation**: Zod + express-validator

## Prerequisites

- Node.js 18+
- PostgreSQL database
- Redis instance (Upstash recommended)
- Google Cloud Console project (for Gmail OAuth)
- Stripe account

## Quick Start

### 1. Clone and Install

```bash
npm install
cd backend
npm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env` and fill in all required values:

```bash
cp .env.example .env
```

**Required environment variables:**

- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Random secret for JWT signing (min 32 chars)
- `JWT_REFRESH_SECRET`: Random secret for refresh tokens
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
- `STRIPE_SECRET_KEY`: Stripe secret key
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook signing secret
- `STRIPE_PRICE_STARTER`: Price ID for Starter plan
- `STRIPE_PRICE_GROWTH`: Price ID for Growth plan
- `STRIPE_PRICE_PRO`: Price ID for Pro plan
- `REDIS_URL`: Redis connection URL (Upstash)
- `ENCRYPTION_KEY`: 32-character key for encrypting credentials

### 3. Setup Database

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed demo data (optional)
npm run db:seed
```

Demo credentials after seeding:
- Email: `demo@example.com`
- Password: `demo123`

### 4. Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Gmail API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3001/api/auth/google/callback`
6. Copy Client ID and Secret to `.env`

### 5. Configure Stripe

1. Create account at [stripe.com](https://stripe.com)
2. Get API keys from Developers section
3. Create products and pricing (Starter $19, Growth $49, Pro $99)
4. Copy price IDs to `.env`
5. Create webhook endpoint for your local/test environment:
   - URL: `http://localhost:3001/api/webhooks/stripe`
   - Events to listen: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`
6. Copy webhook secret to `.env`

### 6. Start Development Server

```bash
npm run dev
```

Server will start on `http://localhost:3001`

## API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with email/password
- `GET /api/auth/google` - Google OAuth login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Workspace Endpoints

- `GET /api/workspaces` - List user workspaces
- `POST /api/workspaces` - Create workspace
- `GET /api/workspaces/:id` - Get workspace details
- `PUT /api/workspaces/:id` - Update workspace
- `POST /api/workspaces/:id/invite` - Invite member
- `GET /api/workspaces/:id/members` - List members
- `PUT /api/workspaces/:id/members/:userId` - Update member role
- `DELETE /api/workspaces/:id/members/:userId` - Remove member

### Campaign Endpoints

- `GET /api/campaigns` - List campaigns
- `POST /api/campaigns` - Create campaign
- `GET /api/campaigns/:id` - Get campaign
- `PUT /api/campaigns/:id` - Update campaign
- `DELETE /api/campaigns/:id` - Delete campaign
- `POST /api/campaigns/:id/steps` - Add step
- `PUT /api/campaigns/:id/steps/:stepNumber` - Update step
- `DELETE /api/campaigns/:id/steps/:stepNumber` - Delete step
- `POST /api/campaigns/:id/contacts` - Add contacts
- `POST /api/campaigns/:id/start` - Start campaign
- `POST /api/campaigns/:id/pause` - Pause campaign
- `POST /api/campaigns/:id/resume` - Resume campaign
- `POST /api/campaigns/:id/stop` - Stop campaign
- `GET /api/campaigns/:id/stats` - Get statistics

### Inbox Endpoints

- `GET /api/inboxes` - List inboxes
- `POST /api/inboxes` - Add inbox (Gmail OAuth or SMTP)
- `GET /api/inboxes/:id` - Get inbox
- `PUT /api/inboxes/:id` - Update inbox
- `DELETE /api/inboxes/:id` - Delete inbox
- `GET /api/inboxes/:id/health` - Check health

### Contact Endpoints

- `GET /api/contacts` - List contacts
- `POST /api/contacts` - Create contact
- `GET /api/contacts/:id` - Get contact
- `PUT /api/contacts/:id` - Update contact
- `DELETE /api/contacts/:id` - Delete contact
- `POST /api/contacts/:id/lists/:listId` - Add to list
- `DELETE /api/contacts/:id/lists/:listId` - Remove from list

### Contact Lists

- `GET /api/contacts/lists` - List all lists
- `POST /api/contacts/lists` - Create list
- `POST /api/contacts/lists/:id/upload` - Upload CSV to list

### Analytics Endpoints

- `GET /api/analytics/overview` - Workspace overview
- `GET /api/analytics/campaign/:campaignId` - Campaign details
- `GET /api/analytics/inboxes` - Inbox performance
- `GET /api/analytics/trends?days=30` - Email trends
- `GET /api/analytics/replies` - Reply analytics

### Team Endpoints

- `GET /api/team/members` - List team members
- `POST /api/team/invite` - Invite member
- `PUT /api/team/members/:userId` - Update member role
- `DELETE /api/team/members/:userId` - Remove member
- `GET /api/team/invitations` - Pending invitations
- `DELETE /api/team/invitations/:id` - Cancel invitation

### Billing Endpoints

- `GET /api/billing/plans` - Get all plans
- `GET /api/billing/subscription` - Current subscription
- `POST /api/billing/create-checkout-session` - Create Stripe checkout
- `POST /api/billing/create-portal-session` - Customer portal
- `GET /api/billing/invoices` - Invoice history

### Webhooks

- `GET /api/webhooks` - List webhooks
- `POST /api/webhooks` - Create webhook
- `PUT /api/webhooks/:id` - Update webhook
- `DELETE /api/webhooks/:id` - Delete webhook
- `POST /api/webhooks/stripe` - Stripe webhooks endpoint

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   │   ├── database.ts
│   │   └── passport.ts
│   ├── middleware/      # Express middleware
│   │   ├── auth.ts
│   │   ├── error-handler.ts
│   │   ├── rate-limiter.ts
│   │   └── workspace.ts
│   ├── modules/         # Feature modules
│   │   ├── auth/
│   │   ├── workspace/
│   │   ├── billing/
│   │   ├── inbox/
│   │   ├── campaign/
│   │   ├── contact/
│   │   ├── reply/
│   │   ├── team/
│   │   └── referral/
│   ├── queues/          # BullMQ queue setup
│   ├── routes/          # API route handlers
│   │   ├── auth.ts
│   │   ├── workspace.ts
│   │   ├── billing.ts
│   │   ├── inbox.ts
│   │   ├── campaign.ts
│   │   ├── contact.ts
│   │   ├── analytics.ts
│   │   ├── team.ts
│   │   ├── webhooks.ts
│   │   ├── track.ts
│   │   └── stripe-webhooks.ts
│   ├── services/        # Business logic services
│   │   ├── auth.service.ts
│   │   ├── email-service.ts
│   │   └── campaign-service.ts
│   ├── utils/           # Utility functions
│   │   ├── logger.ts
│   │   └── crypto.ts
│   └── server.ts        # Express app entry point
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── seed.ts          # Database seed
├── package.json
├── tsconfig.json
└── .env.example
```

## Deployment

### Railway/Render

1. Connect GitHub repository
2. Add environment variables
3. Set build command: `npm run build`
4. Set start command: `npm start`
5. Add PostgreSQL add-on
6. Add Redis add-on (Upstash recommended)

### Environment Variables for Production

Additional to development variables:

```env
NODE_ENV=production
LOG_LEVEL=warn
TRACKING_DOMAIN=https://yourdomain.com
```

## Monitoring & Maintenance

### Reset Daily Email Counters

Run daily at midnight:

```bash
# Manual trigger
curl -X POST https://your-api.com/api/admin/reset-daily-counts
```

Or add cron job:

```bash
0 0 * * * curl -X POST https://your-api.com/api/admin/reset-daily-counts
```

### Database Backups

Set up automated PostgreSQL backups. Most hosting providers offer this.

### Logs

Logs are stored in `logs/` directory:
- `combined.log` - All logs
- `error.log` - Error logs only

## Security Notes

1. **Never commit `.env` file** - Add to `.gitignore`
2. Use strong, unique `ENCRYPTION_KEY`
3. Enable rate limiting in production
4. Use HTTPS everywhere
5. Implement CORS properly for your frontend domain
6. Validate all user inputs
7. Keep dependencies updated
8. Use Stripe webhook signature verification (enabled by default)

## Troubleshooting

### Redis Connection Issues
- Verify `REDIS_URL` is correct
- Check firewall rules
- For Upstash, use `rediss://` for TLS

### Gmail OAuth Not Working
- Verify Google OAuth credentials
- Check redirect URI matches exactly
- Ensure Gmail API is enabled
- Token might expire - users may need to re-authenticate

### Stripe Webhooks Not Triggering
- Verify webhook endpoint is reachable
- Check Stripe signature verification secret
- View webhook retry attempts in Stripe Dashboard

### Emails Not Sending
- Check inbox health status
- Verify SMTP/OAuth credentials
- Check daily limit hasn't been reached
- Look at job failures in BullMQ board

### BullMQ Jobs Stuck
- Redis connection issues
- Workers not running
- Check queue stats: `emailQueue.getMetrics()`

## License

Proprietary - All rights reserved
