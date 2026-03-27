import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import passport from 'passport';
import { authService } from '../services/auth.service';
import { prisma } from '../config/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rate-limiter';

const router = Router();

// Validation rules
const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('name').optional().trim()
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
];

// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public
router.post(
  '/register',
  authRateLimiter,
  registerValidation,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, name } = req.body;
      const result = await authService.register(email, password, name);

      res.status(201).json(result);
    } catch (error: any) {
      next(error);
    }
  }
);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post(
  '/login',
  authRateLimiter,
  loginValidation,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;
      const result = await authService.login(email, password);

      res.json(result);
    } catch (error: any) {
      next(error);
    }
  }
);

// @route   GET /api/auth/google
// @desc    Google OAuth login
// @access  Public
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email']
  })
);

// @route   GET /api/auth/google/callback
// @desc    Google OAuth callback
// @access  Public
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false }),
  async (req: any, res: Response, next) => {
    try {
      if (!req.user) {
        throw new Error('OAuth failed');
      }

      const { googleId, email, displayName, photos } = req.user;
      const result = await authService.googleAuth(
        googleId,
        email,
        displayName,
        photos?.[0]?.value
      );

      // Redirect to frontend with token
      const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/callback?token=${result.accessToken}&refreshToken=${result.refreshToken}`;
      res.redirect(redirectUrl);
    } catch (error: any) {
      next(error);
    }
  }
);

// @route   POST /api/auth/refresh
// @desc    Refresh access token
// @access  Public
router.post(
  '/refresh',
  async (req: Request, res: Response, next) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw new Error('Refresh token required');
      }

      const result = await authService.refreshToken(refreshToken);
      res.json(result);
    } catch (error: any) {
      next(error);
    }
  }
);

// @route   POST /api/auth/logout
// @desc    Logout user (invalidate refresh token)
// @access  Private
router.post(
  '/logout',
  authenticateToken,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.json({ success: true });
      }

      await authService.logout(req.user!.id, refreshToken);
      res.json({ success: true });
    } catch (error: any) {
      next(error);
    }
  }
);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get(
  '/me',
  authenticateToken,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          createdAt: true
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Get user's workspaces
      const memberships = await prisma.workspaceMember.findMany({
        where: { userId: user.id },
        include: {
          workspace: {
            select: {
              id: true,
              name: true,
              slug: true,
              plan: true
            }
          }
        }
      });

      res.json({
        user,
        workspaces: memberships.map((m: any) => m.workspace)
      });
    } catch (error: any) {
      next(error);
    }
  }
);

// @route   POST /api/auth/change-password
// @desc    Change password
// @access  Private
router.post(
  '/change-password',
  authenticateToken,
  [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 8 })
  ],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { currentPassword, newPassword } = req.body;

      const user = await prisma.user.findUnique({
        where: { id: req.user!.id }
      });

      if (!user || !user.passwordHash) {
        throw new Error('User not found');
      }

      const bcrypt = await import('bcryptjs');
      const isValid = await bcrypt.compare(currentPassword, user.passwordHash);

      if (!isValid) {
        throw new Error('Current password is incorrect');
      }

      const newPasswordHash = await bcrypt.hash(newPassword, 10);

      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: newPasswordHash }
      });

      res.json({ success: true, message: 'Password changed successfully' });
    } catch (error: any) {
      next(error);
    }
  }
);

export default router;
