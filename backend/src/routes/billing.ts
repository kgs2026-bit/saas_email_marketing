import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { prisma } from '../config/database';
import { authenticateToken, requireWorkspace, AuthRequest } from '../middleware/auth';
import { ForbiddenError } from '../middleware/error-handler';

const router = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20'
});

// Plans configuration
const PLANS = {
  FREE: {
    name: 'Free Trial',
    price: 0,
    features: [
      '100 emails per day',
      '1 connected inbox',
      'Basic analytics',
      '3 campaigns',
      '100 contacts'
    ],
    limits: {
      campaigns: 3,
      inboxes: 1,
      teamMembers: 1,
      contacts: 100,
      dailyEmails: 100
    }
  },
  STARTER: {
    name: 'Starter',
    price: 19,
    priceId: process.env.STRIPE_PRICE_STARTER,
    features: [
      '1,000 emails per day',
      '3 connected inboxes',
      'Advanced analytics',
      '10 campaigns',
      '1,000 contacts',
      'Team members (3)',
      'Email support'
    ],
    limits: {
      campaigns: 10,
      inboxes: 3,
      teamMembers: 3,
      contacts: 1000,
      dailyEmails: 1000
    }
  },
  GROWTH: {
    name: 'Growth',
    price: 49,
    priceId: process.env.STRIPE_PRICE_GROWTH,
    features: [
      '5,000 emails per day',
      '10 connected inboxes',
      'Full analytics suite',
      '50 campaigns',
      '10,000 contacts',
      'Team members (10)',
      'Priority support',
      'Custom tracking domain'
    ],
    limits: {
      campaigns: 50,
      inboxes: 10,
      teamMembers: 10,
      contacts: 10000,
      dailyEmails: 5000
    }
  },
  PRO: {
    name: 'Pro',
    price: 99,
    priceId: process.env.STRIPE_PRICE_PRO,
    features: [
      'Unlimited emails',
      '50 connected inboxes',
      'Enterprise analytics',
      '200 campaigns',
      '100,000 contacts',
      'Team members (25)',
      '24/7 phone support',
      'Custom tracking domain',
      'API access',
      'Webhooks'
    ],
    limits: {
      campaigns: 200,
      inboxes: 50,
      teamMembers: 25,
      contacts: 100000,
      dailyEmails: -1 // unlimited
    }
  }
};

// @route   GET /api/billing/plans
// @desc    Get all plans
// @access  Private
router.get('/plans', authenticateToken, (req: Request, res: Response) => {
  res.json(PLANS);
});

// @route   GET /api/billing/subscription
// @desc    Get current subscription
// @access  Private
router.get(
  '/subscription',
  authenticateToken,
  requireWorkspace,
  async (req: AuthRequest, res: Response, next) => {
    try {
      const subscription = await prisma.subscription.findFirst({
        where: { workspaceId: req.workspace!.id },
        orderBy: { createdAt: 'desc' }
      });

      res.json(subscription || null);
    } catch (error: any) {
      next(error);
    }
  }
);

// @route   POST /api/billing/create-checkout-session
// @desc    Create Stripe checkout session
// @access  Private
router.post(
  '/create-checkout-session',
  authenticateToken,
  requireWorkspace,
  requireRole(['ADMIN']),
  async (req: AuthRequest, res: Response, next) => {
    try {
      const { priceId, successUrl, cancelUrl } = req.body;

      if (!priceId) {
        throw new Error('Price ID is required');
      }

      // Verify this is a valid price for our plans
      const validPriceIds = Object.values(PLANS)
        .filter(p => p.priceId)
        .map(p => p.priceId);

      if (!validPriceIds.includes(priceId)) {
        throw new Error('Invalid price ID');
      }

      // Create or get Stripe customer
      let customerId = req.workspace!.stripeCustomerId;

      if (!customerId) {
        const customer = await stripe.customers.create({
          email: req.user!.email,
          metadata: {
            workspaceId: req.workspace!.id,
            userId: req.user!.id
          }
        });
        customerId = customer.id;

        await prisma.workspace.update({
          where: { id: req.workspace!.id },
          data: { stripeCustomerId: customerId }
        });
      }

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        line_items: [
          {
            price: priceId,
            quantity: 1
          }
        ],
        mode: 'subscription',
        success_url: successUrl || `${process.env.FRONTEND_URL}/workspace/${req.workspace!.slug}/billing?success=true`,
        cancel_url: cancelUrl || `${process.env.FRONTEND_URL}/workspace/${req.workspace!.slug}/billing?canceled=true`,
        metadata: {
          workspaceId: req.workspace!.id,
          userId: req.user!.id
        },
        allow_promotion_codes: true
      });

      res.json({ sessionId: session.id, url: session.url });
    } catch (error: any) {
      next(error);
    }
  }
);

// @route   POST /api/billing/create-portal-session
// @desc    Create Stripe customer portal session
// @access  Private
router.post(
  '/create-portal-session',
  authenticateToken,
  requireWorkspace,
  requireRole(['ADMIN']),
  async (req: AuthRequest, res: Response, next) => {
    try {
      const workspace = await prisma.workspace.findUnique({
        where: { id: req.workspace!.id }
      });

      if (!workspace?.stripeCustomerId) {
        throw new Error('No Stripe customer found');
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: workspace.stripeCustomerId,
        return_url: `${process.env.FRONTEND_URL}/workspace/${workspace.slug}/billing`
      });

      res.json({ url: session.url });
    } catch (error: any) {
      next(error);
    }
  }
);

// @route   GET /api/billing/invoices
// @desc    Get workspace invoices
// @access  Private
router.get(
  '/invoices',
  authenticateToken,
  requireWorkspace,
  async (req: AuthRequest, res: Response, next) => {
    try {
      const workspace = await prisma.workspace.findUnique({
        where: { id: req.workspace!.id }
      });

      if (!workspace?.stripeCustomerId) {
        return res.json([]);
      }

      const invoices = await stripe.invoices.list({
        customer: workspace.stripeCustomerId,
        limit: 100
      });

      res.json(invoices.data);
    } catch (error: any) {
      next(error);
    }
  }
);

export { PLANS };
export default router;
