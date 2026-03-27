import { Router, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import crypto from 'crypto';
import { prisma } from '../config/database';
import { authenticateToken, requireWorkspace, AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

// @route   GET /api/webhooks
// @desc    Get workspace webhooks
// @access  Private
router.get(
  '/',
  authenticateToken,
  requireWorkspace,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const webhooks = await prisma.webhook.findMany({
        where: {
          workspaceId: req.workspace!.id
        }
      });

      // Don't return the secret
      const safeWebhooks = webhooks.map((w: any) => ({
        id: w.id,
        eventType: w.eventType,
        url: w.url,
        isActive: w.isActive,
        createdAt: w.createdAt
      }));

      res.json(safeWebhooks);
    } catch (error: any) {
      next(error);
    }
  }
);

// @route   POST /api/webhooks
// @desc    Create webhook
// @access  Private
router.post(
  '/',
  authenticateToken,
  requireWorkspace,
  [
    body('eventType').notEmpty(),
    body('url').isURL()
  ],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { eventType, url, isActive = true } = req.body;

      // Generate secret for signature verification
      const secret = crypto.randomBytes(32).toString('hex');

      const webhook = await prisma.webhook.create({
        data: {
          workspaceId: req.workspace!.id,
          eventType,
          url,
          secret,
          isActive
        }
      });

      return res.status(201).json({
        ...webhook,
        secret // Only shown once at creation
      });
    } catch (error: any) {
      next(error);
    }
  }
);

// @route   PUT /api/webhooks/:webhookId
// @desc    Update webhook
// @access  Private
router.put(
  '/:webhookId',
  authenticateToken,
  requireWorkspace,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { webhookId } = req.params;
      const { eventType, url, isActive } = req.body;

      const webhook = await prisma.webhook.update({
        where: {
          id: webhookId,
          workspaceId: req.workspace!.id
        },
        data: {
          ...(eventType && { eventType }),
          ...(url && { url }),
          ...(isActive !== undefined && { isActive })
        }
      });

      res.json(webhook);
    } catch (error: any) {
      next(error);
    }
  }
);

// @route   DELETE /api/webhooks/:webhookId
// @desc    Delete webhook
// @access  Private
router.delete(
  '/:webhookId',
  authenticateToken,
  requireWorkspace,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { webhookId } = req.params;

      await prisma.webhook.delete({
        where: {
          id: webhookId,
          workspaceId: req.workspace!.id
        }
      });

      res.json({ success: true });
    } catch (error: any) {
      next(error);
    }
  }
);

// This endpoint is called internally by the email service to trigger webhooks
// It's not exposed in the API routes but is used by the service
export async function triggerWebhook(workspaceId: string, eventType: string, data: any) {
  try {
    const webhooks = await prisma.webhook.findMany({
      where: {
        workspaceId,
        eventType,
        isActive: true
      }
    });

    for (const webhook of webhooks) {
      await sendWebhookRequest(webhook.url, webhook.secret, {
        event: eventType,
        workspaceId,
        data,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    logger.error('Failed to trigger webhook:', error);
  }
}

async function sendWebhookRequest(url: string, secret: string, payload: any) {
  const signature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');

  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Email-SaaS-Signature': `sha256=${signature}`,
      'X-Email-SaaS-Event': payload.event
    },
    body: JSON.stringify(payload)
  }).catch(err => {
    logger.error(`Webhook delivery failed to ${url}:`, err);
  });
}

export default router;
