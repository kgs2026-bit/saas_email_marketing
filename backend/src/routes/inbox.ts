import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { body, validationResult } from 'express-validator';
import { google } from 'googleapis'; // Import Google APIs
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../config/database';
import { authenticateToken, requireWorkspace, AuthRequest } from '../middleware/auth';
import { ForbiddenError } from '../middleware/error-handler';
import { encrypt, decrypt } from '../utils/crypto';
import { logger } from '../utils/logger';

const router = Router();

// @route   GET /api/inboxes
// @desc    Get all inboxes for workspace
// @access  Private
router.get('/', authenticateToken, requireWorkspace, async (req: AuthRequest, res: Response, next) => {
  try {
    const inboxes = await prisma.inbox.findMany({
      where: { workspaceId: req.workspace!.id },
      select: {
        id: true,
        email: true,
        provider: true,
        providerName: true,
        dailyLimit: true,
        sentCountToday: true,
        lastSentAt: true,
        isActive: true,
        healthScore: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(inboxes);
  } catch (error: any) {
    next(error);
  }
});

// @route   POST /api/inboxes
// @desc    Create inbox (Gmail OAuth or SMTP)
// @access  Private
router.post(
  '/',
  authenticateToken,
  requireWorkspace,
  [
    body('email').isEmail().normalizeEmail(),
    body('provider').isIn(['GMAIL', 'SMTP']),
    body('providerName').optional().trim()
  ],
  async (req: AuthRequest, res: Response, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, provider, providerName, credentials, smtpHost, smtpPort, smtpUser, smtpPass, dailyLimit = 100 } = req.body;

      if (provider === 'GMAIL') {
        // Verify the OAuth token is valid by getting user info
        const oauth2Client = new OAuth2Client(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
          process.env.GOOGLE_CALLBACK_URL
        );

        oauth2Client.setCredentials({
          access_token: credentials.accessToken,
          refresh_token: credentials.refreshToken
        });

        try {
          const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
          const response = await oauth2.userinfo.get();
          // Verify email matches
          if (response.data.email !== email) {
            throw new Error('OAuth token does not match email address');
          }
        } catch (error) {
          throw new Error('Invalid Gmail OAuth credentials');
        }
      }

      // Encrypt credentials before saving
      const credsToStore = credentials || {
        smtpHost,
        smtpPort,
        smtpUser,
        smtpPass
      };

      const encryptedCreds = encrypt(JSON.stringify(credsToStore));

      const inbox = await prisma.inbox.create({
        data: {
          workspaceId: req.workspace!.id,
          email,
          provider,
          providerName: providerName || provider,
          encryptedCreds,
          oauthToken: credentials?.accessToken,
          refreshToken: credentials?.refreshToken,
          tokenExpiresAt: credentials?.expiryDate ? new Date(credentials.expiryDate) : null,
          dailyLimit
        },
        select: {
          id: true,
          email: true,
          provider: true,
          providerName: true,
          dailyLimit: true,
          isActive: true,
          createdAt: true
        }
      });

      logger.info(`Inbox created: ${email} for workspace: ${req.workspace!.id}`);

      res.status(201).json(inbox);
    } catch (error: any) {
      next(error);
    }
  }
);

// @route   GET /api/inboxes/:inboxId
// @desc    Get single inbox
// @access  Private
router.get(
  '/:inboxId',
  authenticateToken,
  requireWorkspace,
  async (req: AuthRequest, res: Response, next) => {
    try {
      const { inboxId } = req.params;

      const inbox = await prisma.inbox.findFirst({
        where: {
          id: inboxId,
          workspaceId: req.workspace!.id
        },
        select: {
          id: true,
          email: true,
          provider: true,
          providerName: true,
          dailyLimit: true,
          sentCountToday: true,
          lastSentAt: true,
          isActive: true,
          healthScore: true,
          createdAt: true,
          updatedAt: true
        }
      });

      if (!inbox) {
        throw ForbiddenError('Inbox not found');
      }

      res.json(inbox);
    } catch (error: any) {
      next(error);
    }
  }
);

// @route   PUT /api/inboxes/:inboxId
// @desc    Update inbox
// @access  Private
router.put(
  '/:inboxId',
  authenticateToken,
  requireWorkspace,
  async (req: AuthRequest, res: Response, next) => {
    try {
      const { inboxId } = req.params;
      const { email, isActive, dailyLimit } = req.body;

      // Check inbox belongs to workspace
      const existingInbox = await prisma.inbox.findFirst({
        where: {
          id: inboxId,
          workspaceId: req.workspace!.id
        }
      });

      if (!existingInbox) {
        throw ForbiddenError('Inbox not found');
      }

      const updates: any = {};
      if (email !== undefined) updates.email = email;
      if (isActive !== undefined) updates.isActive = isActive;
      if (dailyLimit !== undefined) updates.dailyLimit = dailyLimit;

      const inbox = await prisma.inbox.update({
        where: { id: inboxId },
        data: updates,
        select: {
          id: true,
          email: true,
          dailyLimit: true,
          isActive: true,
          updatedAt: true
        }
      });

      res.json(inbox);
    } catch (error: any) {
      next(error);
    }
  }
);

// @route   DELETE /api/inboxes/:inboxId
// @desc    Delete inbox
// @access  Private
router.delete(
  '/:inboxId',
  authenticateToken,
  requireWorkspace,
  async (req: AuthRequest, res: Response, next) => {
    try {
      const { inboxId } = req.params;

      const result = await prisma.inbox.deleteMany({
        where: {
          id: inboxId,
          workspaceId: req.workspace!.id
        }
      });

      if (result.count === 0) {
        throw ForbiddenError('Inbox not found');
      }

      res.json({ success: true });
    } catch (error: any) {
      next(error);
    }
  }
);

// @route   POST /api/inboxes/:inboxId/refresh-token
// @desc    Refresh Gmail OAuth token
// @access  Private
router.post(
  '/:inboxId/refresh-token',
  authenticateToken,
  requireWorkspace,
  async (req: AuthRequest, res: Response, next) => {
    try {
      const { inboxId } = req.params;

      const inbox = await prisma.inbox.findFirst({
        where: {
          id: inboxId,
          workspaceId: req.workspace!.id
        }
      });

      if (!inbox || !inbox.refreshToken) {
        throw ForbiddenError('Inbox not found or not using OAuth');
      }

      // Use refresh token to get new access token
      const oauth2Client = new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_CALLBACK_URL
      );

      oauth2Client.setCredentials({
        refresh_token: inbox.refreshToken
      });

      const { credentials } = await oauth2Client.refreshAccessToken();

      // Update token in database
      await prisma.inbox.update({
        where: { id: inboxId },
        data: {
          oauthToken: credentials.access_token,
          tokenExpiresAt: credentials.expiry_date ? new Date(credentials.expiry_date) : null
        }
      });

      res.json({ success: true, accessToken: credentials.access_token });
    } catch (error: any) {
      next(error);
    }
  }
);

// @route   GET /api/inboxes/:inboxId/health
// @desc    Check inbox health
// @access  Private
router.get(
  '/:inboxId/health',
  authenticateToken,
  requireWorkspace,
  async (req: AuthRequest, res: Response, next) => {
    try {
      const { inboxId } = req.params;

      const inbox = await prisma.inbox.findFirst({
        where: {
          id: inboxId,
          workspaceId: req.workspace!.id
        }
      });

      if (!inbox) {
        throw ForbiddenError('Inbox not found');
      }

      // TODO: Implement actual health check by sending test email
      // For now, return current stats
      const healthScore = calculateHealthScore(inbox);

      await prisma.inbox.update({
        where: { id: inboxId },
        data: { healthScore }
      });

      res.json({
        healthy: healthScore > 0.5,
        healthScore,
        sentCountToday: inbox.sentCountToday,
        dailyLimit: inbox.dailyLimit,
        lastSentAt: inbox.lastSentAt
      });
    } catch (error: any) {
      next(error);
    }
  }
);

function calculateHealthScore(inbox: any): number {
  let score = 1.0;

  // Reduce score if close to daily limit
  const usageRatio = inbox.sentCountToday / inbox.dailyLimit;
  if (usageRatio > 0.8) score -= 0.3;
  else if (usageRatio > 0.5) score -= 0.1;

  // Reduce score if not sent recently
  if (inbox.lastSentAt) {
    const hoursSinceLastSend = (Date.now() - new Date(inbox.lastSentAt).getTime()) / (1000 * 60 * 60);
    if (hoursSinceLastSend > 24) score -= 0.2;
    if (hoursSinceLastSend > 48) score -= 0.3;
  } else {
    score -= 0.5; // Never sent
  }

  return Math.max(0, Math.min(1, score));
}

export default router;
