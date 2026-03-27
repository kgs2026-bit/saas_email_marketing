import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { prisma } from '../config/database';

// Configure Google OAuth strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: `${process.env.API_URL!}/api/auth/google/callback`
    },
    async (_accessToken, _refreshToken, profile: any, done: any) => {
      try {
        const { id, emails, displayName, photos } = profile;

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const user = await prisma.user.upsert({
          where: { googleId: id },
          update: {
            name: displayName,
            avatarUrl: photos?.[0]?.value
          },
          create: {
            googleId: id,
            email: emails[0].value,
            name: displayName,
            avatarUrl: photos?.[0]?.value
          }
        });

        // Create workspace if user doesn't have one
        const existingWorkspace = await prisma.workspace.findFirst({
          where: { ownerId: user.id }
        });

        if (!existingWorkspace) {
          const workspace = await prisma.workspace.create({
            data: {
              name: `${displayName}'s Workspace`,
              slug: `${displayName?.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`,
              ownerId: user.id
            }
          });

          await prisma.workspaceMember.create({
            data: {
              userId: user.id,
              workspaceId: workspace.id,
              role: 'ADMIN'
            }
          });
        }

        done(null, user);
      } catch (error) {
        done(error);
      }
    }
  )
);

// Serialize and deserialize user
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (error) {
    done(error);
  }
});

export default passport;
