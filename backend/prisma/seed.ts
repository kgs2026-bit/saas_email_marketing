import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create a demo user
  const demoPassword = await bcrypt.hash('demo123', 10);

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      passwordHash: demoPassword,
      name: 'Demo User'
    }
  });

  console.log('✅ Created demo user:', demoUser.email);

  // Create demo workspace
  const demoWorkspace = await prisma.workspace.upsert({
    where: { slug: 'demo-workspace' },
    update: {},
    create: {
      id: 'workspace_' + crypto.randomBytes(16).toString('hex'),
      name: 'Demo Workspace',
      slug: 'demo-workspace',
      ownerId: demoUser.id,
      plan: 'PRO'
    }
  });

  console.log('✅ Created demo workspace:', demoWorkspace.name);

  // Add demo user to workspace as admin
  await prisma.workspaceMember.upsert({
    where: {
      userId_workspaceId: {
        userId: demoUser.id,
        workspaceId: demoWorkspace.id
      }
    },
    update: {},
    create: {
      userId: demoUser.id,
      workspaceId: demoWorkspace.id,
      role: 'ADMIN'
    }
  });

  console.log('✅ Added demo user to workspace as admin');

  // Create sample plans in Stripe (placeholder - you'll need to update with real price IDs)
  console.log('\n📋 Stripe Price IDs needed (update in .env):');
  console.log('   STRIPE_PRICE_STARTER=price_...');
  console.log('   STRIPE_PRICE_GROWTH=price_...');
  console.log('   STRIPE_PRICE_PRO=price_...\n');

  console.log('🎉 Seed completed!');
  console.log('\nDemo credentials:');
  console.log('  Email: demo@example.com');
  console.log('  Password: demo123');
  console.log(`\nWorkspace URL: http://localhost:5173/workspace/${demoWorkspace.slug}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
