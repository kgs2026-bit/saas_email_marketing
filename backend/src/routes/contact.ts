import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import csv from 'csv-parse';
import { prisma } from '../config/database';
import { authenticateToken, requireWorkspace, AuthRequest } from '../middleware/auth';
import { validatePlanLimits } from '../middleware/workspace';
import { ForbiddenError } from '../middleware/error-handler';

const router = Router();

// @route   GET /api/contacts
// @desc    Get all contacts for workspace
// @access  Private
router.get('/', authenticateToken, requireWorkspace, async (req: AuthRequest, res: Response, next) => {
  try {
    const {
      page = 1,
      limit = 50,
      listId,
      status,
      search,
      tag
    } = req.query;

    const where: any = {
      workspaceId: req.workspace!.id
    };

    if (listId) {
      const listContacts = await prisma.contactListContact.findMany({
        where: { listId: listId as string },
        select: { contactId: true }
      });
      where.id = { in: listContacts.map(lc => lc.contactId) };
    }

    if (status) {
      where.status = status;
    }

    if (tag) {
      where.tags = { has: tag };
    }

    if (search) {
      where.OR = [
        { email: { contains: search as string, mode: 'insensitive' } },
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { fullName: { contains: search as string, mode: 'insensitive' } },
        { company: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const offset = (Number(page) - 1) * Number(limit);

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        include: {
          lists: {
            include: {
              list: true
            }
          },
          _count: {
            select: {
              emailLogs: true,
              replies: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: Number(limit)
      }),
      prisma.contact.count({ where })
    ]);

    res.json({
      contacts,
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

// @route   POST /api/contacts
// @desc    Create contact manually
// @access  Private
router.post(
  '/',
  authenticateToken,
  requireWorkspace,
  [
    body('email').isEmail().normalizeEmail(),
    body('firstName').optional().trim(),
    body('lastName').optional().trim(),
    body('company').optional().trim(),
    body('position').optional().trim(),
    body('tags').optional().isArray()
  ],
  async (req: AuthRequest, res: Response, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, firstName, lastName, fullName, company, position, website, phone, tags } = req.body;

      // Check contact limit
      const canCreate = await validatePlanLimits(req, 'contacts');
      if (!canCreate) {
        throw new Error('Contact limit reached for your plan. Please upgrade.');
      }

      // Generate full name if not provided
      const finalFullName = fullName || `${firstName || ''} ${lastName || ''}`.trim() || null;

      const contact = await prisma.contact.create({
        data: {
          workspaceId: req.workspace!.id,
          email,
          firstName,
          lastName,
          fullName: finalFullName,
          company,
          position,
          website,
          phone,
          tags: tags || []
        },
        include: {
          lists: {
            include: {
              list: true
            }
          }
        }
      });

      res.status(201).json(contact);
    } catch (error: any) {
      // Handle unique constraint violation
      if (error.code === 'P2002') {
        next(new Error('Contact with this email already exists'));
        return;
      }
      next(error);
    }
  }
);

// @route   POST /api/contacts/upload
// @desc    Upload contacts via CSV
// @access  Private
router.post(
  '/upload',
  authenticateToken,
  requireWorkspace,
  async (req: AuthRequest, res: Response, next) => {
    try {
      // This expects multipart/form-data with a 'file' field
      // Implementation would need multer middleware setup
      const error = new Error('CSV upload requires multipart/form-data with "file" field');
      (error as any).statusCode = 400;
      throw error;
    } catch (error: any) {
      next(error);
    }
  }
);

// @route   GET /api/contacts/:contactId
// @desc    Get single contact
// @access  Private
router.get(
  '/:contactId',
  authenticateToken,
  requireWorkspace,
  async (req: AuthRequest, res: Response, next) => {
    try {
      const { contactId } = req.params;

      const contact = await prisma.contact.findFirst({
        where: {
          id: contactId,
          workspaceId: req.workspace!.id
        },
        include: {
          lists: {
            include: {
              list: true
            }
          },
          emailLogs: {
            take: 50,
            orderBy: { sentAt: 'desc' }
          },
          replies: {
            take: 50,
            orderBy: { receivedAt: 'desc' }
          }
        }
      });

      if (!contact) {
        throw ForbiddenError('Contact not found');
      }

      res.json(contact);
    } catch (error: any) {
      next(error);
    }
  }
);

// @route   PUT /api/contacts/:contactId
// @desc    Update contact
// @access  Private
router.put(
  '/:contactId',
  authenticateToken,
  requireWorkspace,
  [
    body('firstName').optional().trim(),
    body('lastName').optional().trim(),
    body('company').optional().trim(),
    body('position').optional().trim(),
    body('website').optional().trim(),
    body('phone').optional().trim(),
    body('tags').optional().isArray(),
    body('status').optional().isIn(['ACTIVE', 'UNSUBSCRIBED', 'BOUNCED', 'SPAM_COMPLAINT'])
  ],
  async (req: AuthRequest, res: Response, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { contactId } = req.params;

      const contact = await prisma.contact.update({
        where: {
          id: contactId,
          workspaceId: req.workspace!.id
        },
        data: req.body,
        include: {
          lists: {
            include: {
              list: true
            }
          }
        }
      });

      res.json(contact);
    } catch (error: any) {
      next(error);
    }
  }
);

// @route   DELETE /api/contacts/:contactId
// @desc    Delete contact
// @access  Private
router.delete(
  '/:contactId',
  authenticateToken,
  requireWorkspace,
  async (req: AuthRequest, res: Response, next) => {
    try {
      const { contactId } = req.params;

      await prisma.contact.delete({
        where: {
          id: contactId,
          workspaceId: req.workspace!.id
        }
      });

      res.json({ success: true });
    } catch (error: any) {
      next(error);
    }
  }
);

// @route   POST /api/contacts/:contactId/lists/:listId
// @desc    Add contact to list
// @access  Private
router.post(
  '/:contactId/lists/:listId',
  authenticateToken,
  requireWorkspace,
  async (req: AuthRequest, res: Response, next) => {
    try {
      const { contactId, listId } = req.params;

      // Verify both exist in workspace
      const [contact, list] = await Promise.all([
        prisma.contact.findFirst({
          where: { id: contactId, workspaceId: req.workspace!.id }
        }),
        prisma.contactList.findFirst({
          where: { id: listId, workspaceId: req.workspace!.id }
        })
      ]);

      if (!contact || !list) {
        throw ForbiddenError('Contact or list not found');
      }

      await prisma.contactListContact.create({
        data: {
          listId,
          contactId
        }
      });

      res.json({ success: true });
    } catch (error: any) {
      if (error.code === 'P2002') {
        res.status(200).json({ success: true, message: 'Already in list' });
        return;
      }
      next(error);
    }
  }
);

// @route   DELETE /api/contacts/:contactId/lists/:listId
// @desc    Remove contact from list
// @access  Private
router.delete(
  '/:contactId/lists/:listId',
  authenticateToken,
  requireWorkspace,
  async (req: AuthRequest, res: Response, next) => {
    try {
      const { contactId, listId } = req.params;

      await prisma.contactListContact.delete({
        where: {
          listId_contactId: {
            listId,
            contactId
          }
        }
      });

      res.json({ success: true });
    } catch (error: any) {
      next(error);
    }
  }
);

// Contact Lists Endpoints

// @route   GET /api/contacts/lists
// @desc    Get all contact lists
// @access  Private
router.get(
  '/lists',
  authenticateToken,
  requireWorkspace,
  async (req: AuthRequest, res: Response, next) => {
    try {
      const lists = await prisma.contactList.findMany({
        where: { workspaceId: req.workspace!.id },
        include: {
          _count: {
            select: {
              contacts: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json(lists);
    } catch (error: any) {
      next(error);
    }
  }
);

// @route   POST /api/contacts/lists
// @desc    Create contact list
// @access  Private
router.post(
  '/lists',
  authenticateToken,
  requireWorkspace,
  [
    body('name').notEmpty().trim()
  ],
  async (req: AuthRequest, res: Response, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, description, isDefault } = req.body;

      const list = await prisma.contactList.create({
        data: {
          workspaceId: req.workspace!.id,
          name,
          description,
          isDefault: isDefault || false
        },
        include: {
          _count: {
            select: {
              contacts: true
            }
          }
        }
      });

      res.status(201).json(list);
    } catch (error: any) {
      next(error);
    }
  }
);

// @route   POST /api/contacts/lists/:listId/upload
// @desc    Upload CSV to list
// @access  Private
router.post(
  '/lists/:listId/upload',
  authenticateToken,
  requireWorkspace,
  async (req: AuthRequest, res: Response, next) => {
    try {
      // CSRF protection would recommend checking referer origin in production
      const { listId } = req.params;

      const list = await prisma.contactList.findFirst({
        where: { id: listId, workspaceId: req.workspace!.id }
      });

      if (!list) {
        throw ForbiddenError('List not found');
      }

      // TODO: Implement CSV upload with multer
      res.json({ message: 'CSV upload endpoint - to be implemented with multer middleware' });
    } catch (error: any) {
      next(error);
    }
  }
);

export default router;
