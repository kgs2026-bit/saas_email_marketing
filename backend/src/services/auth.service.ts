import jwt = require('jsonwebtoken');
import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';
import { generateSecureToken } from '../utils/crypto';
import { logger } from '../utils/logger';
import { JwtPayload } from '../middleware/auth';

const SALT_ROUNDS = 10;

export class AuthService {
  async register(email: string, password: string, name?: string) {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user and workspace in a transaction
    const result = await prisma.$transaction(async (tx: any) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          name,
          ownedWorkspaces: {
            create: {
              name: `${name || email}'s Workspace`,
              slug: this.generateSlug(name || email)
            }
          }
        },
        include: {
          ownedWorkspaces: {
            include: {
              members: true
            }
          }
        }
      });

      // Add user as workspace admin
      await tx.workspaceMember.create({
        data: {
          userId: user.id,
          workspaceId: user.ownedWorkspaces[0].id,
          role: 'ADMIN'
        }
      });

      return user;
    });

    // Generate tokens
    const { accessToken, refreshToken } = this.generateTokens(result.id);

    // Store refresh token in session
    await prisma.session.create({
      data: {
        userId: result.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    });

    logger.info(`User registered: ${email}`);

    return {
      user: {
        id: result.id,
        email: result.email,
        name: result.name,
        avatarUrl: result.avatarUrl
      },
      workspace: {
        id: result.ownedWorkspaces[0].id,
        name: result.ownedWorkspaces[0].name,
        slug: result.ownedWorkspaces[0].slug
      },
      accessToken,
      refreshToken
    };
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.passwordHash) {
      throw new Error('Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Get user's workspaces
    const memberships = await prisma.workspaceMember.findMany({
      where: { userId: user.id },
      include: {
        workspace: true
      }
    });

    const { accessToken, refreshToken } = this.generateTokens(user.id);

    // Store refresh token
    await prisma.session.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    logger.info(`User logged in: ${email}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl
      },
      workspaces: memberships.map((m: any) => ({
        id: m.workspace.id,
        name: m.workspace.name,
        slug: m.workspace.slug,
        role: m.role,
        plan: m.workspace.plan
      })),
      accessToken,
      refreshToken
    };
  }

  async googleAuth(googleId: string, email: string, name: string, avatarUrl?: string) {
    // Find or create user
    let user = await prisma.user.findUnique({ where: { googleId } });

    if (!user) {
      user = await prisma.user.upsert({
        where: { googleId },
        update: {},
        create: {
          googleId,
          email,
          name,
          avatarUrl,
          ownedWorkspaces: {
            create: {
              name: `${name}'s Workspace`,
              slug: this.generateSlug(name)
            }
          }
        },
        include: {
          ownedWorkspaces: {
            include: {
              members: true
            }
          }
        }
      });

      // Add user as workspace admin if just created
      const existingMember = await prisma.workspaceMember.findFirst({
        where: {
          userId: user.id,
          workspaceId: user.ownedWorkspaces[0].id
        }
      });

      if (!existingMember) {
        await prisma.workspaceMember.create({
          data: {
            userId: user.id,
            workspaceId: user.ownedWorkspaces[0].id,
            role: 'ADMIN'
          }
        });
      }
    } else {
      // Update last login info
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name,
          avatarUrl
        },
        include: {
          ownedWorkspaces: {
            include: {
              members: true
            }
          }
        }
      });
    }

    // Get workspaces
    const memberships = await prisma.workspaceMember.findMany({
      where: { userId: user.id },
      include: {
        workspace: true
      }
    });

    const { accessToken, refreshToken } = this.generateTokens(user.id);

    // Store refresh token
    await prisma.session.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    logger.info(`User logged in with Google: ${email}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl
      },
      workspaces: memberships.map((m: any) => ({
        id: m.workspace.id,
        name: m.workspace.name,
        slug: m.workspace.slug,
        role: m.role,
        plan: m.workspace.plan
      })),
      accessToken,
      refreshToken
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as JwtPayload;

      // Check if refresh token exists in database
      const session = await prisma.session.findUnique({
        where: { token: refreshToken },
        include: { user: true }
      });

      if (!session || session.expiresAt < new Date()) {
        throw new Error('Invalid refresh token');
      }

      // Generate new tokens
      const { accessToken, refreshToken: newRefreshToken } = this.generateTokens(
        payload.userId
      );

      // Delete old session and create new one
      await prisma.session.delete({ where: { id: session.id } });

      await prisma.session.create({
        data: {
          userId: payload.userId,
          token: newRefreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      });

      return { accessToken, refreshToken: newRefreshToken };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  async logout(userId: string, refreshToken: string) {
    await prisma.session.deleteMany({
      where: {
        userId,
        token: refreshToken
      }
    });

    logger.info(`User logged out: ${userId}`);
    return { success: true };
  }

  async validateToken(token: string) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
      const user = await prisma.user.findUnique({ where: { id: payload.userId } });

      if (!user) {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl
      };
    } catch {
      return null;
    }
  }

  private generateTokens(userId: string) {
    const secret = process.env.JWT_SECRET as string;
    const refreshSecret = process.env.JWT_REFRESH_SECRET as string;
    const expiresIn = process.env.JWT_EXPIRES_IN || '15m';
    const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

    const accessToken = jwt.sign({ userId }, secret, { expiresIn });
    const refreshToken = jwt.sign({ userId }, refreshSecret, { expiresIn: refreshExpiresIn });

    return { accessToken, refreshToken };
  }

  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + generateSecureToken(4);
  }
}

export const authService = new AuthService();
