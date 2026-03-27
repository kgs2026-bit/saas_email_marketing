import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { body, validationResult } from 'express-validator';
import { prisma } from '../config/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { workspaceMiddleware } from '../middleware/workspace';

const router = Router();

// Validation
const createWorkspaceValidation = [
  body('name').notEmpty().trim(),
  body('slug').optional().matches(/^[a-z0-9-]+$/)
];

// @route   GET /api/workspaces
// @desc    Get user's workspaces
// @access  Private
router.get('/', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const memberships = await prisma.workspaceMember.findMany({
      where: { userId: req.user!.id },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true,
            plan: true,
            ownerId: true,
            createdAt: true,
            _count: {
              select: {
                campaigns: true,
                inboxes: true,
                members: true,
                contacts: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      workspaces: memberships.map(m => m.workspace),
      currentWorkspace: memberships.find(m => m.workspace.ownerId === req.user!.id)?.workspace || memberships[0]?.workspace
    });
  } catch (error: any) {
    next(error);
  }
});

// @route   POST /api/workspaces
// @desc    Create new workspace
// @access  Private
router.post(
  '/',
  authenticateToken,
  createWorkspaceValidation,
  async (req: AuthRequest, res: Response, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, slug } = req.body;
      const generatedSlug = slug || this.generateSlug(name);

      // Check if slug exists
      const existing = await prisma.workspace.findUnique({ where: { slug: generatedSlug } });
      if (existing) {
        throw new Error('Workspace with this slug already exists');
      }

      const workspace = await prisma.$transaction(async (tx) => {
        const w = await tx.workspace.create({
          data: {
            name,
            slug: generatedSlug,
            ownerId: req.user!.id,
            plan: 'FREE'
          }
        });

        await tx.workspaceMember.create({
          data: {
            userId: req.user!.id,
            workspaceId: w.id,
            role: 'ADMIN'
          }
        });

        return w;
      });

      res.status(201).json(workspace);
    } catch (error: any) {
      next(error);
    }
  }
);

// @route   GET /api/workspaces/:workspaceId
// @desc    Get workspace by ID
// @access  Private
router.get(
  '/:workspaceId',
  authenticateToken,
  workspaceMiddleware,
  async (req: AuthRequest, res: Response, next) => {
    try {
      const workspace = await prisma.workspace.findUnique({
        where: { id: req.workspace!.id },
        include: {
          owner: {
            select: { id: true, email: true, name: true, avatarUrl: true }
          },
          _count: {
            select: {
              campaigns: true,
              inboxes: true,
              members: true,
              contacts: true
            }
          }
        }
      });

      if (!workspace) {
        throw new Error('Workspace not found');
      }

      res.json(workspace);
    } catch (error: any) {
      next(error);
    }
  }
);

// @route   PUT /api/workspaces/:workspaceId
// @desc    Update workspace
// @access  Private (Admin only)
router.put(
  '/:workspaceId',
  authenticateToken,
  workspaceMiddleware,
  requireRole(['ADMIN']),
  async (req: AuthRequest, res: Response, next) => {
    try {
      const { name } = req.body;

      const workspace = await prisma.workspace.update({
        where: { id: req.workspace!.id },
        data: { name },
        include: {
          owner: {
            select: { id: true, email: true, name: true, avatarUrl: true }
          }
        }
      });

      res.json(workspace);
    } catch (error: any) {
      next(error);
    }
  }
);

// @route   POST /api/workspaces/:workspaceId/invite
// @desc    Invite member to workspace
// @access  Private (Admin only)
router.post(
  '/:workspaceId/invite',
  authenticateToken,
  workspaceMiddleware,
  requireRole(['ADMIN']),
  [
    body('email').isEmail().normalizeEmail(),
    body('role').optional().isIn(['ADMIN', 'MEMBER'])
  ],
  async (req: AuthRequest, res: Response, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, role = 'MEMBER' } = req.body;
      const { workspaceId } = req.workspace!;

      // Check if user exists
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        // Create invitation for new user
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        const invitation = await prisma.invitation.create({
          data: {
            email,
            token,
            workspaceId,
            invitedBy: req.user!.id,
            role,
            expiresAt
          }
        });

        // TODO: Send invitation email

        res.status(201).json(invitation);
        return;
      }

      // Check if already member
      const existingMember = await prisma.workspaceMember.findFirst({
        where: {
          userId: user.id,
          workspaceId
        }
      });

      if (existingMember) {
        throw new Error('User is already a member of this workspace');
      }

      // Add member
      const member = await prisma.workspaceMember.create({
        data: {
          userId: user.id,
          workspaceId,
          role
        }
      });

      // TODO: Send notification email

      res.status(201).json(member);
    } catch (error: any) {
      next(error);
    }
  }
);

// @route   GET /api/workspaces/:workspaceId/members
// @desc    Get workspace members
// @access  Private
router.get(
  '/:workspaceId/members',
  authenticateToken,
  workspaceMiddleware,
  async (req: AuthRequest, res: Response, next) => {
    try {
      const members = await prisma.workspaceMember.findMany({
        where: { workspaceId: req.workspace!.id },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              avatarUrl: true,
              createdAt: true
            }
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      res.json(members);
    } catch (error: any) {
      next(error);
    }
  }
);

// @route   PUT /api/workspaces/:workspaceId/members/:userId
// @desc    Update member role
// @access  Private (Admin only)
router.put(
  '/:workspaceId/members/:userId',
  authenticateToken,
  workspaceMiddleware,
  requireRole(['ADMIN']),
  async (req: AuthRequest, res: Response, next) => {
    try {
      const { userId } = req.params;
      const { role } = req.body;

      if (!['ADMIN', 'MEMBER'].includes(role)) {
        throw new Error('Invalid role');
      }

      // Prevent self-demotion
      const isSelf = userId === req.user!.id;
      if (isSelf && role !== 'ADMIN') {
        throw new Error('Cannot change your own role from ADMIN');
      }

      const member = await prisma.workspaceMember.update({
        where: {
          userId_workspaceId: {
            userId,
            workspaceId: req.workspace!.id
          }
        },
        data: { role },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              avatarUrl: true
            }
          }
        }
      });

      res.json(member);
    } catch (error: any) {
      next(error);
    }
  }
);

// @route   DELETE /api/workspaces/:workspaceId/members/:userId
// @desc    Remove member from workspace
// @access  Private (Admin only)
router.delete(
  '/:workspaceId/members/:userId',
  authenticateToken,
  workspaceMiddleware,
  requireRole(['ADMIN']),
  async (req: AuthRequest, res: Response, next) => {
    try {
      const { userId } = req.params;

      // Prevent self-removal
      if (userId === req.user!.id) {
        throw new Error('Cannot remove yourself from workspace');
      }

      await prisma.workspaceMember.delete({
        where: {
          userId_workspaceId: {
            userId,
            workspaceId: req.workspace!.id
          }
        }
      });

      res.json({ success: true });
    } catch (error: any) {
      next(error);
    }
  }
);

// @route   DELETE /api/workspaces/:workspaceId
// @desc    Delete workspace (owner only)
// @access  Private
router.delete(
  '/:workspaceId',
  authenticateToken,
  workspaceMiddleware,
  requireRole(['ADMIN']),
  async (req: AuthRequest, res: Response, next) => {
    try {
      const workspace = await prisma.workspace.findUnique({
        where: { id: req.workspace!.id }
      });

      if (workspace?.ownerId !== req.user!.id) {
        throw new Error('Only workspace owner can delete workspace');
      }

      await prisma.workspace.delete({
        where: { id: req.workspace!.id }
      });

      res.json({ success: true });
    } catch (error: any) {
      next(error);
    }
  }
);

// Helper function
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') + '-' + crypto.randomBytes(4).toString('hex');
}

export default router;
export { crypto };
