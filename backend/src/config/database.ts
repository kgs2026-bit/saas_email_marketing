import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
});

// Connection event listeners
prisma.$on('connection', () => {
  console.log('✅ Database connected successfully');
});

prisma.$on('error', (e) => {
  console.error('❌ Database connection error:', e);
});

prisma.$on('warning', (e) => {
  console.warn('⚠️  Database warning:', e);
});

export default prisma;
