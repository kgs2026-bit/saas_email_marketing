import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { authenticateToken, requireWorkspace, AuthRequest } from '../middleware/auth';

const router = Router();

// @route   GET /api/analytics/overview
// @desc    Get overview analytics for workspace
// @access  Private
router.get('/overview', authenticateToken, requireWorkspace, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.workspace!.id;
    const { startDate, endDate } = req.query;

    const dateFilter = startDate && endDate
      ? {
          sentAt: {
            gte: new Date(startDate as string),
            lte: new Date(endDate as string)
          }
        }
      : {};

    const emailLogs = await prisma.emailLog.findMany({
      where: {
        workspaceId,
        ...dateFilter
      },
      select: {
        type: true,
        sentAt: true
      }
    });

    const campaigns = await prisma.campaign.findMany({
      where: { workspaceId },
      select: {
        status: true
      }
    });

    // Calculate metrics
    const totalSent = emailLogs.filter((l: any) => l.type === 'SENT').length;
    const totalOpened = emailLogs.filter((l: any) => l.type === 'OPENED').length;
    const totalClicked = emailLogs.filter((l: any) => l.type === 'CLICKED').length;
    const totalBounced = emailLogs.filter((l: any) => l.type === 'BOUNCED').length;
    const totalReplied = emailLogs.filter((l: any) => l.type === 'REPLY').length;

    const activeCampaigns = campaigns.filter((c: any) => c.status === 'ACTIVE').length;
    const totalCampaigns = campaigns.length;

    res.json({
      totalSent,
      totalOpened,
      totalClicked,
      totalBounced,
      totalReplied,
      openRate: totalSent > 0 ? (totalOpened / totalSent) * 100 : 0,
      clickRate: totalSent > 0 ? (totalClicked / totalSent) * 100 : 0,
      bounceRate: totalSent > 0 ? (totalBounced / totalSent) * 100 : 0,
      replyRate: totalSent > 0 ? (totalReplied / totalSent) * 100 : 0,
      activeCampaigns,
      totalCampaigns
    });
  } catch (error: any) {
    next(error);
  }
});

// @route   GET /api/analytics/campaign/:campaignId
// @desc    Get detailed analytics for a campaign
// @access  Private
router.get(
  '/campaign/:campaignId',
  authenticateToken,
  requireWorkspace,
  async (req: AuthRequest, res: Response, next) => {
    try {
      const { campaignId } = req.params;
      const { startDate, endDate } = req.query;

      const campaign = await prisma.campaign.findFirst({
        where: {
          id: campaignId,
          workspaceId: req.workspace!.id
        }
      });

      if (!campaign) {
        throw new Error('Campaign not found');
      }

      const dateFilter = startDate && endDate
        ? {
            sentAt: {
              gte: new Date(startDate as string),
              lte: new Date(endDate as string)
            }
          }
        : {};

      const emailLogs = await prisma.emailLog.findMany({
        where: {
          campaignId,
          workspaceId: req.workspace!.id,
          ...dateFilter
        },
        select: {
          type: true,
          sentAt: true
        }
      });

      const totalSent = emailLogs.filter((l: any) => l.type === 'SENT').length;
      const totalOpened = emailLogs.filter((l: any) => l.type === 'OPENED').length;
      const totalClicked = emailLogs.filter((l: any) => l.type === 'CLICKED').length;
      const totalBounced = emailLogs.filter((l: any) => l.type === 'BOUNCED').length;
      const totalReplied = emailLogs.filter((l: any) => l.type === 'REPLY').length;

      // Get daily stats
      const dailyStats = await prisma.emailLog.groupBy({
        by: ['sentAt'],
        where: {
          campaignId,
          workspaceId: req.workspace!.id,
          ...dateFilter
        },
        _all: true,
        orderBy: { sentAt: 'asc' }
      });

      res.json({
        campaign: {
          id: campaign.id,
          name: campaign.name,
          status: campaign.status,
          startDate: campaign.startedAt,
          totalContacts: campaign.totalSent
        },
        metrics: {
          totalSent,
          totalOpened,
          totalClicked,
          totalBounced,
          totalReplied,
          openRate: totalSent > 0 ? (totalOpened / totalSent) * 100 : 0,
          clickRate: totalSent > 0 ? (totalClicked / totalSent) * 100 : 0,
          bounceRate: totalSent > 0 ? (totalBounced / totalSent) * 100 : 0,
          replyRate: totalSent > 0 ? (totalReplied / totalSent) * 100 : 0
        },
        dailyStats
      });
    } catch (error: any) {
      next(error);
    }
  }
);

// @route   GET /api/analytics/inboxes
// @desc    Get inbox performance analytics
// @access  Private
router.get('/inboxes', authenticateToken, requireWorkspace, async (req: AuthRequest, res: Response, next) => {
  try {
    const { startDate, endDate } = req.query;
    const workspaceId = req.workspace!.id;

    const dateFilter = startDate && endDate
      ? {
          sentAt: {
            gte: new Date(startDate as string),
            lte: new Date(endDate as string)
          }
        }
      : {};

    const inboxStats = await prisma.inbox.groupBy({
      by: ['id', 'email'],
      where: {
        workspaceId
      },
      _all: {
        _sum: {
          sentCountToday: true
        }
      }
    });

    // Get email logs per inbox
    const inboxPerformance = await prisma.emailLog.groupBy({
      by: ['inboxId'],
      where: {
        workspaceId,
        ...dateFilter
      },
      _all: true
    });

    const result = inboxStats.map((inbox: any) => {
      return {
        inboxId: inbox.id,
        email: inbox.email,
        sentCount: inbox._sum.sentCountToday || 0,
        openCount: 0, // Calculate from type filters
        clickCount: 0,
        bounceCount: 0
      };
    });

    res.json(result);
  } catch (error: any) {
    next(error);
  }
});

// @route   GET /api/analytics/trends
// @desc    Get email trends over time
// @access  Private
router.get('/trends', authenticateToken, requireWorkspace, async (req: AuthRequest, res: Response, next) => {
  try {
    const workspaceId = req.workspace!.id;
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(days));

    const dailyStats = await prisma.emailLog.groupBy({
      by: ['sentAt'],
      where: {
        workspaceId,
        sentAt: {
          gte: startDate
        }
      },
      _all: true,
      orderBy: { sentAt: 'asc' }
    });

    const result = dailyStats.map((day: any) => ({
      date: day.sentAt.toISOString().split('T')[0],
      sent: day._all.count,
      opened: 0, // Would need separate groupBy or aggregate
      clicked: 0,
      bounced: 0
    }));

    res.json(result);
  } catch (error: any) {
    next(error);
  }
});

// @route   GET /api/analytics/replies
// @desc    Get reply analytics
// @access  Private
router.get('/replies', authenticateToken, requireWorkspace, async (req: AuthRequest, res: Response, next) => {
  try {
    const workspaceId = req.workspace!.id;
    const { limit = 50 } = req.query;

    const replies = await prisma.reply.findMany({
      where: { workspaceId },
      orderBy: { receivedAt: 'desc' },
      take: Number(limit),
      include: {
        contact: {
          select: {
            id: true,
            email: true,
            fullName: true
          }
        }
      }
    });

    const stats = {
      totalReplies: replies.length,
      markedInteresting: replies.filter((r: any) => r.isInteresting).length,
      byTag: replies.reduce((acc: Record<string, number>, r: any) => {
        r.tags.forEach((tag: string) => {
          acc[tag] = (acc[tag] || 0) + 1;
        });
        return acc;
      }, {} as Record<string, number>)
    };

    res.json({
      stats,
      recentReplies: replies.slice(0, 50)
    });
  } catch (error: any) {
    next(error);
  }
});

export default router;
