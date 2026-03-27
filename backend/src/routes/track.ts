import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

const router = Router();

// @route   GET /track/open/:trackingId
// @desc    Track email opens (1x1 pixel)
// @access  Public
router.get('/open/:trackingId', async (req: Request, res: Response) => {
  try {
    const { trackingId } = req.params;

    const emailLog = await prisma.emailLog.findUnique({
      where: { trackingId }
    });

    if (emailLog && !emailLog.openedAt) {
      await prisma.emailLog.update({
        where: { trackingId },
        data: {
          openedAt: new Date(),
          type: 'OPENED'
        }
      });

      logger.info(`Email opened: ${emailLog.emailLogId}`);
    }

    // Return 1x1 transparent pixel
    const pixel = Buffer.from(
      'R0lGODlhAQABAPAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==',
      'base64'
    );

    res.set('Content-Type', 'image/gif');
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.send(pixel);
  } catch (error: any) {
    logger.error('Tracking error:', error);
    res.status(404).end();
  }
});

// @route   GET /track/click/:trackingId
// @desc    Track link clicks and redirect
// @access  Public
router.get('/click/:trackingId', async (req: Request, res: Response) => {
  try {
    const { trackingId } = req.params;
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    const emailLog = await prisma.emailLog.findUnique({
      where: { trackingId }
    });

    if (emailLog && !emailLog.clickedAt) {
      await prisma.emailLog.update({
        where: { trackingId },
        data: {
          clickedAt: new Date(),
          type: 'CLICKED'
        }
      });

      logger.info(`Link clicked: ${emailLog.emailLogId}`);
    }

    // Redirect to original URL
    res.redirect(url as string);
  } catch (error: any) {
    logger.error('Click tracking error:', error);
    res.status(400).json({ error: 'Invalid tracking ID or URL' });
  }
});

export default router;
