import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../config/database';
import { authenticateToken, requireWorkspace, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/auth';
import { ForbiddenError } from '../middleware/error-handler';

const router = Router();

// @route   GET /api/team/members
// @desc    Get workspace team members
// @access  Private
router.get('/members', authenticateToken, requireWorkspace, async (req: AuthRequest, res: Response, next) => {
  try {
    const members = await prisma.workspaceMember.findMany({
      where: {
        workspaceId: req.workspace!.id
      },
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
      orderBy: { createdAt: 'asc' }
    });

    res.json(members);
  } catch (error: any) {
    next(error);
  }
});

// @route   POST /api/team/invite
// @desc    Invite team member
// @access  Private (Admin only)
router.post(
  '/invite',
  authenticateToken,
  requireWorkspace,
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

      if (user) {
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

        // Add member directly
        const member = await prisma.workspaceMember.create({
          data: {
            userId: user.id,
            workspaceId,
            role: role as 'ADMIN' | 'MEMBER'
          },
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

        // TODO: Send notification email

        res.status(201).json(member);
      } else {
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

        res.status(201).json({
          ...invitation,
          message: 'Invitation sent to new user'
        });
      }
    } catch (error: any) {
      next(error);
    }
  }
);

// @route   PUT /api/team/members/:userId
// @desc    Update member role
// @access  Private (Admin only)
router.put(
  '/members/:userId',
  authenticateToken,
  requireWorkspace,
  requireRole(['ADMIN']),
  async (req: AuthRequest, res: Response, next) => {
    try {
      const { userId } = req.params;
      const { role } = req.body;

      if (!['ADMIN', 'MEMBER'].includes(role)) {
        throw new Error('Invalid role');
      }

      // Prevent self-demotion
      if (userId === req.user!.id && role !== 'ADMIN') {
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

// @route   DELETE /api/team/members/:userId
// @desc    Remove team member
// @access  Private (Admin only)
router.delete(
  '/members/:userId',
  authenticateToken,
  requireWorkspace,
  requireRole(['ADMIN']),
  async (req: AuthRequest, res: Response, next) => {
    try {
      const { userId } = req.params;

      // Cannot remove yourself
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

// @route   GET /api/team/invitations
// @desc    Get pending invitations
// @access  Private (Admin only)
router.get(
  '/invitations',
  authenticateToken,
  requireWorkspace,
  requireRole(['ADMIN']),
  async (req: AuthRequest, res: Response, next) => {
    try {
      const invitations = await prisma.invitation.findMany({
        where: {
          workspaceId: req.workspace!.id,
          accepted: false,
          expiresAt: { gt: new Date() }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json(invitations);
    } catch (error: any) {
      next(error);
    }
  }
);

// @route   DELETE /api/team/invitations/:invitationId
// @desc    Cancel invitation
// @access  Private (Admin only)
router.delete(
  '/invitations/:invitationId',
  authenticateToken,
  requireWorkspace,
  requireRole(['ADMIN']),
  async (req: AuthRequest, res: Response, next) => {
    try {
      const { invitationId } = req.params;

      await prisma.invitation.delete({
        where: { id: invitationId }
      });

      res.json({ success: true });
    } catch (error: any) {
      next(error);
    }
  }
);

// @route   POST /api/team/invitations/:token/accept
// @desc    Accept invitation
// @access  Public (but with token)
router.post(
  '/invitations/:token/accept',
  async (req: Request, res: Response, next) => {
    try {
      const { token } = req.params;

      const invitation = await prisma.invitation.findFirst({
        where: { token }
      });

      if (!invitation) {
        throw new Error('Invalid invitation token');
      }

      if (invitation.accepted) {
        throw new Error('Invitation already accepted');
      }

      if (invitation.expiresAt < new Date()) {
        throw new Error('Invitation has expired');
      }

      // Check if user is logged in
      const authHeader = req.headers['authorization'];
      if (!authHeader) {
        throw new Error('Please log in to accept invitation');
      }

      const jwt = await import('jsonwebtoken');
      const token = authHeader.split(' ')[1];
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as any;

      // Add user to workspace
      await prisma.workspaceMember.create({
        data: {
          userId: payload.userId,
          workspaceId: invitation.workspaceId,
          role: invitation.role
        }
      });

      // Mark invitation as accepted
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { accepted: true }
      });

      res.json({ success: true, message: 'Invitation accepted' });
    } catch (error: any) {
      next(error);
    }
  }
);

import crypto from 'crypto';
export default router;
