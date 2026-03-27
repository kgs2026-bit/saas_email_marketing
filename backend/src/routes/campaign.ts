import { Router, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../config/database';
import { authenticateToken, requireWorkspace, AuthRequest } from '../middleware/auth';
import { campaignService } from '../services/campaign-service';
import { ForbiddenError } from '../middleware/error-handler';

const router = Router();

// Validation
const createCampaignValidation = [
  body('name').notEmpty().trim(),
  body('fromName').notEmpty().trim(),
  body('fromEmail').isEmail(),
  body('subject').notEmpty().trim(),
  body('body').notEmpty()
];

// @route   GET /api/campaigns
// @desc    Get all campaigns for workspace
// @access  Private
router.get('/', authenticateToken, requireWorkspace, async (req: AuthRequest, res: Response, next) => {
  try {
    const { page = 1, limit = 50, status } = req.query;

    const where: any = {
      workspaceId: req.workspace!.id
    };

    if (status) {
      where.status = status;
    }

    const offset = (Number(page) - 1) * Number(limit);

    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        include: {
          steps: {
            orderBy: { stepNumber: 'asc' }
          },
          _count: {
            select: {
              contacts: true,
              emailLogs: {
                where: { type: 'SENT' }
              }
            }
          }
        },
        orderBy: { updatedAt: 'desc' },
        skip: offset,
        take: Number(limit)
      }),
      prisma.campaign.count({ where })
    ]);

    res.json({
      campaigns,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    next(error);
  }
});

// @route   POST /api/campaigns
// @desc    Create campaign
// @access  Private
router.post(
  '/',
  authenticateToken,
  requireWorkspace,
  createCampaignValidation,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const data = {
        ...req.body,
        workspaceId: req.workspace!.id
      };

      const campaign = await campaignService.createCampaign(req.workspace!.id, data);
      return res.status(201).json(campaign);
    } catch (error: any) {
      next(error);
    }
  }
);

// @route   GET /api/campaigns/:campaignId
// @desc    Get campaign by ID
// @access  Private
router.get(
  '/:campaignId',
  authenticateToken,
  requireWorkspace,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { campaignId } = req.params;

      const campaign = await prisma.campaign.findFirst({
        where: {
          id: campaignId,
          workspaceId: req.workspace!.id
        },
        include: {
          steps: {
            orderBy: { stepNumber: 'asc' }
          },
          inboxes: true,
          contacts: {
            include: {
              contact: true
            },
            orderBy: { createdAt: 'desc' }
          },
          emailLogs: {
            take: 100,
            orderBy: { sentAt: 'desc' }
          }
        }
      });

      if (!campaign) {
        throw ForbiddenError('Campaign not found');
      }

      res.json(campaign);
    } catch (error: any) {
      next(error);
    }
  }
);

// @route   PUT /api/campaigns/:campaignId
// @desc    Update campaign
// @access  Private
router.put(
  '/:campaignId',
  authenticateToken,
  requireWorkspace,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { campaignId } = req.params;
      const data = req.body;

      const campaign = await campaignService.updateCampaign(campaignId, req.workspace!.id, data);
      res.json(campaign);
    } catch (error: any) {
      next(error);
    }
  }
);

// @route   DELETE /api/campaigns/:campaignId
// @desc    Delete campaign
// @access  Private
router.delete(
  '/:campaignId',
  authenticateToken,
  requireWorkspace,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { campaignId } = req.params;

      const result = await campaignService.deleteCampaign(campaignId, req.workspace!.id);
      res.json(result);
    } catch (error: any) {
      next(error);
    }
  }
);

// @route   POST /api/campaigns/:campaignId/steps
// @desc    Add step to campaign
// @access  Private
router.post(
  '/:campaignId/steps',
  authenticateToken,
  requireWorkspace,
  [
    body('subject').notEmpty().trim(),
    body('body').notEmpty(),
    body('delayHours').optional().isInt({ min: 0 }),
    body('delayDays').optional().isInt({ min: 0 }),
    body('delayMinutes').optional().isInt({ min: 0 }),
    body('isEnabled').optional().isBoolean()
  ],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { campaignId } = req.params;
      const step = await campaignService.addStep(campaignId, req.workspace!.id, req.body);

      return res.status(201).json(step);
    } catch (error: any) {
      next(error);
    }
  }
);

// @route   PUT /api/campaigns/:campaignId/steps/:stepNumber
// @desc    Update campaign step
// @access  Private
router.put(
  '/:campaignId/steps/:stepNumber',
  authenticateToken,
  requireWorkspace,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { campaignId, stepNumber } = req.params;
      const { subject, body, delayHours, delayDays, delayMinutes, isEnabled } = req.body;

      const step = await prisma.campaignStep.update({
        where: {
          campaignId_stepNumber: {
            campaignId,
            stepNumber: Number(stepNumber)
          }
        },
        data: {
          subject,
          body,
          delayHours,
          delayDays,
          delayMinutes,
          isEnabled
        }
      });

      res.json(step);
    } catch (error: any) {
      next(error);
    }
  }
);

// @route   DELETE /api/campaigns/:campaignId/steps/:stepNumber
// @desc    Delete campaign step
// @access  Private
router.delete(
  '/:campaignId/steps/:stepNumber',
  authenticateToken,
  requireWorkspace,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { campaignId, stepNumber } = req.params;

      await prisma.campaignStep.delete({
        where: {
          campaignId_stepNumber: {
            campaignId,
            stepNumber: Number(stepNumber)
          }
        }
      });

      // Reorder remaining steps
      const remainingSteps = await prisma.campaignStep.findMany({
        where: { campaignId },
        orderBy: { stepNumber: 'asc' }
      });

      for (let i = 0; i < remainingSteps.length; i++) {
        await prisma.campaignStep.update({
          where: { id: remainingSteps[i].id },
          data: { stepNumber: i + 1 }
        });
      }

      res.json({ success: true });
    } catch (error: any) {
      next(error);
    }
  }
);

// @route   POST /api/campaigns/:campaignId/contacts
// @desc    Add contacts to campaign
// @access  Private
router.post(
  '/:campaignId/contacts',
  authenticateToken,
  requireWorkspace,
  [
    body('contactIds').isArray().notEmpty(),
    body('listId').optional()
  ],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { campaignId } = req.params;
      const { contactIds, listId } = req.body;

      let finalContactIds = contactIds;

      // If listId is provided, get all contacts from that list
      if (listId) {
        const listContacts = await prisma.contactListContact.findMany({
          where: { listId },
          select: { contactId: true }
        });
        finalContactIds = listContacts.map((lc: any) => lc.contactId);
      }

      const results = await campaignService.addContacts(campaignId, req.workspace!.id, finalContactIds);

      const errorsList = results.filter(r => !r.success);
      if (errorsList.length > 0) {
        return res.status(207).json({
          success: true,
          added: results.filter(r => r.success).length,
          errors: errorsList
        });
      }

      return res.json({
        success: true,
        added: results.filter(r => r.success).length
      });
    } catch (error: any) {
      next(error);
    }
  }
);

// @route   POST /api/campaigns/:campaignId/start
// @desc    Start campaign
// @access  Private
router.post(
  '/:campaignId/start',
  authenticateToken,
  requireWorkspace,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { campaignId } = req.params;
      const campaign = await campaignService.startCampaign(campaignId, req.workspace!.id);
      res.json(campaign);
    } catch (error: any) {
      next(error);
    }
  }
);

// @route   POST /api/campaigns/:campaignId/pause
// @desc    Pause campaign
// @access  Private
router.post(
  '/:campaignId/pause',
  authenticateToken,
  requireWorkspace,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { campaignId } = req.params;
      const campaign = await campaignService.pauseCampaign(campaignId, req.workspace!.id);
      res.json(campaign);
    } catch (error: any) {
      next(error);
    }
  }
);

// @route   POST /api/campaigns/:campaignId/resume
// @desc    Resume campaign
// @access  Private
router.post(
  '/:campaignId/resume',
  authenticateToken,
  requireWorkspace,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { campaignId } = req.params;
      const campaign = await campaignService.resumeCampaign(campaignId, req.workspace!.id);
      res.json(campaign);
    } catch (error: any) {
      next(error);
    }
  }
);

// @route   POST /api/campaigns/:campaignId/stop
// @desc    Stop/Archive campaign
// @access  Private
router.post(
  '/:campaignId/stop',
  authenticateToken,
  requireWorkspace,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { campaignId } = req.params;
      const campaign = await campaignService.stopCampaign(campaignId, req.workspace!.id);
      res.json(campaign);
    } catch (error: any) {
      next(error);
    }
  }
);

// @route   GET /api/campaigns/:campaignId/stats
// @desc    Get campaign statistics
// @access  Private
router.get(
  '/:campaignId/stats',
  authenticateToken,
  requireWorkspace,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { campaignId } = req.params;
      const stats = await campaignService.getCampaignStats(campaignId, req.workspace!.id);
      res.json(stats);
    } catch (error: any) {
      next(error);
    }
  }
);

// @route   POST /api/campaigns/:campaignId/inboxes/:inboxId
// @desc    Add inbox to campaign
// @access  Private
router.post(
  '/:campaignId/inboxes/:inboxId',
  authenticateToken,
  requireWorkspace,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { campaignId, inboxId } = req.params;

      // Verify both exist and belong to workspace
      const [campaign, inbox] = await Promise.all([
        prisma.campaign.findFirst({
          where: { id: campaignId, workspaceId: req.workspace!.id }
        }),
        prisma.inbox.findFirst({
          where: { id: inboxId, workspaceId: req.workspace!.id }
        })
      ]);

      if (!campaign || !inbox) {
        throw ForbiddenError('Campaign or inbox not found');
      }

      const link = await prisma.campaignInbox.create({
        data: {
          campaignId,
          inboxId
        }
      });

      res.json(link);
    } catch (error: any) {
      next(error);
    }
  }
);

// @route   DELETE /api/campaigns/:campaignId/inboxes/:inboxId
// @desc    Remove inbox from campaign
// @access  Private
router.delete(
  '/:campaignId/inboxes/:inboxId',
  authenticateToken,
  requireWorkspace,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { campaignId, inboxId } = req.params;

      await prisma.campaignInbox.delete({
        where: {
          campaignId_inboxId: {
            campaignId,
            inboxId
          }
        }
      });

      res.json({ success: true });
    } catch (error: any) {
      next(error);
    }
  }
);

export default router;
