import { Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { ForbiddenError } from './error-handler';
import { AuthRequest } from './auth';

export async function workspaceMiddleware(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) {
  try {
    const workspaceId = req.params.workspaceId || req.body.workspaceId;

    if (!workspaceId) {
      throw ForbiddenError('Workspace ID is required');
    }

    // Check if user has access to this workspace
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
      throw ForbiddenError('You do not have access to this workspace');
    }

    // Attach workspace info to request
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

export function withWorkspace(fn: Function) {
  return async (req: AuthRequest, _res: Response, next: NextFunction) => {
    try {
      await workspaceMiddleware(req, _res, () => {
        fn(req, _res, next);
      });
    } catch (error) {
      next(error);
    }
  };
}

export async function validatePlanLimits(
  req: AuthRequest,
  resourceType: 'campaigns' | 'inboxes' | 'teamMembers' | 'contacts'
): Promise<boolean> {
  if (!req.workspace) return false;

  const workspace = await prisma.workspace.findUnique({
    where: { id: req.workspace.id },
    include: {
      _count: {
        select: {
          campaigns: true,
          inboxes: true,
          members: {
            where: {
              role: 'MEMBER'
            }
          },
          contacts: true
        }
      }
    }
  });

  if (!workspace) return false;

  const limits: Record<string, {
    campaigns: number;
    inboxes: number;
    teamMembers: number;
    contacts: number;
  }> = {
    [workspace.plan]: {
      campaigns: getCampaignLimit(workspace.plan),
      inboxes: getInboxLimit(workspace.plan),
      teamMembers: getTeamMemberLimit(workspace.plan),
      contacts: getContactLimit(workspace.plan)
    }
  };

  const currentCount = workspace._count[resourceType];
  const planLimit = limits[workspace.plan][resourceType];

  return currentCount < planLimit;
}

function getCampaignLimit(plan: string): number {
  const limits: Record<string, number> = {
    FREE: 3,
    STARTER: 10,
    GROWTH: 50,
    PRO: 200
  };
  return limits[plan];
}

function getInboxLimit(plan: string): number {
  const limits: Record<string, number> = {
    FREE: 1,
    STARTER: 3,
    GROWTH: 10,
    PRO: 50
  };
  return limits[plan];
}

function getTeamMemberLimit(plan: string): number {
  const limits: Record<string, number> = {
    FREE: 1,
    STARTER: 3,
    GROWTH: 10,
    PRO: 25
  };
  return limits[plan];
}

function getContactLimit(plan: string): number {
  const limits: Record<string, number> = {
    FREE: 100,
    STARTER: 1000,
    GROWTH: 10000,
    PRO: 100000
  };
  return limits[plan];
}
