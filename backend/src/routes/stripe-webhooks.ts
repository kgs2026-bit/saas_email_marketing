import express, { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

const router = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // @ts-ignore - Stripe API version type definition may be outdated
  apiVersion: '2024-06-20'
});

// Stripe webhook endpoint (must use raw body)
router.post(
  '/',
  express.raw({ type: 'application/json' }),
  async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'] as string;

    if (!sig) {
      return res.status(400).json({ error: 'Missing stripe-signature header' });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      logger.error('Stripe webhook signature verification failed:', err);
      return res.status(400).json({ error: 'Webhook signature verification failed' });
    }

    try {
      await handleStripeEvent(event);
      return res.json({ received: true });
    } catch (err) {
      logger.error('Stripe webhook handler error:', err);
      return res.status(500).json({ error: 'Webhook handler failed' });
    }
  }
);

async function handleStripeEvent(event: Stripe.Event) {
  const type = event.type;

  switch (type) {
    case 'checkout.session.completed':
      await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
      break;

    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
      break;

    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;

    case 'invoice.payment_succeeded':
      await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
      break;

    case 'invoice.payment_failed':
      await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
      break;

    default:
      logger.info(`Unhandled Stripe event: ${type}`);
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const workspaceId = session.metadata?.workspaceId;
  const userId = session.metadata?.userId;
  // @ts-ignore - display_items may not be in Stripe type definitions
  const priceId = session.display_items?.[0]?.price?.id || session.line_items?.data[0]?.price?.id;

  if (!workspaceId || !userId || !priceId) {
    logger.error('Missing metadata in checkout session:', session);
    return;
  }

  // Determine plan from price ID
  const plan = getPlanFromPriceId(priceId);

  // Update workspace subscription
  await prisma.workspace.update({
    where: { id: workspaceId },
    data: {
      plan,
      stripeCustomerId: session.customer as string,
      stripeSubscriptionId: session.subscription as string
    }
  });

  // Since checkout session doesn't have current_period_start/end,
  // we would need to fetch subscription separately. For now, set to current time.
  const now = new Date();

  // Create/update subscription record
  await prisma.subscription.upsert({
    where: {
      workspaceId_stripeSubscriptionId: {
        workspaceId,
        stripeSubscriptionId: session.subscription as string
      }
    },
    update: {
      plan,
      status: 'ACTIVE',
      stripeCustomerId: session.customer as string,
      currentPeriodStart: now,
      currentPeriodEnd: now
    },
    create: {
      userId,
      workspaceId,
      stripeCustomerId: session.customer as string,
      stripeSubscriptionId: session.subscription as string,
      plan,
      status: 'ACTIVE',
      currentPeriodStart: now,
      currentPeriodEnd: now
    }
  });

  logger.info(`Subscription activated for workspace: ${workspaceId}`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const workspace = await prisma.workspace.findFirst({
    where: { stripeSubscriptionId: subscription.id }
  });

  if (!workspace) {
    logger.error(`Workspace not found for subscription: ${subscription.id}`);
    return;
  }

  const status = mapStripeStatus(subscription.status);

  // @ts-ignore - Stripe type definitions may be incomplete
  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000)
    }
  });

  // If subscription ended, downgrade to FREE
  if (status === 'CANCELED' || status === 'PAST_DUE') {
    await prisma.workspace.update({
      where: { id: workspace.id },
      data: { plan: 'FREE' }
    });
  }

  logger.info(`Subscription updated for workspace: ${workspace.id}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const workspace = await prisma.workspace.findFirst({
    where: { stripeSubscriptionId: subscription.id }
  });

  if (!workspace) return;

  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: 'CANCELED'
    }
  });

  // Downgrade to FREE
  await prisma.workspace.update({
    where: { id: workspace.id },
    data: { plan: 'FREE' }
  });

  logger.info(`Subscription deleted for workspace: ${workspace.id}`);
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return;

  const workspace = await prisma.workspace.findFirst({
    where: { stripeSubscriptionId: invoice.subscription as string }
  });

  if (!workspace) return;

  // Update subscription period
  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: invoice.subscription as string },
    data: {
      currentPeriodStart: new Date(invoice.period_start * 1000),
      currentPeriodEnd: new Date(invoice.period_end * 1000)
    }
  });

  logger.info(`Invoice payment succeeded for workspace: ${workspace.id}`);
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return;

  const workspace = await prisma.workspace.findFirst({
    where: { stripeSubscriptionId: invoice.subscription as string }
  });

  if (!workspace) return;

  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: invoice.subscription as string },
    data: {
      status: 'PAST_DUE'
    }
  });

  logger.warn(`Invoice payment failed for workspace: ${workspace.id}`);
}

function getPlanFromPriceId(priceId: string): string {
  const priceToPlan: Record<string, string> = {
    [process.env.STRIPE_PRICE_STARTER || '']: 'STARTER',
    [process.env.STRIPE_PRICE_GROWTH || '']: 'GROWTH',
    [process.env.STRIPE_PRICE_PRO || '']: 'PRO'
  };

  return priceToPlan[priceId] || 'FREE';
}

function mapStripeStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'active': 'ACTIVE',
    'canceled': 'CANCELED',
    'past_due': 'PAST_DUE',
    'unpaid': 'UNPAID',
    'trialing': 'TRIALING',
    'incomplete': 'INCOMPLETE',
    'incomplete_expired': 'INCOMPLETE_EXPIRED'
  };

  return statusMap[status] || status.toUpperCase();
}

export default router;
