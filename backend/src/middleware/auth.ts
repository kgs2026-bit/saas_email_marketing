import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { UnauthorizedError, ForbiddenError } from './error-handler';

interface JwtPayload {
  userId: string;
  workspaceId?: string;
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name?: string;
  };
  workspace?: {
    id: string;
    slug: string;
    plan: string;
    role: string;
  };
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    throw UnauthorizedError('No token provided');
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    req.user = {
      id: payload.userId,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw UnauthorizedError('Token expired');
    }
    throw UnauthorizedError('Invalid token');
  }
}

export async function requireWorkspace(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const workspaceId = req.params.workspaceId || req.body.workspaceId || req.query.workspaceId;

    if (!workspaceId) {
      throw ForbiddenError('Workspace ID required');
    }

    // Check if user is a member of the workspace
    const membership = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: req.user!.id,
          workspaceId
        }
      },
      include: {
        workspace: true
      }
    });

    if (!membership) {
      throw ForbiddenError('Access denied to this workspace');
    }

    req.workspace = {
      id: membership.workspace.id,
      slug: membership.workspace.slug,
      plan: membership.workspace.plan,
      role: membership.role
    };

    next();
  } catch (error) {
    next(error);
  }
}

export function requireRole(allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.workspace) {
      throw ForbiddenError('Workspace context required');
    }

    if (!allowedRoles.includes(req.workspace.role)) {
      throw ForbiddenError(`Requires role: ${allowedRoles.join(' or ')}`);
    }

    next();
  };
}

export async function validateWorkspaceAccess(
  req: AuthRequest,
  workspaceId: string
): Promise<boolean> {
  const membership = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId: req.user!.id,
        workspaceId
      }
    }
  });

  return !!membership;
}
