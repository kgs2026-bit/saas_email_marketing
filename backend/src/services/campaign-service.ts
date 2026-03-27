import { prisma } from '../config/database';
import { emailService } from './email-service';
import { emailQueue } from '../queues';
import { logger } from '../utils/logger';
import { validatePlanLimits } from '../middleware/workspace';

export class CampaignService {
  async createCampaign(workspaceId: string, data: any) {
    // Check plan limits
    const canCreate = await validatePlanLimits({ workspace: { id: workspaceId } as any, user: {} as any }, 'campaigns');
    if (!canCreate) {
      throw new Error('Campaign limit reached for your plan. Please upgrade.');
    }

    // Generate unique slug
    const slug = this.generateSlug(data.name);

    // Check for duplicate slug
    const existing = await prisma.campaign.findFirst({
      where: {
        workspaceId,
        slug
      }
    });

    if (existing) {
      throw new Error('Campaign with this name already exists');
    }

    const campaign = await prisma.campaign.create({
      data: {
        ...data,
        workspaceId,
        slug
      },
      include: {
        steps: {
          orderBy: { stepNumber: 'asc' }
        },
        inboxes: true
      }
    });

    logger.info(`Campaign created: ${campaign.id} for workspace: ${workspaceId}`);

    return campaign;
  }

  async updateCampaign(campaignId: string, workspaceId: string, data: any) {
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, workspaceId }
    });

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    const updated = await prisma.campaign.update({
      where: { id: campaignId },
      data,
      include: {
        steps: {
          orderBy: { stepNumber: 'asc' }
        },
        inboxes: true
      }
    });

    logger.info(`Campaign updated: ${campaignId}`);
    return updated;
  }

  async addStep(campaignId: string, workspaceId: string, stepData: any) {
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, workspaceId }
    });

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    const stepNumber = campaign.steps.length + 1;

    const step = await prisma.campaignStep.create({
      data: {
        campaignId,
        stepNumber,
        subject: stepData.subject,
        body: stepData.body,
        delayHours: stepData.delayHours || 0,
        delayDays: stepData.delayDays || 0,
        delayMinutes: stepData.delayMinutes || 0,
        isEnabled: stepData.isEnabled !== false
      }
    });

    logger.info(`Step added to campaign ${campaignId}: step ${stepNumber}`);
    return step;
  }

  async addContacts(campaignId: string, workspaceId: string, contactIds: string[]) {
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, workspaceId }
    });

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // Check contact limit
    const contactCount = await prisma.contact.count({
      where: { workspaceId }
    });

    const planLimit = this.getPlanLimit(campaign.workspacePlan || 'FREE', 'contacts');
    if (planLimit !== -1 && contactCount + contactIds.length > planLimit) {
      throw new Error(`Contact limit exceeded. Current: ${contactCount}, Adding: ${contactIds.length}, Limit: ${planLimit}`);
    }

    const results = [];
    for (const contactId of contactIds) {
      try {
        const campaignContact = await prisma.campaignContact.create({
          data: {
            campaignId,
            contactId
          }
        });
        results.push({ contactId, success: true });
      } catch (error: any) {
        results.push({ contactId, success: false, error: error.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    logger.info(`Added ${successCount} contacts to campaign ${campaignId}`);

    return results;
  }

  async startCampaign(campaignId: string, workspaceId: string) {
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, workspaceId },
      include: {
        steps: true,
        contacts: {
          include: {
            contact: true
          }
        },
        inboxes: true
      }
    });

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    if (campaign.status === 'ACTIVE') {
      throw new Error('Campaign is already active');
    }

    if (campaign.steps.length === 0) {
      throw new Error('Campaign has no steps defined');
    }

    if (campaign.contacts.length === 0) {
      throw new Error('Campaign has no contacts');
    }

    if (!campaign.inboxes || campaign.inboxes.length === 0) {
      throw new Error('Campaign has no inboxes configured');
    }

    // Check workspace plan limits
    const canStart = await validatePlanLimits({ workspace: { id: workspaceId } as any, user: {} as any }, 'campaigns');
    if (!canStart) {
      throw new Error('Plan limit exceeded. Please upgrade.');
    }

    // Update campaign status
    const updated = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: 'ACTIVE',
        startedAt: new Date()
      }
    });

    // Queue emails for all contacts
    for (const cc of campaign.contacts) {
      try {
        await emailQueue.add('SEND_CAMPAIGN_EMAIL', {
          campaignId,
          contactId: cc.contactId,
          workspaceId
        }, {
          jobId: `${campaignId}-${cc.contactId}-step-1`,
          // Start immediately
          delay: 0
        });
      } catch (error) {
        logger.error(`Failed to queue email for contact ${cc.contactId}:`, error);
      }
    }

    logger.info(`Campaign started: ${campaignId} with ${campaign.contacts.length} contacts`);
    return updated;
  }

  async pauseCampaign(campaignId: string, workspaceId: string) {
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, workspaceId }
    });

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    if (campaign.status !== 'ACTIVE') {
      throw new Error('Campaign is not active');
    }

    // Pause all pending jobs
    await emailQueue.pause();

    const updated = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: 'PAUSED',
        pausedAt: new Date()
      }
    });

    logger.info(`Campaign paused: ${campaignId}`);
    return updated;
  }

  async resumeCampaign(campaignId: string, workspaceId: string) {
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, workspaceId }
    });

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    if (campaign.status !== 'PAUSED') {
      throw new Error('Campaign is not paused');
    }

    // Resume queue
    await emailQueue.resume();

    const updated = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: 'ACTIVE',
        pausedAt: null
      }
    });

    // Re-queue all pending contacts
    const pendingContacts = await prisma.campaignContact.findMany({
      where: {
        campaignId,
        status: 'PENDING'
      }
    });

    for (const cc of pendingContacts) {
      await emailQueue.add('SEND_CAMPAIGN_EMAIL', {
        campaignId,
        contactId: cc.contactId,
        workspaceId
      }, {
        jobId: `${campaignId}-${cc.contactId}-resume`,
        delay: 0
      });
    }

    logger.info(`Campaign resumed: ${campaignId} with ${pendingContacts.length} pending contacts`);
    return updated;
  }

  async stopCampaign(campaignId: string, workspaceId: string) {
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, workspaceId }
    });

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // Remove all pending jobs
    await emailQueue.removeByPrefix(`${campaignId}-`);

    const updated = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: 'ARCHIVED',
        completedAt: new Date()
      }
    });

    logger.info(`Campaign stopped: ${campaignId}`);
    return updated;
  }

  async deleteCampaign(campaignId: string, workspaceId: string) {
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, workspaceId }
    });

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // Remove all queued jobs
    await emailQueue.removeByPrefix(`${campaignId}-`);

    await prisma.campaign.delete({
      where: { id: campaignId }
    });

    logger.info(`Campaign deleted: ${campaignId}`);
    return { success: true };
  }

  async getCampaignStats(campaignId: string, workspaceId: string) {
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, workspaceId },
      include: {
        steps: true,
        emailLogs: {
          where: {
            type: 'SENT'
          }
        }
      }
    });

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    const totalContacts = await prisma.campaignContact.count({
      where: { campaignId }
    });

    const sentCount = campaign.emailLogs.length;
    const openedCount = await prisma.emailLog.count({
      where: {
        campaignId,
        type: 'OPENED'
      }
    });
    const clickedCount = await prisma.emailLog.count({
      where: {
        campaignId,
        type: 'CLICKED'
      }
    });
    const repliedCount = await prisma.campaignContact.count({
      where: {
        campaignId,
        status: 'REPLIED'
      }
    });
    const bouncedCount = await prisma.emailLog.count({
      where: {
        campaignId,
        type: 'BOUNCED'
      }
    });

    return {
      totalContacts,
      sentCount,
      openedCount,
      clickedCount,
      repliedCount,
      bouncedCount,
      openRate: sentCount > 0 ? (openedCount / sentCount) * 100 : 0,
      clickRate: sentCount > 0 ? (clickedCount / sentCount) * 100 : 0,
      replyRate: sentCount > 0 ? (repliedCount / sentCount) * 100 : 0,
      bounceRate: sentCount > 0 ? (bouncedCount / sentCount) * 100 : 0,
      steps: campaign.steps.map(step => ({
        stepNumber: step.stepNumber,
        subject: step.subject,
        delayHours: step.delayHours,
        delayDays: step.delayDays
      }))
    };
  }

  private generateSlug(text: string): string {
    const slug = text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    return `${slug}-${Date.now().toString(36)}`;
  }

  private getPlanLimit(plan: string, resource: string): number {
    const limits: Record<string, Record<string, number>> = {
      FREE: { campaigns: 3, contacts: 100, inboxes: 1, teamMembers: 1 },
      STARTER: { campaigns: 10, contacts: 1000, inboxes: 3, teamMembers: 3 },
      GROWTH: { campaigns: 50, contacts: 10000, inboxes: 10, teamMembers: 10 },
      PRO: { campaigns: 200, contacts: 100000, inboxes: 50, teamMembers: 25 }
    };

    return limits[plan]?.[resource] ?? 0;
  }
}

export const campaignService = new CampaignService();
