import nodemailer from 'nodemailer';
import { prisma } from '../config/database';
import { decrypt } from '../utils/crypto';
import { logger } from '../utils/logger';
import { generateSecureToken } from '../utils/crypto';
import { emailQueue } from '../queues';

export class EmailService {
  private static instance: EmailService;
  private transponders: Map<string, nodemailer.Transporter> = new Map();

  static getInstance(): EmailService {
    if (!this.instance) {
      this.instance = new EmailService();
    }
    return this.instance;
  }

  async createTransporter(inboxId: string, credentials: any) {
    const cacheKey = `transporter-${inboxId}`;

    if (this.transponders.has(cacheKey)) {
      return this.transponders.get(cacheKey)!;
    }

    let transporter: nodemailer.Transporter;

    if (credentials.smtpHost) {
      // SMTP configuration
      transporter = nodemailer.createTransport({
        host: credentials.smtpHost,
        port: credentials.smtpPort || 587,
        secure: credentials.smtpPort === 465,
        auth: {
          user: credentials.smtpUser,
          pass: credentials.smtpPass
        },
        connectionTimeout: 30000,
        greetingTimeout: 30000,
        socketTimeout: 60000
      });
    } else {
      // Gmail OAuth2
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: credentials.email,
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          accessToken: credentials.accessToken,
          refreshToken: credentials.refreshToken
        }
      });
    }

    // Verify connection
    try {
      await transporter.verify();
      this.transponders.set(cacheKey, transporter);
      logger.info(`Transporter created for inbox: ${inboxId}`);
    } catch (error) {
      logger.error(`Transporter verification failed for inbox ${inboxId}:`, error);
      throw error;
    }

    return transporter;
  }

  async sendEmail(params: {
    inboxId: string;
    to: string;
    subject: string;
    html: string;
    text?: string;
    campaignId?: string;
    contactId: string;
    stepId?: string;
    trackingId?: string;
  }) {
    const { inboxId, to, subject, html, text, campaignId, contactId, stepId, trackingId } = params;

    try {
      // Get inbox details
      const inbox = await prisma.inbox.findUnique({
        where: { id: inboxId }
      });

      if (!inbox) {
        throw new Error('Inbox not found');
      }

      if (!inbox.isActive) {
        throw new Error('Inbox is not active');
      }

      if (inbox.sentCountToday >= inbox.dailyLimit) {
        throw new Error('Daily sending limit reached for this inbox');
      }

      // Decrypt credentials
      const credentials = JSON.parse(decrypt(inbox.encryptedCreds));
      credentials.email = inbox.email;

      // Create transporter
      const transporter = await this.createTransporter(inboxId, credentials);

      // Generate tracking pixel and links if tracking is enabled
      let processedHtml = html;
      let processedText = text;

      if (trackingId) {
        processedHtml = this.addOpenTracking(html, trackingId);
        processedHtml = this.addClickTracking(processedHtml, trackingId);
      }

      // Prepare email options
      const mailOptions: nodemailer.SendMailOptions = {
        from: {
          name: params.fromName || inbox.email,
          address: inbox.email
        },
        to,
        subject,
        html: processedHtml,
        text: processedText,
        headers: {
          'X-Mailer': 'EmailAutomationSaaS',
          'X-Campaign-ID': campaignId || '',
          'X-Contact-ID': contactId,
          'X-Step-ID': stepId || '',
          'Message-ID': `<${generateSecureToken(32)}@${process.env.TRACKING_DOMAIN || 'localhost'}>`
        }
      };

      // Send email
      const info = await transporter.sendMail(mailOptions);

      // Update inbox sent count
      await prisma.inbox.update({
        where: { id: inboxId },
        data: {
          sentCountToday: { increment: 1 },
          lastSentAt: new Date()
        }
      });

      // Log email
      const emailLog = await prisma.emailLog.create({
        data: {
          workspaceId: inbox.workspaceId,
          campaignId,
          inboxId,
          contactId,
          stepId,
          type: 'SENT',
          sentAt: new Date(),
          trackingId: trackingId || generateSecureToken(32),
          messageId: info.messageId,
          smtpResponse: JSON.stringify(info.response)
        }
      });

      // Update campaign contact stats
      if (campaignId && contactId) {
        await prisma.campaignContact.update({
          where: {
            campaignId_contactId: {
              campaignId,
              contactId
            }
          },
          data: {
            lastSentAt: new Date(),
            status: 'IN_PROGRESS'
          }
        });
      }

      logger.info(`Email sent to ${to} from ${inbox.email}`, {
        inboxId,
        messageId: info.messageId
      });

      return {
        success: true,
        messageId: info.messageId,
        emailLogId: emailLog.id
      };
    } catch (error: any) {
      logger.error(`Failed to send email to ${to}:`, error);

      // Log bounce if applicable
      if (error.code === 'EAUTH') {
        // Authentication error - mark inbox as potentially unhealthy
        await prisma.inbox.update({
          where: { id: inboxId },
          data: { healthScore: Math.max(0, 0.3) }
        });
      }

      throw error;
    }
  }

  private addOpenTracking(html: string, trackingId: string): string {
    const trackingPixel = `<img src="${process.env.TRACKING_DOMAIN || 'http://localhost:3001'}/track/open/${trackingId}" width="1" height="1" alt="" style="display:none" />`;

    // Insert pixel before </body>
    if (html.includes('</body>')) {
      return html.replace('</body>', `${trackingPixel}</body>`);
    }

    return trackingPixel + html;
  }

  private addClickTracking(html: string, trackingId: string): string {
    // Simple regex-based link rewriting (for production, use a proper HTML parser)
    const linkRegex = /href="([^"]+)"/g;

    return html.replace(linkRegex, (match, url) => {
      if (url.startsWith('http') || url.startsWith('mailto:') || url.startsWith('tel:')) {
        const trackingUrl = `${process.env.TRACKING_DOMAIN || 'http://localhost:3001'}/track/click/${trackingId}?url=${encodeURIComponent(url)}`;
        return `href="${trackingUrl}"`;
      }
      return match;
    });
  }

  async sendCampaignEmail(params: {
    campaignId: string;
    contactId: string;
    workspaceId: string;
  }) {
    // This would be called as a queued job
    try {
      const { campaignId, contactId, workspaceId } = params;

      // Get campaign details with steps and inboxes
      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
        include: {
          steps: {
            orderBy: { stepNumber: 'asc' }
          },
          inboxes: true
        }
      });

      if (!campaign) {
        throw new Error('Campaign not found');
      }

      const contact = await prisma.contact.findUnique({
        where: { id: contactId }
      });

      if (!contact) {
        throw new Error('Contact not found');
      }

      // Check if we should stop due to reply
      if (campaign.stopOnReply) {
        const hasReplied = await prisma.reply.findFirst({
          where: {
            contactId,
            workspaceId
          }
        });

        if (hasReplied) {
          await prisma.campaignContact.update({
            where: {
              campaignId_contactId: { campaignId, contactId }
            },
            data: { status: 'STOPPED' }
          });
          logger.info(`Campaign ${campaignId} stopped for contact ${contactId} due to reply`);
          return;
        }
      }

      // Find next step to send
      const campaignContact = await prisma.campaignContact.findUnique({
        where: {
          campaignId_contactId: {
            campaignId,
            contactId
          }
        }
      });

      if (!campaignContact) {
        throw new Error('Campaign contact relationship not found');
      }

      // Determine which step to send
      let stepToSend: any = null;
      let stepNumber = 1;

      if (campaignContact.status === 'PENDING') {
        stepToSend = campaign.steps[0];
      } else if (campaignContact.status === 'IN_PROGRESS') {
        // Find the last sent step
        const lastEmailLog = await prisma.emailLog.findFirst({
          where: {
            campaignId,
            contactId,
            type: 'SENT'
          },
          orderBy: { sentAt: 'desc' }
        });

        if (lastEmailLog) {
          const lastStepNumber = lastEmailLog.stepId
            ? campaign.steps.find(s => s.id === lastEmailLog.stepId)?.stepNumber || 1
            : 1;
          stepNumber = lastStepNumber + 1;
          stepToSend = campaign.steps.find(s => s.stepNumber === stepNumber);
        } else {
          stepToSend = campaign.steps[0];
        }
      }

      if (!stepToSend || !stepToSend.isEnabled) {
        // No more steps or step disabled
        await prisma.campaignContact.update({
          where: {
            campaignId_contactId: { campaignId, contactId }
          },
          data: { status: 'COMPLETED' }
        });
        await prisma.campaign.update({
          where: { id: campaignId },
          data: {
            totalSent: { increment: 1 }
          }
        });
        return;
      }

      // Get an inbox to send from (rotate or select based on health)
      const inbox = await this.selectInbox(campaign.workspaceId, campaign.inboxes);
      if (!inbox) {
        throw new Error('No available inbox');
      }

      // Add random delays if configured
      if (campaign.minDelay > 0 || campaign.maxDelay > 0) {
        const delayMinutes = this.getRandomDelay(
          campaign.minDelay,
          campaign.maxDelay
        );
        await this.delay(delayMinutes * 60 * 1000);
      }

      // Process spintax and personalization
      const personalizationData = {
        firstName: contact.firstName || contact.fullName || '',
        lastName: contact.lastName || '',
        email: contact.email,
        company: contact.company || '',
        position: contact.position || ''
      };

      const subject = this.processSpintax(stepToSend.subject, personalizationData);
      const body = this.processSpintax(stepToSend.body, personalizationData);

      // Generate tracking ID
      const trackingId = generateSecureToken(32);

      // Send the email
      await this.sendEmail({
        inboxId: inbox.id,
        to: contact.email,
        subject,
        html: body,
        text: this.htmlToText(body),
        campaignId,
        contactId,
        stepId: stepToSend.id,
        trackingId
      });

      // Update campaign contact with next send time
      const nextSendAt = this.calculateNextSendTime(stepToSend);
      await prisma.campaignContact.update({
        where: {
          campaignId_contactId: { campaignId, contactId }
        },
        data: {
          lastSentAt: new Date(),
          nextSendAt,
          status: 'PENDING'
        }
      });

      // Schedule next step if there are more
      const nextStepNumber = stepNumber + 1;
      const nextStep = campaign.steps.find(s => s.stepNumber === nextStepNumber);

      if (nextStep && nextStep.isEnabled) {
        const scheduleTime = this.calculateDelay(nextStep);
        await emailQueue.add('SEND_CAMPAIGN_EMAIL', {
          campaignId,
          contactId,
          workspaceId
        }, {
          delay: scheduleTime,
          jobId: `${campaignId}-${contactId}-step-${nextStepNumber}`
        });
      } else {
        // Campaign complete for this contact
        await prisma.campaignContact.update({
          where: {
            campaignId_contactId: { campaignId, contactId }
          },
          data: { status: 'COMPLETED' }
        });
      }

      logger.info(`Campaign email sent: ${campaignId} to ${contact.email}, step ${stepNumber}`);
    } catch (error: any) {
      logger.error(`Campaign email failed: ${campaignId} to ${contactId}:`, error);

      // Update campaign contact status to error
      await prisma.campaignContact.update({
        where: {
          campaignId_contactId: { campaignId, contactId }
        },
        data: { status: 'STOPPED' }
      }).catch(() => {});

      throw error;
    }
  }

  private async selectInbox(workspaceId: string, campaignInboxes: any[]) {
    // Get all inboxes for workspace that are active and under daily limit
    const inboxes = await prisma.inbox.findMany({
      where: {
        workspaceId,
        isActive: true
      }
    });

    const availableInboxes = inboxes.filter(
      i => i.sentCountToday < i.dailyLimit && i.healthScore > 0.3
    );

    if (availableInboxes.length === 0) {
      return null;
    }

    // Sort by health score (descending) and then by sent count (ascending)
    availableInboxes.sort((a, b) => {
      if (b.healthScore !== a.healthScore) {
        return b.healthScore - a.healthScore;
      }
      return a.sentCountToday - b.sentCountToday;
    });

    return availableInboxes[0];
  }

  private getRandomDelay(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private calculateNextSendTime(step: any): Date | null {
    if (!step.delayHours && !step.delayDays) {
      return null;
    }

    const now = new Date();
    const delayMs = (
      (step.delayDays || 0) * 24 * 60 * 60 * 1000 +
      (step.delayHours || 0) * 60 * 60 * 1000 +
      (step.delayMinutes || 0) * 60 * 1000
    );

    return new Date(now.getTime() + delayMs);
  }

  private calculateDelay(step: any): number {
    return (
      (step.delayDays || 0) * 24 * 60 * 60 * 1000 +
      (step.delayHours || 0) * 60 * 60 * 1000 +
      (step.delayMinutes || 0) * 60 * 1000
    );
  }

  private processSpintax(text: string, data: Record<string, string>): string {
    // Replace personalization variables
    let processed = text;
    for (const [key, value] of Object.entries(data)) {
      processed = processed.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'gi'), value);
    }

    // Process spintax {option1|option2|option3}
    processed = processed.replace(/\{([^{}]+)\}/g, (match, options) => {
      const choices = options.split('|').map(s => s.trim());
      return choices[Math.floor(Math.random() * choices.length)];
    });

    return processed;
  }

  private htmlToText(html: string): string {
    // Simple HTML to text conversion (use a proper library in production)
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<p[^>]*>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async resetDailyCounts() {
    // Reset sentCountToday for all inboxes at midnight
    const result = await prisma.inbox.updateMany({
      where: {},
      data: {
        sentCountToday: 0,
        lastSentAt: null
      }
    });

    logger.info(`Reset daily counts for ${result.count} inboxes`);
    return result;
  }
}

export const emailService = EmailService.getInstance();
